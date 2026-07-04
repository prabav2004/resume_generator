from fastapi import APIRouter

from app.api.v1.routes import auth, health, resumes, role_comparison, career_recommendation, ats, learning_roadmap, analysis

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(ats.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(role_comparison.router, prefix="/roles", tags=["roles"])
api_router.include_router(career_recommendation.router, prefix="/career", tags=["career"])
api_router.include_router(learning_roadmap.router, prefix="/roadmap", tags=["roadmap"])
api_router.include_router(analysis.router, prefix="", tags=["analysis"])

