"""Security Configuration and Secrets Management for AeroDispatch Backend.

Manages cryptographic secrets, token lifetimes, algorithm whitelists,
cookie security policies, and environment variable validation.
"""
import os
import secrets
from typing import List

# ==============================================================================
# Environment & Deployment Mode
# ==============================================================================
ENVIRONMENT = os.getenv("AERODISPATCH_ENV", "development").lower()
IS_PRODUCTION = ENVIRONMENT in ("production", "prod")

# ==============================================================================
# JWT Authentication Settings
# ==============================================================================
# Separate secrets for access and refresh tokens to prevent token purpose confusion
DEFAULT_DEV_ACCESS_SECRET = "aerodispatch-jwt-access-secret-32chars-minimum-prod-key-2026"
DEFAULT_DEV_REFRESH_SECRET = "aerodispatch-jwt-refresh-secret-32chars-minimum-prod-key-2026"

JWT_ACCESS_SECRET = os.getenv("JWT_ACCESS_SECRET") or os.getenv("JWT_SECRET") or DEFAULT_DEV_ACCESS_SECRET
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET") or DEFAULT_DEV_REFRESH_SECRET

# Strict algorithm whitelist (never allow 'none' or dynamically picked algs)
JWT_ALGORITHM = "HS256"
ALLOWED_JWT_ALGORITHMS = ["HS256"]

JWT_ISSUER = "aerodispatch-auth"
JWT_AUDIENCE = "aerodispatch-api"

# Token lifetimes
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))  # 15 minutes
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))      # 7 days
PASSWORD_RESET_TOKEN_EXPIRE_HOURS = 1

# ==============================================================================
# Cookie Configuration
# ==============================================================================
# Secure flag: False for local HTTP development, True for production HTTPS
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true" if IS_PRODUCTION else "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").lower()  # "lax", "strict", or "none"
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", None)

ACCESS_COOKIE_NAME = "aerodispatch_access_token"
REFRESH_COOKIE_NAME = "aerodispatch_refresh_token"
CSRF_COOKIE_NAME = "aerodispatch_csrf_token"

# ==============================================================================
# CORS & Allowed Origins
# ==============================================================================
DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://aerodispatch-web-761112473042.s3-website.ap-northeast-2.amazonaws.com",
    "https://aerodispatch-web-761112473042.s3-website.ap-northeast-2.amazonaws.com",
    "http://aerodispatch-api-live.eba-phcug3cm.ap-northeast-2.elasticbeanstalk.com",
    "https://aerodispatch-api-live.eba-phcug3cm.ap-northeast-2.elasticbeanstalk.com",
]
cors_env = os.getenv("CORS_ORIGINS")
ALLOWED_ORIGINS: List[str] = [
    orig.strip() for orig in cors_env.split(",") if orig.strip()
] if cors_env else DEFAULT_CORS_ORIGINS

# ==============================================================================
# File Upload Constraints
# ==============================================================================
MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

# ==============================================================================
# Rate Limiting & Throttling
# ==============================================================================
LOGIN_RATE_LIMIT_MAX_ATTEMPTS = int(os.getenv("LOGIN_RATE_LIMIT_MAX_ATTEMPTS", "5"))
LOGIN_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("LOGIN_RATE_LIMIT_WINDOW_SECONDS", "900"))  # 15 min window


def validate_security_configuration() -> None:
    """Validates security configuration at application startup."""
    if IS_PRODUCTION:
        if JWT_ACCESS_SECRET == DEFAULT_DEV_ACCESS_SECRET or JWT_REFRESH_SECRET == DEFAULT_DEV_REFRESH_SECRET:
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: Production environment detected with default JWT secrets. "
                "You must set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables."
            )
        if len(JWT_ACCESS_SECRET) < 32 or len(JWT_REFRESH_SECRET) < 32:
            raise RuntimeError("JWT secrets must be at least 32 characters long in production.")
        if not COOKIE_SECURE:
            import logging
            logging.getLogger("security.config").warning(
                "WARNING: COOKIE_SECURE is disabled in production environment. HTTPS is strongly recommended."
            )

