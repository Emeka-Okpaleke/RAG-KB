from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1)
    collection_ids: Optional[List[str]] = None
    conversation_id: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=20)


class SourceChunk(BaseModel):
    document_id: str
    document_name: str
    content: str
    chunk_index: int
    relevance_score: float


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]
    conversation_id: str
    query_time_ms: int


class ConversationMessage(BaseModel):
    role: str
    content: str
    sources: Optional[List[SourceChunk]] = None
    timestamp: datetime


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    collection_ids: List[str]
    messages: List[ConversationMessage]
    created_at: datetime
    updated_at: Optional[datetime] = None
