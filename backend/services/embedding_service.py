import httpx
from typing import List, Optional
from config import settings


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


async def generate_embeddings_huggingface(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using HuggingFace Inference API (free)."""
    model = settings.HF_EMBED_MODEL
    api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model}"
    
    headers = {}
    if settings.HF_API_TOKEN:
        headers["Authorization"] = f"Bearer {settings.HF_API_TOKEN}"
    
    embeddings = []
    async with httpx.AsyncClient(timeout=120.0) as client:
        for text in texts:
            response = await client.post(
                api_url,
                headers=headers,
                json={"inputs": text, "options": {"wait_for_model": True}},
            )
            response.raise_for_status()
            embedding = response.json()
            # HF returns nested list for single input
            if isinstance(embedding[0], list):
                embedding = embedding[0]
            embeddings.append(embedding)
    return embeddings


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
    # Use HuggingFace if configured or if Ollama is unavailable
    if settings.EMBEDDING_PROVIDER == "huggingface":
        return await generate_embeddings_huggingface(texts)
    elif settings.EMBEDDING_PROVIDER == "ollama":
        return await generate_embeddings_ollama(texts)
    else:
        # Auto-detect: try Ollama first, fallback to HuggingFace
        if await check_ollama_available():
            return await generate_embeddings_ollama(texts)
        else:
            return await generate_embeddings_huggingface(texts)


async def generate_single_embedding(text: str) -> List[float]:
    """Generate embedding for a single text."""
    result = await generate_embeddings([text])
    return result[0]
