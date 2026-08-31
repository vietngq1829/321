import React from 'react';
import { 
  Video, 
  Sparkles, 
  Download, 
  LayoutTemplate, 
  Smartphone, 
  Monitor, 
  Square,
  Globe,
  Sliders
} from 'lucide-react';
import { AspectRatio, VideoProject } from '../types';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../data/languages';

interface HeaderProps {
  project: VideoProject;
  onUpdateAspectRatio: (ratio: AspectRatio) => void;
  onUpdateLanguage?: (lang: SupportedLanguage) => void;
  onOpenTemplates: () => void;
  onOpenVoiceStudio?: () => void;
  onExportVideo: () => void;
  isExporting: boolean;
  exportProgress: number;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onUpdateAspectRatio,
  onUpdateLanguage,
  onOpenTemplates,
  onOpenVoiceStudio,
  onExportVideo,
  isExporting,
  exportProgress,
}) => {
  const totalDuration = project.scenes.reduce((acc, s) => acc + s.duration, 0);
  const currentLang = project.language || 'vi';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
          <Video className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-100 text-base sm:text-lg tracking-tight">
              AI Video & Voiceover Studio
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" /> Gemini Pro AI
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden md:block">
            Tạo video chất lượng cao từ văn bản tích hợp lồng tiếng tự động đa ngôn ngữ
          </p>
        </div>
      </div>

      {/* Center: Language & Aspect Ratio */}
      <div className="hidden md:flex items-center gap-2">
        {/* Language Selector in Header */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-xl">
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <select
            id="header-language-select"
            value={currentLang}
            onChange={(e) => onUpdateLanguage && onUpdateLanguage(e.target.value as SupportedLanguage)}
            className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
            title="Chọn ngôn ngữ lồng tiếng & kịch bản"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
                {lang.flag} {lang.label} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        {/* Aspect Ratio */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            id="btn-aspect-16-9"
            type="button"
            onClick={() => onUpdateAspectRatio('16:9')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              project.aspectRatio === '16:9'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Ngang (YouTube, TV, Facebook)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>16:9</span>
          </button>

          <button
            id="btn-aspect-9-16"
            type="button"
            onClick={() => onUpdateAspectRatio('9:16')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              project.aspectRatio === '9:16'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Dọc (TikTok, Reels, Shorts)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16</span>
          </button>

          <button
            id="btn-aspect-1-1"
            type="button"
            onClick={() => onUpdateAspectRatio('1:1')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              project.aspectRatio === '1:1'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Vuông (Instagram, Feed)"
          >
            <Square className="w-3.5 h-3.5" />
            <span>1:1</span>
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Voice Studio Shortcut */}
        {onOpenVoiceStudio && (
          <button
            type="button"
            onClick={onOpenVoiceStudio}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-950/40 hover:bg-violet-900/60 text-violet-300 border border-violet-800/50 hover:border-violet-700 transition-all cursor-pointer shadow-sm"
            title="Cấu hình giọng đọc ElevenLabs & DSP"
          >
            <Sliders className="w-3.5 h-3.5 text-violet-400" />
            <span>Voice Lab</span>
          </button>
        )}

        {/* Total Duration Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{totalDuration.toFixed(1)}s</span>
          <span className="text-slate-500">({project.scenes.length} cảnh)</span>
        </div>

        {/* Templates Button */}
        <button
          id="btn-open-templates"
          type="button"
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm"
        >
          <LayoutTemplate className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Mẫu có sẵn</span>
        </button>

        {/* Export Video Button */}
        <button
          id="btn-export-video"
          type="button"
          onClick={onExportVideo}
          disabled={isExporting || project.scenes.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
            isExporting
              ? 'bg-indigo-700/50 text-indigo-200 border border-indigo-500/30 cursor-wait'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]'
          }`}
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang xuất {(exportProgress * 100).toFixed(0)}%</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Xuất Video HD</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
