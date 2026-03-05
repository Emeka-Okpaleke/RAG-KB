import time
import uuid
from typing import Optional, List, Dict
from datetime import datetime, timezone
from database import get_db
from models import QueryRequest, QueryResponse, SourceChunk
from .embedding_service import generate_single_embedding
from .vector_store import query_collection, query_multiple_collections
from .llm_service import generate_answer, generate_conversation_title, is_casual_query


async def process_query(
    user_id: str,
    request: QueryRequest,
) -> QueryResponse:
    """Full RAG pipeline: embed query → retrieve chunks → generate answer."""
    start_time = time.time()
    db = get_db()

    # 0. Check if this is casual conversation (greetings, small talk)
    casual = is_casual_query(request.question)
    if casual:
        answer = await generate_answer(request.question, [], None, casual=True)
        conversation_id = request.conversation_id or str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        user_message = {"role": "user", "content": request.question, "sources": None, "timestamp": now}
        assistant_message = {"role": "assistant", "content": answer, "sources": None, "timestamp": now}
        existing = await db.conversations.find_one({"_id": conversation_id, "user_id": user_id})
        if existing:
            await db.conversations.update_one(
                {"_id": conversation_id},
                {"$push": {"messages": {"$each": [user_message, assistant_message]}}, "$set": {"updated_at": now}},
            )
        else:
            title = await generate_conversation_title(request.question, answer)
            await db.conversations.insert_one({
                "_id": conversation_id, "user_id": user_id, "title": title,
                "collection_ids": [], "messages": [user_message, assistant_message],
                "created_at": now, "updated_at": now,
            })
        return QueryResponse(
            answer=answer, sources=[], conversation_id=conversation_id,
            query_time_ms=int((time.time() - start_time) * 1000),
        )

    # 1. Determine which collections to search
    collection_ids = request.collection_ids
    if not collection_ids:
        # Search all user's collections
        collections = await db.collections.find(
            {"user_id": user_id}
        ).to_list(length=100)
        collection_ids = [str(c["_id"]) for c in collections]

    if not collection_ids:
        # No collections but not casual — answer conversationally and suggest uploading
        answer = await generate_answer(
            request.question, [], None, casual=False
        )
        return QueryResponse(
            answer=answer,
            sources=[],
            conversation_id=request.conversation_id or str(uuid.uuid4()),
            query_time_ms=int((time.time() - start_time) * 1000),
        )

    # 2. Generate query embedding
    query_embedding = await generate_single_embedding(request.question)

    # 3. Retrieve relevant chunks
    if len(collection_ids) == 1:
        raw_results = query_collection(
            collection_ids[0],
            query_embedding,
            top_k=request.top_k,
        )
        # Normalize single collection results
        retrieved_chunks = []
        if raw_results and raw_results["ids"] and raw_results["ids"][0]:
            for i in range(len(raw_results["ids"][0])):
                retrieved_chunks.append({
                    "id": raw_results["ids"][0][i],
                    "document": raw_results["documents"][0][i],
                    "metadata": raw_results["metadatas"][0][i],
                    "distance": raw_results["distances"][0][i],
                })
    else:
        retrieved_chunks = query_multiple_collections(
            collection_ids, query_embedding, top_k=request.top_k
        )

    if not retrieved_chunks:
        return QueryResponse(
            answer="I couldn't find any relevant information in your knowledge base for this question.",
            sources=[],
            conversation_id=request.conversation_id or str(uuid.uuid4()),
            query_time_ms=int((time.time() - start_time) * 1000),
        )

    # 4. Get conversation history if continuing a conversation
    conversation_history = None
    if request.conversation_id:
        conversation = await db.conversations.find_one({
            "_id": request.conversation_id,
            "user_id": user_id,
        })
        if conversation:
            conversation_history = conversation.get("messages", [])

    # 5. Generate answer with LLM
    answer = await generate_answer(
        request.question, retrieved_chunks, conversation_history
    )

    # 6. Build source citations
    sources = []
    for chunk in retrieved_chunks:
        meta = chunk.get("metadata", {})
        sources.append(SourceChunk(
            document_id=meta.get("document_id", ""),
            document_name=meta.get("document_name", "Unknown"),
            content=chunk["document"][:500],
            chunk_index=meta.get("chunk_index", 0),
            relevance_score=round(1 - chunk.get("distance", 0), 4),
        ))

    # 7. Save to conversation
    conversation_id = request.conversation_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    user_message = {
        "role": "user",
        "content": request.question,
        "sources": None,
        "timestamp": now,
    }
    assistant_message = {
        "role": "assistant",
        "content": answer,
        "sources": [s.model_dump() for s in sources],
        "timestamp": now,
    }

    existing = await db.conversations.find_one({
        "_id": conversation_id,
        "user_id": user_id,
    })

    if existing:
        await db.conversations.update_one(
            {"_id": conversation_id},
            {
                "$push": {"messages": {"$each": [user_message, assistant_message]}},
                "$set": {"updated_at": now},
            },
        )
    else:
        title = await generate_conversation_title(request.question, answer)
        await db.conversations.insert_one({
            "_id": conversation_id,
            "user_id": user_id,
            "title": title,
            "collection_ids": collection_ids,
            "messages": [user_message, assistant_message],
            "created_at": now,
            "updated_at": now,
        })

    query_time_ms = int((time.time() - start_time) * 1000)

    return QueryResponse(
        answer=answer,
        sources=sources,
        conversation_id=conversation_id,
        query_time_ms=query_time_ms,
    )
