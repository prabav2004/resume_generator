import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';

interface PdfPreviewProps {
  file: File | null;
  previewUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

const zoomLevels = [0.75, 0.9, 1, 1.15, 1.3, 1.5];

export default function PdfPreview({ file, previewUrl, isOpen, onClose, darkMode }: PdfPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setZoom(1);
  }, [previewUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen || !previewUrl) {
    return null;
  }

  const handleDownload = () => {
    if (!previewUrl || !file) return;

    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = file.name || 'resume.pdf';
    link.click();
  };

  const toggleFullscreen = async () => {
    if (!viewerRef.current) return;

    if (!document.fullscreenElement) {
      await viewerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const changeZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'reset') {
      setZoom(1);
      return;
    }

    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex === -1) {
      setZoom(direction === 'in' ? 1.15 : 0.9);
      return;
    }

    const nextIndex = direction === 'in' ? Math.min(currentIndex + 1, zoomLevels.length - 1) : Math.max(currentIndex - 1, 0);
    setZoom(zoomLevels[nextIndex]);
  };

  const toolBtnClass = darkMode
    ? 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10'
    : 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className={`min-w-0 rounded-3xl border p-4 shadow-[0_18px_60px_rgba(15,23,42,0.2)] backdrop-blur-xl sm:p-5 ${darkMode ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-white/90'}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Resume preview</p>
          <p className={`truncate text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Zoom, scroll, fullscreen, and download your uploaded PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => changeZoom('out')} className={toolBtnClass} aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => changeZoom('reset')}
            className={`${toolBtnClass} w-auto px-3 text-sm font-medium`}
          >
            {zoom.toFixed(2)}x
          </button>
          <button type="button" onClick={() => changeZoom('in')} className={toolBtnClass} aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button type="button" onClick={toggleFullscreen} className={toolBtnClass} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button type="button" onClick={handleDownload} className={toolBtnClass} aria-label="Download PDF">
            <Download className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} className={toolBtnClass} aria-label="Close preview">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={viewerRef}
        className={`relative max-h-[70vh] min-h-[280px] overflow-auto rounded-2xl border p-2 sm:min-h-[360px] sm:p-3 ${darkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-slate-100'}`}
      >
        <div
          className="mx-auto w-full max-w-3xl origin-top"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', width: `${100 / zoom}%` }}
        >
          <iframe
            src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            className="aspect-[8.5/11] min-h-[480px] w-full rounded-xl border-none bg-white sm:min-h-[640px]"
            title="Resume PDF preview"
          />
        </div>
      </div>
    </motion.div>
  );
}
