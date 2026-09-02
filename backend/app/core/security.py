import os
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union
import jwt
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """
    Generates a fast & secure PBKDF2-HMAC-SHA256 password hash with unique salt.
    """
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        20000
    ).hex()
    return f"pbkdf2_sha256${salt}${key}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a password against the PBKDF2 hash.
    """
    try:
        if not hashed_password or "$" not in hashed_password:
            return False
        parts = hashed_password.split("$")
        if len(parts) != 3 or parts[0] != "pbkdf2_sha256":
            return False
        salt, expected_key = parts[1], parts[2]
        
        # Check both 20000 and 100000 iterations for backwards compatibility
        computed_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            20000
        ).hex()
        if hmac.compare_digest(expected_key, computed_key):
            return True
            
        computed_key_old = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100000
        ).hex()
        return hmac.compare_digest(expected_key, computed_key_old)
    except Exception:
        return False

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    if isinstance(encoded_jwt, bytes):
        encoded_jwt = encoded_jwt.decode("utf-8")
    return encoded_jwt