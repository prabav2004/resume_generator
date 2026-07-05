import { useMemo } from 'react';
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
  const nodes: NodeState[] = useMemo(
    () => [
      { id: 0, label: 'Uploading', icon: FileText, description: 'Sending the PDF to the parser' },
      { id: 1, label: 'Extracting text', icon: Cpu, description: 'Reading resume content from the file' },
      { id: 2, label: 'ATS analysis', icon: Award, description: 'Scoring keywords, structure, and formatting' },
      { id: 3, label: 'Role comparison', icon: Target, description: 'Matching skills against the selected role' },
      { id: 4, label: 'Career matching', icon: Briefcase, description: 'Finding suitable career paths' },
      { id: 5, label: 'Roadmap', icon: MapPin, description: 'Building 30/60/90 day growth steps' },
    ],
    []
  );

  const status = (loadingStep || '').toLowerCase();
  const activeIndex = status.includes('upload')
    ? 0
    : status.includes('extract')
      ? 1
      : status.includes('ats') || status.includes('career') || status.includes('analysis')
        ? 2
        : status.includes('compar')
          ? 3
          : status.includes('roadmap')
            ? 5
            : 0;
  const activeNode = nodes[activeIndex];
  const currentStatus = loadingStep || activeNode?.description || 'Preparing your tailored analysis...';

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col items-center px-0 py-6 sm:py-10">
      <div className="mb-8 w-full text-center sm:mb-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'linear' }}
          className="mb-4 inline-flex items-center justify-center rounded-full border border-indigo-500/25 bg-indigo-500/10 p-3 text-indigo-400"
        >
          <Sparkles className="h-7 w-7 sm:h-8 sm:w-8" />
        </motion.div>
        <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
          Analyzing your resume profile
        </h2>
        <p className="mx-auto max-w-2xl px-2 text-sm leading-6 text-slate-400 sm:text-base">
          {currentStatus}
        </p>
      </div>

      <div className="mb-8 w-full rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.45)] backdrop-blur-2xl sm:p-8">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Current operation</div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-indigo-400" />
            <span className="min-w-0 text-sm font-semibold text-white">{currentStatus}</span>
          </div>
        </div>
      </div>

      <div className="relative mb-8 w-full min-w-0">
        <div className="mb-4 flex items-center gap-3 text-sm text-slate-400">
          <Workflow className="h-4 w-4 shrink-0 text-indigo-400" />
          <span>LangGraph workflow in motion</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {nodes.map((node, index) => {
            const Icon = node.icon;
            const isCompleted = index < activeIndex;
            const isActive = index === activeIndex;

            return (
              <div
                key={node.id}
                className="relative flex min-w-0 flex-col items-center rounded-2xl border border-white/10 bg-slate-950/40 p-3 shadow-inner shadow-black/20 sm:p-4"
              >
                <div className="relative mb-3">
                  {isActive && (
                    <motion.div
                      className="absolute -inset-2 rounded-full bg-indigo-500/20 blur-sm"
                      animate={{ scale: [1, 1.12, 1], opacity: [0.48, 0.82, 0.48] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    />
                  )}

                  <div
                    className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-500 sm:h-12 sm:w-12 ${
                      isCompleted
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : isActive
                          ? 'scale-105 border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/20'
                          : 'border-white/10 bg-white/[0.03] text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                </div>

                <span className={`mb-1 w-full truncate px-1 text-center text-xs font-semibold tracking-tight sm:text-sm ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                  {node.label}
                </span>
                <span className="hidden w-full px-1 text-center text-[10px] font-medium leading-4 text-slate-500 sm:block sm:text-[11px] sm:leading-5">
                  {node.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur-xl sm:p-6">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">AI insight draft</div>
              <div className="text-xs text-slate-500">Generating ATS score and role-fit insights</div>
            </div>
          </div>

          <div className="relative mt-6 space-y-3">
            <div className="h-3 w-full rounded-full bg-white/[0.08]" />
            <div className="h-3 w-5/6 rounded-full bg-white/[0.08]" />
            <div className="h-3 w-2/3 rounded-full bg-white/[0.08]" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Execution trace</div>
              <div className="text-xs text-slate-500">Node activity and model calls</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2.5">
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-indigo-400" />
              <span className="min-w-0 text-sm leading-5 text-slate-300">Calling language model for matching insights</span>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2.5">
              <motion.span
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              />
              <span className="min-w-0 text-sm leading-5 text-slate-300">Aggregating ATS checks and growth recommendations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
