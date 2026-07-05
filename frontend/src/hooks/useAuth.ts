import { useCallback, useEffect, useState } from 'react';
import { getHistory } from '../services/authApi';
import { ApiError, getAuthToken } from '../services/apiClient';
import type { AnalysisHistoryEntry } from '../types/api';

const historyRequestByToken = new Map<string, Promise<AnalysisHistoryEntry[]>>();

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [historyEntries, setHistoryEntries] = useState<AnalysisHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const isAuthenticated = Boolean(token);

  const handleAuthenticated = useCallback((nextToken: string) => {
    localStorage.setItem('resume_auth_token', nextToken);
    setToken(nextToken);
  }, []);

  const logout = useCallback(() => {
    const currentToken = getAuthToken();
    if (currentToken) {
      historyRequestByToken.delete(currentToken);
    }
    localStorage.removeItem('resume_auth_token');
    setToken(null);
    setHistoryEntries([]);
    setHistoryError(null);
  }, []);

  useEffect(() => {
    let ignore = false;

    if (!token) {
      setHistoryEntries([]);
      setHistoryError(null);
      return;
    }

    const request = historyRequestByToken.get(token) ?? getHistory();
    historyRequestByToken.set(token, request);

    request
      .then((entries) => {
        if (!ignore) {
          setHistoryEntries(entries);
          setHistoryError(null);
        }
      })
      .catch((error: unknown) => {
        historyRequestByToken.delete(token);
        if (ignore) return;
        const message = error instanceof ApiError && error.status === 401
          ? 'Your session expired. Please sign in again.'
          : error instanceof Error
            ? error.message
            : 'Unable to load analysis history.';
        setHistoryError(message);
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  return {
    token,
    isAuthenticated,
    historyEntries,
    historyError,
    handleAuthenticated,
    logout,
  };
}
