import React, { useState } from 'react';
import { VoiceConfig, VoiceCategory, VoiceEmotion, VoiceProvider, VoiceAccent } from '../types';
import { VOICE_PROFILES } from '../data/voiceProfiles';
import { SUPPORTED_LANGUAGES, SupportedLanguage, getLanguageOption } from '../data/languages';
import { TTSService } from '../services/ttsService';
import { 
  Mic, 
  Sparkles, 
  Sliders, 
  Volume2, 
  Play, 
  Square, 
  X, 
  Check, 
  RefreshCw,
  Wand2,
  Layers,
  Radio,
  Music,
  Gauge,
  Globe,
  Key,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceConfig: VoiceConfig;
  onSaveVoiceConfig: (config: VoiceConfig) => void;
  onApplyToAllScenes?: () => void;
}

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({
  isOpen,
  onClose,
  voiceConfig,
  onSaveVoiceConfig,
  onApplyToAllScenes,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<VoiceProvider | 'all'>('vbee');
  const [selectedAccent, setSelectedAccent] = useState<VoiceAccent | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<VoiceCategory>('all');
  const [currentConfig, setCurrentConfig] = useState<VoiceConfig>({ ...voiceConfig });
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewPlayer, setPreviewPlayer] = useState<{ stop: () => void } | null>(null);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [clonePromptInput, setClonePromptInput] = useState(voiceConfig.customPromptClone || '');
  const [customSampleText, setCustomSampleText] = useState<string>('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  if (!isOpen) return null;

  const currentProfile = TTSService.getVoiceProfile(currentConfig.voiceId);
  const selectedLangOption = getLanguageOption(currentConfig.lang || 'vi');

  const filteredVoices = VOICE_PROFILES.filter((v) => {
    if (selectedProvider !== 'all' && v.provider !== selectedProvider) return false;
    if (selectedAccent !== 'all' && v.accent !== selectedAccent) return false;
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
    return true;
  });

  const providers: { id: VoiceProvider | 'all'; label: string; badge: string; desc: string }[] = [
    { id: 'vbee', label: 'Vbee AI Studio', badge: '🇻🇳 Bản địa 100%', desc: 'studio.vbee.vn - Giọng đọc chuẩn Bắc/Trung/Nam tự nhiên' },
    { id: 'elevenlabs', label: 'ElevenLabs', badge: '🌐 Đa cảm xúc', desc: 'elevenlabs.io - Siêu AI lồng tiếng điện ảnh hàng đầu thế giới' },
    { id: 'edge_neural', label: 'Edge Neural HD', badge: '🎙️ Phát thanh viên', desc: 'Giọng đọc tin tức & phóng sự chuẩn mực' },
    { id: 'all', label: 'Tất cả nguồn giọng', badge: '✨ Toàn bộ', desc: 'Xem danh mục tất cả các giọng' },
  ];

  const accents: { id: VoiceAccent | 'all'; label: string }[] = [
    { id: 'all', label: 'Mọi vùng miền' },
    { id: 'bac_bo', label: '🏛️ Miền Bắc (Hà Nội)' },
    { id: 'nam_bo', label: '🌴 Miền Nam (Sài Gòn)' },
    { id: 'trung_bo', label: '🏰 Miền Trung (Huế)' },
    { id: 'global', label: '🌐 Quốc tế / Đa ngữ' },
  ];

  const categories: { id: VoiceCategory; label: string }[] = [
    { id: 'all', label: 'Tất cả thể loại' },
    { id: 'storytelling', label: '📖 Kể chuyện & Sách' },
    { id: 'cinema', label: '🎬 Điện ảnh & Trailer' },
    { id: 'social', label: '⚡ Viral & TikTok' },
    { id: 'news', label: '🎙️ Thời sự & Tin tức' },
    { id: 'education', label: '🔬 Khoa học & Tài liệu' },
    { id: 'asmr', label: '🌿 ASMR & Thiền' },
  ];

  const emotionList: { id: VoiceEmotion; label: string; icon: string }[] = [
    { id: 'neutral', label: 'Tự nhiên', icon: '✨' },
    { id: 'warm', label: 'Ấm áp, truyền cảm', icon: '❤️' },
    { id: 'dramatic', label: 'Kịch tính, điện ảnh', icon: '🔥' },
    { id: 'whisper', label: 'Thì thầm, ASMR', icon: '🌙' },
    { id: 'energetic', label: 'Năng động, hào hứng', icon: '⚡' },
    { id: 'authoritative', label: 'Uy nghiêm, đĩnh đạc', icon: '🏛️' },
    { id: 'cheerful', label: 'Tươi vui, dí dỏm', icon: '🎉' },
    { id: 'mysterious', label: 'Bí ẩn, sâu lắng', icon: '🔮' },
  ];

  const eqPresets: { id: VoiceConfig['audioFx']['equalizer']; label: string; desc: string }[] = [
    { id: 'studio', label: 'Studio Neutral', desc: 'Âm thanh phòng thu cân bằng' },
    { id: 'bass_boost', label: 'Warm Bass Pro', desc: 'Tăng cường âm trầm ấm áp' },
    { id: 'crisp_voice', label: 'Crisp Broadcast', desc: 'Tăng độ trong & sáng giọng đài' },
    { id: 'cinematic_hall', label: 'Cinematic Presence', desc: 'Âm hưởng phim trường không gian rộng' },
  ];

  const handleSelectProfile = (profileId: string) => {
    const profile = VOICE_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;

    setCurrentConfig((prev) => ({
      ...prev,
      voiceId: profile.id,
      voiceName: profile.name,
      provider: profile.provider,
      accent: profile.accent,
      gender: profile.gender,
      stability: profile.defaultStability,
      claritySimilarity: profile.defaultClarity,
      styleExaggeration: profile.defaultStyle,
      pitch: profile.defaultPitch,
      rate: profile.defaultRate,
      emotionTone: profile.defaultEmotion,
      engine: profile.provider,
    }));
  };

  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    setCurrentConfig((prev) => ({
      ...prev,
      lang: langCode,
    }));
  };

  const [activePlayingVoiceId, setActivePlayingVoiceId] = useState<string | null>(null);

  const handlePlayProfileSample = async (e: React.MouseEvent, voice: typeof VOICE_PROFILES[0]) => {
    e.stopPropagation();
    if (activePlayingVoiceId === voice.id && previewPlayer) {
      previewPlayer.stop();
      setPreviewPlayer(null);
      setActivePlayingVoiceId(null);
      setIsPlayingPreview(false);
      return;
    }

    if (previewPlayer) {
      previewPlayer.stop();
      setPreviewPlayer(null);
    }

    handleSelectProfile(voice.id);

    const isVi = (currentConfig.lang || 'vi') === 'vi';
    const sampleText = isVi ? (voice.sampleTextVi || selectedLangOption.sampleText) : (voice.sampleTextEn || selectedLangOption.sampleText);

    setActivePlayingVoiceId(voice.id);
    setIsLoadingTTS(true);
    try {
      const cfg: VoiceConfig = {
        ...currentConfig,
        voiceId: voice.id,
        voiceName: voice.name,
        provider: voice.provider,
        accent: voice.accent,
        gender: voice.gender,
        stability: voice.defaultStability,
        claritySimilarity: voice.defaultClarity,
        styleExaggeration: voice.defaultStyle,
        pitch: voice.defaultPitch,
        rate: voice.defaultRate,
        emotionTone: voice.defaultEmotion,
        engine: voice.provider,
      };

      const result = await TTSService.generateVoiceover(sampleText, cfg);
      setIsLoadingTTS(false);
      setIsPlayingPreview(true);

      const player = TTSService.playVoice(
        sampleText,
        result.audioBuffer,
        result.audioUrl,
        cfg,
        () => {
          setIsPlayingPreview(false);
          setActivePlayingVoiceId(null);
          setPreviewPlayer(null);
        }
      );
      setPreviewPlayer(player);
    } catch {
      setIsLoadingTTS(false);
      setIsPlayingPreview(false);
      setActivePlayingVoiceId(null);
    }
  };

  const handlePlayPreview = async () => {
    if (isPlayingPreview && previewPlayer) {
      previewPlayer.stop();
      setIsPlayingPreview(false);
      return;
    }

    const sampleTextToPlay = customSampleText.trim() || selectedLangOption.sampleText;

    setIsLoadingTTS(true);
    try {
      const result = await TTSService.generateVoiceover(sampleTextToPlay, currentConfig);
      setIsLoadingTTS(false);
      setIsPlayingPreview(true);

      const player = TTSService.playVoice(
        sampleTextToPlay,
        result.audioBuffer,
        result.audioUrl,
        currentConfig,
        () => {
          setIsPlayingPreview(false);
        }
      );
      setPreviewPlayer(player);
    } catch {
      setIsLoadingTTS(false);
      setIsPlayingPreview(false);
    }
  };

  const handleApplyAIPromptClone = () => {
    if (!clonePromptInput.trim()) return;
    const lower = clonePromptInput.toLowerCase();
    
    let emotion: VoiceEmotion = 'warm';
    let pitch = 0;
    let rate = 1.0;
    let style = 0.5;

    if (lower.includes('trầm') || lower.includes('nam tính') || lower.includes('phim') || lower.includes('trailer')) {
      emotion = 'dramatic';
      pitch = -2.5;
      rate = 0.95;
      style = 0.8;
    } else if (lower.includes('nhanh') || lower.includes('tiktok') || lower.includes('vui') || lower.includes('năng động')) {
      emotion = 'energetic';
      pitch = 0.8;
      rate = 1.15;
      style = 0.7;
    } else if (lower.includes('thì thầm') || lower.includes('asmr') || lower.includes('ru ngủ') || lower.includes('nhẹ')) {
      emotion = 'whisper';
      pitch = 0.5;
      rate = 0.85;
      style = 0.9;
    } else if (lower.includes('tin tức') || lower.includes('thời sự') || lower.includes('chuyên nghiệp')) {
      emotion = 'authoritative';
      pitch = -1.0;
      rate = 1.02;
      style = 0.3;
    }

    setCurrentConfig((prev) => ({
      ...prev,
      emotionTone: emotion,
      pitch,
      rate,
      styleExaggeration: style,
      customPromptClone: clonePromptInput,
    }));
  };

  const handleSave = () => {
    if (previewPlayer) previewPlayer.stop();
    onSaveVoiceConfig(currentConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Voice Studio & Studio Thuyết Minh Bản Địa
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Vbee AI & ElevenLabs Integrated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Nguồn giọng bản địa tự nhiên chuẩn tiếng Việt (studio.vbee.vn) & Siêu AI biểu cảm điện ảnh (elevenlabs.io)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                showKeyConfig
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              API Key & Tokens
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Drawer (Optional) */}
        {showKeyConfig && (
          <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between text-xs animate-fade-in">
            <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  ElevenLabs API Key (elevenlabs.io)
                </label>
                <input
                  type="password"
                  value={currentConfig.customElevenLabsKey || ''}
                  onChange={(e) => setCurrentConfig(prev => ({ ...prev, customElevenLabsKey: e.target.value }))}
                  placeholder="xi-api-key (Để trống nếu dùng mặc định Cloud Studio)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Vbee Token (studio.vbee.vn)
                </label>
                <input
                  type="password"
                  value={currentConfig.customVbeeToken || ''}
                  onChange={(e) => setCurrentConfig(prev => ({ ...prev, customVbeeToken: e.target.value }))}
                  placeholder="Vbee Token (Để trống nếu dùng mặc định Cloud Studio)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 max-w-xs">
              💡 Hệ thống hỗ trợ sẵn chế độ Neural HD chất lượng cao. Nếu bạn có tài khoản ElevenLabs hoặc Vbee, hãy nhập key để gọi trực tiếp.
            </p>
          </div>
        )}

        {/* Top Provider & Accent Selection Bar */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Provider Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {providers.map((p) => {
              const isSelected = selectedProvider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20'
                      : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                >
                  <span>{p.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-700/60 text-slate-300'
                  }`}>
                    {p.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Language Selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0 mr-1" />
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentConfig.lang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left Column: Voice Catalog */}
          <div className="lg:col-span-5 p-5 flex flex-col gap-3.5 overflow-y-auto">
            
            {/* Accent and Category Sub-Filters */}
            <div className="space-y-2">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {accents.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccent(acc.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedAccent === acc.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Cards */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {filteredVoices.map((voice) => {
                const isSelected = currentConfig.voiceId === voice.id;
                const isVbee = voice.provider === 'vbee';
                const isEleven = voice.provider === 'elevenlabs';
                return (
                  <div
                    key={voice.id}
                    onClick={() => handleSelectProfile(voice.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500/80 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={voice.avatar}
                        alt={voice.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-slate-700"
                      />
                      <span className={`absolute -bottom-1 -right-1 text-[9px] px-1 py-0.2 rounded font-bold uppercase shadow-sm ${
                        isVbee 
                          ? 'bg-emerald-600 text-white' 
                          : isEleven 
                          ? 'bg-violet-600 text-white' 
                          : 'bg-cyan-600 text-white'
                      }`}>
                        {isVbee ? 'VBEE' : isEleven ? '11LABS' : 'EDGE'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {voice.name}
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handlePlayProfileSample(e, voice)}
                            title="Nghe thử giọng này ngay"
                            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                              activePlayingVoiceId === voice.id
                                ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse shadow-md shadow-indigo-500/50'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {activePlayingVoiceId === voice.id ? (
                              <Square className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            )}
                          </button>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {voice.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-block px-1.5 py-0.5 bg-slate-800 text-[10px] font-medium text-indigo-300 rounded border border-slate-700">
                          🎯 {voice.recommendedUse.split(',')[0]}
                        </span>
                        {voice.accent && (
                          <span className="inline-block px-1.5 py-0.5 bg-slate-800/80 text-[10px] font-medium text-slate-400 rounded">
                            {voice.accent === 'bac_bo' ? 'Bắc Bộ' : voice.accent === 'nam_bo' ? 'Nam Bộ' : voice.accent === 'trung_bo' ? 'Trung Bộ' : 'Quốc tế'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Voice Prompt Clone (Voice Design) */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 mb-1.5">
                <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-slate-200">
                  AI Voice Design / Sắc thái giọng tuỳ biến
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={clonePromptInput}
                  onChange={(e) => setClonePromptInput(e.target.value)}
                  placeholder="Vd: Giọng nam Hà Nội trầm ấm, đọc truyền cảm như thời sự..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleApplyAIPromptClone}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Áp dụng
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Parameters & DSP Studio */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between overflow-y-auto space-y-5">
            
            {/* Active Voice Overview Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/60 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={currentProfile.avatar}
                  alt={currentProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/50 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {currentConfig.voiceName || currentProfile.name}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      currentConfig.provider === 'vbee' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : currentConfig.provider === 'elevenlabs' 
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {currentConfig.provider === 'vbee' ? '🇻🇳 Vbee Studio' : currentConfig.provider === 'elevenlabs' ? '🌐 ElevenLabs' : '🎙️ Edge Neural'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {currentProfile.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 flex items-center gap-1">
                      <span>{selectedLangOption.flag}</span>
                      <span>{selectedLangOption.label}</span>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                      Sắc thái: {currentConfig.emotionTone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instant Audio Preview Button */}
              <button
                onClick={handlePlayPreview}
                disabled={isLoadingTTS}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg transition-all ${
                  isPlayingPreview
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {isLoadingTTS ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isPlayingPreview ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    Dừng nghe
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Nghe thử giọng ({currentConfig.voiceName.split(' ')[0]})
                  </>
                )}
              </button>
            </div>

            {/* Test Sample Text Preview Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  Câu đọc thử nghiệm ({selectedLangOption.flag} {selectedLangOption.name})
                </span>
                {customSampleText && (
                  <button
                    type="button"
                    onClick={() => setCustomSampleText('')}
                    className="text-[10px] text-slate-400 hover:text-rose-400"
                  >
                    Khôi phục câu mẫu mặc định
                  </button>
                )}
              </div>
              <input
                type="text"
                value={customSampleText || selectedLangOption.sampleText}
                onChange={(e) => setCustomSampleText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Parameter Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Stability */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Độ ổn định giọng (Stability)
                  </span>
                  <span className="text-indigo-400 font-mono">
                    {Math.round((currentConfig.stability || 0.75) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={currentConfig.stability || 0.75}
                  onChange={(e) =>
                    setCurrentConfig((prev) => ({
                      ...prev,
                      stability: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Biến tấu cảm xúc cao</span>
                  <span>Chuẩn mực & ổn định</span>
                </div>
              </div>

              {/* Clarity & Similarity */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Độ rõ & Tương đồng (Clarity Boost)
                  </span>
                  <span className="text-cyan-400 font-mono">
                    {Math.round((currentConfig.claritySimilarity || 0.85) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={currentConfig.claritySimilarity || 0.85}
                  onChange={(e) =>
                    setCurrentConfig((prev) => ({
                      ...prev,
                      claritySimilarity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Tự nhiên mềm mại</span>
                  <span>Sắc nét chuẩn studio</span>
                </div>
              </div>

              {/* Style Exaggeration */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    Độ nhấn nhá & Kịch tính (Style)
                  </span>
                  <span className="text-amber-400 font-mono">
                    {Math.round((currentConfig.styleExaggeration || 0.4) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={currentConfig.styleExaggeration || 0.4}
                  onChange={(e) =>
                    setCurrentConfig((prev) => ({
                      ...prev,
                      styleExaggeration: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Nhẹ nhàng</span>
                  <span>Hùng tráng & cảm xúc</span>
                </div>
              </div>

              {/* Pitch Shift */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    Cao độ (Pitch Shift)
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {(currentConfig.pitch || 0) > 0 ? `+${currentConfig.pitch}` : currentConfig.pitch || 0} st
                  </span>
                </div>
                <input
                  type="range"
                  min="-4.0"
                  max="4.0"
                  step="0.5"
                  value={currentConfig.pitch || 0}
                  onChange={(e) =>
                    setCurrentConfig((prev) => ({
                      ...prev,
                      pitch: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Trầm ấm (-4)</span>
                  <span>Thanh thoát (+4)</span>
                </div>
              </div>

              {/* Speaking Rate */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 md:col-span-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-blue-400" />
                    Tốc độ đọc (Speaking Rate)
                  </span>
                  <span className="text-blue-400 font-mono">
                    {(currentConfig.rate || 1.0).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  value={currentConfig.rate || 1.0}
                  onChange={(e) =>
                    setCurrentConfig((prev) => ({
                      ...prev,
                      rate: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Chậm rãi (0.7x)</span>
                  <span>Bình thường (1.0x)</span>
                  <span>Nhanh viral (1.4x)</span>
                </div>
              </div>

            </div>

            {/* Emotion Tone Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Sắc thái cảm xúc (Emotion Tone)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {emotionList.map((emo) => (
                  <button
                    key={emo.id}
                    onClick={() =>
                      setCurrentConfig((prev) => ({ ...prev, emotionTone: emo.id }))
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${
                      currentConfig.emotionTone === emo.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-950'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{emo.icon}</span>
                    <span className="truncate">{emo.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio DSP & EQ Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-violet-400" />
                Bộ lọc DSP Equalizer & Master Compressor
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {eqPresets.map((eq) => {
                  const isSelected = (currentConfig.audioFx?.equalizer || 'studio') === eq.id;
                  return (
                    <button
                      key={eq.id}
                      onClick={() =>
                        setCurrentConfig((prev) => ({
                          ...prev,
                          audioFx: {
                            ...(prev.audioFx || { reverb: 0, compression: true }),
                            equalizer: eq.id,
                          },
                        }))
                      }
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-violet-950/40 border-violet-500 text-violet-200 ring-1 ring-violet-500/40'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-semibold truncate">{eq.label}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{eq.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            {onApplyToAllScenes && (
              <button
                onClick={() => {
                  onSaveVoiceConfig(currentConfig);
                  onApplyToAllScenes();
                  onClose();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                Áp dụng giọng ({currentConfig.voiceName.split(' ')[0]}) cho toàn bộ phân cảnh
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Lưu cấu hình giọng đọc
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
