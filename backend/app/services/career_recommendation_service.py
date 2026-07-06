import logging
import time

from langchain_openai import ChatOpenAI

from app.config.config import get_settings
from app.schemas.career_recommendation import CareerRecommendationResult
from app.schemas.skills import SkillExtractionResult
from app.services.llm_utils import RequestDeduplicator, is_rate_limit_error, retry_after_seconds, stable_request_key
from app.utils.exceptions import AppError


logger = logging.getLogger(__name__)
_deduplicator = RequestDeduplicator()


class CareerRecommendationService:
    def __init__(self) -> None:
        self.settings = get_settings()

        try:
            self.openai_llm = ChatOpenAI(
                model=self.settings.openai_model,
                api_key=self.settings.openai_api_key.get_secret_value(),
                temperature=0.4,
                max_retries=0,
                timeout=60,
            )
            self.openai_structured_llm = self.openai_llm.with_structured_output(CareerRecommendationResult)
            logger.info("OpenAI career model initialized successfully")
        except Exception:
            logger.exception("Failed to initialize OpenAI career model")
            self.openai_llm = None
            self.openai_structured_llm = None

        try:
            self.groq_llm = ChatOpenAI(
                model=self.settings.groq_model,
                api_key=self.settings.groq_api_key.get_secret_value(),
                base_url=self.settings.groq_base_url,
                temperature=0.4,
                max_retries=0,
                timeout=60,
            )
            self.groq_structured_llm = self.groq_llm.with_structured_output(CareerRecommendationResult)
            logger.info("Groq career model initialized successfully")
        except Exception:
            logger.exception("Failed to initialize Groq career model")
            self.groq_llm = None
            self.groq_structured_llm = None

        if self.openai_structured_llm is None and self.groq_structured_llm is None:
            raise AppError(
                "Unable to initialize any career recommendation AI model.",
                status_code=503,
                code="all_llm_providers_unavailable",
            )

    def generate_recommendations(
        self,
        resume_text: str,
        skills: SkillExtractionResult | None = None,
    ) -> CareerRecommendationResult:
        key = stable_request_key(
            "career",
            {
                "resume_text": resume_text,
                "skills": skills.model_dump() if skills else None,
            },
        )
        return _deduplicator.run(key, lambda: self._generate_recommendations(resume_text, skills, key))

    def _generate_recommendations(
        self,
        resume_text: str,
        skills: SkillExtractionResult | None,
        analysis_id: str,
    ) -> CareerRecommendationResult:
        if not resume_text.strip():
            raise AppError("Resume text cannot be empty.", status_code=400, code="empty_resume_text")

        logger.info(
            "analysis_id=%s stage=career provider_order=%s",
            analysis_id,
            self.settings.llm_primary_provider,
        )

        messages = [
            (
                "system",
                "You are a career advisor. Return structured JSON matching the schema. "
                "Be specific and concise. Limit suitable_roles to 3, strengths to 5, "
                "areas_for_improvement to 5, certifications to 3, and list fields to 3-5 short items.",
            ),
            (
                "user",
                f"{self._compact_resume_text(resume_text)}\n{self._build_skills_context(skills)}\n"
                "Generate career recommendations.",
            ),
        ]

        provider_errors: dict[str, BaseException] = {}
        for provider in self._provider_order():
            structured_llm = self._structured_llm(provider)
            if structured_llm is None:
                continue
            try:
                return self._invoke_provider(structured_llm, provider, messages, analysis_id)
            except AppError as exc:
                provider_errors[provider] = exc
                if exc.code == "llm_rate_limited" and provider == "groq":
                    raise
                logger.warning(
                    "analysis_id=%s stage=career provider=%s failed code=%s",
                    analysis_id,
                    provider,
                    exc.code,
                )
            except Exception as exc:
                provider_errors[provider] = exc
                logger.warning(
                    "analysis_id=%s stage=career provider=%s failed type=%s error=%s",
                    analysis_id,
                    provider,
                    type(exc).__name__,
                    str(exc),
                )

        if any(is_rate_limit_error(error) for error in provider_errors.values()):
            raise AppError(
                "AI generation is temporarily rate limited. Please retry shortly.",
                status_code=429,
                code="llm_rate_limited",
            )

        raise AppError(
            "Both OpenAI and Groq failed to generate career recommendations.",
            status_code=502,
            code="all_llm_providers_failed",
        )

    def _provider_order(self) -> list[str]:
        if self.settings.llm_primary_provider == "groq":
            return ["groq", "openai"]
        return ["openai", "groq"]

    def _structured_llm(self, provider: str):
        return self.groq_structured_llm if provider == "groq" else self.openai_structured_llm

    def _invoke_provider(self, structured_llm, provider: str, messages, analysis_id: str) -> CareerRecommendationResult:
        attempts = 2 if provider == "groq" else 1
        for attempt in range(1, attempts + 1):
            try:
                logger.info("analysis_id=%s stage=career provider=%s attempt=%s", analysis_id, provider, attempt)
                result = structured_llm.invoke(messages)
                logger.info("analysis_id=%s stage=career provider=%s success=true", analysis_id, provider)
                return result
            except Exception as exc:
                if provider == "groq" and is_rate_limit_error(exc):
                    wait_seconds = retry_after_seconds(exc)
                    logger.warning(
                        "analysis_id=%s stage=career provider=groq attempt=%s rate_limited retry_after=%.2f",
                        analysis_id,
                        attempt,
                        wait_seconds,
                    )
                    if attempt < attempts:
                        time.sleep(min(wait_seconds, 20.0))
                        continue
                    raise AppError(
                        "AI generation is temporarily rate limited. Please retry shortly.",
                        status_code=429,
                        code="llm_rate_limited",
                    ) from exc
                raise

        raise AppError("No AI provider is currently available.", status_code=503, code="no_llm_provider_available")

    def _build_skills_context(self, skills: SkillExtractionResult | None) -> str:
        if not skills:
            return "Skills: not provided."
        lines = [
            f"- {category.replace('_', ' ').title()}: {', '.join(skill_list[:8])}"
            for category, skill_list in skills.model_dump().items()
            if skill_list
        ]
        return "Skills:\n" + "\n".join(lines) if lines else "Skills: none detected."

    def _compact_resume_text(self, resume_text: str, max_chars: int = 6000) -> str:
        text = " ".join(resume_text.split())
        if len(text) <= max_chars:
            return f"Resume:\n{text}"
        return f"Resume (truncated to reduce tokens):\n{text[:max_chars]}"
