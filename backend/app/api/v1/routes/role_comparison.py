from fastapi import APIRouter, status
from pydantic import BaseModel

from app.graphs.role_comparison_agent import build_role_comparison_graph
from app.schemas.role_comparison import RoleComparisonResult, TargetRole
from app.schemas.skills import SkillExtractionResult

router = APIRouter()


class RoleComparisonRequest(BaseModel):
    skills: SkillExtractionResult
    target_role: TargetRole


@router.post(
    "/compare",
    response_model=RoleComparisonResult,
    status_code=status.HTTP_200_OK,
)
async def compare_role(request: RoleComparisonRequest) -> RoleComparisonResult:
    """
    Compare extracted skills against a target role.

    Returns missing skills, priority levels, and recommended learning topics.
    """
    # Build and execute the role comparison graph
    graph = build_role_comparison_graph()

    result = graph.invoke({
        "skills": request.skills.model_dump(),
        "target_role": request.target_role.value,
    })

    # Extract and return the comparison result
    comparison_data = result.get("comparison_result", {})
    return RoleComparisonResult(**comparison_data)


@router.get("/roles", status_code=status.HTTP_200_OK)
async def get_available_roles():
    """Get list of available target roles for comparison."""
    roles = [role.value for role in TargetRole]
    return {
        "roles": roles,
        "total": len(roles),
    }
