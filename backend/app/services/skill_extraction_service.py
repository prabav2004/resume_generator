import logging
import re
from functools import cached_property

from app.config.config import get_settings
from app.schemas.skills import SkillExtractionResult
from app.utils.exceptions import AppError

logger = logging.getLogger(__name__)

SKILL_CATALOG: dict[str, list[str]] = {
    "programming_languages": [
        "Python",
        "JavaScript",
        "TypeScript",
        "Java",
        "C++",
        "C#",
        "Go",
        "Rust",
        "Ruby",
        "PHP",
        "Swift",
        "Kotlin",
        "SQL",
        "R",
        "Scala",
    ],
    "frameworks": [
        "React",
        "Angular",
        "Vue",
        "Next.js",
        "Node.js",
        "Express",
        "FastAPI",
        "Django",
        "Flask",
        "Spring Boot",
        "LangChain",
        "LangGraph",
        "TensorFlow",
        "PyTorch",
    ],
    "databases": [
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "Redis",
        "SQLite",
        "Oracle",
        "SQL Server",
        "DynamoDB",
        "Elasticsearch",
        "Snowflake",
        "BigQuery",
    ],
    "cloud_platforms": [
        "AWS",
        "Amazon Web Services",
        "Azure",
        "Microsoft Azure",
        "Google Cloud",
        "GCP",
        "Firebase",
        "Heroku",
        "Vercel",
        "Netlify",
    ],
    "soft_skills": [
        "Leadership",
        "Communication",
        "Problem Solving",
        "Collaboration",
        "Teamwork",
        "Mentoring",
        "Stakeholder Management",
        "Time Management",
        "Critical Thinking",
        "Adaptability",
    ],
    "certifications": [
        "AWS Certified",
        "Azure Fundamentals",
        "Google Cloud Certified",
        "PMP",
        "Scrum Master",
        "CKA",
        "CKAD",
        "CISSP",
        "CompTIA",
        "Oracle Certified",
    ],
    "tools": [
        "Git",
        "Docker",
        "Kubernetes",
        "Jenkins",
        "GitHub Actions",
        "GitLab CI",
        "Terraform",
        "Ansible",
        "Jira",
        "Confluence",
        "Postman",
        "Figma",
        "Linux",
        "Tableau",
        "Power BI",
    ],
}

CATEGORY_LABELS = {
    "programming_languages": "programming language",
    "frameworks": "software framework or library",
    "databases": "database technology",
    "cloud_platforms": "cloud platform",
    "soft_skills": "soft skill",
    "certifications": "professional certification",
    "tools": "developer or productivity tool",
}


class SkillExtractionService:
    def __init__(self, confidence_threshold: float = 0.45) -> None:
        self.confidence_threshold = confidence_threshold

    @cached_property
    def classifier(self):
        from transformers import pipeline
        settings = get_settings()
        logger.info("Loading Hugging Face skill extraction model: %s", settings.hf_skill_model)
        try:
            return pipeline(
                "zero-shot-classification",
                model=settings.hf_skill_model,
                token=settings.huggingfacehub_api_token.get_secret_value(),
            )
        except Exception as exc:
            logger.exception("Failed to load Hugging Face skill extraction model")
            raise AppError(
                "Unable to initialize Hugging Face skill extraction model.",
                status_code=503,
                code="skill_model_unavailable",
            ) from exc

    def extract(self, resume_text: str) -> SkillExtractionResult:
        if not resume_text.strip():
            return SkillExtractionResult()

        logger.info("Starting Skill Extraction Agent")
        matches = self._find_catalog_matches(resume_text)
        result = self._classify_matches(matches)
        logger.info("Skill Extraction Agent completed with %s total skills", self._count_skills(result))
        return result

    def _find_catalog_matches(self, resume_text: str) -> dict[str, set[str]]:
        matches: dict[str, set[str]] = {category: set() for category in SKILL_CATALOG}

        for category, skills in SKILL_CATALOG.items():
            for skill in skills:
                pattern = rf"(?<![\w.+#-]){re.escape(skill)}(?![\w.+#-])"
                if re.search(pattern, resume_text, flags=re.IGNORECASE):
                    matches[category].add(skill)

        logger.debug("Catalog skill matches: %s", {key: sorted(value) for key, value in matches.items()})
        return matches

    def _classify_matches(self, matches: dict[str, set[str]]) -> SkillExtractionResult:
        classified: dict[str, list[str]] = {}

        for category, skills in matches.items():
            accepted: list[str] = []
            label = CATEGORY_LABELS[category]

            for skill in sorted(skills):
                if self._is_skill_in_category(skill, label):
                    accepted.append(skill)

            classified[category] = accepted

        return SkillExtractionResult(**classified)

    def _is_skill_in_category(self, skill: str, label: str) -> bool:
        output = self.classifier(
            skill,
            candidate_labels=[label, "unrelated resume term"],
            hypothesis_template="This resume term is a {}.",
        )
        top_label = output["labels"][0]
        top_score = output["scores"][0]
        logger.debug("HF classified '%s' as '%s' with %.3f confidence", skill, top_label, top_score)
        return top_label == label and top_score >= self.confidence_threshold

    @staticmethod
    def _count_skills(result: SkillExtractionResult) -> int:
        return sum(len(value) for value in result.model_dump().values())
