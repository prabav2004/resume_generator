import { apiRequest, getAuthHeaders } from './apiClient';
import type { ParsedResumeText, ResumeUploadResponse } from '../types/api';

export async function uploadResume(file: File): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<ResumeUploadResponse>('/resumes/upload', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
}

export async function parseResume(filename: string): Promise<ParsedResumeText> {
  return apiRequest<ParsedResumeText>(`/resumes/parse?filename=${encodeURIComponent(filename)}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}
