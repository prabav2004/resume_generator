#!/usr/bin/env python3
"""
Demo Script for Career Recommendation Agent

This script demonstrates how to call the service and the LangGraph graph
directly to get structured career guidance from a resume.
"""
import json
import logging
from app.schemas.skills import SkillExtractionResult
from app.services.career_recommendation_service import CareerRecommendationService
from app.graphs.career_recommendation_agent import build_career_recommendation_graph

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")


def run_demo():
    print("\n" + "=" * 60)
    print("Career Recommendation Agent - Demo")
    print("=" * 60)

    # Sample Resume Text
    sample_resume = """
    John Doe
    Software Engineer
    john.doe@example.com | github.com/johndoe | linkedin.com/in/johndoe

    SUMMARY
    Highly motivated Software Engineer with 4 years of experience building scalable web applications.
    Specialized in Python (FastAPI, Django), JavaScript/TypeScript (React, Next.js), and cloud architectures.
    AWS Certified Solutions Architect with a proven track record of reducing hosting costs and improving API response times.

    EXPERIENCE
    Software Engineer | Tech Solutions Inc. | 2022 - Present
    - Designed and implemented microservices using FastAPI, reducing processing overhead by 30%.
    - Built interactive, responsive user interfaces using React, Next.js, and TypeScript.
    - Managed deployments on AWS (ECS, RDS, S3) and integrated CI/CD pipelines with GitHub Actions.
    - Collaborated with product teams to design databases, optimizing PostgreSQL queries for speed.

    Junior Developer | Startup Hub | 2020 - 2022
    - Developed backend features with Django/Python and MySQL.
    - Maintained legacy frontend applications using jQuery and Vanilla CSS.
    - Participated in weekly code reviews and sprint planning.

    EDUCATION
    Bachelor of Science in Computer Science | University of Tech | 2016 - 2020

    SKILLS
    - Programming: Python, JavaScript, TypeScript, SQL, HTML, CSS
    - Frameworks: FastAPI, Django, React, Next.js
    - Databases: PostgreSQL, MySQL, Redis
    - Cloud & DevOps: AWS, Docker, Git, GitHub Actions, Linux
    - Soft Skills: Communication, Collaboration, Problem Solving
    """

    # Optional Pre-extracted Skills
    skills = SkillExtractionResult(
        programming_languages=["Python", "JavaScript", "TypeScript", "SQL"],
        frameworks=["FastAPI", "Django", "React", "Next.js"],
        databases=["PostgreSQL", "MySQL", "Redis"],
        cloud_platforms=["AWS"],
        soft_skills=["Communication", "Collaboration", "Problem Solving"],
        certifications=["AWS Certified"],
        tools=["Git", "Docker", "GitHub Actions", "Linux"]
    )

    # --- Part 1: Service Demo ---
    print("\n[PART 1] Running CareerRecommendationService directly...")
    service = CareerRecommendationService()
    try:
        service_result = service.generate_recommendations(sample_resume, skills=skills)
        print("\nSuccessfully generated recommendations from Service:")
        print(json.dumps(service_result.model_dump(), indent=2))
    except Exception as e:
        print(f"Error in Service: {e}")

    # --- Part 2: LangGraph Agent Demo ---
    print("\n" + "-" * 50)
    print("\n[PART 2] Running CareerRecommendationAgent via LangGraph...")
    graph = build_career_recommendation_graph()

    state = {
        "resume_text": sample_resume,
        "skills": skills.model_dump()
    }

    try:
        graph_result = graph.invoke(state)
        recommendation_result = graph_result.get("recommendation_result", {})
        print("\nSuccessfully generated recommendations from LangGraph Agent:")
        print(json.dumps(recommendation_result, indent=2))
    except Exception as e:
        print(f"Error in LangGraph: {e}")


if __name__ == "__main__":
    run_demo()
