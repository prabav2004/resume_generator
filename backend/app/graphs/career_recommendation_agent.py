import logging
from typing import Any, TypedDict
from langgraph.graph import END, START, StateGraph

from app.schemas.career_recommendation import CareerRecommendationResult
from app.schemas.skills import SkillExtractionResult
from app.services.career_recommendation_service import CareerRecommendationService

logger = logging.getLogger(__name__)


class CareerRecommendationState(TypedDict, total=False):
    resume_text: str
    skills: dict[str, list[str]]
    recommendation_result: dict[str, Any]


class CareerRecommendationAgent:
    name = "Career Recommendation Agent"

    def __init__(self, service: CareerRecommendationService | None = None) -> None:
        self.service = service or CareerRecommendationService()

    def __call__(self, state: CareerRecommendationState) -> CareerRecommendationState:
        resume_text = state.get("resume_text", "")
        skills_dict = state.get("skills", None)

        logger.info("Running LangGraph node: %s", self.name)

        skills_obj = SkillExtractionResult(**skills_dict) if skills_dict else None

        result: CareerRecommendationResult = self.service.generate_recommendations(
            resume_text=resume_text,
            skills=skills_obj,
        )

        return {"recommendation_result": result.model_dump()}


career_recommendation_agent = CareerRecommendationAgent()


def career_recommendation_node(state: CareerRecommendationState) -> dict[str, Any]:
    return career_recommendation_agent(state)


def build_career_recommendation_graph():
    graph = StateGraph(CareerRecommendationState)
    graph.add_node(CareerRecommendationAgent.name, career_recommendation_node)
    graph.add_edge(START, CareerRecommendationAgent.name)
    graph.add_edge(CareerRecommendationAgent.name, END)
    return graph.compile()
