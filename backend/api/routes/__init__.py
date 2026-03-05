from .auth_routes import router as auth_router
from .collection_routes import router as collection_router
from .document_routes import router as document_router
from .query_routes import router as query_router
from .health_routes import router as health_router

__all__ = [
    "auth_router",
    "collection_router",
    "document_router",
    "query_router",
    "health_router",
]
