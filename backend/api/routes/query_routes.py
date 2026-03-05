from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from database import get_db
from models import QueryRequest, QueryResponse
from services.rag_engine import process_query

router = APIRouter(prefix="/api/v1/query", tags=["Query"])


@router.post("", response_model=QueryResponse)
async def ask_question(request: QueryRequest, current_user=Depends(get_current_user)):
    """Ask a question against your knowledge base using RAG."""
    try:
        result = await process_query(
            user_id=current_user["_id"],
            request=request,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@router.get("/conversations")
async def list_conversations(current_user=Depends(get_current_user)):
    """List all conversations for the current user."""
    db = get_db()
    conversations = await db.conversations.find(
        {"user_id": current_user["_id"]}
    ).sort("updated_at", -1).to_list(length=50)

    return {
        "success": True,
        "data": [
            {
                "id": c["_id"],
                "title": c.get("title", "Untitled"),
                "collection_ids": c.get("collection_ids", []),
                "message_count": len(c.get("messages", [])),
                "created_at": c["created_at"].isoformat(),
                "updated_at": c.get("updated_at", c["created_at"]).isoformat(),
            }
            for c in conversations
        ],
    }


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, current_user=Depends(get_current_user)):
    """Get a full conversation with all messages and sources."""
    db = get_db()
    conversation = await db.conversations.find_one({
        "_id": conversation_id,
        "user_id": current_user["_id"],
    })

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = []
    for msg in conversation.get("messages", []):
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
            "sources": msg.get("sources"),
            "timestamp": msg["timestamp"].isoformat() if hasattr(msg["timestamp"], "isoformat") else msg["timestamp"],
        })

    return {
        "success": True,
        "data": {
            "id": conversation["_id"],
            "title": conversation.get("title", "Untitled"),
            "collection_ids": conversation.get("collection_ids", []),
            "messages": messages,
            "created_at": conversation["created_at"].isoformat(),
            "updated_at": conversation.get("updated_at", conversation["created_at"]).isoformat(),
        },
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user=Depends(get_current_user)):
    """Delete a conversation."""
    db = get_db()
    result = await db.conversations.delete_one({
        "_id": conversation_id,
        "user_id": current_user["_id"],
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {"success": True, "message": "Conversation deleted"}
