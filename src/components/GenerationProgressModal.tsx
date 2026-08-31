import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  BrainCircuit, 
  Mic2, 
  Film, 
  Music, 
  Clock, 
  Hourglass,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface GenerationProgressState {
  isOpen: boolean;
  stage: 'idle' | 'analyzing' | 'voiceover' | 'visuals' | 'audio_sfx' | 'finalizing' | 'completed' | 'error';
  progress: number; // 0 to 100
  statusMessage: string;
  currentScene: number;
  totalScenes: number;
  startTime: number | null;
  error?: string | null;
}

interface GenerationProgressModalProps {
  state: GenerationProgressState;
  onClose: () => void;
  onCancel?: () => void;
  projectTitle: string;
}

export const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({
  state,
  onClose,
  onCancel,
  projectTitle,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (state.isOpen && state.stage !== 'completed' && state.stage !== 'error' && state.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        setElapsedSeconds(Math.max(1, Math.floor((now - state.startTime!) / 1000)));
      }, 500);
    } else if (state.stage === 'completed' || state.stage === 'error') {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isOpen, state.stage, state.startTime]);

  useEffect(() => {
    if (state.stage === 'completed' && state.isOpen) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [state.stage, state.isOpen]);

  if (!state.isOpen) return null;

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Estimate remaining time based on current progress & elapsed time
  const calculateRemainingSeconds = () => {
    if (state.progress <= 5 || elapsedSeconds < 2) {
      // Baseline estimate: around 15-25 seconds total
      const baseline = state.totalScenes > 0 ? state.totalScenes * 4 + 8 : 20;
      return Math.max(3, baseline - elapsedSeconds);
    }
    const estimatedTotal = (elapsedSeconds / (state.progress / 100));
    const remaining = Math.max(1, Math.round(estimatedTotal - elapsedSeconds));
    return remaining;
  };

  const remainingSeconds = calculateRemainingSeconds();

  const STEPS = [
    {
      id: 'analyzing',
      label: 'Phân tích Kịch bản & Nhịp điệu AI',
      desc: 'Gemini AI tạo phân cảnh, gợi ý âm thanh & góc máy',
      icon: BrainCircuit,
      activeRange: [0, 25],
    },
    {
      id: 'voiceover',
      label: 'Lồng tiếng AI & Ngắt nghỉ Ngữ điệu',
      desc: 'Tổng hợp giọng đọc tự nhiên chuẩn đài truyền hình',
      icon: Mic2,
      activeRange: [25, 60],
    },
    {
      id: 'visuals',
      label: 'Khởi tạo Hình ảnh & Chuyển động Điện ảnh',
      desc: 'Tối ưu độ phân giải cao & hiệu ứng Ken Burns',
      icon: Film,
      activeRange: [60, 85],
    },
    {
      id: 'audio_sfx',
      label: 'Hòa âm Hiệu ứng SFX & Nhạc nền BGM',
      desc: 'Thiết kế âm thanh vòm, tự động hạ nhạc khi thuyết minh',
      icon: Music,
      activeRange: [85, 100],
    },
  ];

  const getStepStatus = (stepIndex: number, range: number[]) => {
    if (state.stage === 'completed') return 'done';
    if (state.stage === 'error') return 'error';
    if (state.progress >= range[1]) return 'done';
    if (state.progress >= range[0]) return 'active';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 relative">
        {/* Header / Close button */}
        {(state.stage === 'completed' || state.stage === 'error') && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {state.stage === 'error' ? (
          /* Error State */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Quá Trình Tạo Video Gặp Lỗi</h3>
            <p className="text-xs text-rose-300 bg-rose-950/60 p-3 rounded-xl border border-rose-800/80 leading-relaxed text-left font-mono">
              {state.error || 'Không thể hoàn thành quá trình tạo video. Vui lòng kiểm tra lại kịch bản và thử lại.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Đóng & Thử lại
            </button>
          </div>
        ) : state.stage === 'completed' ? (
          /* Completed State */
          <div className="text-center py-3 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Tạo Video AI Hoàn Tất 100%!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Toàn bộ phân cảnh, giọng đọc lồng tiếng và hiệu ứng âm thanh đã được đồng bộ sẵn sàng.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 font-mono">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase">Tổng thời gian tạo</div>
                <div className="font-bold text-emerald-400 text-sm mt-0.5">{formatTime(elapsedSeconds)}</div>
              </div>
              <div className="text-center border-l border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Số phân cảnh</div>
                <div className="font-bold text-cyan-400 text-sm mt-0.5">{state.totalScenes || 4} phân cảnh</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Xem & Chỉnh sửa Video ngay
            </button>
          </div>
        ) : (
          /* In-Progress State */
          <div className="space-y-5">
            {/* Header with Title & Live Progress */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Đang Tạo Video & Lồng Tiếng AI
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                  {projectTitle || 'Dự án Video mới'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-mono">
                  {Math.min(99, Math.round(state.progress))}%
                </span>
              </div>
            </div>

            {/* Glowing Main Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80 relative">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 shadow-md shadow-indigo-500/30"
                  style={{ width: `${Math.max(6, state.progress)}%` }}
                />
              </div>

              {/* Real-time Time Statistics */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  Đã chạy: <strong className="text-slate-200">{formatTime(elapsedSeconds)}</strong>
                </span>

                <span className="flex items-center gap-1">
                  <Hourglass className="w-3 h-3 text-amber-400" />
                  Dự kiến còn lại: <strong className="text-amber-300">~{formatTime(remainingSeconds)}</strong>
                </span>
              </div>
            </div>

            {/* Live Status Callout */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin text-indigo-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-400 font-medium">Trạng thái hiện tại:</div>
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {state.statusMessage || 'Đang khởi tạo các module trí tuệ nhân tạo...'}
                </div>
              </div>
              {state.totalScenes > 0 && (
                <div className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-800/60 shrink-0">
                  {state.currentScene}/{state.totalScenes} Cảnh
                </div>
              )}
            </div>

            {/* Step-by-Step Visual Checklist */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quy trình xử lý chi tiết:
              </div>

              <div className="space-y-1.5">
                {STEPS.map((step, idx) => {
                  const status = getStepStatus(idx, step.activeRange);
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                        status === 'active'
                          ? 'bg-indigo-950/40 border-indigo-500/60 text-white shadow-sm ring-1 ring-indigo-500/30'
                          : status === 'done'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                          : 'bg-slate-950/20 border-slate-900/60 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            status === 'active'
                              ? 'bg-indigo-600 text-white animate-pulse'
                              : status === 'done'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800/80 text-slate-500'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold">{step.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{step.desc}</div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2 font-mono text-[11px]">
                        {status === 'done' ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Xong
                          </span>
                        ) : status === 'active' ? (
                          <span className="text-indigo-400 font-bold flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                            Đang chạy...
                          </span>
                        ) : (
                          <span className="text-slate-600">Chờ</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
