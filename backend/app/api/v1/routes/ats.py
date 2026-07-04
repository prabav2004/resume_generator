from fastapi import APIRouter, status
from pydantic import BaseModel

from app.graphs.ats_analyzer_agent import build_ats_analyzer_graph
from app.schemas.ats import ATSAnalysisResult
from app.schemas.skills import SkillExtractionResult

router = APIRouter()


class ATSAnalysisRequest(BaseModel):
    resume_text: str
    skills: SkillExtractionResult | None = None


@router.post(
    "/analyze",
    response_model=ATSAnalysisResult,
    status_code=status.HTTP_200_OK,
)
async def analyze_resume(request: ATSAnalysisRequest) -> ATSAnalysisResult:
    """
    Perform ATS score analysis on raw resume text.

    Optionally accepts pre-extracted skills to improve scoring accuracy.
    """
    graph = build_ats_analyzer_graph()

    state = {
        "resume_text": request.resume_text,
    }
    if request.skills:
        state["skills"] = request.skills.model_dump()

    result = graph.invoke(state)

    ats_data = result.get("ats_analysis", {})
    return ATSAnalysisResult(**ats_data)
