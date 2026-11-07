"""Security Middleware and Dependencies for AeroDispatch Backend.

Includes:
- HTTP Security Headers Middleware (OWASP recommended)
- Request Body Size Limiter Middleware (DoS protection)
- In-Memory Rate Limiter for Authentication & Sensitive Endpoints
- Double-Submit Cookie CSRF Protection for State-Changing Requests
"""
import time
from collections import defaultdict
from typing import Callable, Dict, List, Optional, Tuple

from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

from .audit_logger import log_security_event
from .security_config import (
    ALLOWED_ORIGINS,
    CSRF_COOKIE_NAME,
    IS_PRODUCTION,
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
    LOGIN_RATE_LIMIT_WINDOW_SECONDS,
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforces strict HTTP response security headers."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Prevent clickjacking / framing
        response.headers["X-Frame-Options"] = "DENY"
        # XSS Protection for legacy browsers
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Referrer policy to prevent referrer leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # HSTS in production HTTPS
        if IS_PRODUCTION:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob: https://*.cartocdn.com https://unpkg.com; "
            "connect-src 'self' ws: wss: https://*.cartocdn.com https://unpkg.com;"
        )
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Rejects request payloads exceeding max allowed body size to mitigate DoS."""

    def __init__(self, app, max_body_bytes: int = 10 * 1024 * 1024):
        super().__init__(app)
        self.max_body_bytes = max_body_bytes

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                if length > self.max_body_bytes:
                    log_security_event(
                        event_type="RATE_LIMIT_EXCEEDED",
                        action="request_body_size_check",
                        status="BLOCKED",
                        client_ip=request.client.host if request.client else "unknown",
                        details={"contentLength": length, "maxAllowed": self.max_body_bytes},
                    )
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Request body exceeds maximum allowed size of {self.max_body_bytes} bytes.",
                    )
            except ValueError:
                pass
        return await call_next(request)


class InMemoryRateLimiter:
    """Sliding-window rate limiter for brute-force and credential-stuffing prevention."""

    def __init__(self, max_attempts: int = LOGIN_RATE_LIMIT_MAX_ATTEMPTS, window_seconds: int = LOGIN_RATE_LIMIT_WINDOW_SECONDS):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._history: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, key: str) -> Tuple[bool, int]:
        """
        Checks if key is rate limited.
        
        Returns (is_limited, retry_after_seconds).
        """
        now = time.time()
        cutoff = now - self.window_seconds
        # Clean expired timestamps
        self._history[key] = [t for t in self._history[key] if t > cutoff]

        if len(self._history[key]) >= self.max_attempts:
            oldest = self._history[key][0]
            retry_after = int(oldest + self.window_seconds - now) + 1
            return True, max(1, retry_after)

        return False, 0

    def record_attempt(self, key: str) -> None:
        """Records an attempt timestamp."""
        self._history[key].append(time.time())

    def reset(self, key: str) -> None:
        """Resets the history for a key on successful action."""
        if key in self._history:
            del self._history[key]


# Singleton instances for endpoints
auth_rate_limiter = InMemoryRateLimiter(max_attempts=LOGIN_RATE_LIMIT_MAX_ATTEMPTS, window_seconds=LOGIN_RATE_LIMIT_WINDOW_SECONDS)
reset_rate_limiter = InMemoryRateLimiter(max_attempts=3, window_seconds=3600)  # 3 password reset requests per hour


def check_rate_limit(request: Request, key_prefix: str = "auth_login") -> None:
    """FastAPI dependency to enforce rate limiting on sensitive endpoints."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    key = f"{key_prefix}:{client_ip}"
    is_limited, retry_after = auth_rate_limiter.is_rate_limited(key)
    if is_limited:
        log_security_event(
            event_type="RATE_LIMIT_EXCEEDED",
            action="rate_limit_enforce",
            status="BLOCKED",
            client_ip=client_ip,
            details={"key": key, "retryAfterSeconds": retry_after},
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many attempts. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )


def verify_csrf_token(request: Request) -> None:
    """
    Validates CSRF token for state-changing HTTP requests.
    
    Exemptions:
      - Safe idempotent methods (GET, HEAD, OPTIONS)
      - Requests authenticated via Authorization: Bearer header without cookies
        (Bearer tokens are not ambient credentials sent automatically by browsers)
    
    For cookie-authenticated state-changing requests (POST, PUT, PATCH, DELETE):
      - Checks that X-CSRF-Token or X-XSRF-Token header matches the CSRF cookie.
      - Rejects if missing or mismatched.
    """
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    # If the request carries an explicit Authorization: Bearer header, it is immune to CSRF
    # because browsers cannot forge cross-origin custom Authorization headers.
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth_header and auth_header.strip().lower().startswith("bearer "):
        return

    # Check if request carries cookies for authentication
    cookies = request.cookies
    has_auth_cookie = "aerodispatch_access_token" in cookies or "aerodispatch_refresh_token" in cookies

    # If request neither has auth header nor auth cookies (e.g. anonymous public post), no CSRF check needed
    if not has_auth_cookie:
        return

    # If authenticated via cookie: validate double-submit CSRF token
    cookie_token = cookies.get(CSRF_COOKIE_NAME)
    header_token = request.headers.get("X-CSRF-Token") or request.headers.get("X-XSRF-Token") or request.headers.get("x-csrf-token")

    if not cookie_token or not header_token:
        client_ip = request.client.host if request.client else "unknown"
        log_security_event(
            event_type="CSRF_FAILURE",
            action="verify_csrf_token",
            status="BLOCKED",
            client_ip=client_ip,
            resource=str(request.url.path),
            details={"reason": "Missing CSRF cookie or header token", "hasCookie": bool(cookie_token), "hasHeader": bool(header_token)},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF validation failed: Missing CSRF token in cookie or request header.",
        )

    import secrets
    if not secrets.compare_digest(cookie_token, header_token):
        client_ip = request.client.host if request.client else "unknown"
        log_security_event(
            event_type="CSRF_FAILURE",
            action="verify_csrf_token",
            status="BLOCKED",
            client_ip=client_ip,
            resource=str(request.url.path),
            details={"reason": "CSRF token mismatch"},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF validation failed: Invalid or mismatched CSRF token.",
        )
