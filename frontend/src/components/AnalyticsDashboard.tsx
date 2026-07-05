import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Award,
  Briefcase,
  CheckCircle2,
  Clock3,
  Cpu,
  Eye,
  MapPin,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import PdfPreview from './PdfPreview';
import type {
  ATSAnalysisResult,
  CareerRecommendationResult,
  LearningRoadmapResult,
  RoadmapPhase,
  RoleComparisonResult,
  SkillExtractionResult,
} from '../services/api';

interface AnalyticsDashboardProps {
  file: File | null;
  atsResult: ATSAnalysisResult;
  careerResult: CareerRecommendationResult;
  roadmapResult: LearningRoadmapResult | null;
  comparisonResult: RoleComparisonResult | null;
  extractedSkills: SkillExtractionResult | null;
  selectedRole: string;
  availableRoles: string[];
  onRoleSelect: (role: string) => void;
  onReRunAnalysis: () => void;
  isComparing: boolean;
  darkMode: boolean;
}

function DashboardCard({ children, className = '', darkMode }: { children: React.ReactNode; className?: string; darkMode: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className={`min-w-0 self-start rounded-2xl border p-5 shadow-[0_14px_40px_rgba(2,6,23,0.24)] backdrop-blur-xl sm:p-6 ${
        darkMode ? 'border-white/10 bg-slate-950/72' : 'border-slate-200 bg-white/95'
      } ${className}`}
    >
      {children}
    </motion.section>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, darkMode }: { icon: React.ElementType; title: string; subtitle: string; darkMode: boolean }) {
  return (
    <div className="mb-5 flex min-w-0 items-start gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-500/10 text-indigo-600'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className={`text-sm font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        <p className={`mt-0.5 text-sm leading-5 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{subtitle}</p>
      </div>
    </div>
  );
}

function skillTone(priority: string) {
  if (priority === 'critical') return 'bg-red-500/10 text-red-300 border-red-500/20';
  if (priority === 'high') return 'bg-orange-500/10 text-orange-300 border-orange-500/20';
  if (priority === 'medium') return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
  return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
}

export default function AnalyticsDashboard({
  file,
  atsResult,
  careerResult,
  roadmapResult,
  comparisonResult,
  extractedSkills,
  selectedRole,
  availableRoles,
  onRoleSelect,
  onReRunAnalysis,
  isComparing,
  darkMode,
}: AnalyticsDashboardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [activeRoadmapPhase, setActiveRoadmapPhase] = useState<'30' | '60' | '90'>('30');

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const score = atsResult.ats_score;
  const gaugeData = [
    { name: 'ATS Score', value: score },
    { name: 'Remaining', value: Math.max(100 - score, 0) },
  ];
  const gaugeColors = ['#6366f1', darkMode ? '#1e293b' : '#e2e8f0'];

  const atsBreakdownData = [
    { name: 'Structure', score: atsResult.resume_structure.score },
    { name: 'Keywords', score: atsResult.keywords.score },
    { name: 'Formatting', score: atsResult.formatting.score },
    { name: 'Tech Skills', score: atsResult.technical_skills.score },
    { name: 'Experience', score: atsResult.experience.score },
    { name: 'Education', score: atsResult.education.score },
  ];

  const extractedSkillGroups = useMemo(() => {
    const groups = [
      { key: 'programming_languages', label: 'Languages', values: extractedSkills?.programming_languages || [] },
      { key: 'frameworks', label: 'Frameworks', values: extractedSkills?.frameworks || [] },
      { key: 'databases', label: 'Databases', values: extractedSkills?.databases || [] },
      { key: 'cloud_platforms', label: 'Cloud', values: extractedSkills?.cloud_platforms || [] },
      { key: 'tools', label: 'Tools', values: extractedSkills?.tools || [] },
      { key: 'soft_skills', label: 'Soft Skills', values: extractedSkills?.soft_skills || [] },
    ];

    return groups.filter((group) => group.values.length > 0);
  }, [extractedSkills]);

  const missingSkills = comparisonResult?.missing_skills ?? [];
  const activePhaseKey = `phase_${activeRoadmapPhase}` as const;
  const activePhase = roadmapResult ? roadmapResult[activePhaseKey as keyof LearningRoadmapResult] as RoadmapPhase : null;

  const controlBtnClass = darkMode
    ? 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10'
    : 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100';

  const skillBadgeClass = darkMode
    ? 'rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200'
    : 'rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700';

  return (
    <div className="w-full min-w-0 space-y-6 pb-10">
      <section className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              AI career intelligence
            </div>
            <h2 className="truncate text-lg font-semibold text-white sm:text-xl">{file?.name || 'resume.pdf'}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-400">ATS readiness, skills, role fit, and next actions from the latest analysis.</p>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:justify-end">
            <div className="min-w-0 sm:w-[240px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Target role</label>
              <select
                value={selectedRole}
                onChange={(event) => onRoleSelect(event.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role} className="bg-slate-900">
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {previewUrl && (
              <button type="button" onClick={() => setShowPdf((value) => !value)} className={controlBtnClass}>
                <Eye className="h-4 w-4" />
                {showPdf ? 'Hide preview' : 'Resume preview'}
              </button>
            )}

            <button
              type="button"
              onClick={onReRunAnalysis}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-indigo-500/30"
            >
              <RefreshCw className="h-4 w-4" />
              Re-run analysis
            </button>
          </div>
        </div>
      </section>

      {showPdf && previewUrl && (
        <PdfPreview file={file} previewUrl={previewUrl} isOpen={showPdf} onClose={() => setShowPdf(false)} darkMode={darkMode} />
      )}

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-white">Overview</h2>
        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          <DashboardCard darkMode={darkMode}>
            <SectionTitle icon={Award} title="ATS Score" subtitle="Screener readiness" darkMode={darkMode} />
            <div className="relative mx-auto flex h-[170px] w-full max-w-[300px] items-end justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius="62%"
                    outerRadius="86%"
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={gaugeColors[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-1 flex flex-col items-center">
                <span className="text-4xl font-semibold tracking-tight text-white">{score}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">ATS score</span>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium leading-5 text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{score >= 80 ? 'Strong screening readiness.' : score >= 60 ? 'Good base with clear room to improve.' : 'Needs targeted improvements before applying.'}</span>
            </div>
          </DashboardCard>

          <DashboardCard darkMode={darkMode}>
            <SectionTitle icon={Cpu} title="Extracted Skills" subtitle="Detected expertise" darkMode={darkMode} />
            <div className="space-y-4">
              {extractedSkillGroups.length > 0 ? (
                extractedSkillGroups.map((group) => (
                  <div key={group.key} className="min-w-0">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{group.label}</div>
                    <div className="flex flex-wrap gap-2">
                      {group.values.map((skill: string) => (
                        <span key={`${group.key}-${skill}`} className={skillBadgeClass}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
                  Skills will appear here as soon as your resume is processed.
                </div>
              )}
            </div>
          </DashboardCard>

          <DashboardCard darkMode={darkMode}>
            <SectionTitle icon={Target} title="Missing Skills" subtitle="Highest-priority gaps" darkMode={darkMode} />
            {isComparing ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
                Comparing your profile with the target role...
              </div>
            ) : missingSkills.length > 0 ? (
              <div className="space-y-3">
                {missingSkills.slice(0, 4).map((skill) => (
                  <div key={skill.skill_name} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="min-w-0 text-sm font-semibold leading-5 text-white">{skill.skill_name}</h4>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${skillTone(skill.priority_level)}`}>
                        {skill.priority_level}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-400">{skill.why_important}</p>
                  </div>
                ))}
                {missingSkills.length > 4 && (
                  <button type="button" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
                    View all missing skills
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-5 text-sm font-medium text-emerald-300">
                Your profile already aligns well with the target role.
              </div>
            )}
          </DashboardCard>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-white">Detailed Analysis</h2>
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <DashboardCard darkMode={darkMode}>
            <SectionTitle icon={TrendingUp} title="ATS Breakdown" subtitle="Category performance" darkMode={darkMode} />
            <div className="h-[320px] w-full min-w-0 sm:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={atsBreakdownData} layout="vertical" margin={{ left: 8, right: 18, top: 8, bottom: 8 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(148,163,184,0.8)', fontSize: 11 }} stroke="rgba(148,163,184,0.16)" />
                  <YAxis dataKey="name" type="category" width={92} tick={{ fill: 'rgba(203,213,225,0.8)', fontSize: 11 }} stroke="transparent" />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 600, fontSize: 12 }}
                    itemStyle={{ color: '#67e8f9', fontSize: 12 }}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DashboardCard darkMode={darkMode}>
            <SectionTitle icon={Briefcase} title="Career Suggestions" subtitle="Best-fit opportunities" darkMode={darkMode} />
            <div className="space-y-3">
              {careerResult.suitable_roles.slice(0, 3).map((role) => (
                <div key={role.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="min-w-0 text-sm font-semibold leading-5 text-white">{role.title}</h4>
                    <span className="shrink-0 rounded-full bg-cyan-500/10 px-2.5 py-1 text-sm font-semibold text-cyan-300">{role.match_score}%</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-400">{role.why_suitable}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </section>

      {comparisonResult && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-white">Role Analysis</h2>
          <DashboardCard darkMode={darkMode}>
            <SectionTitle icon={Target} title={`${comparisonResult.target_role} Match`} subtitle="Readiness and learning priorities" darkMode={darkMode} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-4xl font-semibold text-white">{Math.round(comparisonResult.skill_match_percentage)}%</div>
                <p className="mt-1 text-sm text-slate-400">{comparisonResult.overall_readiness}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm leading-6 text-slate-300">{comparisonResult.summary}</p>
                {comparisonResult.recommended_learning_path.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {comparisonResult.recommended_learning_path.slice(0, 6).map((item) => (
                      <span key={item} className={skillBadgeClass}>{item}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DashboardCard>
        </section>
      )}

      {roadmapResult && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-white">Learning Roadmap</h2>
          <DashboardCard darkMode={darkMode}>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionTitle icon={MapPin} title="30 / 60 / 90 Day Plan" subtitle={roadmapResult.overall_goal} darkMode={darkMode} />
              <div className="flex w-fit shrink-0 rounded-xl border border-white/10 bg-slate-900/70 p-1">
                {(['30', '60', '90'] as const).map((phase) => (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => setActiveRoadmapPhase(phase)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeRoadmapPhase === phase ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {phase}d
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activePhaseKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activePhase && (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 lg:col-span-1">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">{activePhase.phase}</div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{activePhase.goal}</p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                        <Clock3 className="h-4 w-4 text-cyan-300" />
                        {activePhase.weekly_time_commitment_hours}h/week
                      </div>
                    </div>
                    <div className="space-y-3 lg:col-span-2">
                      {activePhase.skills.slice(0, 4).map((milestone) => (
                        <div key={milestone.skill} className="flex min-w-0 items-start gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4">
                          <div className="mt-0.5 shrink-0 rounded-full bg-indigo-500/10 p-1 text-indigo-300">
                            <ArrowUpRight className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{milestone.skill}</p>
                            <p className="mt-1 text-sm leading-5 text-slate-400">{milestone.topic}</p>
                          </div>
                          <span className="ml-auto shrink-0 text-sm font-semibold text-cyan-300">{milestone.estimated_hours}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </DashboardCard>
        </section>
      )}
    </div>
  );
}
