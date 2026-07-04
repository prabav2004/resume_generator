from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.auth import AnalysisHistoryEntry, LoginRequest, RegisterRequest, TokenResponse, UserPublic
from app.services.auth_service import (
    add_analysis_history,
    authenticate_user,
    create_access_token,
    decode_access_token,
    get_analysis_history,
    get_user_profile,
    register_user,
)

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing authentication token')
    payload = decode_access_token(credentials.credentials)
    return get_user_profile(payload['sub'])


@router.post('/register', response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest) -> TokenResponse:
    user = register_user(payload.username, payload.email, payload.password)
    token = create_access_token(user['id'])
    return TokenResponse(
        access_token=token,
        user=UserPublic(
            id=user['id'],
            username=user['username'],
            email=user['email'],
            created_at=user['created_at'],
        ),
    )


@router.post('/login', response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    user = authenticate_user(payload.username, payload.password)
    token = create_access_token(user['id'])
    return TokenResponse(
        access_token=token,
        user=UserPublic(
            id=user['id'],
            username=user['username'],
            email=user['email'],
            created_at=user['created_at'],
        ),
    )


@router.get('/me', response_model=UserPublic)
async def me(current_user: dict = Depends(get_current_user)) -> UserPublic:
    return UserPublic(
        id=current_user['id'],
        username=current_user['username'],
        email=current_user['email'],
        created_at=current_user['created_at'],
    )


@router.get('/history', response_model=list[AnalysisHistoryEntry])
async def history(current_user: dict = Depends(get_current_user)) -> list[AnalysisHistoryEntry]:
    entries = get_analysis_history(current_user['id'])
    return [
        AnalysisHistoryEntry(
            id=entry['id'],
            filename=entry['filename'],
            status=entry['status'],
            target_role=entry['target_role'],
            created_at=entry['created_at'],
        )
        for entry in entries
    ]


@router.post('/history', status_code=status.HTTP_201_CREATED)
async def save_history(payload: dict, current_user: dict = Depends(get_current_user)) -> dict:
    add_analysis_history(current_user['id'], payload['filename'], payload['status'], payload.get('target_role'))
    return {'ok': True}
