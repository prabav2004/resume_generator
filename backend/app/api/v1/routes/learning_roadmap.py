from fastapi import APIRouter, status

from app.graphs.learning_roadmap_agent import build_learning_roadmap_graph
from app.schemas.learning_roadmap import LearningRoadmapRequest, LearningRoadmapResult

router = APIRouter()


@router.post(
    "/generate",
    response_model=LearningRoadmapResult,
    status_code=status.HTTP_200_OK,
)
async def generate_roadmap(request: LearningRoadmapRequest) -> LearningRoadmapResult:
    """
    Generate a personalized 30/60/90-day learning roadmap based on a resume.

    Accepts raw resume text, optional pre-extracted skills, and an optional target role.
    Returns a structured plan with skills, projects, platforms, and certifications for each phase.
    """
    graph = build_learning_roadmap_graph()

    state = {
        "resume_text": request.resume_text,
        "target_role": request.target_role,
    }
    if request.skills:
        state["skills"] = request.skills.model_dump()

    result = graph.invoke(state)

    roadmap_data = result.get("roadmap_result", {})
    return LearningRoadmapResult(**roadmap_data)
