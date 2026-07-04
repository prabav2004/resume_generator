import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Cpu,
  Award,
  Target,
  Briefcase,
  MapPin,
  Check,
  Loader2,
  Sparkles,
  Hourglass,
  Bot,
  Workflow,
  BrainCircuit,
  type LucideIcon,
} from 'lucide-react';

interface AnalysisLoaderProps {
  loadingStep?: string;
}

interface NodeState {
  id: number;
  label: string;
  icon: LucideIcon;
  description: string;
}

export default function AnalysisLoader({ loadingStep }: AnalysisLoaderProps) {
  const [progress, setProgress] = useState(6);
  const [timeLeft, setTimeLeft] = useState(24);

  const nodes: NodeState[] = useMemo(
    () => [
      { id: 0, label: 'PDF Parsing', icon: FileText, description: 'Extracting clean text structure' },
      { id: 1, label: 'Skill Extraction', icon: Cpu, description: 'Classifying hard and soft skills' },
      { id: 2, label: 'ATS Analysis', icon: Award, description: 'Scoring keywords and formatting' },
      { id: 3, label: 'Role Comparison', icon: Target, description: 'Matching critical gaps against target roles' },
      { id: 4, label: 'Career Matching', icon: Briefcase, description: 'Aligning opportunities with your profile' },
      { id: 5, label: 'Roadmap Blueprint', icon: MapPin, description: 'Preparing 30/60/90 day growth steps' },
    ],
    []
  );

  useEffect(() => {
    const progressInterval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return 96;
        return prev + Math.random() * 4 + 1.2;
      });
    }, 420);

    const timerInterval = window.setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 1 : prev - 1));
    }, 1000);

    return () => {
      window.clearInterval(progressInterval);
      window.clearInterval(timerInterval);
    };
  }, []);

  const progressPercent = Math.round(progress);
  const activeIndex = progressPercent < 15 ? 0 : progressPercent < 35 ? 1 : progressPercent < 55 ? 2 : progressPercent < 75 ? 3 : progressPercent < 90 ? 4 : 5;
  const activeNode = nodes[activeIndex];
  const currentStatus = loadingStep || activeNode?.description || 'Preparing your tailored analysis...';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      <div className="w-full text-center mb-8 sm:mb-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'linear' }}
          className="inline-flex items-center justify-center p-3 rounded-full bg-indigo-500/10 border border-indigo-500/25 mb-4 text-indigo-400"
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">Analyzing your resume profile</h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-6">
          {currentStatus}
        </p>
      </div>

      <div className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-slate-950/60 backdrop-blur-2xl shadow-[0_20px_80px_rgba(15,23,42,0.45)] p-6 sm:p-8 mb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:w-2/3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 mb-2">
              <span>Overall analysis progress</span>
              <span className="text-indigo-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-white/8 h-2.5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 px-4 py-3 rounded-2xl min-w-[170px]">
            <Hourglass className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Estimated remaining</div>
              <div className="text-sm font-semibold text-white tracking-tight">{timeLeft}s</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mb-8 relative">
        <div className="mb-4 flex items-center gap-3 text-sm text-slate-400">
          <Workflow className="w-4 h-4 text-indigo-400" />
          <span>LangGraph workflow in motion</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 md:gap-3 relative z-10">
          {nodes.map((node, index) => {
            const Icon = node.icon;
            const isCompleted = index < activeIndex;
            const isActive = index === activeIndex;

            return (
              <div key={node.id} className="relative flex flex-col items-center rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner shadow-black/20">
                <div className="relative mb-3">
                  {isActive && (
                    <motion.div
                      className="absolute -inset-2.5 rounded-full bg-indigo-500/20 blur-sm"
                      animate={{ scale: [1, 1.14, 1], opacity: [0.48, 0.82, 0.48] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    />
                  )}

                  <div
                    className={`w-13 h-13 rounded-full flex items-center justify-center border transition-all duration-500 ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : isActive
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/20 scale-105'
                          : 'bg-white/[0.03] border-white/10 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                </div>

                <span className={`text-sm font-semibold tracking-tight text-center mb-1 ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                  {node.label}
                </span>
                <span className="text-[11px] text-slate-500 font-medium text-center leading-5 hidden sm:block">
                  {node.description}
                </span>

                {index < nodes.length - 1 && (
                  <div className="hidden xl:block absolute top-6 left-[calc(50%+1.85rem)] right-[calc(-50%+1.85rem)] h-[1px] bg-white/10 overflow-hidden">
                    {isCompleted && (
                      <motion.div
                        initial={{ left: '-100%' }}
                        animate={{ left: '100%' }}
                        transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                        className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">AI insight draft</div>
              <div className="text-xs text-slate-500">Generating ATS score and role-fit insights</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-3 w-full rounded-full bg-white/[0.08]" />
            <div className="h-3 w-5/6 rounded-full bg-white/[0.08]" />
            <div className="h-3 w-4/6 rounded-full bg-white/[0.08]" />
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Execution trace</div>
              <div className="text-xs text-slate-500">Node activity and model calls</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="text-sm text-slate-300">Calling language model for matching insights</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2">
              <motion.span
                className="h-2.5 w-2.5 rounded-full bg-cyan-400"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              />
              <span className="text-sm text-slate-300">Aggregating ATS checks and growth recommendations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
