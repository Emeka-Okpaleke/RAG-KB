import httpx
from typing import List
from config import settings


async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of texts using Ollama."""
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


async def generate_single_embedding(text: str) -> List[float]:
    """Generate embedding for a single text."""
    result = await generate_embeddings([text])
    return result[0]
