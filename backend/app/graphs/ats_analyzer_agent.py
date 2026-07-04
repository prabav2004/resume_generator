import logging
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.schemas.ats import ATSAnalysisResult
from app.services.ats_analyzer_service import ATSAnalyzerService

logger = logging.getLogger(__name__)


class ATSAnalyzerState(TypedDict, total=False):
    resume_text: str
    skills: dict[str, list[str]]
    ats_analysis: dict[str, Any]


class ATSAnalyzerAgent:
    name = "ATS Analyzer Agent"

    def __init__(self, service: ATSAnalyzerService | None = None) -> None:
        self.service = service or ATSAnalyzerService()

    def __call__(self, state: ATSAnalyzerState) -> ATSAnalyzerState:
        logger.info("Running LangGraph node: %s", self.name)
        result: ATSAnalysisResult = self.service.analyze(
            resume_text=state.get("resume_text", ""),
            skills=state.get("skills", {}),
        )
        return {"ats_analysis": result.model_dump()}


ats_analyzer_agent = ATSAnalyzerAgent()


def ats_analyzer_node(state: ATSAnalyzerState) -> dict[str, Any]:
    return ats_analyzer_agent(state)


def build_ats_analyzer_graph():
    graph = StateGraph(ATSAnalyzerState)
    graph.add_node(ATSAnalyzerAgent.name, ats_analyzer_node)
    graph.add_edge(START, ATSAnalyzerAgent.name)
    graph.add_edge(ATSAnalyzerAgent.name, END)
    return graph.compile()
