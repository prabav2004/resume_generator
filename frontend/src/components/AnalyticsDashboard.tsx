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
  Cpu,
  TrendingUp,
  Target,
  Briefcase,
  MapPin,
  Eye,
  RefreshCw,
  Sparkles,
  Clock3,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import PdfPreview from './PdfPreview';
import type {
  ATSAnalysisResult,
  CareerRecommendationResult,
  RoleComparisonResult,
  LearningRoadmapResult,
  RoadmapPhase,
} from '../services/api';

interface AnalyticsDashboardProps {
  file: File | null;
  atsResult: ATSAnalysisResult;
  careerResult: CareerRecommendationResult;
  roadmapResult: LearningRoadmapResult | null;
  comparisonResult: RoleComparisonResult | null;
  extractedSkills: any;
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -3, scale: 1.01 }}
      className={`rounded-[24px] border p-6 shadow-[0_18px_60px_rgba(15,23,42,0.2)] backdrop-blur-xl ${darkMode ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-white/90'} ${className}`}
    >
      {children}
    </motion.section>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, darkMode }: { icon: React.ElementType; title: string; subtitle: string; darkMode: boolean }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-500/10 text-indigo-600'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className={`text-sm font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{title}</h3>
        <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{subtitle}</p>
      </div>
    </div>
  );
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
  const GAUGE_COLORS = ['#6366f1', darkMode ? '#1e293b' : '#e2e8f0'];

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

  return (
    <div className="w-full space-y-6 pb-12">
      <DashboardCard darkMode={darkMode} className="overflow-hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI career intelligence
            </div>
            <div>
              <h2 className={`text-2xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {file?.name || 'resume.pdf'}
              </h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                A polished snapshot of your ATS readiness, skill profile, and next best moves.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="min-w-[220px]">
              <label className={`mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Target role</label>
              <select
                value={selectedRole}
                onChange={(event) => onRoleSelect(event.target.value)}
                className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none transition ${darkMode ? 'border-white/10 bg-slate-900/70 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role} className={darkMode ? 'bg-slate-900' : 'bg-white'}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {previewUrl && (
              <button
                onClick={() => setShowPdf((value) => !value)}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${darkMode ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                <Eye className="h-4 w-4" />
                {showPdf ? 'Hide preview' : 'Resume preview'}
              </button>
            )}

            <button
              onClick={onReRunAnalysis}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-indigo-500/30"
            >
              <RefreshCw className="h-4 w-4" />
              Re-run analysis
            </button>
          </div>
        </div>
      </DashboardCard>

      {showPdf && previewUrl && (
        <PdfPreview file={file} previewUrl={previewUrl} isOpen={showPdf} onClose={() => setShowPdf(false)} darkMode={darkMode} />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardCard darkMode={darkMode}>
              <SectionTitle icon={Award} title="ATS score" subtitle="Screener readiness" darkMode={darkMode} />
              <div className="relative mx-auto flex h-[180px] w-full items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={64}
                      outerRadius={86}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {gaugeData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={GAUGE_COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-3 flex flex-col items-center">
                  <span className={`text-4xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{score}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>ATS score</span>
                </div>
              </div>
              <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-500/10 text-emerald-700'}`}>
                <CheckCircle2 className="h-4 w-4" />
                Strong fit for your target role
              </div>
            </DashboardCard>

            <DashboardCard darkMode={darkMode}>
              <SectionTitle icon={Cpu} title="Extracted skills" subtitle="Detected expertise" darkMode={darkMode} />
              <div className="space-y-4">
                {extractedSkillGroups.length > 0 ? (
                  extractedSkillGroups.map((group) => (
                    <div key={group.key}>
                      <div className={`mb-2 text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{group.label}</div>
                      <div className="flex flex-wrap gap-2">
                        {group.values.map((skill: string) => (
                          <span key={skill} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${darkMode ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`rounded-2xl border border-dashed px-4 py-6 text-sm ${darkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    Skills will appear here as soon as your resume is processed.
                  </div>
                )}
              </div>
            </DashboardCard>
          </div>

          <DashboardCard darkMode={darkMode}>
            <SectionTitle icon={TrendingUp} title="ATS breakdown" subtitle="Category performance" darkMode={darkMode} />
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={atsBreakdownData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.45)', fontSize: 10 }} stroke="transparent" />
                  <YAxis dataKey="name" type="category" tick={{ fill: darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.65)', fontSize: 10 }} stroke="transparent" />
                  <Tooltip
                    contentStyle={{ background: darkMode ? '#0f172a' : '#ffffff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: darkMode ? '#fff' : '#0f172a', fontWeight: 600, fontSize: 11 }}
                    itemStyle={{ color: '#6366f1', fontSize: 11 }}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={13} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <DashboardCard darkMode={darkMode}>
            <SectionTitle icon={Target} title="Missing skills" subtitle="Highest-priority gaps" darkMode={darkMode} />
            {isComparing ? (
              <div className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm ${darkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                Comparing your profile with the target role…
              </div>
            ) : missingSkills.length > 0 ? (
              <div className="space-y-3">
                {missingSkills.slice(0, 4).map((skill) => (
                  <div key={skill.skill_name} className={`rounded-2xl border p-3 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{skill.skill_name}</p>
                        <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{skill.why_important}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${skill.priority_level === 'critical' ? 'bg-red-500/10 text-red-400' : skill.priority_level === 'high' ? 'bg-orange-500/10 text-orange-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                        {skill.priority_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-6 text-sm font-medium text-emerald-500`}>
                Your profile already aligns well with the target role.
              </div>
            )}
          </DashboardCard>

          <DashboardCard darkMode={darkMode}>
            <SectionTitle icon={Briefcase} title="Career suggestions" subtitle="Best-fit opportunities" darkMode={darkMode} />
            <div className="space-y-3">
              {careerResult.suitable_roles.slice(0, 3).map((role) => (
                <motion.div
                  key={role.title}
                  whileHover={{ x: 2 }}
                  className={`rounded-2xl border p-3 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{role.title}</p>
                      <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{role.why_suitable}</p>
                    </div>
                    <div className={`rounded-full px-2.5 py-1 text-sm font-semibold ${darkMode ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-500/10 text-cyan-700'}`}>
                      {role.match_score}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </DashboardCard>

          {roadmapResult && (
            <DashboardCard darkMode={darkMode}>
              <div className="mb-4 flex items-center justify-between">
                <SectionTitle icon={MapPin} title="Learning roadmap" subtitle="30/60/90 day plan" darkMode={darkMode} />
                <div className={`flex rounded-2xl border p-1 ${darkMode ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
                  {(['30', '60', '90'] as const).map((phase) => (
                    <button
                      key={phase}
                      onClick={() => setActiveRoadmapPhase(phase)}
                      className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${activeRoadmapPhase === phase ? 'bg-indigo-500 text-white' : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
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
                    <div className="space-y-4">
                      <div className={`rounded-2xl border p-3 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                        <div className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Focus</div>
                        <p className={`mt-1 text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{activePhase.goal}</p>
                      </div>

                      <div className="space-y-2">
                        {activePhase.skills.slice(0, 3).map((milestone) => (
                          <div key={milestone.skill} className={`flex items-start gap-2 rounded-2xl border p-3 ${darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
                            <div className="mt-0.5 rounded-full bg-indigo-500/10 p-1 text-indigo-400">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{milestone.skill}</p>
                              <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{milestone.topic}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${darkMode ? 'border-white/10 bg-slate-900/60 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
                        <Clock3 className="h-4 w-4 text-cyan-400" />
                        Estimated effort: {activePhase.skills.reduce((sum, item) => sum + item.estimated_hours, 0)} hrs
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </DashboardCard>
          )}
        </div>
      </div>
    </div>
  );
}
