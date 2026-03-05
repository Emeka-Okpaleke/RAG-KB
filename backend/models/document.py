from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class DocumentCreate(BaseModel):
    collection_id: str
    name: str
    description: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    user_id: str
    collection_id: str
    name: str
    description: Optional[str] = None
    file_type: str
    file_size: int
    status: DocumentStatus
    chunk_count: int = 0
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class DocumentChunk(BaseModel):
    id: str
    document_id: str
    collection_id: str
    user_id: str
    content: str
    chunk_index: int
    metadata: dict = {}


class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class CollectionResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    document_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
