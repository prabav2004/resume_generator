import logging
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.schemas.skills import SkillExtractionResult
from app.schemas.role_comparison import RoleComparisonResult
from app.services.role_comparison_service import RoleComparisonService

logger = logging.getLogger(__name__)


class RoleComparisonState(TypedDict, total=False):
    skills: dict[str, list[str]]
    target_role: str
    comparison_result: dict[str, Any]


class RoleComparisonAgent:
    name = "Role Comparison Agent"

    def __init__(self, service: RoleComparisonService | None = None) -> None:
        self.service = service or RoleComparisonService()

    def __call__(self, state: RoleComparisonState) -> RoleComparisonState:
        skills_dict = state.get("skills", {})
        target_role = state.get("target_role", "")

        logger.info("Running LangGraph node: %s for role: %s", self.name, target_role)

        # Convert skills dict back to SkillExtractionResult
        skills_obj = SkillExtractionResult(**skills_dict)

        # Compare skills against target role
        result: RoleComparisonResult = self.service.compare(skills_obj, target_role)

        return {"comparison_result": result.model_dump()}


role_comparison_agent = RoleComparisonAgent()


def role_comparison_node(state: RoleComparisonState) -> dict[str, Any]:
    return role_comparison_agent(state)


def build_role_comparison_graph():
    graph = StateGraph(RoleComparisonState)
    graph.add_node(RoleComparisonAgent.name, role_comparison_node)
    graph.add_edge(START, RoleComparisonAgent.name)
    graph.add_edge(RoleComparisonAgent.name, END)
    return graph.compile()
