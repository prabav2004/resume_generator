from fastapi import APIRouter, File, UploadFile, status, Query

from app.schemas.resume import ResumeUploadResponse, ParsedResumeText
from app.services.resume_upload_service import save_resume_temporarily
from app.services.resume_parser import ResumeParser
from app.config.config import get_settings

router = APIRouter()


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_resume(file: UploadFile = File(...)) -> ResumeUploadResponse:
    filename = await save_resume_temporarily(file)
    return ResumeUploadResponse(filename=filename)


@router.post(
    "/parse",
    response_model=ParsedResumeText,
    status_code=status.HTTP_200_OK,
)
async def parse_resume(filename: str = Query(...)) -> ParsedResumeText:
    """Extract text from an uploaded resume PDF."""
    settings = get_settings()
    file_path = settings.temp_upload_dir / filename
    parser = ResumeParser()
    return parser.parse_pdf(file_path)
