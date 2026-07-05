import { apiRequest, assertNonEmptyText, getAuthHeaders } from './apiClient';
import type {
  ATSAnalysisResult,
  AvailableRolesResponse,
  CareerRecommendationResult,
  LearningRoadmapResult,
  RoleComparisonResult,
  SkillExtractionResult,
} from '../types/api';

let rolesRequest: Promise<AvailableRolesResponse> | null = null;

export async function analyzeATS(resumeText: string, skills?: SkillExtractionResult): Promise<ATSAnalysisResult> {
  return apiRequest<ATSAnalysisResult>('/resumes/analyze', {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      resume_text: assertNonEmptyText(resumeText),
      skills: skills || null,
    }),
  });
}

export async function getCareerRecommendations(
  resumeText: string,
  skills?: SkillExtractionResult,
): Promise<CareerRecommendationResult> {
  return apiRequest<CareerRecommendationResult>('/career/recommend', {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      resume_text: assertNonEmptyText(resumeText),
      skills: skills || null,
    }),
  });
}

export async function compareRole(
  skills: SkillExtractionResult,
  targetRole: string,
): Promise<RoleComparisonResult> {
  return apiRequest<RoleComparisonResult>('/roles/compare', {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      skills,
      target_role: targetRole,
    }),
  });
}

export async function getAvailableRoles(): Promise<AvailableRolesResponse> {
  rolesRequest ??= apiRequest<AvailableRolesResponse>('/roles/roles', {
    method: 'GET',
    headers: getAuthHeaders(),
  }).catch((error) => {
    rolesRequest = null;
    throw error;
  });

  return rolesRequest;
}

export async function generateLearningRoadmap(
  resumeText: string,
  skills?: SkillExtractionResult,
  targetRole?: string,
): Promise<LearningRoadmapResult> {
  return apiRequest<LearningRoadmapResult>('/roadmap/generate', {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      resume_text: assertNonEmptyText(resumeText),
      skills: skills || null,
      target_role: targetRole || null,
    }),
  });
}
