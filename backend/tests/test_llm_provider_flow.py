from types import SimpleNamespace

import pytest

from app.services.career_recommendation_service import CareerRecommendationService
from app.services.learning_roadmap_service import LearningRoadmapService
from app.utils.exceptions import AppError


class FakeStructuredLLM:
    def __init__(self, result=None, errors: list[Exception] | None = None) -> None:
        self.result = result
        self.errors = errors or []
        self.calls = 0

    def invoke(self, messages):
        self.calls += 1
        if self.errors:
            raise self.errors.pop(0)
        return self.result


class FakeLLM:
    def __init__(self, structured: FakeStructuredLLM) -> None:
        self.structured = structured

    def with_structured_output(self, schema):
        return self.structured


def test_career_uses_groq_first_when_configured():
    service = CareerRecommendationService.__new__(CareerRecommendationService)
    service.settings = SimpleNamespace(llm_primary_provider="groq")
    service.openai_structured_llm = FakeStructuredLLM(result="openai")
    service.groq_structured_llm = FakeStructuredLLM(result="groq")

    result = service._generate_recommendations("Python FastAPI developer", None, "analysis-test")

    assert result == "groq"
    assert service.groq_structured_llm.calls == 1
    assert service.openai_structured_llm.calls == 0


def test_roadmap_groq_rate_limit_returns_temporary_error():
    service = LearningRoadmapService.__new__(LearningRoadmapService)
    service.settings = SimpleNamespace(llm_primary_provider="groq")
    service.groq_llm = FakeLLM(
        FakeStructuredLLM(
            errors=[
                Exception("429 Too Many Requests. Please try again in 0 seconds."),
                Exception("429 Too Many Requests. Please try again in 0 seconds."),
            ]
        )
    )
    service.openai_llm = FakeLLM(FakeStructuredLLM(result="openai"))

    with pytest.raises(AppError) as exc:
        service._generate_roadmap("Python FastAPI developer", None, "Backend Developer", "analysis-test")

    assert exc.value.status_code == 429
    assert exc.value.code == "llm_rate_limited"


def test_roadmap_schema_failure_retries_same_provider_once():
    service = LearningRoadmapService.__new__(LearningRoadmapService)
    service.settings = SimpleNamespace(llm_primary_provider="groq")
    groq_structured = FakeStructuredLLM(errors=[Exception("Generated JSON does not match the expected schema.")], result="roadmap")
    service.groq_llm = FakeLLM(groq_structured)
    service.openai_llm = FakeLLM(FakeStructuredLLM(result="openai"))

    result = service._generate_roadmap("Python FastAPI developer", None, "Backend Developer", "analysis-test")

    assert result == "roadmap"
    assert groq_structured.calls == 2
