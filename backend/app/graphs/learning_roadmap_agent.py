import logging
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.schemas.learning_roadmap import LearningRoadmapResult
from app.schemas.skills import SkillExtractionResult
from app.services.learning_roadmap_service import LearningRoadmapService

logger = logging.getLogger(__name__)


class LearningRoadmapState(TypedDict, total=False):
    resume_text: str
    skills: dict[str, list[str]]
    target_role: str | None
    roadmap_result: dict[str, Any]


class LearningRoadmapAgent:
    name = "Learning Roadmap Agent"

    def __init__(self, service: LearningRoadmapService | None = None) -> None:
        self.service = service or LearningRoadmapService()

    def __call__(self, state: LearningRoadmapState) -> LearningRoadmapState:
        resume_text = state.get("resume_text", "")
        skills_dict = state.get("skills", None)
        target_role = state.get("target_role", None)

        logger.info("Running LangGraph node: %s", self.name)

        skills_obj = SkillExtractionResult(**skills_dict) if skills_dict else None

        result: LearningRoadmapResult = self.service.generate_roadmap(
            resume_text=resume_text,
            skills=skills_obj,
            target_role=target_role,
        )

        return {"roadmap_result": result.model_dump()}


learning_roadmap_agent = LearningRoadmapAgent()


def learning_roadmap_node(state: LearningRoadmapState) -> dict[str, Any]:
    return learning_roadmap_agent(state)


def build_learning_roadmap_graph():
    graph = StateGraph(LearningRoadmapState)
    graph.add_node(LearningRoadmapAgent.name, learning_roadmap_node)
    graph.add_edge(START, LearningRoadmapAgent.name)
    graph.add_edge(LearningRoadmapAgent.name, END)
    return graph.compile()
