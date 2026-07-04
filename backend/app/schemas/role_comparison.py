from enum import Enum
from pydantic import BaseModel, ConfigDict, Field


class PriorityLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class SkillGap(BaseModel):
    skill_name: str
    category: str
    priority_level: PriorityLevel
    why_important: str
    learning_resources: list[str] = Field(default_factory=list)
    estimated_learning_hours: int = Field(default=0, ge=0)


class TargetRole(str, Enum):
    FRONTEND_DEVELOPER = "Frontend Developer"
    BACKEND_DEVELOPER = "Backend Developer"
    FULL_STACK_DEVELOPER = "Full Stack Developer"
    DATA_SCIENTIST = "Data Scientist"
    AI_ENGINEER = "AI Engineer"


class RoleComparisonResult(BaseModel):
    target_role: str
    extracted_skills: dict[str, list[str]] = Field(default_factory=dict)
    missing_skills: list[SkillGap] = Field(default_factory=list)
    matched_skills: dict[str, list[str]] = Field(default_factory=dict)
    skill_match_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    overall_readiness: str
    recommended_learning_path: list[str] = Field(default_factory=list)
    total_learning_hours: int = Field(default=0, ge=0)
    summary: str

    model_config = ConfigDict(extra="forbid")
