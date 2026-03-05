import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory rate limiter for portfolio deployment.
    Limits requests per IP to prevent abuse without needing Redis.

    Configurable via settings:
    - RATE_LIMIT_PER_MINUTE: max requests per minute per IP (general API)
    - RATE_LIMIT_QUERY_PER_MINUTE: max AI query requests per minute per IP
    - RATE_LIMIT_QUERY_PER_DAY: max AI query requests per day per IP
    """

    def __init__(self, app):
        super().__init__(app)
        # { ip: [(timestamp, ...), ...] }
        self.general_requests: Dict[str, list] = defaultdict(list)
        self.query_requests: Dict[str, list] = defaultdict(list)
        self.daily_query_requests: Dict[str, list] = defaultdict(list)
        self._last_cleanup = time.time()

    def _cleanup_old_entries(self):
        """Periodically clean up old entries to prevent memory growth."""
        now = time.time()
        if now - self._last_cleanup < 60:  # Clean up every 60 seconds
            return

        self._last_cleanup = now
        minute_ago = now - 60
        day_ago = now - 86400

        # Clean general requests
        for ip in list(self.general_requests.keys()):
            self.general_requests[ip] = [
                t for t in self.general_requests[ip] if t > minute_ago
            ]
            if not self.general_requests[ip]:
                del self.general_requests[ip]

        # Clean query requests (per minute)
        for ip in list(self.query_requests.keys()):
            self.query_requests[ip] = [
                t for t in self.query_requests[ip] if t > minute_ago
            ]
            if not self.query_requests[ip]:
                del self.query_requests[ip]

        # Clean daily query requests
        for ip in list(self.daily_query_requests.keys()):
            self.daily_query_requests[ip] = [
                t for t in self.daily_query_requests[ip] if t > day_ago
            ]
            if not self.daily_query_requests[ip]:
                del self.daily_query_requests[ip]

    def _get_client_ip(self, request: Request) -> str:
        """Get the real client IP, accounting for reverse proxies."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _count_recent(self, timestamps: list, window_seconds: float) -> int:
        """Count requests within a time window."""
        cutoff = time.time() - window_seconds
        return sum(1 for t in timestamps if t > cutoff)

    async def dispatch(self, request: Request, call_next):
        self._cleanup_old_entries()

        # Skip rate limiting for health checks and OPTIONS
        if request.method == "OPTIONS" or request.url.path in ("/", "/health", "/health/ready"):
            return await call_next(request)

        ip = self._get_client_ip(request)
        now = time.time()
        path = request.url.path

        # General rate limit (all endpoints)
        general_limit = getattr(settings, "RATE_LIMIT_PER_MINUTE", 60)
        general_count = self._count_recent(self.general_requests[ip], 60)

        if general_count >= general_limit:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {general_limit} requests per minute. Please slow down.",
            )

        self.general_requests[ip].append(now)

        # Stricter limits for AI query endpoints (expensive operations)
        is_query = path.startswith("/api/v1/query") and request.method == "POST"
        is_upload = path.startswith("/api/v1/documents/upload") and request.method == "POST"

        if is_query or is_upload:
            query_per_min = getattr(settings, "RATE_LIMIT_QUERY_PER_MINUTE", 5)
            query_per_day = getattr(settings, "RATE_LIMIT_QUERY_PER_DAY", 100)

            min_count = self._count_recent(self.query_requests[ip], 60)
            day_count = self._count_recent(self.daily_query_requests[ip], 86400)

            if min_count >= query_per_min:
                raise HTTPException(
                    status_code=429,
                    detail=f"AI query rate limit: max {query_per_min} queries per minute. Please wait before trying again.",
                )

            if day_count >= query_per_day:
                raise HTTPException(
                    status_code=429,
                    detail=f"Daily query limit reached ({query_per_day} queries/day). This is a portfolio demo — thanks for exploring!",
                )

            self.query_requests[ip].append(now)
            self.daily_query_requests[ip].append(now)

        response = await call_next(request)

        # Add rate limit headers for transparency
        response.headers["X-RateLimit-Limit"] = str(general_limit)
        response.headers["X-RateLimit-Remaining"] = str(
            max(0, general_limit - general_count - 1)
        )

        return response
