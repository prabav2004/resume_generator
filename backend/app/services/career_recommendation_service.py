import logging
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.config.config import get_settings
from app.schemas.career_recommendation import CareerRecommendationResult
from app.schemas.skills import SkillExtractionResult
from app.utils.exceptions import AppError

logger = logging.getLogger(__name__)


class CareerRecommendationService:
    def __init__(self) -> None:
        self.settings = get_settings()
        try:
            # Initialize OpenAI Chat Model
            self.llm = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=self.settings.openai_api_key.get_secret_value(),
                temperature=0.7,
            )
            # Configure model to return structured output matching the schema
            self.structured_llm = self.llm.with_structured_output(CareerRecommendationResult)
        except Exception as exc:
            logger.exception("Failed to initialize OpenAI client for career recommendations")
            raise AppError(
                "Unable to initialize career recommendation AI model.",
                status_code=503,
                code="openai_unavailable",
            ) from exc

    def generate_recommendations(
        self, resume_text: str, skills: SkillExtractionResult | None = None
    ) -> CareerRecommendationResult:
        if not resume_text.strip():
            raise AppError("Resume text cannot be empty.", status_code=400, code="empty_resume_text")

        logger.info("Generating career recommendations using LLM")

        # Prepare optional skills context
        skills_context = ""
        if skills:
            skills_dict = skills.model_dump()
            skills_context = "\nPre-extracted Skills:\n"
            for category, skill_list in skills_dict.items():
                if skill_list:
                    skills_context += f"- {category.replace('_', ' ').title()}: {', '.join(skill_list)}\n"

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    (
                        "You are an expert, premium Career Advisor and Recruitment Specialist.\n"
                        "Your task is to analyze the user's resume and optionally their pre-extracted skills, "
                        "and generate comprehensive, high-quality, actionable career recommendations.\n\n"
                        "You must strictly output a structured JSON response matching the requested schema. "
                        "Provide detailed, realistic, and highly personalized advice based on their actual background, "
                        "avoiding generic or placeholder answers."
                    ),
                ),
                (
                    "user",
                    (
                        "Here is the resume content:\n"
                        "---BEGIN RESUME---\n"
                        "{resume_text}\n"
                        "---END RESUME---\n"
                        "{skills_context}\n"
                        "Please analyze this profile and generate:\n"
                        "1. Suitable job roles (including match scores and detailed suitability reasons)\n"
                        "2. Key career strengths\n"
                        "3. Areas for improvement/gaps to bridge\n"
                        "4. Tailored interview preparation advice (technical topics, behavioral tips, and sample questions)\n"
                        "5. Certifications to pursue (relevant to their target trajectory)\n"
                        "6. Salary growth suggestions (estimated range, specific growth strategies, high-paying skills)"
                    ),
                ),
            ]
        )

        try:
            messages = prompt.format_messages(resume_text=resume_text, skills_context=skills_context)
            result = self.structured_llm.invoke(messages)
            logger.info("Career recommendations generated successfully")
            return result
        except Exception as exc:
            logger.exception("Failed to generate career recommendations via OpenAI")
            raise AppError(
                "Failed to generate career recommendations due to an external model error.",
                status_code=502,
                code="llm_generation_failed",
            ) from exc
