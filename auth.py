"""Password hashing and JWT authentication helpers for Chutti.com."""
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Cookie, Header, HTTPException, status

from database import get_user_by_id

# Keep a deterministic fallback secret in dev if JWT_SECRET is not provided in .env,
# stored in data/.jwt_secret so restarts don't invalidate active logins.
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_SECRET_FILE = os.path.join(_BASE_DIR, "data", ".jwt_secret")
_CACHED_SECRET: str | None = None


def _jwt_secret() -> str:
    global _CACHED_SECRET
    env_secret = os.getenv("JWT_SECRET", "").strip()
    if env_secret and env_secret != "change-this-to-a-random-secret-string":
        return env_secret
    if _CACHED_SECRET:
        return _CACHED_SECRET
    os.makedirs(os.path.dirname(_SECRET_FILE), exist_ok=True)
    if os.path.exists(_SECRET_FILE):
        with open(_SECRET_FILE, "r", encoding="utf-8") as fh:
            s = fh.read().strip()
            if s:
                _CACHED_SECRET = s
                return s
    s = secrets.token_hex(32)
    with open(_SECRET_FILE, "w", encoding="utf-8") as fh:
        fh.write(s)
    _CACHED_SECRET = s
    return s


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 200_000)
    return f"pbkdf2_sha256${salt}${dk.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algo, salt, hex_digest = stored_hash.split("$", 2)
        if algo != "pbkdf2_sha256":
            return False
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 200_000)
        return hmac.compare_digest(dk.hex(), hex_digest)
    except Exception:
        return False


def create_access_token(user: dict, days_valid: int = 7) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "name": user["name"],
        "picture_url": user.get("picture_url", ""),
        "auth_provider": user.get("auth_provider", "local"),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=days_valid)).timestamp()),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def _extract_token(authorization: str | None, chutti_token: str | None) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    if chutti_token:
        return chutti_token.strip()
    return None


def get_optional_user(
    authorization: str | None = Header(default=None),
    chutti_token: str | None = Cookie(default=None),
) -> dict | None:
    token = _extract_token(authorization, chutti_token)
    if not token:
        return None
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        return None
    try:
        uid = int(payload["sub"])
    except ValueError:
        return None
    return get_user_by_id(uid)


def get_current_user(
    authorization: str | None = Header(default=None),
    chutti_token: str | None = Cookie(default=None),
) -> dict:
    user = get_optional_user(authorization=authorization, chutti_token=chutti_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to continue.",
        )
    return user

