import logging
import re

from app.schemas.ats import ATSAnalysisResult, ATSCategoryScore

logger = logging.getLogger(__name__)

SECTION_KEYWORDS = {
    "summary": ["summary", "profile", "objective"],
    "skills": ["skills", "technical skills", "technologies"],
    "experience": ["experience", "work experience", "professional experience", "employment"],
    "education": ["education", "academic background"],
    "projects": ["projects", "portfolio"],
    "certifications": ["certifications", "licenses"],
}

ACTION_VERBS = [
    "built",
    "created",
    "developed",
    "designed",
    "implemented",
    "optimized",
    "improved",
    "led",
    "managed",
    "delivered",
    "automated",
    "integrated",
    "reduced",
    "increased",
]

COMMON_TECH_KEYWORDS = [
    "python",
    "javascript",
    "typescript",
    "java",
    "react",
    "fastapi",
    "django",
    "node",
    "sql",
    "postgresql",
    "mongodb",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "git",
    "api",
    "machine learning",
]

EDUCATION_TERMS = [
    "bachelor",
    "master",
    "phd",
    "degree",
    "university",
    "college",
    "institute",
    "gpa",
]


class ATSAnalyzerService:
    def analyze(self, resume_text: str, skills: dict[str, list[str]] | None = None) -> ATSAnalysisResult:
        normalized_text = self._normalize(resume_text)
        skills = skills or {}

        logger.info("Starting ATS Analyzer Agent")
        structure = self._analyze_structure(normalized_text)
        keywords = self._analyze_keywords(normalized_text)
        formatting = self._analyze_formatting(resume_text)
        technical_skills = self._analyze_technical_skills(normalized_text, skills)
        experience = self._analyze_experience(normalized_text)
        education = self._analyze_education(normalized_text)

        category_scores = [structure, keywords, formatting, technical_skills, experience, education]
        ats_score = round(sum(category.score for category in category_scores) / len(category_scores))

        strengths = self._build_strengths(
            {
                "resume structure": structure,
                "keywords": keywords,
                "formatting": formatting,
                "technical skills": technical_skills,
                "experience": experience,
                "education": education,
            }
        )
        weaknesses = self._build_weaknesses(
            {
                "resume structure": structure,
                "keywords": keywords,
                "formatting": formatting,
                "technical skills": technical_skills,
                "experience": experience,
                "education": education,
            }
        )
        suggestions = self._build_suggestions(structure, keywords, formatting, technical_skills, experience, education)

        logger.info("ATS Analyzer Agent completed with score %s", ats_score)
        return ATSAnalysisResult(
            ats_score=ats_score,
            resume_structure=structure,
            keywords=keywords,
            formatting=formatting,
            technical_skills=technical_skills,
            experience=experience,
            education=education,
            strengths=strengths,
            weaknesses=weaknesses,
            improvement_suggestions=suggestions,
        )

    def _analyze_structure(self, text: str) -> ATSCategoryScore:
        found = [name for name, aliases in SECTION_KEYWORDS.items() if any(alias in text for alias in aliases)]
        score = min(100, round((len(found) / 5) * 100))
        findings = [f"Detected resume sections: {', '.join(found)}." if found else "No standard resume sections detected."]
        return ATSCategoryScore(score=score, findings=findings)

    def _analyze_keywords(self, text: str) -> ATSCategoryScore:
        matched = [keyword for keyword in COMMON_TECH_KEYWORDS if keyword in text]
        action_verbs = [verb for verb in ACTION_VERBS if verb in text]
        score = min(100, (len(matched) * 6) + (len(action_verbs) * 4))
        findings = [
            f"Matched {len(matched)} role-relevant technical keywords.",
            f"Matched {len(action_verbs)} action verbs.",
        ]
        return ATSCategoryScore(score=score, findings=findings)

    def _analyze_formatting(self, raw_text: str) -> ATSCategoryScore:
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        very_long_lines = [line for line in lines if len(line) > 160]
        bullet_lines = [line for line in lines if line.startswith(("-", "*", "•"))]
        score = 100
        if len(raw_text.strip()) < 500:
            score -= 25
        if very_long_lines:
            score -= 20
        if len(bullet_lines) < 3:
            score -= 15
        findings = [
            f"Detected {len(bullet_lines)} bullet-style lines.",
            f"Detected {len(very_long_lines)} overly long lines.",
        ]
        return ATSCategoryScore(score=max(0, score), findings=findings)

    def _analyze_technical_skills(self, text: str, skills: dict[str, list[str]]) -> ATSCategoryScore:
        extracted_count = sum(len(values) for values in skills.values())
        fallback_matches = [keyword for keyword in COMMON_TECH_KEYWORDS if keyword in text]
        total = max(extracted_count, len(fallback_matches))
        score = min(100, total * 8)
        findings = [f"Detected {total} technical skill signals."]
        return ATSCategoryScore(score=score, findings=findings)

    def _analyze_experience(self, text: str) -> ATSCategoryScore:
        has_experience_section = any(alias in text for alias in SECTION_KEYWORDS["experience"])
        date_ranges = re.findall(r"\b(?:20\d{2}|19\d{2})\b", text)
        quantified_impacts = re.findall(r"\b\d+(?:\.\d+)?%|\b\d+\+?\s+(?:users|clients|projects|teams|apis|services)\b", text)
        score = 20 if has_experience_section else 0
        score += min(40, len(date_ranges) * 8)
        score += min(40, len(quantified_impacts) * 10)
        findings = [
            "Experience section detected." if has_experience_section else "Experience section not detected.",
            f"Detected {len(date_ranges)} year references.",
            f"Detected {len(quantified_impacts)} quantified impact statements.",
        ]
        return ATSCategoryScore(score=min(100, score), findings=findings)

    def _analyze_education(self, text: str) -> ATSCategoryScore:
        matched = [term for term in EDUCATION_TERMS if term in text]
        has_section = any(alias in text for alias in SECTION_KEYWORDS["education"])
        score = (40 if has_section else 0) + min(60, len(matched) * 15)
        findings = [
            "Education section detected." if has_section else "Education section not detected.",
            f"Detected education indicators: {', '.join(matched)}." if matched else "No education indicators detected.",
        ]
        return ATSCategoryScore(score=min(100, score), findings=findings)

    @staticmethod
    def _normalize(text: str) -> str:
        return re.sub(r"\s+", " ", text.lower()).strip()

    @staticmethod
    def _build_strengths(categories: dict[str, ATSCategoryScore]) -> list[str]:
        return [f"Strong {name} signal." for name, category in categories.items() if category.score >= 75]

    @staticmethod
    def _build_weaknesses(categories: dict[str, ATSCategoryScore]) -> list[str]:
        return [f"Weak {name} signal." for name, category in categories.items() if category.score < 60]

    @staticmethod
    def _build_suggestions(*categories: ATSCategoryScore) -> list[str]:
        suggestions = [
            "Use standard headings such as Summary, Skills, Experience, Education, Projects, and Certifications.",
            "Add role-specific keywords from the target job description throughout relevant experience bullets.",
            "Use concise bullet points and avoid dense paragraphs or unusual formatting.",
            "Include measurable impact with numbers, percentages, scale, or business outcomes.",
            "List technical skills in a dedicated skills section grouped by category.",
            "Include education details such as degree, institution, and graduation year when applicable.",
        ]
        weak_count = sum(1 for category in categories if category.score < 60)
        return suggestions[: max(3, min(len(suggestions), weak_count + 2))]
