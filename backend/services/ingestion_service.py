import uuid
from datetime import datetime, timezone
from typing import Dict
from database import get_db
from models import DocumentStatus
from .document_processor import extract_text, chunk_text
from .embedding_service import generate_embeddings
from .vector_store import add_chunks_to_collection


async def ingest_document(
    document_id: str,
    user_id: str,
    collection_id: str,
    file_bytes: bytes,
    file_type: str,
    file_name: str,
) -> Dict:
    """Full ingestion pipeline: extract text → chunk → embed → store in vector DB."""
    db = get_db()

    # Update status to processing
    await db.documents.update_one(
        {"_id": document_id},
        {"$set": {"status": DocumentStatus.PROCESSING, "updated_at": datetime.now(timezone.utc)}},
    )

    try:
        # 1. Extract text
        text = extract_text(file_bytes, file_type)
        if not text or not text.strip():
            raise ValueError("No text could be extracted from the document")

        # 2. Chunk text
        chunks = chunk_text(text)
        if not chunks:
            raise ValueError("Document produced no chunks after processing")

        # 3. Prepare chunk data
        chunk_ids = []
        chunk_texts = []
        chunk_metadatas = []

        for chunk_text_content, chunk_index in chunks:
            chunk_id = str(uuid.uuid4())
            chunk_ids.append(chunk_id)
            chunk_texts.append(chunk_text_content)
            chunk_metadatas.append({
                "document_id": document_id,
                "document_name": file_name,
                "collection_id": collection_id,
                "user_id": user_id,
                "chunk_index": chunk_index,
            })

        # 4. Generate embeddings
        embeddings = await generate_embeddings(chunk_texts)

        # 5. Store in ChromaDB
        add_chunks_to_collection(
            collection_id=collection_id,
            chunk_ids=chunk_ids,
            embeddings=embeddings,
            documents=chunk_texts,
            metadatas=chunk_metadatas,
        )

        # 6. Store chunk metadata in MongoDB for reference
        chunk_docs = []
        for i, (chunk_id, chunk_text_content) in enumerate(zip(chunk_ids, chunk_texts)):
            chunk_docs.append({
                "_id": chunk_id,
                "document_id": document_id,
                "collection_id": collection_id,
                "user_id": user_id,
                "content": chunk_text_content,
                "chunk_index": i,
                "created_at": datetime.now(timezone.utc),
            })
        if chunk_docs:
            await db.chunks.insert_many(chunk_docs)

        # 7. Update document status
        await db.documents.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "status": DocumentStatus.READY,
                    "chunk_count": len(chunks),
                    "text_length": len(text),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        # 8. Update collection document count
        doc_count = await db.documents.count_documents({
            "collection_id": collection_id,
            "status": DocumentStatus.READY,
        })
        await db.collections.update_one(
            {"_id": collection_id},
            {"$set": {"document_count": doc_count, "updated_at": datetime.now(timezone.utc)}},
        )

        return {
            "document_id": document_id,
            "chunks_created": len(chunks),
            "text_length": len(text),
            "status": "ready",
        }

    except Exception as e:
        await db.documents.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "status": DocumentStatus.FAILED,
                    "error_message": str(e),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        raise
