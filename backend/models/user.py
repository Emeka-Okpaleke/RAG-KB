from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime


class UserInDB(BaseModel):
    id: str
    email: str
    name: str
    hashed_password: str
    created_at: datetime
    updated_at: Optional[datetime] = None
