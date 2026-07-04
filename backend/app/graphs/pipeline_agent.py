import logging
import time
from typing import Any
from langgraph.graph import END, START, StateGraph

from app.schemas.pipeline import PipelineState
from app.services.resume_parser import ResumeParser
from app.graphs.skill_extraction_agent import SkillExtractionAgent
from app.graphs.ats_analyzer_agent import ATSAnalyzerAgent
from app.graphs.role_comparison_agent import RoleComparisonAgent
from app.graphs.career_recommendation_agent import CareerRecommendationAgent
from app.graphs.learning_roadmap_agent import LearningRoadmapAgent
from app.config.config import get_settings

logger = logging.getLogger(__name__)


def pdf_extraction_node(state: PipelineState) -> dict[str, Any]:
    filename = state.get("resume_filename")
    if not filename:
        raise ValueError("resume_filename is required for pdf_extraction")
    settings = get_settings()
    file_path = settings.temp_upload_dir / filename
    parser = ResumeParser()
    parsed = parser.parse_pdf(file_path)
    return {
        "resume_text": parsed.text,
        "page_count": parsed.page_count,
    }


def skill_extraction_node(state: PipelineState) -> dict[str, Any]:
    text = state.get("resume_text", "")
    agent = SkillExtractionAgent()
    res = agent({"resume_text": text})
    return {"skills": res.get("skills", {})}


def ats_analysis_node(state: PipelineState) -> dict[str, Any]:
    text = state.get("resume_text", "")
    skills = state.get("skills", {})
    agent = ATSAnalyzerAgent()
    res = agent({"resume_text": text, "skills": skills})
    return {"ats_analysis": res.get("ats_analysis", {})}


def missing_skills_node(state: PipelineState) -> dict[str, Any]:
    target_role = state.get("target_role")
    if not target_role:
        return {"comparison_result": {}}
    skills = state.get("skills", {})
    agent = RoleComparisonAgent()
    res = agent({"skills": skills, "target_role": target_role})
    return {"comparison_result": res.get("comparison_result", {})}


def career_recommendation_node(state: PipelineState) -> dict[str, Any]:
    text = state.get("resume_text", "")
    skills = state.get("skills", {})
    agent = CareerRecommendationAgent()
    res = agent({"resume_text": text, "skills": skills})
    return {"recommendation_result": res.get("recommendation_result", {})}


def learning_roadmap_node(state: PipelineState) -> dict[str, Any]:
    text = state.get("resume_text", "")
    skills = state.get("skills", {})
    target_role = state.get("target_role")
    agent = LearningRoadmapAgent()
    res = agent({"resume_text": text, "skills": skills, "target_role": target_role})
    return {"roadmap_result": res.get("roadmap_result", {})}


def wrap_node_with_telemetry(node_name: str, node_func):
    def wrapper(state: PipelineState) -> dict[str, Any]:
        start_time = time.perf_counter()
        timings = state.get("node_timings", {}).copy()
        errors = state.get("pipeline_errors", []).copy()

        try:
            result = node_func(state)
        except Exception as exc:
            logger.exception("Error in pipeline node %s", node_name)
            errors.append(f"Node '{node_name}' failed: {str(exc)}")
            result = {}

        duration_ms = (time.perf_counter() - start_time) * 1000.0
        timings[node_name] = duration_ms

        result["node_timings"] = timings
        result["pipeline_errors"] = errors
        return result
    return wrapper


def build_pipeline_graph():
    graph = StateGraph(PipelineState)

    graph.add_node("pdf_extraction", wrap_node_with_telemetry("pdf_extraction", pdf_extraction_node))
    graph.add_node("skill_extraction", wrap_node_with_telemetry("skill_extraction", skill_extraction_node))
    graph.add_node("ats_analysis", wrap_node_with_telemetry("ats_analysis", ats_analysis_node))
    graph.add_node("missing_skills", wrap_node_with_telemetry("missing_skills", missing_skills_node))
    graph.add_node("career_recommendation", wrap_node_with_telemetry("career_recommendation", career_recommendation_node))
    graph.add_node("learning_roadmap", wrap_node_with_telemetry("learning_roadmap", learning_roadmap_node))

    graph.add_edge(START, "pdf_extraction")
    graph.add_edge("pdf_extraction", "skill_extraction")
    graph.add_edge("skill_extraction", "ats_analysis")
    graph.add_edge("ats_analysis", "missing_skills")
    graph.add_edge("missing_skills", "career_recommendation")
    graph.add_edge("career_recommendation", "learning_roadmap")
    graph.add_edge("learning_roadmap", END)

    return graph.compile()
