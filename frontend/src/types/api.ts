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

export interface SkillExtractionResult {
  programming_languages: string[];
  frameworks: string[];
  databases: string[];
  cloud_platforms: string[];
  soft_skills: string[];
  certifications: string[];
  tools: string[];
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

export interface AnalysisHistoryEntry {
  id: string;
  filename: string;
  status: string;
  target_role: string | null;
  created_at: string;
}

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
