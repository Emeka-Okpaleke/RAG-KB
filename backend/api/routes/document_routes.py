import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, BackgroundTasks
from auth import get_current_user
from database import get_db
from models import DocumentStatus
from config import settings
from services.ingestion_service import ingest_document
from services.vector_store import delete_document_chunks

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

ALLOWED_TYPES = {"pdf", "docx", "txt", "md"}


def _get_file_extension(filename: str) -> str:
    if "." in filename:
        return filename.rsplit(".", 1)[1].lower()
    return ""


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    collection_id: str = Form(...),
    description: str = Form(default=""),
    current_user=Depends(get_current_user),
):
    db = get_db()

    # Validate collection exists and belongs to user
    collection = await db.collections.find_one({
        "_id": collection_id,
        "user_id": current_user["_id"],
    })
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Validate file type
    file_ext = _get_file_extension(file.filename)
    if file_ext not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{file_ext}. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    # Read file
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # Validate file size
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Create document record
    document_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    doc_record = {
        "_id": document_id,
        "user_id": current_user["_id"],
        "collection_id": collection_id,
        "name": file.filename,
        "description": description,
        "file_type": file_ext,
        "file_size": file_size,
        "status": DocumentStatus.PENDING,
        "chunk_count": 0,
        "error_message": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.documents.insert_one(doc_record)

    # Process document in background
    background_tasks.add_task(
        ingest_document,
        document_id=document_id,
        user_id=current_user["_id"],
        collection_id=collection_id,
        file_bytes=file_bytes,
        file_type=file_ext,
        file_name=file.filename,
    )

    return {
        "success": True,
        "data": {
            "id": document_id,
            "name": file.filename,
            "file_type": file_ext,
            "file_size": file_size,
            "status": DocumentStatus.PENDING,
            "message": "Document uploaded. Processing will begin shortly.",
        },
    }


@router.get("/{document_id}")
async def get_document(document_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    document = await db.documents.find_one({
        "_id": document_id,
        "user_id": current_user["_id"],
    })

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "success": True,
        "data": {
            "id": document["_id"],
            "name": document["name"],
            "description": document.get("description"),
            "collection_id": document["collection_id"],
            "file_type": document["file_type"],
            "file_size": document["file_size"],
            "status": document["status"],
            "chunk_count": document.get("chunk_count", 0),
            "text_length": document.get("text_length"),
            "error_message": document.get("error_message"),
            "created_at": document["created_at"].isoformat(),
        },
    }


@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: str,
    page: int = 1,
    per_page: int = 20,
    current_user=Depends(get_current_user),
):
    db = get_db()

    document = await db.documents.find_one({
        "_id": document_id,
        "user_id": current_user["_id"],
    })
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    skip = (page - 1) * per_page
    chunks = await db.chunks.find(
        {"document_id": document_id}
    ).sort("chunk_index", 1).skip(skip).limit(per_page).to_list(length=per_page)

    total = await db.chunks.count_documents({"document_id": document_id})

    return {
        "success": True,
        "data": {
            "chunks": [
                {
                    "id": c["_id"],
                    "content": c["content"],
                    "chunk_index": c["chunk_index"],
                }
                for c in chunks
            ],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page,
            },
        },
    }


@router.delete("/{document_id}")
async def delete_document(document_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    document = await db.documents.find_one({
        "_id": document_id,
        "user_id": current_user["_id"],
    })

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from ChromaDB
    delete_document_chunks(document["collection_id"], document_id)

    # Delete chunks and document from MongoDB
    await db.chunks.delete_many({"document_id": document_id})
    await db.documents.delete_one({"_id": document_id})

    # Update collection count
    collection_id = document["collection_id"]
    doc_count = await db.documents.count_documents({
        "collection_id": collection_id,
        "status": DocumentStatus.READY,
    })
    await db.collections.update_one(
        {"_id": collection_id},
        {"$set": {"document_count": doc_count, "updated_at": datetime.now(timezone.utc)}},
    )

    return {"success": True, "message": "Document deleted"}
