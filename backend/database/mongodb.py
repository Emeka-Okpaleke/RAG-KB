from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import settings

client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]

    await db.users.create_index("email", unique=True)
    await db.documents.create_index("user_id")
    await db.documents.create_index("collection_id")
    await db.collections.create_index("user_id")
    await db.conversations.create_index("user_id")

    print(f"[DB] Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_db():
    global client
    if client:
        client.close()
        print("[DB] MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    return db
