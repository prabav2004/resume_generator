import logging
from app.schemas.skills import SkillExtractionResult
from app.schemas.role_comparison import (
    RoleComparisonResult,
    SkillGap,
    PriorityLevel,
    TargetRole,
)

logger = logging.getLogger(__name__)

# Role-specific requirements and priorities
ROLE_REQUIREMENTS = {
    "Frontend Developer": {
        "critical": {
            "programming_languages": ["JavaScript", "TypeScript"],
            "frameworks": ["React", "Angular", "Vue", "Next.js"],
            "tools": ["Git"],
        },
        "high": {
            "frameworks": ["HTML", "CSS"],
            "tools": ["Figma", "Webpack"],
        },
        "medium": {
            "databases": ["PostgreSQL", "MongoDB"],
            "tools": ["Docker", "GitHub Actions"],
        },
        "low": {
            "cloud_platforms": ["AWS", "Azure", "GCP"],
        },
    },
    "Backend Developer": {
        "critical": {
            "programming_languages": ["Python", "Java", "Go", "C#", "JavaScript"],
            "frameworks": ["FastAPI", "Django", "Node.js", "Express", "Spring Boot"],
            "databases": ["PostgreSQL", "MongoDB", "MySQL"],
        },
        "high": {
            "tools": ["Git", "Docker"],
            "cloud_platforms": ["AWS", "Azure", "GCP"],
        },
        "medium": {
            "tools": ["Kubernetes", "Jenkins"],
            "soft_skills": ["Problem Solving", "Communication"],
        },
        "low": {
            "frameworks": ["TensorFlow", "PyTorch"],
        },
    },
    "Full Stack Developer": {
        "critical": {
            "programming_languages": ["JavaScript", "TypeScript", "Python"],
            "frameworks": ["React", "Next.js", "Node.js", "Express", "FastAPI"],
            "databases": ["PostgreSQL", "MongoDB"],
        },
        "high": {
            "tools": ["Git", "Docker"],
            "cloud_platforms": ["AWS", "Azure", "GCP"],
        },
        "medium": {
            "frameworks": ["Django", "Vue"],
            "tools": ["Kubernetes", "GitHub Actions"],
        },
        "low": {
            "soft_skills": ["Leadership", "Mentoring"],
        },
    },
    "Data Scientist": {
        "critical": {
            "programming_languages": ["Python", "R", "SQL"],
            "frameworks": ["TensorFlow", "PyTorch", "Pandas", "Scikit-learn"],
            "databases": ["PostgreSQL", "MongoDB", "BigQuery"],
        },
        "high": {
            "tools": ["Git", "Tableau", "Power BI", "Jupyter"],
            "cloud_platforms": ["AWS", "Azure", "GCP"],
        },
        "medium": {
            "tools": ["Docker", "Kubernetes"],
            "soft_skills": ["Communication", "Problem Solving"],
        },
        "low": {
            "certifications": ["AWS Certified"],
        },
    },
    "AI Engineer": {
        "critical": {
            "programming_languages": ["Python"],
            "frameworks": ["TensorFlow", "PyTorch", "LangChain", "LangGraph"],
            "tools": ["Git", "Docker"],
        },
        "high": {
            "databases": ["PostgreSQL", "MongoDB", "Redis"],
            "cloud_platforms": ["AWS", "Azure", "GCP"],
        },
        "medium": {
            "tools": ["Kubernetes"],
            "programming_languages": ["Java", "C++"],
        },
        "low": {
            "certifications": ["AWS Certified"],
        },
    },
}

LEARNING_RESOURCES = {
    "Python": ["Real Python", "Python.org", "Codecademy", "Udemy Python Courses"],
    "JavaScript": ["MDN Web Docs", "freeCodeCamp", "JavaScript.info", "Eloquent JavaScript"],
    "TypeScript": ["TypeScript Handbook", "TypeScript Deep Dive", "Pluralsight"],
    "React": ["React Documentation", "Epic React Course", "Frontend Masters", "Scrimba"],
    "Angular": ["Angular Documentation", "Angular University", "Pluralsight"],
    "Vue": ["Vue Documentation", "Vue Mastery", "Frontend Masters"],
    "Next.js": ["Next.js Documentation", "Vercel Tutorials", "Udemy Courses"],
    "Node.js": ["Node.js Documentation", "NodeSchool", "Pluralsight"],
    "Express": ["Express Documentation", "MDN Web Docs", "Scrimba"],
    "FastAPI": ["FastAPI Documentation", "Real Python", "Udemy Courses"],
    "Django": ["Django Documentation", "Real Python", "Two Scoops of Django"],
    "Spring Boot": ["Spring Documentation", "Baeldung", "Pluralsight"],
    "PostgreSQL": ["PostgreSQL Documentation", "Udemy Courses", "DataCamp"],
    "MongoDB": ["MongoDB University", "MongoDB Documentation", "Udemy Courses"],
    "Docker": ["Docker Documentation", "Docker Official Tutorials", "Udemy Courses"],
    "Kubernetes": ["Kubernetes Documentation", "Linux Foundation", "Udemy Courses"],
    "Git": ["Pro Git Book", "GitHub Learning", "Codecademy"],
    "AWS": ["AWS Training", "A Cloud Guru", "Linux Academy"],
    "Azure": ["Microsoft Learn", "A Cloud Guru", "Pluralsight"],
    "GCP": ["Google Cloud Fundamentals", "Coursera", "Udemy"],
    "TensorFlow": ["TensorFlow Documentation", "Fast.ai", "Coursera"],
    "PyTorch": ["PyTorch Documentation", "Fast.ai", "Udemy Courses"],
    "LangChain": ["LangChain Documentation", "GitHub Tutorials"],
    "LangGraph": ["LangGraph Documentation", "GitHub Tutorials"],
    "Tableau": ["Tableau Public", "Tableau Learning", "Udemy"],
    "Power BI": ["Microsoft Learn", "Udemy Courses", "DataCamp"],
    "Figma": ["Figma Design", "Figma Learn", "YouTube Tutorials"],
    "Postman": ["Postman Learning Center", "Postman API Course"],
    "Linux": ["Linux Academy", "Udemy Courses", "Linux Documentation"],
}

LEARNING_HOURS = {
    # Programming Languages
    "Python": 100,
    "JavaScript": 80,
    "TypeScript": 50,
    "Java": 120,
    "C++": 150,
    "Go": 60,
    "Rust": 80,
    "R": 80,
    "SQL": 40,
    # Frameworks
    "React": 80,
    "Angular": 100,
    "Vue": 70,
    "Next.js": 60,
    "Node.js": 70,
    "Express": 50,
    "FastAPI": 60,
    "Django": 80,
    "Flask": 50,
    "Spring Boot": 100,
    "TensorFlow": 120,
    "PyTorch": 120,
    "LangChain": 60,
    "LangGraph": 60,
    # Databases
    "PostgreSQL": 50,
    "MongoDB": 40,
    "MySQL": 40,
    "Redis": 30,
    "Elasticsearch": 60,
    "BigQuery": 50,
    # Tools
    "Docker": 50,
    "Kubernetes": 80,
    "Git": 20,
    "GitHub Actions": 30,
    "Terraform": 60,
    "Tableau": 50,
    "Power BI": 40,
    "Figma": 50,
    "Postman": 30,
    "Linux": 60,
    # Cloud Platforms
    "AWS": 80,
    "Azure": 80,
    "GCP": 80,
}


class RoleComparisonService:
    def compare(
        self, skills: SkillExtractionResult, target_role: str
    ) -> RoleComparisonResult:
        """Compare extracted skills against target role requirements."""
        if target_role not in ROLE_REQUIREMENTS:
            raise ValueError(f"Unknown target role: {target_role}")

        logger.info("Starting Role Comparison for: %s", target_role)

        # Convert SkillExtractionResult to dict
        extracted_skills_dict = skills.model_dump()

        # Get role requirements
        role_reqs = ROLE_REQUIREMENTS[target_role]

        # Find matched and missing skills
        matched_skills, missing_skills_list = self._find_skill_gaps(
            extracted_skills_dict, role_reqs
        )

        # Create SkillGap objects with priorities
        skill_gaps = self._create_skill_gaps(missing_skills_list, role_reqs)

        # Calculate skill match percentage
        total_required = self._count_required_skills(role_reqs)
        total_matched = self._count_skills(matched_skills)
        skill_match_percentage = (
            (total_matched / total_required * 100) if total_required > 0 else 0
        )

        # Determine overall readiness
        overall_readiness = self._determine_readiness(skill_match_percentage)

        # Get recommended learning path
        recommended_path = self._get_learning_path(skill_gaps)

        # Calculate total learning hours
        total_hours = sum(gap.estimated_learning_hours for gap in skill_gaps)

        # Generate summary
        summary = self._generate_summary(
            target_role, skill_match_percentage, overall_readiness, len(skill_gaps)
        )

        result = RoleComparisonResult(
            target_role=target_role,
            extracted_skills=extracted_skills_dict,
            missing_skills=skill_gaps,
            matched_skills=matched_skills,
            skill_match_percentage=skill_match_percentage,
            overall_readiness=overall_readiness,
            recommended_learning_path=recommended_path,
            total_learning_hours=total_hours,
            summary=summary,
        )

        logger.info(
            "Role Comparison completed for %s: %.1f%% match",
            target_role,
            skill_match_percentage,
        )
        return result

    def _find_skill_gaps(
        self, extracted_skills: dict[str, list[str]], role_reqs: dict
    ) -> tuple[dict[str, list[str]], dict[str, list[tuple[str, str]]]]:
        """Find matched and missing skills."""
        matched_skills: dict[str, list[str]] = {}
        missing_skills: dict[str, list[tuple[str, str]]] = {
            priority: [] for priority in ["critical", "high", "medium", "low"]
        }

        # Flatten extracted skills to lowercase for comparison
        extracted_lower = {
            category: [skill.lower() for skill in skills]
            for category, skills in extracted_skills.items()
        }

        # Check for matched skills
        for category, skills in extracted_skills.items():
            matched = []
            for skill in skills:
                skill_lower = skill.lower()
                # Check if skill matches any required skill (case-insensitive)
                is_required = False
                for priority in role_reqs:
                    if category in role_reqs[priority]:
                        required_skills = [s.lower() for s in role_reqs[priority][category]]
                        if skill_lower in required_skills:
                            is_required = True
                            break
                if is_required:
                    matched.append(skill)
            if matched:
                matched_skills[category] = matched

        # Check for missing skills
        for priority in ["critical", "high", "medium", "low"]:
            if priority in role_reqs:
                for category, skills in role_reqs[priority].items():
                    extracted_lower_list = (
                        extracted_lower.get(category, []) if category in extracted_lower else []
                    )
                    for skill in skills:
                        if skill.lower() not in extracted_lower_list:
                            missing_skills[priority].append((skill, category))

        return matched_skills, missing_skills

    def _create_skill_gaps(
        self, missing_skills: dict[str, list[tuple[str, str]]], role_reqs: dict
    ) -> list[SkillGap]:
        """Create SkillGap objects with priorities and details."""
        gaps = []

        priority_order = ["critical", "high", "medium", "low"]
        priority_reasons = {
            "critical": "This is a fundamental skill required for this role.",
            "high": "This skill is important for performing well in this role.",
            "medium": "This skill will enhance your capabilities in this role.",
            "low": "This skill is nice to have and will provide additional value.",
        }

        for priority in priority_order:
            for skill_name, category in missing_skills.get(priority, []):
                gap = SkillGap(
                    skill_name=skill_name,
                    category=category,
                    priority_level=PriorityLevel(priority),
                    why_important=priority_reasons[priority],
                    learning_resources=LEARNING_RESOURCES.get(skill_name, []),
                    estimated_learning_hours=LEARNING_HOURS.get(skill_name, 40),
                )
                gaps.append(gap)

        return gaps

    def _count_required_skills(self, role_reqs: dict) -> int:
        """Count total required skills for a role."""
        count = 0
        for priority_reqs in role_reqs.values():
            for skills in priority_reqs.values():
                count += len(skills)
        return count

    def _count_skills(self, skills: dict[str, list[str]]) -> int:
        """Count total skills in a dict."""
        return sum(len(skill_list) for skill_list in skills.values())

    def _determine_readiness(self, match_percentage: float) -> str:
        """Determine overall readiness level based on skill match percentage."""
        if match_percentage >= 80:
            return "Ready to Apply"
        elif match_percentage >= 60:
            return "Nearly Ready"
        elif match_percentage >= 40:
            return "Some Experience"
        elif match_percentage >= 20:
            return "Beginner Level"
        else:
            return "Early Stage"

    def _get_learning_path(self, skill_gaps: list[SkillGap]) -> list[str]:
        """Get recommended learning path sorted by priority."""
        path = []
        priority_order = [
            PriorityLevel.CRITICAL,
            PriorityLevel.HIGH,
            PriorityLevel.MEDIUM,
            PriorityLevel.LOW,
        ]

        for priority in priority_order:
            for gap in skill_gaps:
                if gap.priority_level == priority:
                    path.append(f"{gap.skill_name} ({gap.priority_level.value})")

        return path[:10]  # Return top 10 recommended skills

    def _generate_summary(
        self, role: str, match_percentage: float, readiness: str, gaps_count: int
    ) -> str:
        """Generate a summary of the role comparison."""
        return (
            f"You have {match_percentage:.1f}% skill match for {role} role. "
            f"Current readiness level: {readiness}. "
            f"You need to acquire {gaps_count} additional skills to be competitive for this role. "
            f"Follow the recommended learning path to improve your qualifications."
        )
