import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


def test_ats_analysis_endpoint(client):
    payload = {
        "resume_text": "John Doe\nSummary\nExperienced software developer.\nSkills: Python, FastAPI, SQL\nExperience\nDeveloped web APIs.\nEducation\nBachelor in Computer Science",
        "skills": {
            "programming_languages": ["Python"],
            "frameworks": ["FastAPI"],
            "databases": ["PostgreSQL"],
        },
    }

    response = client.post("/api/v1/resumes/analyze", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "ats_score" in data
    assert "resume_structure" in data
    assert "keywords" in data
    assert "formatting" in data
    assert "strengths" in data
    assert "weaknesses" in data
