import { apiRequest, getAuthHeaders, getAuthToken } from './apiClient';
import type { AnalysisHistoryEntry, AuthResponse } from '../types/api';

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export async function getHistory(): Promise<AnalysisHistoryEntry[]> {
  if (!getAuthToken()) {
    return [];
  }

  return apiRequest<AnalysisHistoryEntry[]>('/auth/history', {
    headers: getAuthHeaders(),
  });
}

export async function saveHistory(filename: string, status: string, targetRole?: string | null): Promise<void> {
  if (!getAuthToken()) {
    return;
  }

  await apiRequest<{ ok: true }>('/auth/history', {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ filename, status, target_role: targetRole || null }),
  });
}
