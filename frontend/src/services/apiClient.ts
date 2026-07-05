export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('resume_auth_token');
}

export function getAuthHeaders(includeJson = false): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

async function normalizeError(response: Response): Promise<ApiError> {
  const errorData = await response.json().catch(() => ({}));
  const detail = typeof errorData?.detail === 'string'
    ? errorData.detail
    : Array.isArray(errorData?.detail)
      ? errorData.detail.map((item: any) => item?.msg || item?.message || 'Validation error').join(', ')
      : null;

  return new ApiError(detail || `Request failed with status ${response.status}`, response.status, errorData);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    throw await normalizeError(response);
  }

  return response.json() as Promise<T>;
}

export function assertNonEmptyText(value: string | null | undefined, label = 'Resume text'): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new ApiError(`${label} is required before this request can run.`, 400);
  }
  return trimmed;
}
