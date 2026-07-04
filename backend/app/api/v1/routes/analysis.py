import logging
from uuid import uuid4
from fastapi import APIRouter, UploadFile, File, status, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from app.services.resume_upload_service import save_resume_temporarily
from app.schemas.resume import ResumeUploadResponse
from app.schemas.pipeline import PipelineResultResponse
from app.schemas.health import HealthCheckResponse
from app.schemas.skills import SkillExtractionResult
from app.schemas.ats import ATSAnalysisResult
from app.schemas.role_comparison import RoleComparisonResult
from app.schemas.career_recommendation import CareerRecommendationResult
from app.schemas.learning_roadmap import LearningRoadmapResult
from app.config.config import get_settings
from app.graphs.pipeline_agent import build_pipeline_graph

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory database to store analysis results
analysis_results: dict[str, PipelineResultResponse] = {}


class AnalysisRequest(BaseModel):
    filename: str = Field(..., description="Temporary filename of the uploaded PDF")
    target_role: str | None = Field(None, description="Optional target role for comparison")


class AnalysisStartResponse(BaseModel):
    id: str
    status: str


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_resume(file: UploadFile = File(...)) -> ResumeUploadResponse:
    """Upload a resume PDF and get a temporary filename."""
    filename = await save_resume_temporarily(file)
    return ResumeUploadResponse(filename=filename)


async def run_analysis_pipeline(analysis_id: str, filename: str, target_role: str | None):
    """Background task to run the LangGraph resume analysis pipeline."""
    try:
        graph = build_pipeline_graph()
        state = {
            "resume_filename": filename,
            "target_role": target_role,
            "node_timings": {},
            "pipeline_errors": [],
        }

        # invoke is a blocking call (runs synchronous graph execution)
        result = graph.invoke(state)

        errors = result.get("pipeline_errors", [])
        pipeline_status = "partial" if errors else "complete"

        skills_data = result.get("skills")
        skills = SkillExtractionResult(**skills_data) if skills_data else None

        ats_data = result.get("ats_analysis")
        ats_analysis = ATSAnalysisResult(**ats_data) if ats_data else None

        comp_data = result.get("comparison_result")
        # Ensure we only parse if comp_data is non-empty and has target_role (which is required by the schema)
        comparison_result = None
        if comp_data and comp_data.get("target_role"):
            comparison_result = RoleComparisonResult(**comp_data)

        rec_data = result.get("recommendation_result")
        recommendation_result = CareerRecommendationResult(**rec_data) if rec_data else None

        roadmap_data = result.get("roadmap_result")
        roadmap_result = LearningRoadmapResult(**roadmap_data) if roadmap_data else None

        analysis_results[analysis_id] = PipelineResultResponse(
            pipeline_status=pipeline_status,
            resume_filename=filename,
            page_count=result.get("page_count", 0),
            skills=skills,
            ats_analysis=ats_analysis,
            comparison_result=comparison_result,
            recommendation_result=recommendation_result,
            roadmap_result=roadmap_result,
            node_timings=result.get("node_timings", {}),
            pipeline_errors=errors,
        )
        logger.info("Pipeline execution finished for ID: %s, status: %s", analysis_id, pipeline_status)

    except Exception as exc:
        logger.exception("Unified pipeline execution failed for ID %s", analysis_id)
        analysis_results[analysis_id] = PipelineResultResponse(
            pipeline_status="failed",
            resume_filename=filename,
            page_count=0,
            pipeline_errors=[f"Pipeline failed: {str(exc)}"],
        )


@router.post(
    "/analyze",
    response_model=AnalysisStartResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def analyze_resume(
    request: AnalysisRequest, background_tasks: BackgroundTasks
) -> AnalysisStartResponse:
    """Start the asynchronous resume analysis pipeline."""
    analysis_id = str(uuid4())

    # Initialize state as running
    analysis_results[analysis_id] = PipelineResultResponse(
        pipeline_status="running",
        resume_filename=request.filename,
        page_count=0,
    )

    background_tasks.add_task(
        run_analysis_pipeline, analysis_id, request.filename, request.target_role
    )

    return AnalysisStartResponse(id=analysis_id, status="running")


@router.get(
    "/results/{id}",
    response_model=PipelineResultResponse,
    status_code=status.HTTP_200_OK,
)
async def get_results(id: str) -> PipelineResultResponse:
    """Retrieve the results of a resume analysis by its ID."""
    if id not in analysis_results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis result with ID {id} was not found.",
        )
    return analysis_results[id]


@router.get("/health", response_model=HealthCheckResponse)
async def health_check() -> HealthCheckResponse:
    """Health check endpoint."""
    settings = get_settings()
    return HealthCheckResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )
