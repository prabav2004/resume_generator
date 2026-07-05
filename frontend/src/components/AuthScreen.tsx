import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, UserPlus, Sparkles, Mail } from 'lucide-react';
import { login, register } from '../services/api';
import { ApiError } from '../services/apiClient';

interface AuthScreenProps {
  onAuthenticated: (token: string) => void;
  onContinueAsGuest?: () => void;
  darkMode: boolean;
}

export default function AuthScreen({ onAuthenticated, onContinueAsGuest, darkMode }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => (mode === 'login' ? 'Welcome back' : 'Create your account'), [mode]);
  const subtitle = useMemo(
    () => (mode === 'login' ? 'Sign in to continue your analysis journey.' : 'Register to save history and protect your reports.'),
    [mode]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = mode === 'login'
        ? await login(form.username, form.password)
        : await register(form.username, form.email, form.password);

      localStorage.setItem('resume_auth_token', result.access_token);
      onAuthenticated(result.access_token);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldShell = darkMode
    ? 'flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3'
    : 'flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3';

  const inputClass = `w-full min-w-0 bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`;

  return (
    <div className={`flex min-h-screen items-center justify-center overflow-x-hidden px-4 py-8 sm:py-10 ${darkMode ? 'bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_45%),linear-gradient(135deg,_#060816,_#0f172a)]' : 'bg-gradient-to-br from-slate-100 via-white to-indigo-50'}`}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md rounded-3xl border p-6 shadow-[0_25px_75px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-7 ${darkMode ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-white/95'}`}
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 sm:h-12 sm:w-12">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h2 className={`text-xl font-semibold sm:text-2xl ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Username</label>
            <div className={fieldShell}>
              <UserPlus className="h-4 w-4 shrink-0 text-indigo-400" />
              <input
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                className={inputClass}
                placeholder="Enter username"
                required
                autoComplete="username"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
              <div className={fieldShell}>
                <Mail className="h-4 w-4 shrink-0 text-cyan-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className={inputClass}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
            <div className={fieldShell}>
              <Lock className="h-4 w-4 shrink-0 text-cyan-400" />
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className={inputClass}
                placeholder="Enter password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-indigo-500/30 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className={`mt-5 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="font-semibold text-indigo-400 hover:text-indigo-300"
          >
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </div>

        {onContinueAsGuest && (
          <button
            type="button"
            onClick={onContinueAsGuest}
            className={`mt-4 flex h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-semibold transition ${darkMode ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
          >
            Continue as guest
          </button>
        )}
      </motion.div>
    </div>
  );
}
