import logging

from langchain_openai import ChatOpenAI

from app.config.config import get_settings
from app.schemas.career_recommendation import CareerRecommendationResult
from app.schemas.skills import SkillExtractionResult
from app.services.llm_utils import RequestDeduplicator, is_rate_limit_error, is_schema_error, stable_request_key
from app.services.structured_llm_helper import invoke_structured_with_json_recovery
from app.utils.exceptions import AppError

logger = logging.getLogger(__name__)
_deduplicator = RequestDeduplicator()


class CareerRecommendationService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.openai_llm = self._make_llm("openai")
        self.groq_llm = self._make_llm("groq")
        if self.openai_llm is None and self.groq_llm is None:
            raise AppError("Unable to initialize any career recommendation AI model.", status_code=503, code="llm_unavailable")

    def _make_llm(self, provider: str):
        try:
            kwargs = dict(temperature=0.4, max_retries=0, timeout=60)
            if provider == "groq":
                return ChatOpenAI(model=self.settings.groq_model, api_key=self.settings.groq_api_key.get_secret_value(), base_url=self.settings.groq_base_url, **kwargs)
            return ChatOpenAI(model=self.settings.openai_model, api_key=self.settings.openai_api_key.get_secret_value(), **kwargs)
        except Exception:
            logger.exception("Failed to initialize %s career model", provider)
            return None

    def generate_recommendations(self, resume_text: str, skills: SkillExtractionResult | None = None) -> CareerRecommendationResult:
        key = stable_request_key("career", {"resume_text": resume_text, "skills": skills.model_dump() if skills else None})
        return _deduplicator.run(key, lambda: self._generate_recommendations(resume_text, skills, key))

    def _generate_recommendations(self, resume_text: str, skills: SkillExtractionResult | None, analysis_id: str) -> CareerRecommendationResult:
        if not resume_text.strip():
            raise AppError("Resume text cannot be empty.", status_code=400, code="empty_resume_text")

        messages = [
            ("system", "You are a career advisor. Return exactly ONE JSON object matching the requested schema. Never return a top-level array, markdown, commentary, or extra fields. Ensure certifications_to_pursue is a JSON array and salary_growth is a JSON object. Be specific and concise. Limit suitable_roles to 3, strengths to 5, areas_for_improvement to 5, certifications to 3, and list fields to 3-5 short items."),
            ("user", f"{self._compact_resume_text(resume_text)}\n{self._build_skills_context(skills)}\nGenerate career recommendations."),
        ]
        errors: list[BaseException] = []
        for provider in self._provider_order():
            llm = self.groq_llm if provider == "groq" else self.openai_llm
            if llm is None:
                continue
            try:
                return invoke_structured_with_json_recovery(llm=llm, messages=messages, model_cls=CareerRecommendationResult, provider=provider, stage="career", analysis_id=analysis_id)
            except Exception as exc:
                errors.append(exc)
                logger.warning("analysis_id=%s stage=career provider=%s failed type=%s", analysis_id, provider, type(exc).__name__)

        self._raise_final_error(errors, "career recommendations")

    def _raise_final_error(self, errors: list[BaseException], label: str):
        if not errors:
            raise AppError("No AI provider is currently available.", status_code=503, code="llm_unavailable")
        if all(is_rate_limit_error(e) for e in errors):
            raise AppError("AI generation is temporarily rate limited. Please retry shortly.", status_code=429, code="llm_rate_limited")
        if any(is_schema_error(e) or isinstance(e, ValueError) for e in errors):
            raise AppError(f"AI providers returned invalid structured output for {label}.", status_code=502, code="llm_invalid_output")
        raise AppError(f"All configured AI providers failed to generate {label}.", status_code=502, code="llm_generation_failed")

    def _provider_order(self) -> list[str]:
        return ["groq", "openai"] if self.settings.llm_primary_provider == "groq" else ["openai", "groq"]

    def _build_skills_context(self, skills: SkillExtractionResult | None) -> str:
        if not skills:
            return "Skills: not provided."
        lines = [f"- {k.replace('_', ' ').title()}: {', '.join(v[:8])}" for k, v in skills.model_dump().items() if v]
        return "Skills:\n" + "\n".join(lines) if lines else "Skills: none detected."

    def _compact_resume_text(self, resume_text: str, max_chars: int = 6000) -> str:
        text = " ".join(resume_text.split())
        return f"Resume:\n{text}" if len(text) <= max_chars else f"Resume (truncated to reduce tokens):\n{text[:max_chars]}"
