import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, UserPlus, Sparkles } from 'lucide-react';
import { login, register } from '../services/api';

interface AuthScreenProps {
  onAuthenticated: (token: string) => void;
  darkMode: boolean;
}

export default function AuthScreen({ onAuthenticated, darkMode }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => (mode === 'login' ? 'Welcome back' : 'Create your account'), [mode]);
  const subtitle = useMemo(() => (mode === 'login' ? 'Sign in to continue your analysis journey.' : 'Register to save history and protect your reports.'), [mode]);

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
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_45%),linear-gradient(135deg,_#060816,_#0f172a)] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md rounded-[28px] border p-7 shadow-[0_25px_75px_rgba(15,23,42,0.35)] backdrop-blur-xl ${darkMode ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-white/90'}`}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Username</label>
            <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${darkMode ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
              <UserPlus className="h-4 w-4 text-indigo-400" />
              <input
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                className={`w-full bg-transparent text-sm outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`}
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-900/70 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
                placeholder="you@example.com"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
            <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${darkMode ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
              <Lock className="h-4 w-4 text-cyan-400" />
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className={`w-full bg-transparent text-sm outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`}
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-indigo-500/30 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className={`mt-5 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-semibold text-indigo-400">
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
