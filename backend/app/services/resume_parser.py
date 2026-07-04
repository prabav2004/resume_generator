import logging
import re
from pathlib import Path

from pypdf import PdfReader
from pypdf.errors import PdfReadError

from app.schemas.resume import ParsedResumeText, ResumePageText
from app.utils.exceptions import ValidationAppError

logger = logging.getLogger(__name__)


class ResumeParser:
    def parse_pdf(self, file_path: str | Path) -> ParsedResumeText:
        pdf_path = Path(file_path)

        if not pdf_path.exists():
            raise ValidationAppError("Resume PDF was not found.", status_code=404, code="resume_not_found")

        if pdf_path.suffix.lower() != ".pdf":
            raise ValidationAppError("Resume parser accepts only PDF files.", code="invalid_file_extension")

        logger.info("Starting PDF text extraction for %s", pdf_path.name)

        try:
            reader = PdfReader(str(pdf_path))
        except PdfReadError as exc:
            logger.warning("Failed to read PDF %s: %s", pdf_path.name, exc)
            raise ValidationAppError("Unable to read resume PDF.", code="invalid_pdf") from exc
        except OSError as exc:
            logger.exception("File system error while opening PDF %s", pdf_path.name)
            raise ValidationAppError("Unable to open resume PDF.", status_code=500, code="pdf_open_failed") from exc

        if reader.is_encrypted:
            logger.info("PDF %s is encrypted; attempting empty-password decrypt", pdf_path.name)
            try:
                decrypt_result = reader.decrypt("")
            except Exception as exc:
                logger.warning("Encrypted PDF %s could not be decrypted", pdf_path.name)
                raise ValidationAppError(
                    "Encrypted PDF resumes are not supported unless they can be opened without a password.",
                    code="encrypted_pdf",
                ) from exc

            if decrypt_result == 0:
                logger.warning("Encrypted PDF %s requires a password", pdf_path.name)
                raise ValidationAppError(
                    "Encrypted PDF resumes are not supported unless they can be opened without a password.",
                    code="encrypted_pdf",
                )

        pages: list[ResumePageText] = []

        for index, page in enumerate(reader.pages, start=1):
            try:
                raw_text = page.extract_text() or ""
            except Exception as exc:
                logger.warning("Failed to extract text from %s page %s: %s", pdf_path.name, index, exc)
                raw_text = ""

            clean_text = self.clean_text(raw_text)
            logger.debug("Extracted %s characters from %s page %s", len(clean_text), pdf_path.name, index)
            pages.append(ResumePageText(page_number=index, text=clean_text))

        combined_text = self.clean_text("\n\n".join(page.text for page in pages if page.text))
        logger.info("Completed PDF text extraction for %s: %s pages", pdf_path.name, len(pages))

        return ParsedResumeText(
            filename=pdf_path.name,
            page_count=len(pages),
            text=combined_text,
            pages=pages,
        )

    @staticmethod
    def clean_text(text: str) -> str:
        normalized = text.replace("\r", "\n")
        normalized = re.sub(r"[ \t\f\v]+", " ", normalized)
        normalized = re.sub(r" *\n *", "\n", normalized)
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        return normalized.strip()
