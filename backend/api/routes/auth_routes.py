import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from models import UserCreate, UserLogin, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/register")
async def register(data: UserCreate):
    db = get_db()

    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    user_doc = {
        "_id": user_id,
        "email": data.email,
        "name": data.name,
        "hashed_password": hash_password(data.password),
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(user_doc)

    token = create_access_token(user_id, data.email)
    return {
        "success": True,
        "data": {
            "token": token,
            "user": {
                "id": user_id,
                "email": data.email,
                "name": data.name,
            },
        },
    }


@router.post("/login")
async def login(data: UserLogin):
    db = get_db()

    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user["_id"], user["email"])
    return {
        "success": True,
        "data": {
            "token": token,
            "user": {
                "id": user["_id"],
                "email": user["email"],
                "name": user["name"],
            },
        },
    }


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "id": current_user["_id"],
            "email": current_user["email"],
            "name": current_user["name"],
            "created_at": current_user["created_at"].isoformat(),
        },
    }
