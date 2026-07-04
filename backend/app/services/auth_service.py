import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import HTTPException, status

from app.config.config import get_settings

settings = get_settings()

users_db: dict[str, dict[str, Any]] = {}
user_history_db: dict[str, list[dict[str, Any]]] = {}


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100_000)
    return f"{salt}${digest.hex()}"


def _verify_password(password: str, hashed_password: str) -> bool:
    try:
        salt, digest = hashed_password.split('$', 1)
        new_digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100_000)
        return new_digest.hex() == digest
    except ValueError:
        return False


def create_access_token(subject: str) -> str:
    payload = {
        'sub': subject,
        'exp': datetime.now(timezone.utc) + timedelta(hours=8),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.openai_api_key.get_secret_value(), algorithm='HS256')


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.openai_api_key.get_secret_value(), algorithms=['HS256'])
    except jwt.PyJWTError as exc:  # type: ignore[attr-defined]
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired token') from exc


def register_user(username: str, email: str, password: str) -> dict[str, Any]:
    if any(user['username'] == username for user in users_db.values()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username already exists')
    if any(user['email'] == email for user in users_db.values()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already exists')

    user_id = secrets.token_hex(8)
    user_record = {
        'id': user_id,
        'username': username,
        'email': email,
        'password': _hash_password(password),
        'created_at': datetime.now(timezone.utc),
    }
    users_db[user_id] = user_record
    user_history_db[user_id] = []
    return user_record


def authenticate_user(username: str, password: str) -> dict[str, Any]:
    user = next((item for item in users_db.values() if item['username'] == username), None)
    if not user or not _verify_password(password, user['password']):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid username or password')
    return user


def get_user_profile(user_id: str) -> dict[str, Any]:
    user = users_db.get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return user


def add_analysis_history(user_id: str, filename: str, status: str, target_role: str | None = None) -> None:
    entry = {
        'id': secrets.token_hex(6),
        'filename': filename,
        'status': status,
        'target_role': target_role,
        'created_at': datetime.now(timezone.utc),
    }
    user_history_db.setdefault(user_id, []).append(entry)


def get_analysis_history(user_id: str) -> list[dict[str, Any]]:
    return user_history_db.get(user_id, [])
