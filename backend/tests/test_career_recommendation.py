from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.career_recommendation import CareerRecommendationResult
from app.services.career_recommendation_service import CareerRecommendationService


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


def test_schema_parsing():
    # Test that CareerRecommendationResult can parse correctly
    data = {
        "suitable_roles": [
            {"title": "Software Engineer", "why_suitable": "Experience with Python", "match_score": 90}
        ],
        "strengths": ["Python", "FastAPI"],
        "areas_for_improvement": ["Docker"],
        "interview_preparation": {
            "technical_topics": ["Concurrency", "REST APIs"],
            "behavioral_tips": ["Be clear about your experience"],
            "sample_questions": ["Tell me about your FastAPI project"],
        },
        "certifications_to_pursue": [
            {"name": "AWS Developer Associate", "authority": "AWS", "why_recommend": "Enhance cloud skills"}
        ],
        "salary_growth": {
            "current_market_range": "$90,000 - $110,000",
            "growth_strategies": ["Learn AWS", "Lead a project"],
            "high_paying_skills": ["AWS", "Kubernetes"],
        },
    }
    result = CareerRecommendationResult(**data)
    assert result.suitable_roles[0].title == "Software Engineer"
    assert len(result.strengths) == 2


@patch("app.services.career_recommendation_service.ChatOpenAI")
def test_service_recommendation(mock_chat_openai):
    # Setup mocks
    mock_instance = MagicMock()
    mock_chat_openai.return_value = mock_instance

    mock_structured_llm = MagicMock()
    mock_instance.with_structured_output.return_value = mock_structured_llm

    # Mock return value of structured_llm.invoke
    expected_result = CareerRecommendationResult(
        suitable_roles=[
            {"title": "Backend Engineer", "why_suitable": "Strong backend experience", "match_score": 95}
        ],
        strengths=["FastAPI", "Python"],
        areas_for_improvement=["System Design"],
        interview_preparation={
            "technical_topics": ["Databases", "APIs"],
            "behavioral_tips": ["Mention scale"],
            "sample_questions": ["Explain FastAPI architecture"],
        },
        certifications_to_pursue=[
            {"name": "AWS Certified Developer", "authority": "AWS", "why_recommend": "Cloud experience"}
        ],
        salary_growth={
            "current_market_range": "$100,000 - $120,000",
            "growth_strategies": ["Learn Kubernetes"],
            "high_paying_skills": ["Go", "Kubernetes"],
        },
    )
    mock_structured_llm.invoke.return_value = expected_result

    # Run service
    service = CareerRecommendationService()
    result = service.generate_recommendations("Experienced python developer with fastapi experience")

    assert result.suitable_roles[0].title == "Backend Engineer"
    assert result.strengths == ["FastAPI", "Python"]
    assert result.areas_for_improvement == ["System Design"]

    mock_structured_llm.invoke.assert_called_once()


@patch("app.services.career_recommendation_service.CareerRecommendationService.generate_recommendations")
def test_api_recommendation_endpoint(mock_gen_rec, client):
    expected_result = CareerRecommendationResult(
        suitable_roles=[
            {"title": "Backend Engineer", "why_suitable": "Backend experience", "match_score": 90}
        ],
        strengths=["Python"],
        areas_for_improvement=["Frontend"],
        interview_preparation={
            "technical_topics": ["APIs"],
            "behavioral_tips": ["Communicate well"],
            "sample_questions": ["Describe a project"],
        },
        certifications_to_pursue=[],
        salary_growth={
            "current_market_range": "$80k - $100k",
            "growth_strategies": ["Learn Javascript"],
            "high_paying_skills": ["React"],
        },
    )
    mock_gen_rec.return_value = expected_result

    # Request payload
    payload = {"resume_text": "Experienced Python backend dev."}

    response = client.post("/api/v1/career/recommend", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["suitable_roles"][0]["title"] == "Backend Engineer"
    assert "Python" in data["strengths"]
