from pydantic import BaseModel, ConfigDict, Field
from app.schemas.skills import SkillExtractionResult


class JobRoleRecommendation(BaseModel):
    title: str = Field(description="Title of the suitable job role")
    why_suitable: str = Field(description="Detailed explanation of why this role is suitable based on their resume")
    match_score: int = Field(description="Match score out of 100", ge=0, le=100)


class CertificationRecommendation(BaseModel):
    name: str = Field(description="Name of the professional certification")
    authority: str = Field(description="Issuing authority, e.g. AWS, Scrum Alliance, etc.")
    why_recommend: str = Field(description="Why this certification is recommended for their career progression")


class InterviewPrepAdvice(BaseModel):
    technical_topics: list[str] = Field(default_factory=list, description="Key technical topics and concepts to study")
    behavioral_tips: list[str] = Field(default_factory=list, description="Tips for answering behavioral questions based on their profile")
    sample_questions: list[str] = Field(default_factory=list, description="3-5 sample interview questions they are likely to face")


class SalaryGrowthSuggestions(BaseModel):
    current_market_range: str = Field(description="Estimated current market salary range based on experience level and location")
    growth_strategies: list[str] = Field(default_factory=list, description="Specific actions they can take to increase their earning potential")
    high_paying_skills: list[str] = Field(default_factory=list, description="High-paying skills relevant to their field that they should acquire")


class CareerRecommendationResult(BaseModel):
    suitable_roles: list[JobRoleRecommendation] = Field(default_factory=list, description="Recommended job roles")
    strengths: list[str] = Field(default_factory=list, description="Key career strengths identified from the resume")
    areas_for_improvement: list[str] = Field(default_factory=list, description="Areas or skills that need improvement")
    interview_preparation: InterviewPrepAdvice = Field(description="Interview prep advice tailored to the candidate")
    certifications_to_pursue: list[CertificationRecommendation] = Field(default_factory=list, description="Recommended certifications to pursue")
    salary_growth: SalaryGrowthSuggestions = Field(description="Suggestions and insights for salary growth")

    model_config = ConfigDict(extra="forbid")


class CareerRecommendationRequest(BaseModel):
    resume_text: str = Field(description="Raw text extracted from the resume")
    skills: SkillExtractionResult | None = Field(default=None, description="Optional pre-extracted skills")

    model_config = ConfigDict(extra="forbid")
