const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

function getAuthHeaders(includeJson = false): HeadersInit {
  const token = localStorage.getItem('resume_auth_token');
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export interface ResumeUploadResponse {
  filename: string;
}

export interface ResumePageText {
  page_number: number;
  text: string;
}

export interface ParsedResumeText {
  filename: string;
  page_count: number;
  text: string;
  pages: ResumePageText[];
}

export interface ATSCategoryScore {
  score: number;
  findings: string[];
}

export interface ATSAnalysisResult {
  ats_score: number;
  resume_structure: ATSCategoryScore;
  keywords: ATSCategoryScore;
  formatting: ATSCategoryScore;
  technical_skills: ATSCategoryScore;
  experience: ATSCategoryScore;
  education: ATSCategoryScore;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
}

export interface JobRoleRecommendation {
  title: string;
  why_suitable: string;
  match_score: number;
}

export interface CertificationRecommendation {
  name: string;
  authority: string;
  why_recommend: string;
}

export interface InterviewPrepAdvice {
  technical_topics: string[];
  behavioral_tips: string[];
  sample_questions: string[];
}

export interface SalaryGrowthSuggestions {
  current_market_range: string;
  growth_strategies: string[];
  high_paying_skills: string[];
}

export interface CareerRecommendationResult {
  suitable_roles: JobRoleRecommendation[];
  strengths: string[];
  areas_for_improvement: string[];
  interview_preparation: InterviewPrepAdvice;
  certifications_to_pursue: CertificationRecommendation[];
  salary_growth: SalaryGrowthSuggestions;
}

export interface SkillGap {
  skill_name: string;
  category: string;
  priority_level: 'critical' | 'high' | 'medium' | 'low';
  why_important: string;
  learning_resources: string[];
  estimated_learning_hours: number;
}

export interface RoleComparisonResult {
  target_role: string;
  extracted_skills: Record<string, string[]>;
  missing_skills: SkillGap[];
  matched_skills: Record<string, string[]>;
  skill_match_percentage: number;
  overall_readiness: string;
  recommended_learning_path: string[];
  total_learning_hours: number;
  summary: string;
}

export interface AvailableRolesResponse {
  roles: string[];
  total: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    email: string;
    created_at: string;
  };
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Registration failed');
  }

  return response.json();
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed');
  }

  return response.json();
}

export async function uploadResume(file: File): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/resumes/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload resume');
  }

  return response.json();
}

export async function parseResume(filename: string): Promise<ParsedResumeText> {
  const response = await fetch(`${API_BASE_URL}/resumes/parse?filename=${encodeURIComponent(filename)}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to parse resume');
  }

  return response.json();
}

export async function analyzeATS(resumeText: string, skills?: any): Promise<ATSAnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/resumes/analyze`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(true),
    },
    body: JSON.stringify({
      resume_text: resumeText,
      skills: skills || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to analyze ATS');
  }

  return response.json();
}

export async function getCareerRecommendations(resumeText: string, skills?: any): Promise<CareerRecommendationResult> {
  const response = await fetch(`${API_BASE_URL}/career/recommend`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(true),
    },
    body: JSON.stringify({
      resume_text: resumeText,
      skills: skills || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to generate career recommendations');
  }

  return response.json();
}

export async function compareRole(skills: any, targetRole: string): Promise<RoleComparisonResult> {
  const response = await fetch(`${API_BASE_URL}/roles/compare`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(true),
    },
    body: JSON.stringify({
      skills: skills,
      target_role: targetRole,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to compare skills against role');
  }

  return response.json();
}

export async function getAvailableRoles(): Promise<AvailableRolesResponse> {
  const response = await fetch(`${API_BASE_URL}/roles/roles`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch available roles');
  }

  return response.json();
}

// ─── Learning Roadmap Types ────────────────────────────────────────────────

export interface SkillMilestone {
  skill: string;
  topic: string;
  resources: string[];
  estimated_hours: number;
}

export interface ProjectChallenge {
  title: string;
  description: string;
  tech_stack: string[];
  difficulty: string;
}

export interface PlatformRecommendation {
  name: string;
  url: string;
  purpose: string;
}

export interface CertificationPlan {
  name: string;
  authority: string;
  why_now: string;
  study_time_weeks: number;
}

export interface RoadmapPhase {
  phase: string;
  goal: string;
  skills: SkillMilestone[];
  projects: ProjectChallenge[];
  practice_platforms: PlatformRecommendation[];
  certifications: CertificationPlan[];
  weekly_time_commitment_hours: number;
  success_metrics: string[];
}

export interface LearningRoadmapResult {
  target_roles: string[];
  overall_goal: string;
  phase_30: RoadmapPhase;
  phase_60: RoadmapPhase;
  phase_90: RoadmapPhase;
  total_estimated_hours: number;
  motivational_summary: string;
}

export async function generateLearningRoadmap(
  resumeText: string,
  skills?: any,
  targetRole?: string
): Promise<LearningRoadmapResult> {
  const response = await fetch(`${API_BASE_URL}/roadmap/generate`, {
    method: 'POST',
    headers: { ...getAuthHeaders(true) },
    body: JSON.stringify({
      resume_text: resumeText,
      skills: skills || null,
      target_role: targetRole || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to generate learning roadmap');
  }

  return response.json();
}

