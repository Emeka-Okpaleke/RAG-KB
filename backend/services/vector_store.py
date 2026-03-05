import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Optional, Dict, Any
from config import settings


_chroma_client: chromadb.ClientAPI = None


def get_chroma_client() -> chromadb.ClientAPI:
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        print(f"[ChromaDB] Initialized persistent client at {settings.CHROMA_PERSIST_DIR}")
    return _chroma_client


def get_or_create_collection(collection_id: str) -> chromadb.Collection:
    """Get or create a ChromaDB collection for a user's document collection."""
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=f"col_{collection_id}",
        metadata={"hnsw:space": "cosine"},
    )


def add_chunks_to_collection(
    collection_id: str,
    chunk_ids: List[str],
    embeddings: List[List[float]],
    documents: List[str],
    metadatas: List[Dict[str, Any]],
):
    """Add document chunks with embeddings to a ChromaDB collection."""
    collection = get_or_create_collection(collection_id)
    # ChromaDB has a batch limit, process in batches of 100
    batch_size = 100
    for i in range(0, len(chunk_ids), batch_size):
        end = min(i + batch_size, len(chunk_ids))
        collection.add(
            ids=chunk_ids[i:end],
            embeddings=embeddings[i:end],
            documents=documents[i:end],
            metadatas=metadatas[i:end],
        )


def query_collection(
    collection_id: str,
    query_embedding: List[float],
    top_k: int = 5,
    where_filter: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Query a ChromaDB collection for similar chunks."""
    collection = get_or_create_collection(collection_id)
    kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": top_k,
        "include": ["documents", "metadatas", "distances"],
    }
    if where_filter:
        kwargs["where"] = where_filter
    return collection.query(**kwargs)


def query_multiple_collections(
    collection_ids: List[str],
    query_embedding: List[float],
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """Query multiple collections and merge results by relevance score."""
    all_results = []

    for col_id in collection_ids:
        try:
            result = query_collection(col_id, query_embedding, top_k=top_k)
            if result and result["ids"] and result["ids"][0]:
                for i in range(len(result["ids"][0])):
                    all_results.append({
                        "id": result["ids"][0][i],
                        "document": result["documents"][0][i],
                        "metadata": result["metadatas"][0][i],
                        "distance": result["distances"][0][i],
                        "collection_id": col_id,
                    })
        except Exception as e:
            print(f"[ChromaDB] Error querying collection {col_id}: {e}")

    # Sort by distance (lower = more similar for cosine)
    all_results.sort(key=lambda x: x["distance"])
    return all_results[:top_k]


def delete_document_chunks(collection_id: str, document_id: str):
    """Delete all chunks for a document from ChromaDB."""
    collection = get_or_create_collection(collection_id)
    try:
        collection.delete(where={"document_id": document_id})
    except Exception as e:
        print(f"[ChromaDB] Error deleting chunks for document {document_id}: {e}")


def delete_collection(collection_id: str):
    """Delete an entire ChromaDB collection."""
    client = get_chroma_client()
    try:
        client.delete_collection(name=f"col_{collection_id}")
    except Exception as e:
        print(f"[ChromaDB] Error deleting collection {collection_id}: {e}")
