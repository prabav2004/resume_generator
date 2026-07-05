import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeATS, compareRole, generateLearningRoadmap, getCareerRecommendations } from '../services/analysisApi';
import { saveHistory } from '../services/authApi';
import { parseResume, uploadResume } from '../services/resumeApi';
import { mapTargetRole } from '../constants/roles';
import type {
  ATSAnalysisResult,
  CareerRecommendationResult,
  LearningRoadmapResult,
  RoleComparisonResult,
  SkillExtractionResult,
} from '../types/api';

export type AnalysisStage =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'analyzing'
  | 'comparing'
  | 'roadmap'
  | 'complete'
  | 'partial'
  | 'failed';

export interface AnalysisState {
  file: File | null;
  serverFilename: string | null;
  resumeText: string;
  selectedRole: string;
  skills: SkillExtractionResult | null;
  atsResult: ATSAnalysisResult | null;
  careerResult: CareerRecommendationResult | null;
  comparisonResult: RoleComparisonResult | null;
  roadmapResult: LearningRoadmapResult | null;
  stage: AnalysisStage;
  loadingStep: string;
  error: string | null;
  roadmapError: string | null;
  isAnalyzing: boolean;
  isComparing: boolean;
  isRoadmapLoading: boolean;
}

const emptySkills: SkillExtractionResult = {
  programming_languages: [],
  frameworks: [],
  databases: [],
  cloud_platforms: [],
  soft_skills: [],
  certifications: [],
  tools: [],
};

function extractLocalSkills(text: string): SkillExtractionResult {
  const textLower = text.toLowerCase();
  const skills = structuredClone(emptySkills);
  const catalog: Record<keyof SkillExtractionResult, string[]> = {
    programming_languages: ['python', 'javascript', 'typescript', 'java', 'c++', 'go', 'rust', 'sql'],
    frameworks: ['react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'fastapi', 'django', 'flask', 'spring boot', 'tensorflow', 'pytorch'],
    databases: ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch'],
    cloud_platforms: ['aws', 'azure', 'gcp'],
    soft_skills: ['leadership', 'communication', 'problem solving', 'collaboration'],
    certifications: ['aws certified', 'azure certified', 'pmp', 'scrum master'],
    tools: ['git', 'docker', 'kubernetes', 'jenkins', 'github actions', 'terraform', 'figma'],
  };

  Object.entries(catalog).forEach(([category, keywords]) => {
    keywords.forEach((keyword) => {
      if (!textLower.includes(keyword)) return;
      const label = keyword.length <= 3 ? keyword.toUpperCase() : keyword.replace(/\b\w/g, (char) => char.toUpperCase());
      skills[category as keyof SkillExtractionResult].push(label);
    });
  });

  return skills;
}

export function useResumeAnalysis(initialRole: string) {
  const [state, setState] = useState<AnalysisState>({
    file: null,
    serverFilename: null,
    resumeText: '',
    selectedRole: initialRole,
    skills: null,
    atsResult: null,
    careerResult: null,
    comparisonResult: null,
    roadmapResult: null,
    stage: 'idle',
    loadingStep: '',
    error: null,
    roadmapError: null,
    isAnalyzing: false,
    isComparing: false,
    isRoadmapLoading: false,
  });
  const requestIdRef = useRef(0);
  const comparedRoleRef = useRef<string | null>(null);

  useEffect(() => {
    setState((current) => current.selectedRole ? current : { ...current, selectedRole: initialRole });
  }, [initialRole]);

  const setFile = useCallback((file: File | null) => {
    setState((current) => ({
      ...current,
      file,
      error: null,
      serverFilename: file ? null : current.serverFilename,
    }));
  }, []);

  const setSelectedRole = useCallback((selectedRole: string) => {
    setState((current) => ({ ...current, selectedRole }));
  }, []);

  useEffect(() => {
    if (!state.skills || state.isAnalyzing || !state.selectedRole) {
      return;
    }

    const targetRole = mapTargetRole(state.selectedRole);
    if (!targetRole || comparedRoleRef.current === targetRole) {
      return;
    }

    let ignore = false;
    setState((current) => ({ ...current, isComparing: true }));
    compareRole(state.skills, targetRole)
      .then((comparisonResult) => {
        if (ignore) return;
        comparedRoleRef.current = targetRole;
        setState((current) => ({
          ...current,
          selectedRole: targetRole,
          comparisonResult,
          isComparing: false,
        }));
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : 'Role comparison failed.',
          isComparing: false,
        }));
      });

    return () => {
      ignore = true;
    };
  }, [state.isAnalyzing, state.selectedRole, state.skills]);

  const runRoadmap = useCallback(async () => {
    const resumeText = state.resumeText.trim();
    if (!resumeText || !state.skills) {
      setState((current) => ({
        ...current,
        roadmapError: 'Roadmap generation needs extracted resume text first.',
      }));
      return;
    }

    setState((current) => ({ ...current, isRoadmapLoading: true, roadmapError: null, stage: 'roadmap' }));
    try {
      const roadmap = await generateLearningRoadmap(resumeText, state.skills, state.selectedRole || undefined);
      setState((current) => ({
        ...current,
        roadmapResult: roadmap,
        isRoadmapLoading: false,
        stage: current.atsResult && current.careerResult ? 'complete' : 'partial',
      }));
    } catch (error: unknown) {
      setState((current) => ({
        ...current,
        isRoadmapLoading: false,
        stage: current.atsResult || current.careerResult ? 'partial' : 'failed',
        roadmapError: error instanceof Error ? error.message : 'Roadmap generation failed.',
      }));
    }
  }, [state.resumeText, state.selectedRole, state.skills]);

  const startAnalysis = useCallback(async () => {
    if (!state.file || state.isAnalyzing) {
      return;
    }

    if (state.file.type !== 'application/pdf') {
      setState((current) => ({ ...current, error: 'Only PDF resumes are supported.' }));
      return;
    }

    if (state.file.size > 10 * 1024 * 1024) {
      setState((current) => ({ ...current, error: 'File is too large. Max size is 10MB.' }));
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    comparedRoleRef.current = null;
    const targetRole = mapTargetRole(state.selectedRole) || initialRole;

    setState((current) => ({
      ...current,
      selectedRole: targetRole,
      serverFilename: null,
      resumeText: '',
      skills: null,
      atsResult: null,
      careerResult: null,
      comparisonResult: null,
      roadmapResult: null,
      error: null,
      roadmapError: null,
      isAnalyzing: true,
      isRoadmapLoading: false,
      isComparing: false,
      stage: 'uploading',
      loadingStep: 'Uploading resume',
    }));

    try {
      await saveHistory(state.file.name, 'uploading', targetRole).catch((error) => {
        if (error?.status === 401) throw error;
      });

      const uploaded = await uploadResume(state.file);
      if (requestId !== requestIdRef.current) return;

      setState((current) => ({
        ...current,
        serverFilename: uploaded.filename,
        stage: 'extracting',
        loadingStep: 'Extracting resume text',
      }));

      const parsed = await parseResume(uploaded.filename);
      const resumeText = parsed.text.trim();
      if (!resumeText) {
        throw new Error('No readable text was extracted from this PDF.');
      }

      const skills = extractLocalSkills(resumeText);
      if (requestId !== requestIdRef.current) return;

      setState((current) => ({
        ...current,
        resumeText,
        skills,
        stage: 'analyzing',
        loadingStep: 'Running ATS and career analysis',
      }));

      const [atsResult, careerResult] = await Promise.all([
        analyzeATS(resumeText, skills),
        getCareerRecommendations(resumeText, skills),
      ]);
      if (requestId !== requestIdRef.current) return;

      setState((current) => ({
        ...current,
        atsResult,
        careerResult,
        stage: 'comparing',
        loadingStep: 'Comparing against target role',
        isComparing: true,
      }));

      const comparisonResult = await compareRole(skills, targetRole);
      if (requestId !== requestIdRef.current) return;
      comparedRoleRef.current = targetRole;

      setState((current) => ({
        ...current,
        comparisonResult,
        isComparing: false,
        stage: 'roadmap',
        loadingStep: 'Building learning roadmap',
        isRoadmapLoading: true,
      }));

      generateLearningRoadmap(resumeText, skills, targetRole)
        .then((roadmapResult) => {
          if (requestId !== requestIdRef.current) return;
          setState((current) => ({
            ...current,
            roadmapResult,
            roadmapError: null,
            isRoadmapLoading: false,
            stage: 'complete',
          }));
        })
        .catch((error: unknown) => {
          if (requestId !== requestIdRef.current) return;
          setState((current) => ({
            ...current,
            isRoadmapLoading: false,
            roadmapError: error instanceof Error ? error.message : 'Roadmap generation failed.',
            stage: 'partial',
          }));
        });

      await saveHistory(uploaded.filename, 'completed', targetRole).catch((error) => {
        if (error?.status === 401) throw error;
      });

      setState((current) => ({
        ...current,
        isAnalyzing: false,
        loadingStep: '',
      }));
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) return;
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'An error occurred during resume analysis.',
        isAnalyzing: false,
        isComparing: false,
        isRoadmapLoading: false,
        stage: 'failed',
        loadingStep: '',
      }));
    }
  }, [initialRole, state.file, state.isAnalyzing, state.selectedRole]);

  return {
    state,
    setFile,
    setSelectedRole,
    startAnalysis,
    retryRoadmap: runRoadmap,
  };
}
