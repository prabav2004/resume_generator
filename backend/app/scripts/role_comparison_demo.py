#!/usr/bin/env python3
"""
Quick Start Guide - Role Comparison Agent

This script demonstrates how to use the Role Comparison Agent
to analyze skills and compare them against target roles.
"""

from app.schemas.skills import SkillExtractionResult
from app.schemas.role_comparison import TargetRole
from app.services.role_comparison_service import RoleComparisonService
from app.graphs.role_comparison_agent import build_role_comparison_graph


def example_1_simple_comparison():
    """Example 1: Simple skill comparison against a single role"""
    print("\n" + "="*60)
    print("Example 1: Simple Skill Comparison")
    print("="*60)
    
    # Define extracted skills
    skills = SkillExtractionResult(
        programming_languages=["Python", "JavaScript"],
        frameworks=["React", "FastAPI"],
        databases=["PostgreSQL"],
        cloud_platforms=["AWS"],
        soft_skills=["Communication", "Problem Solving"],
        certifications=[],
        tools=["Git", "Docker"]
    )
    
    # Compare against Full Stack Developer role
    service = RoleComparisonService()
    result = service.compare(skills, "Full Stack Developer")
    
    # Display results
    print(f"\nTarget Role: {result.target_role}")
    print(f"Skill Match: {result.skill_match_percentage:.1f}%")
    print(f"Overall Readiness: {result.overall_readiness}")
    print(f"Missing Skills Count: {len(result.missing_skills)}")
    print(f"Total Learning Hours: {result.total_learning_hours}")
    print(f"\nSummary: {result.summary}")
    
    # Show top 5 critical skills to learn
    critical_skills = [s for s in result.missing_skills if s.priority_level.value == "critical"]
    print(f"\nTop Critical Skills to Learn:")
    for skill in critical_skills[:5]:
        print(f"  - {skill.skill_name} ({skill.estimated_learning_hours}h)")


def example_2_all_roles_comparison():
    """Example 2: Compare against all available roles"""
    print("\n" + "="*60)
    print("Example 2: Compare Against All Roles")
    print("="*60)
    
    # Same skills for all roles
    skills = SkillExtractionResult(
        programming_languages=["Python", "JavaScript", "Java"],
        frameworks=["React", "Django", "FastAPI"],
        databases=["PostgreSQL", "MongoDB"],
        cloud_platforms=["AWS"],
        soft_skills=["Leadership", "Communication"],
        certifications=["AWS Certified"],
        tools=["Git", "Docker", "Kubernetes"]
    )
    
    service = RoleComparisonService()
    
    # Compare against each role
    print("\nSkill Match Across All Roles:")
    print("-" * 50)
    
    results = []
    for role in TargetRole:
        result = service.compare(skills, role.value)
        results.append((role.value, result.skill_match_percentage, result.overall_readiness))
        print(f"{role.value:25} | Match: {result.skill_match_percentage:5.1f}% | {result.overall_readiness}")
    
    # Find best fit role
    best_role = max(results, key=lambda x: x[1])
    print(f"\n✓ Best fit role: {best_role[0]} ({best_role[1]:.1f}% match)")


def example_3_learning_path():
    """Example 3: Get personalized learning path"""
    print("\n" + "="*60)
    print("Example 3: Personalized Learning Path")
    print("="*60)
    
    skills = SkillExtractionResult(
        programming_languages=["Python"],
        frameworks=["Django"],
        databases=["PostgreSQL"],
        cloud_platforms=[],
        soft_skills=[],
        certifications=[],
        tools=["Git"]
    )
    
    service = RoleComparisonService()
    result = service.compare(skills, "Data Scientist")
    
    print(f"\nTarget Role: {result.target_role}")
    print(f"Current Match: {result.skill_match_percentage:.1f}%")
    print(f"Learning Hours Required: {result.total_learning_hours}")
    
    print("\nRecommended Learning Path (by priority):")
    print("-" * 50)
    for i, skill_path in enumerate(result.recommended_learning_path, 1):
        print(f"{i:2}. {skill_path}")
    
    print("\nDetailed Skill Gaps:")
    print("-" * 50)
    for skill in result.missing_skills[:5]:  # Show top 5
        print(f"\nSkill: {skill.skill_name} ({skill.priority_level.value})")
        print(f"  Category: {skill.category}")
        print(f"  Why Important: {skill.why_important}")
        print(f"  Learning Hours: {skill.estimated_learning_hours}")
        print(f"  Resources: {', '.join(skill.learning_resources[:2])}...")


def example_4_using_graph():
    """Example 4: Using the LangGraph agent"""
    print("\n" + "="*60)
    print("Example 4: Using LangGraph Agent")
    print("="*60)
    
    # Build the graph
    graph = build_role_comparison_graph()
    
    # Create state with skills and target role
    state = {
        "skills": {
            "programming_languages": ["JavaScript", "TypeScript"],
            "frameworks": ["React", "Next.js"],
            "databases": ["PostgreSQL"],
            "cloud_platforms": ["AWS"],
            "soft_skills": ["Communication"],
            "certifications": [],
            "tools": ["Git", "GitHub Actions"]
        },
        "target_role": "Frontend Developer"
    }
    
    # Execute the graph
    print("\nExecuting Role Comparison Graph...")
    result = graph.invoke(state)
    
    # Extract results
    comparison_result = result.get("comparison_result", {})
    print(f"\nResults from Graph:")
    print(f"  Match: {comparison_result.get('skill_match_percentage', 0):.1f}%")
    print(f"  Readiness: {comparison_result.get('overall_readiness', 'N/A')}")
    print(f"  Missing Skills: {len(comparison_result.get('missing_skills', []))}")


def example_5_error_handling():
    """Example 5: Error handling"""
    print("\n" + "="*60)
    print("Example 5: Error Handling")
    print("="*60)
    
    skills = SkillExtractionResult()
    service = RoleComparisonService()
    
    # Try with invalid role
    try:
        print("\nAttempting comparison with invalid role...")
        result = service.compare(skills, "Invalid Role Name")
    except ValueError as e:
        print(f"✓ Caught expected error: {e}")
    
    # Valid roles check
    print("\nValid Target Roles:")
    valid_roles = [role.value for role in TargetRole]
    for role in valid_roles:
        print(f"  - {role}")


def example_6_career_transition():
    """Example 6: Career transition scenario"""
    print("\n" + "="*60)
    print("Example 6: Career Transition Analysis")
    print("="*60)
    
    # Backend developer wants to become AI Engineer
    current_skills = SkillExtractionResult(
        programming_languages=["Python", "Java"],
        frameworks=["FastAPI", "Django", "Spring Boot"],
        databases=["PostgreSQL", "MongoDB", "Redis"],
        cloud_platforms=["AWS", "Azure"],
        soft_skills=["Problem Solving", "Leadership"],
        certifications=["AWS Certified"],
        tools=["Git", "Docker", "Kubernetes"]
    )
    
    service = RoleComparisonService()
    
    print("\nCareer Transition: Backend Developer → AI Engineer")
    print("-" * 50)
    
    # Current role assessment
    current_role_result = service.compare(current_skills, "Backend Developer")
    print(f"\nCurrent Role (Backend Developer):")
    print(f"  Match: {current_role_result.skill_match_percentage:.1f}%")
    print(f"  Readiness: {current_role_result.overall_readiness}")
    
    # Target role assessment
    target_role_result = service.compare(current_skills, "AI Engineer")
    print(f"\nTarget Role (AI Engineer):")
    print(f"  Match: {target_role_result.skill_match_percentage:.1f}%")
    print(f"  Readiness: {target_role_result.overall_readiness}")
    print(f"  Learning Hours: {target_role_result.total_learning_hours}")
    
    # Show what to focus on
    print(f"\nCritical Skills to Acquire:")
    critical = [s for s in target_role_result.missing_skills 
                if s.priority_level.value == "critical"]
    for skill in critical[:3]:
        print(f"  - {skill.skill_name} ({skill.estimated_learning_hours}h)")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("Role Comparison Agent - Quick Start Examples")
    print("="*60)
    
    # Run examples
    example_1_simple_comparison()
    example_2_all_roles_comparison()
    example_3_learning_path()
    example_4_using_graph()
    example_5_error_handling()
    example_6_career_transition()
    
    print("\n" + "="*60)
    print("All examples completed!")
    print("="*60 + "\n")
