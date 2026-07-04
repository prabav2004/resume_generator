"""
Shared state and response schemas for the unified resume analysis pipeline.

PipelineState is the single TypedDict that flows through every LangGraph node.
PipelineResultResponse is the Pydantic model returned by the HTTP endpoint.
"""

from __future__ import annotations

from typing import Any, TypedDict

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.ats import ATSAnalysisResult
from app.schemas.career_recommendation import CareerRecommendationResult
from app.schemas.learning_roadmap import LearningRoadmapResult
from app.schemas.role_comparison import RoleComparisonResult
from app.schemas.skills import SkillExtractionResult


# ─────────────────────────────────────────────
# Shared LangGraph State
# ─────────────────────────────────────────────

class PipelineState(TypedDict, total=False):
    """
    Accumulated state passed between every node in the pipeline.

    Keys are populated progressively:
      pdf_extraction → skill_extraction → ats_analysis →
      missing_skills → career_recommendation → learning_roadmap
    """

    # ── Inputs ────────────────────────────────
    resume_filename: str          # temp file on disk (set before graph.invoke)
    target_role: str | None       # optional user-supplied role override

    # ── Node outputs (written by each node) ───
    resume_text: str              # extracted plain text
    page_count: int               # PDF page count
    skills: dict[str, list[str]] # categorised skills
    ats_analysis: dict[str, Any]  # ATS score/breakdown
    comparison_result: dict[str, Any]   # missing skills vs target role
    recommendation_result: dict[str, Any]  # career recommendations
    roadmap_result: dict[str, Any]         # 30/60/90-day learning roadmap

    # ── Observability ─────────────────────────
    node_timings: dict[str, float]   # wall-clock ms per node name
    pipeline_errors: list[str]       # non-fatal per-node error messages
    pipeline_status: str             # "running" | "partial" | "complete"


# ─────────────────────────────────────────────
# HTTP Response Schema
# ─────────────────────────────────────────────

class PipelineResultResponse(BaseModel):
    """Full result returned by POST /api/v1/pipeline/run."""

    pipeline_status: str = Field(description="'complete' or 'partial' (if some nodes failed)")
    resume_filename: str = Field(description="Temporary filename of the uploaded PDF")
    page_count: int = Field(default=0, description="Number of pages in the PDF")

    skills: SkillExtractionResult | None = Field(default=None)
    ats_analysis: ATSAnalysisResult | None = Field(default=None)
    comparison_result: RoleComparisonResult | None = Field(default=None)
    recommendation_result: CareerRecommendationResult | None = Field(default=None)
    roadmap_result: LearningRoadmapResult | None = Field(default=None)

    node_timings: dict[str, float] = Field(
        default_factory=dict,
        description="Wall-clock milliseconds each node took",
    )
    pipeline_errors: list[str] = Field(
        default_factory=list,
        description="Non-fatal per-node error messages",
    )

    model_config = ConfigDict(extra="forbid")
