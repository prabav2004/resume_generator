import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.resume import ParsedResumeText
from app.schemas.skills import SkillExtractionResult
from app.schemas.ats import ATSAnalysisResult, ATSCategoryScore
from app.schemas.role_comparison import RoleComparisonResult, SkillGap, PriorityLevel
from app.schemas.career_recommendation import CareerRecommendationResult
from app.schemas.learning_roadmap import LearningRoadmapResult, RoadmapPhase


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


@pytest.fixture
def mock_pipeline_services():
    with patch("app.api.v1.routes.analysis.save_resume_temporarily") as mock_save, \
         patch("app.graphs.pipeline_agent.ResumeParser.parse_pdf") as mock_parse, \
         patch("app.graphs.pipeline_agent.SkillExtractionAgent") as mock_skill_agent, \
         patch("app.graphs.pipeline_agent.ATSAnalyzerAgent") as mock_ats_agent, \
         patch("app.graphs.pipeline_agent.RoleComparisonAgent") as mock_role_agent, \
         patch("app.graphs.pipeline_agent.CareerRecommendationAgent") as mock_career_agent, \
         patch("app.graphs.pipeline_agent.LearningRoadmapAgent") as mock_roadmap_agent:

        mock_save.return_value = "dummy_resume.pdf"

        mock_parse.return_value = ParsedResumeText(
            filename="dummy_resume.pdf",
            page_count=1,
            text="Resume text with Python",
            pages=[],
        )

        # Skill agent call mock
        skill_inst = MagicMock()
        skill_inst.return_value = {
            "skills": {
                "programming_languages": ["Python"]
            }
        }
        mock_skill_agent.return_value = skill_inst

        # ATS agent call mock
        ats_inst = MagicMock()
        cat_score = ATSCategoryScore(score=80, findings=["Good."])
        ats_result = ATSAnalysisResult(
            ats_score=80,
            resume_structure=cat_score,
            keywords=cat_score,
            formatting=cat_score,
            technical_skills=cat_score,
            experience=cat_score,
            education=cat_score,
            strengths=["Python"],
            weaknesses=[],
            improvement_suggestions=[],
        )
        ats_inst.return_value = {"ats_analysis": ats_result.model_dump()}
        mock_ats_agent.return_value = ats_inst

        # Role comparison agent call mock
        role_inst = MagicMock()
        comparison_result = RoleComparisonResult(
            target_role="Backend Developer",
            extracted_skills={"programming_languages": ["Python"]},
            missing_skills=[
                SkillGap(
                    skill_name="FastAPI",
                    category="frameworks",
                    priority_level=PriorityLevel.CRITICAL,
                    why_important="Essential.",
                    learning_resources=["FastAPI Docs"],
                    estimated_learning_hours=20,
                )
            ],
            matched_skills={"programming_languages": ["Python"]},
            skill_match_percentage=50.0,
            overall_readiness="Intermediate Level",
            recommended_learning_path=["Learn FastAPI"],
            total_learning_hours=20,
            summary="Needs FastAPI.",
        )
        role_inst.return_value = {"comparison_result": comparison_result.model_dump()}
        mock_role_agent.return_value = role_inst

        # Career recommendation agent call mock
        career_inst = MagicMock()
        rec_result = CareerRecommendationResult(
            suitable_roles=[
                {"title": "Backend Engineer", "why_suitable": "Backend experience", "match_score": 90}
            ],
            strengths=["Python"],
            areas_for_improvement=[],
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
        career_inst.return_value = {"recommendation_result": rec_result.model_dump()}
        mock_career_agent.return_value = career_inst

        # Learning roadmap agent call mock
        roadmap_inst = MagicMock()
        phase = RoadmapPhase(
            phase="30-Day Foundation",
            goal="Learn basic skills",
            skills=[],
            projects=[],
            practice_platforms=[],
            certifications=[],
            weekly_time_commitment_hours=10,
            success_metrics=[],
        )
        roadmap_result = LearningRoadmapResult(
            target_roles=["Backend Developer"],
            overall_goal="Become a backend developer",
            phase_30=phase,
            phase_60=phase,
            phase_90=phase,
            total_estimated_hours=30,
            motivational_summary="Keep going!",
        )
        roadmap_inst.return_value = {"roadmap_result": roadmap_result.model_dump()}
        mock_roadmap_agent.return_value = roadmap_inst

        yield {
            "save": mock_save,
            "parse": mock_parse,
        }


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data
    assert "version" in data


def test_upload_endpoint(mock_pipeline_services, client):
    # Send a dummy PDF file
    files = {"file": ("test_file.pdf", b"%PDF-1.4 dummy content", "application/pdf")}
    response = client.post("/api/v1/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "dummy_resume.pdf"


def test_pipeline_flow(mock_pipeline_services, client):
    # 1. Start analysis
    payload = {
        "filename": "dummy_resume.pdf",
        "target_role": "Backend Developer"
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 202
    data = response.json()
    assert "id" in data
    assert data["status"] == "running"

    analysis_id = data["id"]

    # 2. Get results (should eventually be completed because TestClient runs background tasks synchronously by default!)
    response = client.get(f"/api/v1/results/{analysis_id}")
    assert response.status_code == 200
    data = response.json()

    assert data["pipeline_status"] == "complete"
    assert data["resume_filename"] == "dummy_resume.pdf"
    assert data["page_count"] == 1
    assert data["skills"]["programming_languages"] == ["Python"]
    assert data["ats_analysis"]["ats_score"] == 80
    assert data["comparison_result"]["target_role"] == "Backend Developer"
    assert data["recommendation_result"]["suitable_roles"][0]["title"] == "Backend Engineer"
    assert data["roadmap_result"]["overall_goal"] == "Become a backend developer"
    assert "pdf_extraction" in data["node_timings"]


def test_get_results_not_found(client):
    response = client.get("/api/v1/results/nonexistent-id")
    assert response.status_code == 404
    assert "was not found" in response.json()["detail"]
