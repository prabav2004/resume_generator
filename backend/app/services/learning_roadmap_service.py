import logging
import time

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from app.config.config import get_settings
from app.schemas.learning_roadmap import LearningRoadmapResult
from app.schemas.skills import SkillExtractionResult
from app.services.llm_utils import (
    RequestDeduplicator,
    is_rate_limit_error,
    is_schema_error,
    retry_after_seconds,
    stable_request_key,
)
from app.utils.exceptions import AppError

logger = logging.getLogger(__name__)
_deduplicator = RequestDeduplicator()


class LearningRoadmapService:
    def __init__(self) -> None:
        self.settings = get_settings()

        self.openai_llm = ChatOpenAI(
            model=self.settings.openai_model,
            api_key=self.settings.openai_api_key.get_secret_value(),
            temperature=0.25,
            max_retries=0,
            timeout=75,
        )

        self.groq_llm = ChatOpenAI(
            model=self.settings.groq_model,
            api_key=self.settings.groq_api_key.get_secret_value(),
            base_url=self.settings.groq_base_url,
            temperature=0.2,
            max_retries=0,
            timeout=75,
        )

    def generate_roadmap(
        self,
        resume_text: str,
        skills: SkillExtractionResult | None = None,
        target_role: str | None = None,
    ) -> LearningRoadmapResult:
        key = stable_request_key(
            "roadmap",
            {
                "resume_text": resume_text,
                "skills": skills.model_dump() if skills else None,
                "target_role": target_role,
            },
        )
        return _deduplicator.run(key, lambda: self._generate_roadmap(resume_text, skills, target_role, key))

    def _generate_roadmap(
        self,
        resume_text: str,
        skills: SkillExtractionResult | None,
        target_role: str | None,
        analysis_id: str,
    ) -> LearningRoadmapResult:
        if not resume_text.strip():
            raise AppError("Resume text cannot be empty.", status_code=400, code="empty_resume_text")

        target_role = target_role or "Software Developer"
        messages = self._build_messages(resume_text, skills, target_role)
        provider_errors: dict[str, BaseException] = {}

        logger.info(
            "analysis_id=%s stage=roadmap provider_order=%s",
            analysis_id,
            self.settings.llm_primary_provider,
        )

        for provider in self._provider_order():
            try:
                return self._invoke_provider(provider, messages, analysis_id)
            except AppError as exc:
                provider_errors[provider] = exc
                if exc.code == "llm_rate_limited" and provider == "groq":
                    raise
                logger.warning(
                    "analysis_id=%s stage=roadmap provider=%s failed code=%s",
                    analysis_id,
                    provider,
                    exc.code,
                )
            except Exception as exc:
                provider_errors[provider] = exc
                logger.warning(
                    "analysis_id=%s stage=roadmap provider=%s failed type=%s error=%s",
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
            "Both OpenAI and Groq failed to generate the learning roadmap.",
            status_code=502,
            code="all_llm_providers_failed",
        )

    def _provider_order(self) -> list[str]:
        if self.settings.llm_primary_provider == "groq":
            return ["groq", "openai"]
        return ["openai", "groq"]

    def _llm_for_provider(self, provider: str) -> ChatOpenAI:
        return self.groq_llm if provider == "groq" else self.openai_llm

    def _invoke_provider(self, provider: str, messages, analysis_id: str) -> LearningRoadmapResult:
        structured_llm = self._llm_for_provider(provider).with_structured_output(LearningRoadmapResult)
        max_attempts = 2 if provider == "groq" else 1
        schema_retry_used = False

        for attempt in range(1, max_attempts + 1):
            try:
                logger.info("analysis_id=%s stage=roadmap provider=%s attempt=%s", analysis_id, provider, attempt)
                result = structured_llm.invoke(messages)
                logger.info("analysis_id=%s stage=roadmap provider=%s success=true", analysis_id, provider)
                return result
            except Exception as exc:
                if is_schema_error(exc) and not schema_retry_used:
                    schema_retry_used = True
                    logger.warning(
                        "analysis_id=%s stage=roadmap provider=%s schema_retry=true",
                        analysis_id,
                        provider,
                    )
                    messages = [
                        *messages,
                        HumanMessage(
                            content=(
                                "Retry and return complete JSON only. Every phase_30, phase_60, and phase_90 object "
                                "must include phase, goal, skills, projects, practice_platforms, certifications, "
                                "weekly_time_commitment_hours, and success_metrics. Never omit success_metrics; "
                                "include at least 3 concise success_metrics for each phase."
                            )
                        ),
                    ]
                    continue

                if provider == "groq" and is_rate_limit_error(exc):
                    wait_seconds = retry_after_seconds(exc)
                    logger.warning(
                        "analysis_id=%s stage=roadmap provider=groq attempt=%s rate_limited retry_after=%.2f",
                        analysis_id,
                        attempt,
                        wait_seconds,
                    )
                    if attempt < max_attempts:
                        time.sleep(min(wait_seconds, 20.0))
                        continue
                    raise AppError(
                        "AI generation is temporarily rate limited. Please retry shortly.",
                        status_code=429,
                        code="llm_rate_limited",
                    ) from exc
                raise

        raise AppError("No AI provider is currently available.", status_code=503, code="no_llm_provider_available")

    def _build_messages(
        self,
        resume_text: str,
        skills: SkillExtractionResult | None,
        target_role: str,
    ):
        return [
            (
                "system",
                "You are a career coach. Return compact structured JSON matching the schema. "
                "Required top-level fields: target_roles, overall_goal, phase_30, phase_60, phase_90, "
                "total_estimated_hours, motivational_summary. "
                "Each phase must include phase, goal, skills, projects, practice_platforms, certifications, "
                "weekly_time_commitment_hours, success_metrics. Never omit success_metrics. "
                "Return at least 3 success_metrics for phase_30, phase_60, and phase_90. "
                "Limits per phase: 3 skills, 1 project, 1 platform, 1 certification, 3 success_metrics, "
                "and max 2 resources per skill. Keep descriptions concise.",
            ),
            (
                "user",
                f"Target role: {target_role}\n{self._compact_resume_text(resume_text)}\n"
                f"{self._build_skills_context(skills)}\nGenerate the 30/60/90 day roadmap.",
            ),
        ]

    def _build_skills_context(self, skills: SkillExtractionResult | None) -> str:
        if not skills:
            return "Skills: not provided."

        lines = [
            f"- {category.replace('_', ' ').title()}: {', '.join(skill_list[:8])}"
            for category, skill_list in skills.model_dump().items()
            if skill_list
        ]
        return "Skills:\n" + "\n".join(lines) if lines else "Skills: none detected."

    def _compact_resume_text(self, resume_text: str, max_chars: int = 5000) -> str:
        text = " ".join(resume_text.split())
        if len(text) <= max_chars:
            return f"Resume:\n{text}"
        return f"Resume (truncated to reduce tokens):\n{text[:max_chars]}"
