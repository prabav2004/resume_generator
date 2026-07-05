import { motion } from 'framer-motion';
import {
  Award, Cpu, TrendingUp, Target,
  Sun, Moon, Sparkles, CheckCircle2, ChevronRight, Laptop, Upload
} from 'lucide-react';
import UploadZone from './UploadZone';

interface LandingPageProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  isLoading: boolean;
  loadingStep: string;
  onStartAnalysis: () => void;
  onEnterPlatform: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function LandingPage({
  file,
  onFileSelect,
  onRemoveFile,
  isLoading,
  loadingStep,
  onStartAnalysis,
  onEnterPlatform,
  darkMode,
  toggleDarkMode,
}: LandingPageProps) {
  const bubbles = [
    { size: 300, color: 'bg-indigo-500/10', x: '10%', y: '15%', delay: 0 },
    { size: 400, color: 'bg-purple-500/10', x: '70%', y: '10%', delay: 2 },
    { size: 250, color: 'bg-cyan-500/5', x: '40%', y: '60%', delay: 4 },
  ];

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-indigo-400" />,
      title: 'ATS Scoring Analyzer',
      desc: 'Check structure, keyword matches, formatting, and experience depth against typical industry screeners.',
    },
    {
      icon: <Target className="w-6 h-6 text-cyan-400" />,
      title: 'Precision Skill Matching',
      desc: 'Map your profile skills against target tech roles. Identify critical, high, and medium-priority gaps.',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
      title: 'AI Career Guidance',
      desc: 'Generate tailored recommendations for alternative suitable roles, salary growth strategies, and certificates.',
    },
    {
      icon: <Award className="w-6 h-6 text-emerald-400" />,
      title: '30-60-90 Day Roadmaps',
      desc: 'Construct a detailed day-by-day roadmap filled with milestone topics, practice resources, and project ideas.',
    },
  ];

  const stats = [
    { value: '15k+', label: 'Resumes Optimized' },
    { value: '4.8x', label: 'Higher Response Rate' },
    { value: '98.5%', label: 'AI Accuracy Match' },
  ];

  const containerClass = 'w-full max-w-[1280px] mx-auto px-4 sm:px-6 min-w-0';

  return (
    <div className={`relative min-h-screen overflow-x-hidden font-sans transition-colors duration-500 ${darkMode ? 'bg-[#070a13] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {bubbles.map((bub, idx) => (
          <motion.div
            key={idx}
            className={`absolute rounded-full blur-3xl ${bub.color}`}
            style={{ width: bub.size, height: bub.size, left: bub.x, top: bub.y }}
            animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
            transition={{ duration: 10 + idx * 3, repeat: Infinity, delay: bub.delay, ease: 'easeInOut' }}
          />
        ))}
        <div className={`absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]`} />
      </div>

      <header className={`sticky top-0 z-20 border-b backdrop-blur-xl ${darkMode ? 'border-white/5 bg-[#070a13]/90' : 'border-slate-200 bg-white/90'}`}>
        <div className={`${containerClass} flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]`}>
          <button
            type="button"
            className="flex min-w-0 items-center gap-3"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-lg font-extrabold text-white shadow-lg shadow-indigo-500/20">
              R
            </div>
            <span className={`truncate text-base font-bold tracking-tight sm:text-lg bg-gradient-to-r ${darkMode ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'} bg-clip-text text-transparent`}>
              ResumeAgent
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-8 shrink-0">
            <a href="#features" className={`text-sm font-medium transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'}`}>Features</a>
            <a href="#stats" className={`text-sm font-medium transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'}`}>Statistics</a>
            <a href="#platform" className={`text-sm font-medium transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'}`}>Platform</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              onClick={toggleDarkMode}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all sm:h-11 sm:w-11 sm:rounded-2xl ${darkMode ? 'border-white/15 bg-white/10 text-yellow-300 hover:bg-white/15' : 'border-slate-300 bg-slate-200/70 text-indigo-600 hover:bg-slate-200'}`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={onEnterPlatform}
              className={`hidden sm:inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all ${darkMode ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100'}`}
            >
              <Laptop className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <main id="platform" className={`relative z-10 ${containerClass} py-10 sm:py-14 lg:py-16`}>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="lg:col-span-7 flex flex-col justify-center min-w-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 text-xs font-semibold text-indigo-400 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Next-Gen AI Resume Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.05]"
            >
              Supercharge your resume with{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                AI-driven
              </span>{' '}
              insights
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`mb-8 max-w-xl text-base leading-relaxed sm:text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
            >
              Optimize your ATS score, map structural gaps, obtain tailored job role paths, and generate a customized 30/60/90-day learning roadmap within minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3"
            >
              {[
                'Instant ATS scoring screener',
                'Target role skill-gap maps',
                'Structured learning milestones',
                'Personalized project blueprints',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center gap-3"
            >
              <a
                href="#features"
                className={`inline-flex h-11 items-center gap-1.5 rounded-xl border px-5 text-sm font-semibold transition-all ${darkMode ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10' : 'border-slate-300 bg-slate-100 hover:bg-slate-200'}`}
              >
                <span>Learn Features</span>
                <ChevronRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={onEnterPlatform}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-indigo-500/30 sm:hidden"
              >
                <Laptop className="h-4 w-4" />
                Dashboard
              </button>
            </motion.div>
          </div>

          <div className="lg:col-span-5 w-full min-w-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
              className={`overflow-hidden rounded-3xl border shadow-2xl ${darkMode ? 'border-white/10 bg-[#081119]/70 shadow-indigo-500/10' : 'border-slate-200 bg-white shadow-slate-300/20'}`}
            >
              <div className={`flex items-center gap-3 border-b px-5 py-4 sm:px-6 ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${darkMode ? 'border-white/10 bg-slate-950/80 text-cyan-300' : 'border-slate-200 bg-white text-indigo-600'}`}>
                  <Upload className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Upload your resume</p>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>PDF only · Max 10MB</p>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <UploadZone
                  file={file}
                  onFileSelect={onFileSelect}
                  onRemoveFile={onRemoveFile}
                  isLoading={isLoading}
                  loadingStep={loadingStep}
                  onStartAnalysis={onStartAnalysis}
                  darkMode={darkMode}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <section id="features" className={`relative z-10 border-t py-16 sm:py-20 lg:py-24 ${darkMode ? 'border-white/5 bg-[#0a0d17]/50' : 'border-slate-200 bg-slate-100/50'}`}>
        <div className={containerClass}>
          <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">Everything you need to succeed</h2>
            <p className={`text-base ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Four autonomous agents working together to transform your credentials into a personalized career accelerator.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`flex h-full flex-col rounded-3xl border p-5 backdrop-blur-xl transition-all duration-300 sm:p-6 ${darkMode ? 'border-white/10 bg-white/5 hover:border-indigo-500/20 hover:bg-white/10' : 'border-slate-200 bg-white hover:border-indigo-500/20 hover:shadow-xl'}`}
              >
                <div className={`mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:mb-5 sm:h-14 sm:w-14 sm:rounded-3xl ${darkMode ? 'border border-white/10 bg-slate-950/70 text-indigo-300' : 'border border-slate-200 bg-slate-100 text-indigo-600'}`}>
                  {feat.icon}
                </div>
                <h3 className={`mb-2 text-base font-semibold sm:mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{feat.title}</h3>
                <p className={`text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="stats" className={`relative z-10 py-14 sm:py-16 lg:py-20 ${containerClass}`}>
        <div className={`rounded-3xl border p-8 text-center backdrop-blur-md shadow-xl sm:p-10 md:p-14 ${darkMode ? 'border-white/10 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5' : 'border-slate-200 bg-white'}`}>
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3 md:gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center">
                <span className="mb-2 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent sm:text-5xl md:text-6xl">
                  {stat.value}
                </span>
                <span className={`text-xs font-semibold uppercase tracking-wider sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className={`relative z-10 border-t py-10 sm:py-12 ${darkMode ? 'border-white/5' : 'border-slate-200'}`}>
        <div className={`${containerClass} flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6`}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              R
            </div>
            <span className="text-sm font-bold tracking-tight">ResumeAgent</span>
          </div>
          <p className={`text-center text-xs sm:text-left ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            © {new Date().getFullYear()} ResumeAgent. Built with React, Tailwind CSS v4.0, and Framer Motion.
          </p>
        </div>
      </footer>
    </div>
  );
}
