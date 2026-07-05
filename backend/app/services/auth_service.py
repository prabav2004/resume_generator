import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config.config import get_settings
from app.models.auth import AnalysisHistory, User

settings = get_settings()


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


def _user_to_dict(user: User) -> dict[str, Any]:
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'password': user.hashed_password,
        'created_at': user.created_at,
    }


def _history_to_dict(entry: AnalysisHistory) -> dict[str, Any]:
    return {
        'id': entry.id,
        'filename': entry.filename,
        'status': entry.status,
        'target_role': entry.target_role,
        'created_at': entry.created_at,
    }


def register_user(db: Session, username: str, email: str, password: str) -> dict[str, Any]:
    if db.scalar(select(User).where(User.username == username)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username already exists')
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already exists')

    user = User(
        id=secrets.token_hex(8),
        username=username,
        email=email,
        hashed_password=_hash_password(password),
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username or email already exists') from exc
    db.refresh(user)
    return _user_to_dict(user)


def authenticate_user(db: Session, username: str, password: str) -> dict[str, Any]:
    user = db.scalar(select(User).where(User.username == username))
    if not user or not _verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid username or password')
    return _user_to_dict(user)


def get_user_profile(db: Session, user_id: str) -> dict[str, Any]:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return _user_to_dict(user)


def add_analysis_history(db: Session, user_id: str, filename: str, status: str, target_role: str | None = None) -> None:
    if not db.get(User, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    entry = AnalysisHistory(
        id=secrets.token_hex(6),
        user_id=user_id,
        filename=filename,
        status=status,
        target_role=target_role,
        created_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()


def get_analysis_history(db: Session, user_id: str) -> list[dict[str, Any]]:
    entries = db.scalars(
        select(AnalysisHistory)
        .where(AnalysisHistory.user_id == user_id)
        .order_by(AnalysisHistory.created_at, AnalysisHistory.id)
    ).all()
    return [_history_to_dict(entry) for entry in entries]
