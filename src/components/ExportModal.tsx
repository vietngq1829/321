import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  Film, 
  AlertCircle, 
  Clock, 
  Hourglass,
  Sparkles,
  Layers,
  FileVideo
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number; // 0 to 1
  statusText: string;
  videoBlob: Blob | null;
  videoUrl: string | null;
  projectTitle: string;
  error?: string | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  progress,
  statusText,
  videoBlob,
  videoUrl,
  projectTitle,
  error,
}) => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (isOpen && !videoBlob && !error) {
      setStartTime(Date.now());
      setElapsedSeconds(0);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen && !videoBlob && !error && startTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.max(1, Math.floor((Date.now() - startTime) / 1000)));
      }, 500);
    } else if (videoBlob || error) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, videoBlob, error, startTime]);

  useEffect(() => {
    if (videoBlob && isOpen) {
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [videoBlob, isOpen]);

  if (!isOpen) return null;

  const isComplete = !!videoBlob && !!videoUrl;
  const fileSizeMb = videoBlob ? (videoBlob.size / (1024 * 1024)).toFixed(1) : '0';
  const progressPercent = Math.min(100, Math.max(2, Math.round(progress * 100)));

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Remaining time estimation
  const calculateRemainingSeconds = () => {
    if (progressPercent <= 10 || elapsedSeconds < 2) {
      return 15;
    }
    const estimatedTotal = (elapsedSeconds / (progressPercent / 100));
    return Math.max(1, Math.round(estimatedTotal - elapsedSeconds));
  };

  const remainingSeconds = calculateRemainingSeconds();

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    const cleanTitle = (projectTitle || 'AI-Video').replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    a.download = `${cleanTitle}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="py-2">
          {error ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Xuất Video Không Thành Công</h3>
              <p className="text-xs text-rose-300 bg-rose-950/50 p-3 rounded-xl border border-rose-800 leading-relaxed font-mono">
                {error}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          ) : isComplete ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Xuất Video Hoàn Tất 100%!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Video HD chất lượng cao tích hợp lồng tiếng và âm thanh SFX đã sẵn sàng tải về.
                </p>
              </div>

              {/* Video Player Preview */}
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video max-h-52 mx-auto">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 font-mono">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500">Dung lượng</div>
                  <div className="font-bold text-slate-200">{fileSizeMb} MB</div>
                </div>
                <div className="text-center border-x border-slate-800">
                  <div className="text-[10px] text-slate-500">Thời gian dựng</div>
                  <div className="font-bold text-emerald-400">{formatTime(elapsedSeconds)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500">Định dạng</div>
                  <div className="font-bold text-indigo-400">MP4 / 1080p</div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Video MP4 Về Máy Ngay</span>
                </button>
              </div>
            </div>
          ) : (
            /* In-Progress Exporting State */
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
                    <Film className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Đang Dựng & Xuất Video HD</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tổng hợp hình ảnh, hoạt họa, lồng tiếng & âm thanh...
                    </p>
                  </div>
                </div>

                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-mono">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 shadow-md shadow-indigo-500/30"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Time Indicators */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    Đã xuất: <strong className="text-slate-200">{formatTime(elapsedSeconds)}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Hourglass className="w-3 h-3 text-amber-400" />
                    Dự kiến còn lại: <strong className="text-amber-300">~{formatTime(remainingSeconds)}</strong>
                  </span>
                </div>
              </div>

              {/* Live Status */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <FileVideo className="w-4 h-4 animate-bounce" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Tiến trình render:</div>
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {statusText || 'Đang chuẩn bị khung hình và hòa âm...'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
