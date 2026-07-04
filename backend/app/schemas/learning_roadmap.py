from pydantic import BaseModel, ConfigDict, Field
from app.schemas.skills import SkillExtractionResult


class SkillMilestone(BaseModel):
    skill: str = Field(description="Name of the skill to learn")
    topic: str = Field(description="Specific topic or sub-skill to focus on")
    resources: list[str] = Field(default_factory=list, description="Recommended learning resources")
    estimated_hours: int = Field(description="Estimated hours needed", ge=1)


class ProjectChallenge(BaseModel):
    title: str = Field(description="Project title")
    description: str = Field(description="What the project involves and what it will demonstrate")
    tech_stack: list[str] = Field(default_factory=list, description="Technologies used in this project")
    difficulty: str = Field(description="Beginner | Intermediate | Advanced")


class PlatformRecommendation(BaseModel):
    name: str = Field(description="Platform name (e.g. LeetCode, HackerRank)")
    url: str = Field(description="Platform URL")
    purpose: str = Field(description="What to practice on this platform for this phase")


class CertificationPlan(BaseModel):
    name: str = Field(description="Certification name")
    authority: str = Field(description="Issuing organization")
    why_now: str = Field(description="Why this certification is recommended in this phase")
    study_time_weeks: int = Field(description="Estimated weeks needed to prepare", ge=1)


class RoadmapPhase(BaseModel):
    phase: str = Field(description="Phase name, e.g. '30-Day Foundation' or '60-Day Growth' or '90-Day Mastery'")
    goal: str = Field(description="The primary learning goal for this phase")
    skills: list[SkillMilestone] = Field(default_factory=list, description="Skills to learn in this phase")
    projects: list[ProjectChallenge] = Field(default_factory=list, description="Projects to build this phase")
    practice_platforms: list[PlatformRecommendation] = Field(default_factory=list, description="Platforms to practice on")
    certifications: list[CertificationPlan] = Field(default_factory=list, description="Certifications to pursue in this phase")
    weekly_time_commitment_hours: int = Field(description="Recommended hours per week to invest", ge=1)
    success_metrics: list[str] = Field(default_factory=list, description="Measurable success indicators to know this phase is complete")


class LearningRoadmapResult(BaseModel):
    target_roles: list[str] = Field(default_factory=list, description="Target job roles this roadmap is aimed at")
    overall_goal: str = Field(description="High-level outcome after completing the full 90-day roadmap")
    phase_30: RoadmapPhase = Field(description="30-day foundation phase")
    phase_60: RoadmapPhase = Field(description="60-day growth phase")
    phase_90: RoadmapPhase = Field(description="90-day mastery phase")
    total_estimated_hours: int = Field(description="Total hours across all 3 phases", ge=1)
    motivational_summary: str = Field(description="Encouraging and inspiring summary for the candidate")

    model_config = ConfigDict(extra="forbid")


class LearningRoadmapRequest(BaseModel):
    resume_text: str = Field(description="Raw text extracted from the resume")
    skills: SkillExtractionResult | None = Field(default=None, description="Optional pre-extracted skills")
    target_role: str | None = Field(default=None, description="Optional specific target role to tailor the roadmap for")

    model_config = ConfigDict(extra="forbid")
