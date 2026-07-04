import logging
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.schemas.skills import SkillExtractionResult
from app.services.skill_extraction_service import SkillExtractionService

logger = logging.getLogger(__name__)


class SkillExtractionState(TypedDict, total=False):
    resume_text: str
    skills: dict[str, list[str]]


class SkillExtractionAgent:
    name = "Skill Extraction Agent"

    def __init__(self, service: SkillExtractionService | None = None) -> None:
        self.service = service or SkillExtractionService()

    def __call__(self, state: SkillExtractionState) -> SkillExtractionState:
        resume_text = state.get("resume_text", "")
        logger.info("Running LangGraph node: %s", self.name)
        result: SkillExtractionResult = self.service.extract(resume_text)
        return {"skills": result.model_dump()}


skill_extraction_agent = SkillExtractionAgent()


def skill_extraction_node(state: SkillExtractionState) -> dict[str, Any]:
    return skill_extraction_agent(state)


def build_skill_extraction_graph():
    graph = StateGraph(SkillExtractionState)
    graph.add_node(SkillExtractionAgent.name, skill_extraction_node)
    graph.add_edge(START, SkillExtractionAgent.name)
    graph.add_edge(SkillExtractionAgent.name, END)
    return graph.compile()
