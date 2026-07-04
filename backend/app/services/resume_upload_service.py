from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.config.config import get_settings
from app.utils.exceptions import ValidationAppError

PDF_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}
PDF_SIGNATURE = b"%PDF"
CHUNK_SIZE = 1024 * 1024


async def save_resume_temporarily(file: UploadFile) -> str:
    settings = get_settings()
    original_filename = Path(file.filename or "").name

    if not original_filename:
        raise ValidationAppError("Uploaded file must include a filename.", code="missing_filename")

    if Path(original_filename).suffix.lower() != ".pdf":
        raise ValidationAppError("Only PDF resume files are accepted.", code="invalid_file_extension")

    if file.content_type not in PDF_CONTENT_TYPES:
        raise ValidationAppError("Uploaded file must be a PDF.", code="invalid_file_type")

    first_chunk = await file.read(CHUNK_SIZE)
    if not first_chunk:
        raise ValidationAppError("Uploaded file is empty.", code="empty_file")

    if not first_chunk.startswith(PDF_SIGNATURE):
        raise ValidationAppError("Uploaded file content is not a valid PDF.", code="invalid_pdf_signature")

    upload_dir = settings.temp_upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)
    temp_filename = f"{uuid4().hex}_{original_filename}"
    temp_path = upload_dir / temp_filename

    total_size = 0

    try:
        with temp_path.open("wb") as destination:
            total_size = _write_chunk(destination, first_chunk, total_size, settings.max_resume_upload_bytes)

            while chunk := await file.read(CHUNK_SIZE):
                total_size = _write_chunk(destination, chunk, total_size, settings.max_resume_upload_bytes)
    except ValidationAppError:
        temp_path.unlink(missing_ok=True)
        raise
    except OSError as exc:
        temp_path.unlink(missing_ok=True)
        raise ValidationAppError(
            "Unable to save uploaded resume.",
            status_code=500,
            code="resume_upload_failed",
        ) from exc
    finally:
        await file.close()

    return temp_filename


def _write_chunk(destination, chunk: bytes, current_size: int, max_size: int) -> int:
    next_size = current_size + len(chunk)
    if next_size > max_size:
        raise ValidationAppError("Resume PDF must be 10 MB or smaller.", code="file_too_large")

    destination.write(chunk)
    return next_size
