import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Eye, AlertCircle, Sparkles } from 'lucide-react';

interface UploadZoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  isLoading: boolean;
  loadingStep: string;
  onStartAnalysis: () => void;
  darkMode?: boolean;
}

export default function UploadZone({
  file,
  onFileSelect,
  onRemoveFile,
  isLoading,
  loadingStep,
  onStartAnalysis,
  darkMode = true,
}: UploadZoneProps) {
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setErrorMsg(null);

      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 50);
      return () => {
        clearInterval(interval);
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
      setProgress(0);
      setShowPreview(false);
    }
  }, [file]);

  const onDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      const rej = rejectedFiles[0];
      if (rej.errors[0]?.code === 'file-too-large') {
        setErrorMsg('File is too large. Max size is 10MB.');
      } else if (rej.errors[0]?.code === 'file-invalid-type') {
        setErrorMsg('Only PDF documents are accepted.');
      } else {
        setErrorMsg(rej.errors[0]?.message || 'Invalid file.');
      }
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: isLoading,
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full min-w-0">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div
              {...getRootProps()}
              className={`group relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 sm:p-10
                ${isDragActive
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
                  : darkMode
                    ? 'border-white/10 bg-white/[0.02] hover:border-indigo-500/40 hover:bg-white/[0.04]'
                    : 'border-slate-300 bg-slate-50 hover:border-indigo-500/40 hover:bg-white'
                }`}
            >
              <input {...getInputProps()} />

              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10 flex flex-col items-center">
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 sm:h-16 sm:w-16 ${darkMode ? 'border-white/10 bg-white/[0.03] text-slate-400 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/10 group-hover:text-indigo-400' : 'border-slate-200 bg-white text-slate-600 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/10 group-hover:text-indigo-500'}`}>
                  <Upload className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>

                <h3 className={`mb-2 text-lg font-semibold sm:text-xl ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Drag & drop your resume
                </h3>
                <p className={`mb-6 max-w-xs text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Only PDF formats are supported. Max size 10MB.
                </p>

                <span className="inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 text-sm font-medium text-white shadow-lg shadow-indigo-500/20">
                  Browse Files
                </span>
              </div>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="min-w-0 break-words">{errorMsg}</span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="file-info"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className={`rounded-2xl border p-4 sm:p-5 ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 sm:h-12 sm:w-12">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`truncate font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{file.name}</h4>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatSize(file.size)}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-all sm:flex-none sm:px-4 ${darkMode ? 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    >
                      <Eye className="h-4 w-4 shrink-0" />
                      <span className="truncate">{showPreview ? 'Hide Preview' : 'Preview'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onRemoveFile}
                    disabled={isLoading}
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all disabled:opacity-50 ${darkMode ? 'border-white/10 bg-white/5 text-slate-400 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400' : 'border-slate-200 bg-white text-slate-600 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400'}`}
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className={`mb-2 flex items-center justify-between gap-3 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="min-w-0 truncate">{isLoading ? loadingStep : 'Ready for analysis'}</span>
                <span className="shrink-0">{isLoading ? 'Processing…' : `${progress}%`}</span>
              </div>
              <div className={`h-2.5 w-full overflow-hidden rounded-full ${darkMode ? 'bg-white/5' : 'bg-slate-200'}`}>
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"
                  initial={{ width: '0%' }}
                  animate={{ width: isLoading ? '95%' : `${progress}%` }}
                  transition={{ duration: isLoading ? 15 : 0.4 }}
                />
              </div>
            </div>

            <AnimatePresence>
              {showPreview && previewUrl && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`overflow-hidden rounded-2xl border ${darkMode ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-slate-100'}`}>
                    <iframe
                      src={`${previewUrl}#toolbar=0&navpanes=0`}
                      className="h-[min(420px,50vh)] w-full border-none sm:h-[min(480px,55vh)]"
                      title="Resume Preview"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isLoading && (
              <button
                type="button"
                onClick={onStartAnalysis}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-indigo-500/40 hover:brightness-105 active:scale-[0.99] sm:h-[3rem] sm:text-base"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>Analyze Resume Now</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
