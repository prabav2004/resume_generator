from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.resume import ParsedResumeText


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


@patch("app.api.v1.routes.resumes.ResumeParser")
def test_parse_resume_endpoint(mock_parser_class, client):
    mock_parser = MagicMock()
    mock_parser_class.return_value = mock_parser

    expected_result = ParsedResumeText(
        filename="resume.pdf",
        page_count=1,
        text="Resume text.",
        pages=[{"page_number": 1, "text": "Resume text."}],
    )
    mock_parser.parse_pdf.return_value = expected_result

    response = client.post("/api/v1/resumes/parse?filename=test_file.pdf")

    assert response.status_code == 200
    data = response.json()
    assert data["text"] == "Resume text."
    assert data["filename"] == "resume.pdf"
