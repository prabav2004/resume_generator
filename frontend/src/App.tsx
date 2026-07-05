import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Sparkles,
  Target,
  Upload,
  UserCircle,
  Zap,
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import AnalysisLoader from './components/AnalysisLoader';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AuthScreen from './components/AuthScreen';
import UploadZone from './components/UploadZone';
import { getAvailableRoles } from './services/analysisApi';
import { SUPPORTED_TARGET_ROLES } from './constants/roles';
import { useAuth } from './hooks/useAuth';
import { useResumeAnalysis } from './hooks/useResumeAnalysis';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<string[]>([...SUPPORTED_TARGET_ROLES]);
  const auth = useAuth();
  const analysis = useResumeAnalysis(availableRoles[0] || SUPPORTED_TARGET_ROLES[0]);
  const { state } = analysis;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    let ignore = false;

    getAvailableRoles()
      .then((data) => {
        if (ignore) return;
        const roles = data.roles.length > 0 ? data.roles : [...SUPPORTED_TARGET_ROLES];
        setAvailableRoles(roles);
      })
      .catch(() => {
        if (!ignore) {
          setAvailableRoles([...SUPPORTED_TARGET_ROLES]);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const hasResults = Boolean(state.atsResult && state.careerResult);
  const uploadError = useMemo(() => state.error || auth.historyError, [auth.historyError, state.error]);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      analysis.setFile(null);
      return;
    }
    analysis.setFile(file);
  };

  const handleStartAnalysis = async () => {
    setShowLanding(false);
    await analysis.startAnalysis();
  };

  const navItems = [
    { label: 'Analyze', icon: Upload, enabled: true, active: !hasResults, onClick: () => setShowLanding(false) },
    { label: 'Results', icon: LayoutDashboard, enabled: hasResults, active: hasResults, onClick: () => setShowLanding(false) },
    { label: 'Role Match', icon: Target, enabled: Boolean(state.comparisonResult), active: false, onClick: () => setShowLanding(false) },
    { label: 'Roadmap', icon: MapPin, enabled: Boolean(state.roadmapResult), active: false, onClick: () => setShowLanding(false) },
  ];

  if (showAuth) {
    return (
      <AuthScreen
        darkMode={darkMode}
        onAuthenticated={(token) => {
          auth.handleAuthenticated(token);
          setShowAuth(false);
          setShowLanding(false);
        }}
        onContinueAsGuest={() => setShowAuth(false)}
      />
    );
  }

  if (showLanding) {
    return (
      <div className="relative">
        {!auth.isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowAuth(true)}
            className="fixed right-4 top-4 z-30 inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-slate-900 sm:right-6 sm:top-5"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
        )}
        <LandingPage
          file={state.file}
          onFileSelect={handleFileSelect}
          onRemoveFile={() => analysis.setFile(null)}
          isLoading={state.isAnalyzing}
          loadingStep={state.loadingStep}
          onStartAnalysis={handleStartAnalysis}
          onEnterPlatform={() => setShowLanding(false)}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode((value) => !value)}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080d18]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1440px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <button type="button" className="flex min-w-0 items-center gap-3" onClick={() => setShowLanding(true)}>
            <div className="logo-icon">AI</div>
            <div className="logo-text hidden sm:block">Resume Advisor</div>
          </button>

          <nav className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-1 sm:gap-2 sm:px-4" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled={!item.enabled}
                  onClick={item.onClick}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                    item.active
                      ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
                      : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-100'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowUserMenu((value) => !value)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10 sm:px-3"
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
            >
              <UserCircle className="h-5 w-5 text-cyan-300" />
              <span className="hidden lg:inline">{auth.isAuthenticated ? 'Account' : 'Guest'}</span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-slate-950 p-3 shadow-2xl shadow-black/40" role="menu">
                <div className="border-b border-white/10 pb-3">
                  <p className="text-sm font-semibold text-white">{auth.isAuthenticated ? 'Signed in securely' : 'Guest mode'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {auth.isAuthenticated ? `${auth.historyEntries.length} saved analyses` : 'Sign in to save analysis history'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (auth.isAuthenticated) {
                      auth.logout();
                    } else {
                      setShowAuth(true);
                    }
                  }}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                  role="menuitem"
                >
                  {auth.isAuthenticated ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  {auth.isAuthenticated ? 'Logout' : 'Sign in'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="main-content-inner">
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {hasResults ? 'Resume Intelligence Dashboard' : 'Analyze Your Resume'}
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                {hasResults
                  ? 'Review ATS readiness, role alignment, career guidance, and a retained roadmap from one reliable analysis state.'
                  : 'Upload a PDF, choose a supported target role, and run the AI workflow without duplicate submissions.'}
              </p>
            </div>

            {state.file && !state.isAnalyzing && (
              <button type="button" className="btn sm:w-auto" onClick={handleStartAnalysis} disabled={state.isAnalyzing}>
                <Zap size={16} />
                {hasResults ? 'Analyze Again' : 'Start Analysis'}
              </button>
            )}
          </div>

          {uploadError && (
            <div className="alert-box" role="alert">
              <AlertCircle size={20} />
              <div className="alert-box-content">
                <strong>Attention:</strong> {uploadError}
              </div>
            </div>
          )}

          {state.roadmapError && hasResults && (
            <div className="alert-box" role="status">
              <AlertCircle size={20} />
              <div className="alert-box-content">
                <strong>Roadmap pending:</strong> {state.roadmapError}{' '}
                <button type="button" className="text-cyan-300 underline" onClick={analysis.retryRoadmap}>
                  Retry roadmap
                </button>
              </div>
            </div>
          )}

          {state.isAnalyzing && <AnalysisLoader loadingStep={state.loadingStep} />}

          {!state.isAnalyzing && hasResults && state.atsResult && state.careerResult ? (
            <AnalyticsDashboard
              file={state.file}
              atsResult={state.atsResult}
              careerResult={state.careerResult}
              roadmapResult={state.roadmapResult}
              comparisonResult={state.comparisonResult}
              extractedSkills={state.skills}
              selectedRole={state.selectedRole}
              availableRoles={availableRoles}
              onRoleSelect={analysis.setSelectedRole}
              onReRunAnalysis={handleStartAnalysis}
              isComparing={state.isComparing}
              darkMode={darkMode}
            />
          ) : !state.isAnalyzing ? (
            <div className="grid-2">
              <section className="glass-card">
                <h2 className="card-title">
                  <FileText size={20} />
                  Resume PDF
                </h2>
                <UploadZone
                  file={state.file}
                  onFileSelect={handleFileSelect}
                  onRemoveFile={() => analysis.setFile(null)}
                  isLoading={state.isAnalyzing}
                  loadingStep={state.loadingStep}
                  onStartAnalysis={handleStartAnalysis}
                  darkMode={darkMode}
                />
              </section>

              <section className="glass-card">
                <h2 className="card-title">
                  <Target size={20} />
                  Target Role
                </h2>
                <div className="form-group">
                  <label className="form-label" htmlFor="target-role">Supported comparison role</label>
                  <select
                    id="target-role"
                    className="select-input"
                    value={state.selectedRole}
                    onChange={(event) => analysis.setSelectedRole(event.target.value)}
                  >
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="empty-state">
                  <Sparkles size={40} />
                  <p>Guest users can analyze resumes. Sign in only when you want saved history.</p>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default App;
