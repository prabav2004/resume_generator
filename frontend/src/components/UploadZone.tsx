import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Eye, AlertCircle } from 'lucide-react';

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

  // Generate local URL for preview
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setErrorMsg(null);
      
      // Simulate progressive upload animation when file is dropped
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
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
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
              className={`relative rounded-3xl border-2 border-dashed p-6 text-center transition-all duration-300 group sm:p-10
                ${isDragActive 
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5' 
                  : darkMode
                    ? 'border-white/10 bg-white/2 hover:border-indigo-500/50 hover:bg-white/4 hover:shadow-xl hover:shadow-indigo-500/2'
                    : 'border-slate-300 bg-white/80 hover:border-indigo-500/50 hover:bg-slate-50 hover:shadow-xl hover:shadow-indigo-500/10'
                }`}
            >
              <input {...getInputProps()} />
              
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10">
                <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 sm:h-16 sm:w-16 ${darkMode ? 'border-white/5 bg-white/3 text-slate-400 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/10 group-hover:text-indigo-400' : 'border-slate-200 bg-slate-100 text-slate-600 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/10 group-hover:text-indigo-500'}`}>
                  <Upload className="w-8 h-8" />
                </div>
                
                <h3 className={`mb-2 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Drag & drop your resume</h3>
                <p className={`mb-6 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Only PDF formats are supported. Max size 10MB.</p>
                
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:shadow-indigo-500/30 hover:scale-102 hover:brightness-110 active:scale-98"
                >
                  Browse Files
                </button>
              </div>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="file-info"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`rounded-3xl border p-4 backdrop-blur-md sm:p-6 ${darkMode ? 'border-white/10 bg-white/2' : 'border-slate-200 bg-white/90'}`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className={`max-w-[12rem] truncate font-semibold sm:max-w-md ${darkMode ? 'text-white' : 'text-slate-900'}`}>{file.name}</h4>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatSize(file.size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                {previewUrl && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${darkMode ? 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                    title="Toggle PDF Preview"
                  >
                    <Eye className="w-4.5 h-4.5" />
                    <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                  </button>
                )}
                
                <button
                  onClick={onRemoveFile}
                  disabled={isLoading}
                  className={`rounded-xl border p-2.5 transition-all disabled:opacity-50 ${darkMode ? 'border-white/10 bg-white/5 text-slate-400 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400'}`}
                  title="Remove file"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Simulated/Real Progress Bar */}
            <div className="mb-6">
                <div className={`mb-2 flex items-center justify-between text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>{isLoading ? loadingStep : 'File uploaded successfully'}</span>
                  <span>{isLoading ? 'Processing...' : `${progress}%`}</span>
                </div>

                <div className={`h-2.5 w-full overflow-hidden rounded-full ${darkMode ? 'bg-white/5' : 'bg-slate-200'}`}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: isLoading ? '95%' : `${progress}%` }}
                    transition={{ duration: isLoading ? 15 : 0.4 }}
                  />
                </div>
              </div>
            {/* Embedded Native PDF Preview Panel */}
            <AnimatePresence>
              {showPreview && previewUrl && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 420, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`mb-6 overflow-hidden rounded-2xl border ${darkMode ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}
                >
                  <iframe
                    src={`${previewUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-none rounded-2xl"
                    title="Resume Preview"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {!isLoading && (
              <button
                onClick={onStartAnalysis}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:brightness-110 active:scale-99 transition-all text-center flex items-center justify-center gap-2 group"
              >
                <span>Analyze Resume Now</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
