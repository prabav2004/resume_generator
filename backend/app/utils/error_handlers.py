import logging
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.errors import ErrorResponse
from app.utils.exceptions import AppError

logger = logging.getLogger(__name__)


def _request_id(request: Request) -> str:
    return request.headers.get("x-request-id", str(uuid4()))


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        request_id = _request_id(request)
        logger.warning("%s | %s | %s", request_id, exc.code, exc.detail)
        payload = ErrorResponse(detail=exc.detail, code=exc.code, request_id=request_id)
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        request_id = _request_id(request)
        logger.info("%s | request_validation_error | %s", request_id, exc.errors())
        payload = ErrorResponse(
            detail="Request validation failed.",
            code="request_validation_error",
            request_id=request_id,
        )
        return JSONResponse(status_code=422, content=payload.model_dump())

    @app.exception_handler(StarletteHTTPException)
    async def http_error_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        request_id = _request_id(request)
        payload = ErrorResponse(
            detail=str(exc.detail),
            code="http_error",
            request_id=request_id,
        )
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = _request_id(request)
        logger.exception("%s | unhandled_error", request_id, exc_info=exc)
        payload = ErrorResponse(
            detail="Internal server error.",
            code="internal_server_error",
            request_id=request_id,
        )
        return JSONResponse(status_code=500, content=payload.model_dump())
