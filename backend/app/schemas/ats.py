from pydantic import BaseModel, ConfigDict, Field


class ATSCategoryScore(BaseModel):
    score: int = Field(ge=0, le=100)
    findings: list[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")


class ATSAnalysisResult(BaseModel):
    ats_score: int = Field(ge=0, le=100)
    resume_structure: ATSCategoryScore
    keywords: ATSCategoryScore
    formatting: ATSCategoryScore
    technical_skills: ATSCategoryScore
    experience: ATSCategoryScore
    education: ATSCategoryScore
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    improvement_suggestions: list[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")
