from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "rag_knowledge_base"

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True

    # Auth
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_IN_MINUTES: int = 1440

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:latest"
    OLLAMA_EMBED_MODEL: str = "nomic-embed-text:latest"

    # HuggingFace (for cloud embeddings - free)
    HF_API_TOKEN: Optional[str] = None
    HF_EMBED_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Embedding provider: "ollama", "huggingface", or "auto" (tries ollama first)
    EMBEDDING_PROVIDER: str = "auto"

    # Groq
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # AI Provider
    AI_PROVIDER: str = "ollama"

    # Document processing
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    MAX_UPLOAD_SIZE_MB: int = 50

    # Frontend URL (for CORS)
    FRONTEND_URL: Optional[str] = None

    # Rate limiting (portfolio protection)
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_QUERY_PER_MINUTE: int = 5
    RATE_LIMIT_QUERY_PER_DAY: int = 100

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_data"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
