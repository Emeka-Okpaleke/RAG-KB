import httpx
import asyncio
from typing import List, Optional
from config import settings

# Global model cache for fastembed
_embed_model = None


def _get_embed_model():
    """Load fastembed model (cached after first call). Uses ONNX - low memory."""
    global _embed_model
    if _embed_model is None:
        from fastembed import TextEmbedding
        # all-MiniLM-L6-v2 is the default, lightweight model
        _embed_model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return _embed_model


async def generate_embeddings_ollama(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using Ollama (local)."""
    embeddings = []
    async with httpx.AsyncClient(timeout=120.0) as client:
        for text in texts:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/embed",
                json={
                    "model": settings.OLLAMA_EMBED_MODEL,
                    "input": text,
                },
            )
            response.raise_for_status()
            data = response.json()
            embeddings.append(data["embeddings"][0])
    return embeddings


async def generate_embeddings_local(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using fastembed locally (ONNX, low memory)."""
    loop = asyncio.get_event_loop()
    model = _get_embed_model()
    # Run in thread pool to avoid blocking the event loop
    embeddings = await loop.run_in_executor(
        None, lambda: list(model.embed(texts))
    )
    # Convert numpy arrays to lists
    return [emb.tolist() for emb in embeddings]


async def check_ollama_available() -> bool:
    """Check if Ollama is available."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            return response.status_code == 200
    except Exception:
        return False


async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using the configured provider."""
    if settings.EMBEDDING_PROVIDER == "huggingface":
        return await generate_embeddings_local(texts)
    elif settings.EMBEDDING_PROVIDER == "ollama":
        return await generate_embeddings_ollama(texts)
    else:
        # Auto-detect: try Ollama first, fallback to local sentence-transformers
        if await check_ollama_available():
            return await generate_embeddings_ollama(texts)
        else:
            return await generate_embeddings_local(texts)


async def generate_single_embedding(text: str) -> List[float]:
    """Generate embedding for a single text."""
    result = await generate_embeddings([text])
    return result[0]
