import logging
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.config.config import get_settings
from app.schemas.learning_roadmap import LearningRoadmapResult
from app.schemas.skills import SkillExtractionResult
from app.utils.exceptions import AppError

logger = logging.getLogger(__name__)


class LearningRoadmapService:
    def __init__(self) -> None:
        self.settings = get_settings()
        try:
            self.llm = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=self.settings.openai_api_key.get_secret_value(),
                temperature=0.7,
            )
            self.structured_llm = self.llm.with_structured_output(LearningRoadmapResult)
        except Exception as exc:
            logger.exception("Failed to initialize OpenAI client for learning roadmap")
            raise AppError(
                "Unable to initialize learning roadmap AI model.",
                status_code=503,
                code="openai_unavailable",
            ) from exc

    def generate_roadmap(
        self,
        resume_text: str,
        skills: SkillExtractionResult | None = None,
        target_role: str | None = None,
    ) -> LearningRoadmapResult:
        if not resume_text.strip():
            raise AppError("Resume text cannot be empty.", status_code=400, code="empty_resume_text")

        logger.info("Generating 30/60/90-day learning roadmap using LLM")

        # Build skills context
        skills_context = ""
        if skills:
            skills_context = "\nExtracted Skills from Resume:\n"
            for category, skill_list in skills.model_dump().items():
                if skill_list:
                    skills_context += f"- {category.replace('_', ' ').title()}: {', '.join(skill_list)}\n"

        target_context = ""
        if target_role:
            target_context = f"\nTarget Role: {target_role}\nPlease tailor this roadmap specifically for achieving the '{target_role}' role."

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    (
                        "You are a world-class Senior Career Coach and Learning Specialist with deep expertise in tech industry hiring.\n\n"
                        "Your task is to generate an actionable, detailed, highly personalized 30/60/90-day learning roadmap "
                        "for a candidate based on their current resume and extracted skills.\n\n"
                        "Guidelines:\n"
                        "- Phase 30 (Foundation): Focus on closing critical skill gaps and solidifying fundamentals.\n"
                        "- Phase 60 (Growth): Focus on building projects, gaining depth, and tackling intermediate challenges.\n"
                        "- Phase 90 (Mastery): Focus on advanced skills, full project completion, interview preparation and certifications.\n\n"
                        "For each phase, include:\n"
                        "  - Skills to focus on (with specific topics, learning resources, and estimated hours)\n"
                        "  - Projects to build (with title, description, tech stack, and difficulty)\n"
                        "  - Practice platforms (with name, URL, and purpose)\n"
                        "  - Certifications to pursue (with name, authority, reason, and study time)\n"
                        "  - Weekly time commitment\n"
                        "  - Success metrics to measure progress\n\n"
                        "Be specific, realistic, and inspiring. Use real platform URLs. Prioritize actions with the highest career impact."
                    ),
                ),
                (
                    "user",
                    (
                        "Here is the candidate's resume:\n"
                        "---BEGIN RESUME---\n"
                        "{resume_text}\n"
                        "---END RESUME---\n"
                        "{skills_context}"
                        "{target_context}\n\n"
                        "Please generate a comprehensive, personalized 30/60/90-day learning roadmap. "
                        "Make it detailed, actionable, and motivating."
                    ),
                ),
            ]
        )

        try:
            messages = prompt.format_messages(
                resume_text=resume_text,
                skills_context=skills_context,
                target_context=target_context,
            )
            result = self.structured_llm.invoke(messages)
            logger.info("Learning roadmap generated successfully")
            return result
        except Exception as exc:
            logger.exception("Failed to generate learning roadmap via OpenAI")
            raise AppError(
                "Failed to generate learning roadmap due to an external model error.",
                status_code=502,
                code="llm_generation_failed",
            ) from exc
