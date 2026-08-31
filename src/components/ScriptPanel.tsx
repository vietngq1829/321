import React, { useState } from 'react';
import { 
  Wand2, 
  Sparkles, 
  Volume2, 
  Music, 
  Play, 
  Square as StopSquare, 
  Lightbulb, 
  Sliders, 
  Check, 
  Globe,
  Languages,
  RefreshCw,
  Music2,
  VolumeX,
  Volume1,
  FileText
} from 'lucide-react';
import { VideoProject, VideoStylePreset, SfxType } from '../types';
import { SUPPORTED_LANGUAGES, SupportedLanguage, getLanguageOption } from '../data/languages';
import { TTSService } from '../services/ttsService';
import { BG_MUSIC_TRACKS, audioEngine } from '../services/audioEngine';

interface ScriptPanelProps {
  project: VideoProject;
  onUpdateProject: (updates: Partial<VideoProject>) => void;
  onGenerateStoryboard: (
    script: string, 
    stylePreset: VideoStylePreset,
    sfxPreferences?: string,
    sfxStylePreset?: string,
    bgmPreferences?: string,
    bgmTrackId?: string
  ) => Promise<void>;
  onAutoDubbing?: (targetLanguage: SupportedLanguage) => Promise<void>;
  onOpenVoiceStudio?: () => void;
  onOpenResearchSources?: () => void;
  isGenerating: boolean;
  generationStep: string;
}

const STYLE_PRESETS: { id: VideoStylePreset; label: string; icon: string; desc: string }[] = [
  { id: 'cinematic', label: 'Điện ảnh', icon: '🎬', desc: 'Góc máy hoành tráng, sâu lắng' },
  { id: 'tiktok_viral', label: 'TikTok/Reels', icon: '⚡', desc: 'Nhịp điệu nhanh, thu hút' },
  { id: 'tech_modern', label: 'Công nghệ', icon: '🚀', desc: 'Hiện đại, sắc nét, tương lai' },
  { id: 'storytelling', label: 'Kể chuyện', icon: '📖', desc: 'Truyền cảm xúc chân thực' },
  { id: 'documentary', label: 'Tài liệu', icon: '🌍', desc: 'Khám phá tri thức đời sống' },
  { id: 'education', label: 'Bài học', icon: '💡', desc: 'Rõ ràng, dễ tiếp thu, cô đọng' },
];

export const ScriptPanel: React.FC<ScriptPanelProps> = ({
  project,
  onUpdateProject,
  onGenerateStoryboard,
  onAutoDubbing,
  onOpenVoiceStudio,
  onOpenResearchSources,
  isGenerating,
}) => {
  const [scriptInput, setScriptInput] = useState(project.originalScript || '');
  const [selectedStyle, setSelectedStyle] = useState<VideoStylePreset>(project.stylePreset || 'cinematic');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isDubbingLoading, setIsDubbingLoading] = useState(false);
  const [testVoicePlaying, setTestVoicePlaying] = useState(false);
  const [activeVoiceController, setActiveVoiceController] = useState<{ stop: () => void } | null>(null);
  const [bgmPreviewPlaying, setBgmPreviewPlaying] = useState<boolean>(false);

  const selectedLanguage = project.language || 'vi';
  const selectedLangOption = getLanguageOption(selectedLanguage);

  // Word count & duration estimate
  const words = scriptInput.trim().split(/\s+/).filter(w => w.length > 0).length;
  const estimatedSeconds = Math.max(0, Math.round(words / 2.5));

  const handleGenerate = () => {
    if (!scriptInput.trim()) return;
    onGenerateStoryboard(
      scriptInput, 
      selectedStyle,
      project.sfxSettings?.customInstructions,
      project.sfxSettings?.stylePreset || 'auto',
      project.bgMusic?.customInstructions,
      project.bgMusic.trackId
    );
  };

  const handleEnhanceScript = async (mode: 'expand' | 'hook' | 'polish') => {
    if (!scriptInput.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/script/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: scriptInput,
          mode,
          stylePreset: selectedStyle,
          language: project.language,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.script) {
          setScriptInput(data.script);
          onUpdateProject({ originalScript: data.script });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    onUpdateProject({
      language: lang,
      voiceSettings: {
        ...project.voiceSettings,
        lang,
      },
    });
  };

  const handleTriggerAutoDubbing = async () => {
    if (!onAutoDubbing) return;
    setIsDubbingLoading(true);
    try {
      await onAutoDubbing(project.language || 'vi');
    } finally {
      setIsDubbingLoading(false);
    }
  };

  const handleTestVoice = async () => {
    if (testVoicePlaying && activeVoiceController) {
      activeVoiceController.stop();
      setActiveVoiceController(null);
      setTestVoicePlaying(false);
      return;
    }

    const sampleText = selectedLanguage === 'vi'
      ? 'Xin chào! Đây là giọng đọc thuyết minh tự nhiên của AI Studio với âm sắc truyền cảm và ngắt nghỉ chân thực.'
      : 'Hello! This is a realistic AI voiceover ready for your cinematic video creation.';

    setTestVoicePlaying(true);
    try {
      const res = await TTSService.generateVoiceover(sampleText, project.voiceSettings);
      const ctrl = TTSService.playVoice(
        sampleText,
        res.audioBuffer,
        res.audioUrl,
        project.voiceSettings,
        () => {
          setTestVoicePlaying(false);
          setActiveVoiceController(null);
        }
      );
      setActiveVoiceController(ctrl);
    } catch {
      setTestVoicePlaying(false);
    }
  };

  const toggleBgmPreview = () => {
    if (bgmPreviewPlaying) {
      audioEngine.stopBgm();
      setBgmPreviewPlaying(false);
    } else {
      audioEngine.init();
      audioEngine.startBgm(project.bgMusic.trackId);
      audioEngine.setBgmVolume(project.bgMusic.volume);
      setBgmPreviewPlaying(true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/40 p-4 sm:p-5 overflow-y-auto space-y-4">
      {/* 1. Language & Dubbing Bar */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200">Ngôn ngữ:</span>
        </div>

        <select
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
          className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs font-semibold text-cyan-300 focus:outline-none cursor-pointer"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Script Input Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-400" />
            1. Ý tưởng & Kịch bản Video
          </label>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
            {words} từ ~ {estimatedSeconds}s
          </span>
        </div>

        <textarea
          id="script-input-textarea"
          rows={5}
          value={scriptInput}
          onChange={(e) => {
            setScriptInput(e.target.value);
            onUpdateProject({ originalScript: e.target.value });
          }}
          placeholder="Nhập nội dung kịch bản, chủ đề hoặc ý tưởng video bạn muốn làm. AI sẽ tự động phân tách thành các cảnh quay, viết lời thoại và tạo âm thanh phù hợp..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none shadow-inner font-sans leading-relaxed"
        />

        {/* Quick Assist Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <button
            id="btn-enhance-hook"
            type="button"
            disabled={isEnhancing || !scriptInput.trim()}
            onClick={() => handleEnhanceScript('hook')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] font-medium text-amber-300 border border-amber-500/20 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" /> Mở đầu Hook
          </button>
          <button
            id="btn-enhance-expand"
            type="button"
            disabled={isEnhancing || !scriptInput.trim()}
            onClick={() => handleEnhanceScript('expand')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] font-medium text-purple-300 border border-purple-500/20 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <Wand2 className="w-3 h-3 text-purple-400" /> Mở rộng kịch bản
          </button>
          {onOpenResearchSources && (
            <button
              id="btn-open-research"
              type="button"
              onClick={onOpenResearchSources}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] font-medium text-cyan-300 border border-cyan-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" /> Tìm tư liệu
            </button>
          )}
        </div>
      </div>

      {/* 3. Visual Style Presets */}
      <div>
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          2. Phong cách hình ảnh
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {STYLE_PRESETS.map((preset) => {
            const isSelected = selectedStyle === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-${preset.id}`}
                type="button"
                onClick={() => {
                  setSelectedStyle(preset.id);
                  onUpdateProject({ stylePreset: preset.id });
                }}
                className={`p-2 rounded-xl border text-left transition-all relative cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-100">
                  <span className="flex items-center gap-1">
                    <span>{preset.icon}</span>
                    <span className="truncate">{preset.label}</span>
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-indigo-400 shrink-0" />}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Unified Voiceover & Sound Design Box */}
      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            3. Giọng Lồng Tiếng & Âm Thanh
          </label>

          <div className="flex items-center gap-1.5">
            {onOpenVoiceStudio && (
              <button
                type="button"
                onClick={onOpenVoiceStudio}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-violet-400" />
                Voice Studio
              </button>
            )}
            <button
              id="btn-test-voice"
              type="button"
              onClick={handleTestVoice}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                testVoicePlaying
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {testVoicePlaying ? (
                <>
                  <StopSquare className="w-3 h-3 text-rose-400" />
                  <span>Dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>Nghe thử</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Voice Selector */}
        <select
          id="select-voice"
          value={project.voiceSettings.voiceId || 'vbee-manhdung'}
          onChange={(e) => {
            const vId = e.target.value;
            const profile = TTSService.getVoiceProfile(vId);
            onUpdateProject({
              voiceSettings: {
                ...project.voiceSettings,
                voiceId: vId,
                voiceName: profile.name,
                provider: profile.provider,
                gender: profile.gender,
                accent: profile.accent,
                stability: profile.defaultStability,
                claritySimilarity: profile.defaultClarity,
                styleExaggeration: profile.defaultStyle,
                pitch: profile.defaultPitch,
                rate: profile.defaultRate,
                emotionTone: profile.defaultEmotion,
                engine: profile.provider,
              },
            });
          }}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
        >
          <optgroup label="🇻🇳 Vbee AI Studio (Thuyết Minh Bản Địa Chuẩn)">
            {TTSService.AVAILABLE_VOICES.filter(v => v.provider === 'vbee').map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.accent === 'bac_bo' ? 'Bắc' : v.accent === 'nam_bo' ? 'Nam' : 'Huế'})
              </option>
            ))}
          </optgroup>
          <optgroup label="🌐 ElevenLabs & Quốc Tế (Điện Ảnh Đa Ngôn Ngữ)">
            {TTSService.AVAILABLE_VOICES.filter(v => v.provider === 'elevenlabs').map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.gender === 'male' ? 'Nam' : 'Nữ'})
              </option>
            ))}
          </optgroup>
          <optgroup label="🎙️ Edge Neural HD (Thời Sự & Tin Tức)">
            {TTSService.AVAILABLE_VOICES.filter(v => v.provider === 'edge_neural').map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Music & SFX Quick Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* BGM select */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
              <span className="flex items-center gap-1">
                <Music className="w-3 h-3 text-purple-400" /> Nhạc nền
              </span>
              <button
                type="button"
                onClick={toggleBgmPreview}
                className="text-[10px] text-purple-400 hover:text-purple-300 cursor-pointer"
              >
                {bgmPreviewPlaying ? '■ Dừng' : '▶ Thử'}
              </button>
            </div>
            <select
              value={project.bgMusic.trackId}
              onChange={(e) => {
                onUpdateProject({
                  bgMusic: {
                    ...project.bgMusic,
                    trackId: e.target.value,
                  },
                });
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              {BG_MUSIC_TRACKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* SFX Quick Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
              <span className="flex items-center gap-1">
                <Music2 className="w-3 h-3 text-cyan-400" /> Hiệu ứng SFX
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const newEnabled = project.sfxSettings?.enabled === false;
                onUpdateProject({
                  sfxSettings: {
                    ...project.sfxSettings,
                    enabled: newEnabled,
                    masterVolume: project.sfxSettings?.masterVolume ?? 0.75,
                  },
                });
              }}
              className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                project.sfxSettings?.enabled !== false
                  ? 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {project.sfxSettings?.enabled !== false ? (
                <>
                  <Volume1 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Bật hiệu ứng SFX</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tắt SFX</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1-Click Re-Dubbing if scenes exist */}
        {project.scenes.length > 0 && onAutoDubbing && (
          <button
            type="button"
            onClick={handleTriggerAutoDubbing}
            disabled={isDubbingLoading || isGenerating}
            className="w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {isDubbingLoading ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                <span>Đang lồng tiếng lại...</span>
              </>
            ) : (
              <>
                <Languages className="w-3 h-3 text-cyan-400" />
                <span>Lồng tiếng lại kịch bản ({selectedLangOption.name})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 5. Main Action Button */}
      <div className="pt-1">
        <button
          id="btn-generate-video-all"
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !scriptInput.trim()}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
            isGenerating
              ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-[0.99]'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>Tạo Video & Lồng Tiếng AI ({selectedLangOption.name})</span>
        </button>
      </div>
    </div>
  );
};
