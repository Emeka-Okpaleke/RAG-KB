import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from models import CollectionCreate, CollectionResponse
from auth import get_current_user
from database import get_db
from services.vector_store import delete_collection

router = APIRouter(prefix="/api/v1/collections", tags=["Collections"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_collection(data: CollectionCreate, current_user=Depends(get_current_user)):
    db = get_db()
    collection_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    collection_doc = {
        "_id": collection_id,
        "user_id": current_user["_id"],
        "name": data.name,
        "description": data.description,
        "document_count": 0,
        "created_at": now,
        "updated_at": now,
    }
    await db.collections.insert_one(collection_doc)

    return {
        "success": True,
        "data": {
            "id": collection_id,
            "name": data.name,
            "description": data.description,
            "document_count": 0,
            "created_at": now.isoformat(),
        },
    }


@router.get("")
async def list_collections(current_user=Depends(get_current_user)):
    db = get_db()
    cursor = db.collections.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    collections = await cursor.to_list(length=100)

    return {
        "success": True,
        "data": [
            {
                "id": c["_id"],
                "name": c["name"],
                "description": c.get("description"),
                "document_count": c.get("document_count", 0),
                "created_at": c["created_at"].isoformat(),
            }
            for c in collections
        ],
    }


@router.get("/{collection_id}")
async def get_collection(collection_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    collection = await db.collections.find_one({
        "_id": collection_id,
        "user_id": current_user["_id"],
    })

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Get documents in this collection
    documents = await db.documents.find({
        "collection_id": collection_id,
    }).sort("created_at", -1).to_list(length=200)

    return {
        "success": True,
        "data": {
            "id": collection["_id"],
            "name": collection["name"],
            "description": collection.get("description"),
            "document_count": collection.get("document_count", 0),
            "created_at": collection["created_at"].isoformat(),
            "documents": [
                {
                    "id": d["_id"],
                    "name": d["name"],
                    "file_type": d["file_type"],
                    "file_size": d["file_size"],
                    "status": d["status"],
                    "chunk_count": d.get("chunk_count", 0),
                    "error_message": d.get("error_message"),
                    "created_at": d["created_at"].isoformat(),
                }
                for d in documents
            ],
        },
    }


@router.delete("/{collection_id}")
async def delete_collection_endpoint(collection_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    collection = await db.collections.find_one({
        "_id": collection_id,
        "user_id": current_user["_id"],
    })

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Delete from ChromaDB
    delete_collection(collection_id)

    # Delete chunks, documents, and the collection from MongoDB
    await db.chunks.delete_many({"collection_id": collection_id})
    await db.documents.delete_many({"collection_id": collection_id})
    await db.collections.delete_one({"_id": collection_id})

    return {"success": True, "message": "Collection deleted"}
