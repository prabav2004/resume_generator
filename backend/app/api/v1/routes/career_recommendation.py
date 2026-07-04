from fastapi import APIRouter, status

from app.graphs.career_recommendation_agent import build_career_recommendation_graph
from app.schemas.career_recommendation import (
    CareerRecommendationRequest,
    CareerRecommendationResult,
)

router = APIRouter()


@router.post(
    "/recommend",
    response_model=CareerRecommendationResult,
    status_code=status.HTTP_200_OK,
)
async def generate_career_recommendations(
    request: CareerRecommendationRequest,
) -> CareerRecommendationResult:
    """
    Generate career recommendation details based on a resume.

    Accepts raw resume text and optionally pre-extracted skills.
    """
    # Build and execute graph
    graph = build_career_recommendation_graph()

    state = {
        "resume_text": request.resume_text,
    }
    if request.skills:
        state["skills"] = request.skills.model_dump()

    result = graph.invoke(state)

    recommendation_data = result.get("recommendation_result", {})
    return CareerRecommendationResult(**recommendation_data)
