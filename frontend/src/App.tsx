import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  FileText,
  Award,
  Sparkles,
  TrendingUp,
  Upload,
  AlertCircle,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  Target,
  GraduationCap,
  ArrowRight,
  Clock,
  BookOpen,
  ChevronRight,
  UserCheck,
  Check,
  Zap,
  MapPin,
  Layers,
  Laptop,
} from 'lucide-react';
import {
  uploadResume,
  parseResume,
  analyzeATS,
  getCareerRecommendations,
  compareRole,
  getAvailableRoles,
  generateLearningRoadmap,
} from './services/api';
import type {
  ATSAnalysisResult,
  CareerRecommendationResult,
  RoleComparisonResult,
  LearningRoadmapResult,
  RoadmapPhase,
} from './services/api';
import LandingPage from './components/LandingPage';
import AnalysisLoader from './components/AnalysisLoader';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AuthScreen from './components/AuthScreen';

type TabType = 'dashboard' | 'ats' | 'recommendations' | 'comparison' | 'roadmap';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [, setAuthToken] = useState<string | null>(localStorage.getItem('resume_auth_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('resume_auth_token')));
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Dark/Light mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Resume Data States
  const [_resumeFilename, setResumeFilename] = useState<string | null>(null);
  const [_resumeText, setResumeText] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<any>(null);

  // Analysis Results
  const [atsResult, setAtsResult] = useState<ATSAnalysisResult | null>(null);
  const [careerResult, setCareerResult] = useState<CareerRecommendationResult | null>(null);
  const [roadmapResult, setRoadmapResult] = useState<LearningRoadmapResult | null>(null);
  const [activeRoadmapPhase, setActiveRoadmapPhase] = useState<'30' | '60' | '90'>('30');
  const [roadmapTargetRole, setRoadmapTargetRole] = useState<string>('');
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);
  
  // Role Comparison States
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<RoleComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [, setHistoryEntries] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAuthenticated = (token: string) => {
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('resume_auth_token');
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLanding(true);
      return;
    }

    getAvailableRoles()
      .then((data) => {
        setAvailableRoles(data.roles);
        if (data.roles.length > 0) {
          setSelectedRole(data.roles[0]);
        }
      })
      .catch((err) => console.error('Error fetching target roles:', err));
  }, [isAuthenticated]);

  // Fetch available target roles on mount
  useEffect(() => {
    getAvailableRoles()
      .then((data) => {
        setAvailableRoles(data.roles);
        if (data.roles.length > 0) {
          setSelectedRole(data.roles[0]);
        }
      })
      .catch((err) => console.error('Error fetching target roles:', err));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('resume_auth_token');
    if (!token) return;

    fetch('http://localhost:8000/api/v1/auth/history', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => setHistoryEntries(Array.isArray(data) ? data : []))
      .catch(() => setHistoryEntries([]));
  }, [isAuthenticated]);

  // Compare role when selected role changes or careerResult/skills are loaded
  useEffect(() => {
    if (selectedRole && extractedSkills) {
      setIsComparing(true);
      compareRole(extractedSkills, selectedRole)
        .then((res) => {
          setComparisonResult(res);
        })
        .catch((err) => {
          console.error('Error comparing role:', err);
        })
        .finally(() => {
          setIsComparing(false);
        });
    }
  }, [selectedRole, extractedSkills]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      processFile(droppedFiles[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFile(selectedFiles[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF resumes are supported.');
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Run learning roadmap generation
  const generateRoadmap = async (text: string, skills: any) => {
    setIsRoadmapLoading(true);
    try {
      const roadmap = await generateLearningRoadmap(text, skills, roadmapTargetRole || undefined);
      setRoadmapResult(roadmap);
    } catch (err: any) {
      console.error('Roadmap generation error:', err);
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  // Run full analysis sequence
  const persistHistory = async (filename: string, status: string, targetRole?: string) => {
    const token = localStorage.getItem('resume_auth_token');
    if (!token) return;

    try {
      await fetch('http://localhost:8000/api/v1/auth/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filename, status, target_role: targetRole || null }),
      });
    } catch (err) {
      console.error('History save error:', err);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setAtsResult(null);
    setCareerResult(null);
    setRoadmapResult(null);
    setComparisonResult(null);
    setShowLanding(false);

    try {
      // Step 1: Upload
      setLoadingStep('Uploading PDF resume to server...');
      await persistHistory(file.name, 'uploading', selectedRole || undefined);
      const uploadRes = await uploadResume(file);
      setResumeFilename(uploadRes.filename);

      // Step 2: Parse
      setLoadingStep('Extracting and parsing text contents...');
      const parsed = await parseResume(uploadRes.filename);
      setResumeText(parsed.text);

      // Step 3: Run ATS & Career recommendations in parallel
      setLoadingStep('Running ATS Analyzer and Career Recommendation Agent...');
      
      // Simple mock skills extraction matching the format of SkillExtractionResult
      // to enrich the analysis. We extract some basic categories using simple regex.
      const programming_languages: string[] = [];
      const frameworks: string[] = [];
      const databases: string[] = [];
      const tools: string[] = [];
      const cloud_platforms: string[] = [];
      const soft_skills: string[] = [];
      const certifications: string[] = [];

      const textLower = parsed.text.toLowerCase();
      
      // Simple matcher catalog matching backend capabilities
      const catalog = {
        programming_languages: ['python', 'javascript', 'typescript', 'java', 'c++', 'go', 'rust', 'sql'],
        frameworks: ['react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'fastapi', 'django', 'flask', 'spring boot', 'tensorflow', 'pytorch'],
        databases: ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch'],
        cloud_platforms: ['aws', 'azure', 'gcp'],
        tools: ['git', 'docker', 'kubernetes', 'jenkins', 'github actions', 'terraform', 'figma'],
        soft_skills: ['leadership', 'communication', 'problem solving', 'collaboration']
      };

      Object.entries(catalog).forEach(([cat, keywords]) => {
        keywords.forEach(keyword => {
          if (textLower.includes(keyword)) {
            if (cat === 'programming_languages') programming_languages.push(keyword.toUpperCase());
            if (cat === 'frameworks') frameworks.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
            if (cat === 'databases') databases.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
            if (cat === 'cloud_platforms') cloud_platforms.push(keyword.toUpperCase());
            if (cat === 'tools') tools.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
            if (cat === 'soft_skills') soft_skills.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
          }
        });
      });

      const parsedSkills = {
        programming_languages,
        frameworks,
        databases,
        cloud_platforms,
        soft_skills,
        certifications,
        tools
      };
      setExtractedSkills(parsedSkills);

      setLoadingStep('Running ATS Analyzer, Career Agent, and Learning Roadmap Agent...');
      const [atsData, careerData] = await Promise.all([
        analyzeATS(parsed.text, parsedSkills),
        getCareerRecommendations(parsed.text, parsedSkills)
      ]);

      setAtsResult(atsData);
      setCareerResult(careerData);
      await persistHistory(uploadRes.filename, 'completed', selectedRole || undefined);

      // Generate roadmap in background (non-blocking)
      generateRoadmap(parsed.text, parsedSkills);
      setActiveTab('ats');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during resume analysis.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };



  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} darkMode={darkMode} />;
  }

  if (showLanding) {
    return (
      <LandingPage
        file={file}
        onFileSelect={(selectedFile) => setFile(selectedFile)}
        onRemoveFile={() => setFile(null)}
        isLoading={isLoading}
        loadingStep={loadingStep}
        onStartAnalysis={startAnalysis}
        onEnterPlatform={() => setShowLanding(false)}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">AI</div>
          <div className="logo-text">Resume Advisor</div>
        </div>

        <ul className="nav-menu">
          <li
            className="nav-item"
            onClick={() => setShowLanding(true)}
          >
            <Laptop size={20} />
            Landing Page
          </li>
          <li
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </li>
          <li
            className={`nav-item ${activeTab === 'ats' ? 'active' : ''} ${!atsResult ? 'disabled' : ''}`}
            onClick={() => atsResult && setActiveTab('ats')}
            style={{ opacity: atsResult ? 1 : 0.4 }}
          >
            <FileText size={20} />
            ATS Analysis
          </li>
          <li
            className={`nav-item ${activeTab === 'recommendations' ? 'active' : ''} ${!careerResult ? 'disabled' : ''}`}
            onClick={() => careerResult && setActiveTab('recommendations')}
            style={{ opacity: careerResult ? 1 : 0.4 }}
          >
            <Sparkles size={20} />
            Career Advisor
          </li>
          <li
            className={`nav-item ${activeTab === 'comparison' ? 'active' : ''} ${!extractedSkills ? 'disabled' : ''}`}
            onClick={() => extractedSkills && setActiveTab('comparison')}
            style={{ opacity: extractedSkills ? 1 : 0.4 }}
          >
            <Target size={20} />
            Role Comparison
          </li>
          <li
            className={`nav-item ${activeTab === 'roadmap' ? 'active' : ''} ${!extractedSkills ? 'disabled' : ''}`}
            onClick={() => extractedSkills && setActiveTab('roadmap')}
            style={{ opacity: extractedSkills ? 1 : 0.4 }}
          >
            <MapPin size={20} />
            Learning Roadmap
          </li>
        </ul>

        <div className="sidebar-footer">
          <p>AI Career Agent v1.0</p>
          <p>Signed in securely</p>
          <button onClick={handleLogout} className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Dashboard Space */}
      <main className="main-content">
        <div className="top-bar">
          <div className="welcome-msg">
            <h1>Elevate Your Career</h1>
            <p>Upload your resume to get instant, LLM-powered job role alignment, ATS checks, and salary growth guides.</p>
          </div>
          
          {file && !isLoading && (
            <button className="btn" onClick={startAnalysis}>
              <Zap size={16} /> Re-Run Analysis
            </button>
          )}
        </div>

        {error && (
          <div className="alert-box">
            <AlertCircle size={20} />
            <div className="alert-box-content">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading && (
          <AnalysisLoader loadingStep={loadingStep} />
        )}

        {/* TAB CONTENTS */}
        {!isLoading && (
          <>
            {/* TAB: DASHBOARD */}
            <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
              {atsResult && careerResult ? (
                <AnalyticsDashboard
                  file={file}
                  atsResult={atsResult}
                  careerResult={careerResult}
                  roadmapResult={roadmapResult}
                  comparisonResult={comparisonResult}
                  extractedSkills={extractedSkills}
                  selectedRole={selectedRole}
                  availableRoles={availableRoles}
                  onRoleSelect={setSelectedRole}
                  onReRunAnalysis={startAnalysis}
                  isComparing={isComparing}
                  darkMode={darkMode}
                />
              ) : (
                <>
                  <div className="grid-2">
                    <div className="glass-card">
                      <h3 className="card-title">
                        <Upload size={20} />
                        Upload Resume PDF
                      </h3>
                      <div
                        className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={triggerUpload}
                      >
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="application/pdf" style={{ display: 'none' }} />
                        <div className="upload-icon-container"><Upload size={24} /></div>
                        <div className="upload-text">
                          <h3>Drag & Drop your resume here</h3>
                          <p>Supports only PDF files (Max 10MB)</p>
                        </div>
                      </div>
                      {file && (
                        <div className="file-info-bar" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                          <div className="file-name-meta"><FileText size={18} /><span>{file.name}</span></div>
                          <span className="file-size-badge">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      )}
                      {file && (
                        <button className="btn" style={{ width: '100%', marginTop: '1.5rem' }} onClick={startAnalysis}>
                          <Sparkles size={18} /> Generate Career Roadmap
                        </button>
                      )}
                    </div>
                    <div className="glass-card">
                      <h3 className="card-title"><LayoutDashboard size={20} /> Dashboard Overview</h3>
                      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                        <Briefcase size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p>No analysis loaded. Upload your resume to begin parsing.</p>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card">
                    <h3 className="card-title"><UserCheck size={20} /> How it Works</h3>
                    <div className="grid-3" style={{ margin: 0 }}>
                      <div>
                        <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="logo-icon" style={{ width: '22px', height: '22px', fontSize: '0.75rem' }}>1</span> Parse & Structure
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>Extract raw text from your PDF and categorize programming languages, tools, and databases.</p>
                      </div>
                      <div>
                        <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="logo-icon" style={{ width: '22px', height: '22px', fontSize: '0.75rem' }}>2</span> ATS & Career Match
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>Audit layout, experience indicators, and quantified impact. Recommend career pathways with LLM schemas.</p>
                      </div>
                      <div>
                        <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="logo-icon" style={{ width: '22px', height: '22px', fontSize: '0.75rem' }}>3</span> Personalize & Learn
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>See missing skills, learning hours, custom resources, and salary scaling strategies.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>


            {/* TAB: ATS ANALYSIS */}
            {atsResult && (
              <div className={`tab-content ${activeTab === 'ats' ? 'active' : ''}`}>
                <div className="grid-2">
                  {/* Scores breakdown */}
                  <div className="glass-card">
                    <h3 className="card-title">
                      <FileText size={20} />
                      ATS Breakdown
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <span>Resume Structure</span>
                          <span>{atsResult.resume_structure.score}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${atsResult.resume_structure.score}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <span>Keyword Presence</span>
                          <span>{atsResult.keywords.score}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${atsResult.keywords.score}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <span>Layout & Formatting</span>
                          <span>{atsResult.formatting.score}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${atsResult.formatting.score}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <span>Technical Skill Coverage</span>
                          <span>{atsResult.technical_skills.score}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${atsResult.technical_skills.score}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <span>Professional Experience Indicators</span>
                          <span>{atsResult.experience.score}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${atsResult.experience.score}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <span>Education Validation</span>
                          <span>{atsResult.education.score}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${atsResult.education.score}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="glass-card">
                    <h3 className="card-title">
                      <Sparkles size={20} />
                      ATS Observations
                    </h3>

                    <h4 style={{ fontSize: '0.95rem', color: 'var(--status-success)', marginBottom: '0.75rem' }}>Strengths</h4>
                    <div style={{ marginBottom: '1.5rem' }}>
                      {atsResult.strengths.map((str, idx) => (
                        <div key={idx} className="list-item-bulleted">
                          <CheckCircle2 size={16} />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ fontSize: '0.95rem', color: 'var(--status-danger)', marginBottom: '0.75rem' }}>Areas to Watch</h4>
                    <div>
                      {atsResult.weaknesses.length > 0 ? (
                        atsResult.weaknesses.map((weak, idx) => (
                          <div key={idx} className="list-item-bulleted negative">
                            <AlertCircle size={16} />
                            <span>{weak}</span>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No significant weaknesses detected!</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Improvements Checklist */}
                <div className="glass-card">
                  <h3 className="card-title">
                    <CheckCircle2 size={20} style={{ color: 'var(--color-secondary)' }} />
                    Improvement Suggestions Checklist
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {atsResult.improvement_suggestions.map((suggestion, idx) => (
                      <div key={idx} className="list-item-bulleted bullet">
                        <ArrowRight size={16} />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CAREER RECOMMENDATIONS */}
            {careerResult && (
              <div className={`tab-content ${activeTab === 'recommendations' ? 'active' : ''}`}>
                {/* Job Roles Grid */}
                <div className="section-header-row">
                  <div>
                    <h2>Recommended Career Trajectories</h2>
                    <p className="section-subtitle">Roles aligned with your skill vectors and experience.</p>
                  </div>
                </div>

                <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
                  {careerResult.suitable_roles.map((role, idx) => (
                    <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{role.title}</h3>
                        <span className="badge badge-info">{role.match_score}% Match</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', flexGrow: 1, marginBottom: '1.5rem' }}>
                        {role.why_suitable}
                      </p>
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', fontSize: '0.85rem' }}
                        onClick={() => {
                          setSelectedRole(role.title);
                          setActiveTab('comparison');
                        }}
                      >
                        Compare Skills
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Strengths & Improvement Areas */}
                <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
                  <div className="glass-card">
                    <h3 className="card-title">
                      <CheckCircle2 size={20} style={{ color: 'var(--status-success)' }} />
                      Core Career Strengths
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {careerResult.strengths.map((str, idx) => (
                        <div key={idx} className="list-item-bulleted">
                          <CheckCircle2 size={16} />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card">
                    <h3 className="card-title">
                      <Target size={20} style={{ color: 'var(--color-accent)' }} />
                      Areas for Skill Improvement
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {careerResult.areas_for_improvement.map((area, idx) => (
                        <div key={idx} className="list-item-bulleted bullet">
                          <ArrowRight size={16} />
                          <span>{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interview Prep & Certs */}
                <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
                  {/* Interview Preparation */}
                  <div className="glass-card">
                    <h3 className="card-title">
                      <GraduationCap size={20} />
                      Interview Preparation Guide
                    </h3>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>Technical Topics to Focus On:</h4>
                      <div className="tag-container" style={{ marginBottom: '1.25rem' }}>
                        {careerResult.interview_preparation.technical_topics.map((topic, idx) => (
                          <span key={idx} className="tag tag-highlight">{topic}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Behavioral Response Strategy:</h4>
                      {careerResult.interview_preparation.behavioral_tips.map((tip, idx) => (
                        <div key={idx} className="list-item-bulleted bullet">
                          <Check size={14} style={{ color: 'var(--color-primary)' }} />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>Sample Interview Questions:</h4>
                      {careerResult.interview_preparation.sample_questions.map((quest, idx) => (
                        <div key={idx} className="list-item-bulleted bullet">
                          <ChevronRight size={14} style={{ color: 'var(--color-accent)' }} />
                          <span>"{quest}"</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications & Salary */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <h3 className="card-title" style={{ marginBottom: '1rem' }}>
                        <Award size={20} />
                        Recommended Certifications
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {careerResult.certifications_to_pursue.map((cert, idx) => (
                          <div key={idx} style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                              <span>{cert.name}</span>
                              <span style={{ color: 'var(--color-secondary)', fontSize: '0.8rem' }}>{cert.authority}</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>{cert.why_recommend}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                      <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>
                        <TrendingUp size={20} />
                        Salary Growth Recommendations
                      </h3>
                      
                      <div className="alert-box" style={{ background: 'rgba(6, 182, 212, 0.05)', borderColor: 'rgba(6, 182, 212, 0.15)', margin: '0 0 1rem' }}>
                        <TrendingUp size={20} style={{ color: 'var(--color-secondary)' }} />
                        <div className="alert-box-content">
                          <strong>Estimated Market Range:</strong> {careerResult.salary_growth.current_market_range}
                        </div>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-bright)', marginBottom: '0.35rem' }}>Strategies to Boost Compensation:</h4>
                        {careerResult.salary_growth.growth_strategies.map((strat, idx) => (
                          <div key={idx} className="list-item-bulleted bullet">
                            <Check size={14} style={{ color: 'var(--color-secondary)' }} />
                            <span>{strat}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-bright)', marginBottom: '0.35rem' }}>High-Paying Skills to Acquire:</h4>
                        <div className="tag-container">
                          {careerResult.salary_growth.high_paying_skills.map((skill, idx) => (
                            <span key={idx} className="tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ROLE COMPARISON */}
            {extractedSkills && (
              <div className={`tab-content ${activeTab === 'comparison' ? 'active' : ''}`}>
                <div className="glass-card" style={{ marginBottom: '2rem' }}>
                  <h3 className="card-title">
                    <Target size={20} />
                    Target Role Skill Alignment
                  </h3>

                  <div className="form-group" style={{ maxWidth: '400px' }}>
                    <label className="form-label">Select Target Role</label>
                    <select
                      className="select-input"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      {availableRoles.map((role, idx) => (
                        <option key={idx} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  {isComparing && (
                    <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Clock className="loading-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
                      <p>Comparing skills profile...</p>
                    </div>
                  )}

                  {!isComparing && comparisonResult && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            <span>Role Competency Match</span>
                            <span style={{ color: 'var(--color-primary)' }}>{comparisonResult.skill_match_percentage.toFixed(1)}% Match</span>
                          </div>
                          <div className="progress-bar-container" style={{ height: '12px' }}>
                            <div className="progress-bar-fill" style={{ width: `${comparisonResult.skill_match_percentage}%` }}></div>
                          </div>
                          <div style={{ marginTop: '0.75rem' }}>
                            <span className="badge badge-info">{comparisonResult.overall_readiness}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <Clock size={16} style={{ color: 'var(--color-secondary)' }} />
                            <span>Estimated Learning Hours Required: <strong>{comparisonResult.total_learning_hours}h</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
                            <span>Skill Gaps to Bridge: <strong>{comparisonResult.missing_skills.length} skills</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="alert-box" style={{ background: 'rgba(99, 102, 241, 0.03)', borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                        <FileText size={20} />
                        <div className="alert-box-content">
                          <strong>Match Summary:</strong> {comparisonResult.summary}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!isComparing && comparisonResult && (
                  <div className="grid-2">
                    {/* Skills Gaps Timeline */}
                    <div className="glass-card">
                      <h3 className="card-title">
                        <BookOpen size={20} />
                        Priority Skill Acquisition Path
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {comparisonResult.missing_skills.map((gap, idx) => (
                          <div key={idx} style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{
                              position: 'absolute',
                              left: '-5px',
                              top: '4px',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: gap.priority_level === 'critical' ? 'var(--status-danger)' : gap.priority_level === 'high' ? 'var(--status-warning)' : 'var(--color-primary)'
                            }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <h4 style={{ fontSize: '0.95rem' }}>{gap.skill_name}</h4>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span className={`badge ${gap.priority_level === 'critical' ? 'badge-danger' : gap.priority_level === 'high' ? 'badge-warning' : 'badge-info'}`}>
                                  {gap.priority_level}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{gap.estimated_learning_hours}h</span>
                              </div>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '0.5rem' }}>{gap.why_important}</p>
                            
                            {gap.learning_resources.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {gap.learning_resources.map((res, rIdx) => (
                                  <a
                                    key={rIdx}
                                    href={`https://www.google.com/search?q=${encodeURIComponent(res)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="tag tag-highlight"
                                    style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                                  >
                                    {res}
                                    <ExternalLink size={10} />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Matched Skills */}
                    <div className="glass-card">
                      <h3 className="card-title">
                        <CheckCircle2 size={20} style={{ color: 'var(--status-success)' }} />
                        Skills You Already Have for this Role
                      </h3>

                      {Object.keys(comparisonResult.matched_skills).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {Object.entries(comparisonResult.matched_skills).map(([category, skills], idx) => (
                            <div key={idx}>
                              <h4 style={{ fontSize: '0.9rem', color: 'var(--color-secondary)', textTransform: 'capitalize', marginBottom: '0.5rem' }}>
                                {category.replace('_', ' ')}
                              </h4>
                              <div className="tag-container">
                                {skills.map((skill, sIdx) => (
                                  <span key={sIdx} className="tag tag-highlight" style={{ borderColor: 'rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.05)' }}>
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                          <p>No matching skills found yet for this target role. Check the priority learning path to start growing your skills!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: LEARNING ROADMAP */}
            {extractedSkills && (
              <div className={`tab-content ${activeTab === 'roadmap' ? 'active' : ''}`}>
                {/* Roadmap Header & Role Control */}
                <div className="glass-card" style={{ marginBottom: '2rem' }}>
                  <h3 className="card-title">
                    <MapPin size={20} />
                    Personalized 30 / 60 / 90-Day Learning Roadmap
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    A structured, phase-by-phase plan tailored to your current skills and career goals.
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                      <label className="form-label">Target Role (optional)</label>
                      <select
                        className="select-input"
                        value={roadmapTargetRole}
                        onChange={(e) => setRoadmapTargetRole(e.target.value)}
                      >
                        <option value="">Auto-detect from resume</option>
                        {availableRoles.map((role, idx) => (
                          <option key={idx} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      className="btn"
                      style={{ marginBottom: 0 }}
                      disabled={isRoadmapLoading}
                      onClick={() => {
                        const rawText = (document.querySelector('[data-resume-text]') as any)?.__resumeText || '';
                        generateRoadmap(rawText, extractedSkills);
                      }}
                    >
                      <Zap size={16} />
                      {isRoadmapLoading ? 'Generating...' : 'Re-Generate Roadmap'}
                    </button>
                  </div>

                  {roadmapResult && (
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Overall Goal</p>
                          <p style={{ fontSize: '1rem', fontWeight: 500, lineHeight: 1.4 }}>{roadmapResult.overall_goal}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '0.85rem 1.25rem' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>{roadmapResult.total_estimated_hours}h</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Hours</span>
                        </div>
                      </div>

                      {/* Phase Tabs */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                        {(['30', '60', '90'] as const).map(phase => (
                          <button
                            key={phase}
                            onClick={() => setActiveRoadmapPhase(phase)}
                            style={{
                              padding: '0.6rem 1.5rem',
                              borderRadius: '10px',
                              border: activeRoadmapPhase === phase ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                              background: activeRoadmapPhase === phase ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                              color: activeRoadmapPhase === phase ? 'var(--text-bright)' : 'var(--text-muted)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontSize: '0.9rem',
                            }}
                          >
                            {phase}-Day {phase === '30' ? 'Foundation' : phase === '60' ? 'Growth' : 'Mastery'}
                          </button>
                        ))}
                      </div>

                      {/* Active Phase Content */}
                      {(() => {
                        const phase: RoadmapPhase | null =
                          activeRoadmapPhase === '30' ? roadmapResult.phase_30
                          : activeRoadmapPhase === '60' ? roadmapResult.phase_60
                          : roadmapResult.phase_90;

                        return phase ? (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                              <div>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>{phase.phase}</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{phase.goal}</p>
                              </div>
                              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ textAlign: 'center', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '10px', padding: '0.6rem 1rem' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{phase.weekly_time_commitment_hours}h/wk</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Weekly</div>
                                </div>
                              </div>
                            </div>

                            <div className="grid-2" style={{ marginBottom: '2rem' }}>
                              {/* Skills */}
                              <div>
                                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                  <Layers size={16} /> Skills to Master
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  {phase.skills.map((skill, idx) => (
                                    <div key={idx} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{skill.skill}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 600 }}>{skill.estimated_hours}h</span>
                                      </div>
                                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{skill.topic}</p>
                                      <div className="tag-container">
                                        {skill.resources.map((res, rIdx) => (
                                          <span key={rIdx} className="tag" style={{ fontSize: '0.7rem' }}>{res}</span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Projects */}
                              <div>
                                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                  <Briefcase size={16} /> Projects to Build
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  {phase.projects.map((proj, idx) => (
                                    <div key={idx} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{proj.title}</span>
                                        <span className={`badge ${proj.difficulty === 'Beginner' ? 'badge-success' : proj.difficulty === 'Intermediate' ? 'badge-warning' : 'badge-danger'}`}>{proj.difficulty}</span>
                                      </div>
                                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>{proj.description}</p>
                                      <div className="tag-container">
                                        {proj.tech_stack.map((tech, tIdx) => (
                                          <span key={tIdx} className="tag tag-highlight" style={{ fontSize: '0.7rem' }}>{tech}</span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="grid-2" style={{ marginBottom: '2rem' }}>
                              {/* Practice Platforms */}
                              <div>
                                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                  <BookOpen size={16} /> Practice Platforms
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  {phase.practice_platforms.map((platform, idx) => (
                                    <a
                                      key={idx}
                                      href={platform.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', transition: 'border-color 0.2s' }}
                                    >
                                      <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-bright)' }}>{platform.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{platform.purpose}</div>
                                      </div>
                                      <ExternalLink size={14} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
                                    </a>
                                  ))}
                                </div>
                              </div>

                              {/* Certifications */}
                              <div>
                                <h4 style={{ fontSize: '0.95rem', color: 'var(--status-warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                  <Award size={16} /> Certifications to Pursue
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  {phase.certifications.map((cert, idx) => (
                                    <div key={idx} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cert.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--status-warning)', whiteSpace: 'nowrap', fontWeight: 600 }}>{cert.study_time_weeks}wk study</span>
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginBottom: '0.25rem' }}>{cert.authority}</div>
                                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.4 }}>{cert.why_now}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Success Metrics */}
                            {phase.success_metrics.length > 0 && (
                              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.95rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                  <CheckCircle2 size={16} /> Success Metrics — Know You've Completed This Phase
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                  {phase.success_metrics.map((metric, idx) => (
                                    <div key={idx} className="list-item-bulleted">
                                      <Check size={14} style={{ color: 'var(--status-success)' }} />
                                      <span style={{ fontSize: '0.85rem' }}>{metric}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}

                      {/* Motivational Summary */}
                      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.06))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <Sparkles size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '0.15rem' }} />
                          <div>
                            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.35rem' }}>Your Coaching Message</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{roadmapResult.motivational_summary}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isRoadmapLoading && !roadmapResult && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Sparkles size={36} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                      <p>AI is crafting your personalized 90-day learning roadmap. This may take ~30 seconds...</p>
                    </div>
                  )}

                  {!isRoadmapLoading && !roadmapResult && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <MapPin size={36} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                      <p>Your roadmap is being generated in the background. Check back in a moment, or click "Re-Generate Roadmap" above.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
