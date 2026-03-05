from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import connect_db, close_db
from api import auth_router, collection_router, document_router, query_router, health_router
from middleware import RateLimitMiddleware
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    print(f"[Server] RAG Knowledge Base API running on {settings.API_HOST}:{settings.API_PORT}")
    yield
    await close_db()


app = FastAPI(
    title="RAG Knowledge Base API",
    description="Enterprise knowledge base with RAG-powered Q&A. Upload documents, ask questions, get answers with source citations.",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting (must be added before CORS so it runs after CORS in the middleware stack)
app.add_middleware(RateLimitMiddleware)

cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if settings.FRONTEND_URL:
    cors_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(collection_router)
app.include_router(document_router)
app.include_router(query_router)
