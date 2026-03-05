import httpx
from fastapi import APIRouter
from config import settings
from database import get_db

router = APIRouter(tags=["Health"])


@router.get("/")
async def root():
    return {
        "name": "RAG Knowledge Base API",
        "version": "1.0.0",
        "description": "Enterprise knowledge base with RAG-powered Q&A",
    }


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/health/ready")
async def readiness():
    """Check if all services are ready."""
    checks = {"mongodb": False, "ollama": False, "chromadb": False}

    # Check MongoDB
    try:
        db = get_db()
        await db.command("ping")
        checks["mongodb"] = True
    except Exception:
        pass

    # Check Ollama
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            checks["ollama"] = resp.status_code == 200
    except Exception:
        pass

    # Check ChromaDB
    try:
        from services.vector_store import get_chroma_client
        client = get_chroma_client()
        client.heartbeat()
        checks["chromadb"] = True
    except Exception:
        pass

    all_ready = all(checks.values())
    return {
        "status": "ready" if all_ready else "degraded",
        "checks": checks,
        "ai_provider": settings.AI_PROVIDER,
    }


@router.get("/stats")
async def get_stats():
    """Get system statistics."""
    db = get_db()
    user_count = await db.users.count_documents({})
    collection_count = await db.collections.count_documents({})
    document_count = await db.documents.count_documents({})
    chunk_count = await db.chunks.count_documents({})
    conversation_count = await db.conversations.count_documents({})

    return {
        "users": user_count,
        "collections": collection_count,
        "documents": document_count,
        "chunks": chunk_count,
        "conversations": conversation_count,
    }
