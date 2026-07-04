from datetime import datetime
from pydantic import BaseModel, Field, EmailStr


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=40)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class UserPublic(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class AnalysisHistoryEntry(BaseModel):
    id: str
    filename: str
    status: str
    target_role: str | None = None
    created_at: datetime
