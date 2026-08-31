export type AspectRatio = '16:9' | '9:16' | '1:1';

export type CameraMotion = 
  | 'zoom-in' 
  | 'zoom-out' 
  | 'pan-left' 
  | 'pan-right' 
  | 'subtle-drift' 
  | 'static';

export type TransitionType = 
  | 'crossfade' 
  | 'fade-black' 
  | 'slide-left' 
  | 'zoom' 
  | 'none';

export type VideoStylePreset = 
  | 'cinematic' 
  | 'documentary' 
  | 'tiktok_viral' 
  | 'tech_modern' 
  | 'storytelling' 
  | 'education';

export type CaptionTheme = 
  | 'tiktok_yellow' 
  | 'cinematic_minimal' 
  | 'neon_cyber' 
  | 'karaoke_glow' 
  | 'bold_banner';

export type VoiceEmotion = 
  | 'neutral' 
  | 'dramatic' 
  | 'whisper' 
  | 'energetic' 
  | 'warm' 
  | 'mysterious' 
  | 'authoritative' 
  | 'cheerful';

export type VoiceCategory = 
  | 'all'
  | 'storytelling' 
  | 'cinema' 
  | 'social' 
  | 'news' 
  | 'asmr' 
  | 'education';

export interface SubtitleWord {
  word: string;
  start: number;
  end: number;
}

export interface SourceCitation {
  title: string;
  source: string;
  author?: string;
  url?: string;
  license?: string;
}

export type SfxType =
  | 'whoosh'
  | 'boom_impact'
  | 'riser'
  | 'shutter'
  | 'typewriter'
  | 'cyber_beep'
  | 'laser'
  | 'bell'
  | 'magic_sparkle'
  | 'glitch'
  | 'applause'
  | 'ambient_nature'
  | 'bass_drop'
  | 'none';

export interface Scene {
  id: string;
  order: number;
  narration: string; // The text to be spoken by AI
  visualPrompt: string; // The visual description for AI image generation
  visualUrl: string; // Image or video thumbnail / poster URL
  mediaType?: 'image' | 'video'; // Media type
  videoUrl?: string; // Optional B-Roll motion video URL (MP4)
  duration: number; // in seconds
  cameraMotion: CameraMotion;
  transition: TransitionType;
  sfx?: string; // Descriptive name of sound effect (e.g. 'Whoosh lướt nhanh & Boom bass')
  sfxType?: SfxType; // Sound effect synth trigger type
  sfxTiming?: 'start' | 'mid' | 'end'; // Timing of SFX in scene
  sfxVolume?: number; // 0.0 to 1.0 (individual scene volume)
  audioUrl?: string; // Base64 or Object URL of voiceover
  audioBuffer?: AudioBuffer; // Decoded AudioBuffer for timeline sync & export
  audioDuration?: number;
  subtitleWords?: SubtitleWord[];
  sourceInfo?: SourceCitation;
  researchFacts?: string[]; // Auto-sourced facts & documentary data
  isGeneratingVisual?: boolean;
  isGeneratingAudio?: boolean;
  error?: string;
}

export type VoiceProvider = 'vbee' | 'elevenlabs' | 'edge_neural' | 'gemini';
export type VoiceAccent = 'bac_bo' | 'nam_bo' | 'trung_bo' | 'us' | 'uk' | 'global';

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
  provider: VoiceProvider;
  accent?: VoiceAccent;
  category: VoiceCategory;
  recommendedUse: string;
  geminiVoice: string;
  vbeeCode?: string;
  elevenId?: string;
  avatar: string;
  defaultStability: number;
  defaultClarity: number;
  defaultStyle: number;
  defaultPitch: number;
  defaultRate: number;
  defaultEmotion: VoiceEmotion;
  sampleTextVi: string;
  sampleTextEn: string;
}

import { SupportedLanguage } from './data/languages';

export interface VoiceAudioFx {
  equalizer: 'studio' | 'bass_boost' | 'crisp_voice' | 'cinematic_hall' | 'warm_vintage';
  reverb: number; // 0.0 to 0.8
  compression: boolean;
}

export interface VoiceConfig {
  voiceId: string; // e.g. 'vbee-manhdung', 'eleven-rachel', 'adam'
  voiceName: string;
  provider: VoiceProvider;
  gender: 'male' | 'female';
  accent?: VoiceAccent;
  lang: SupportedLanguage;
  pitch: number; // -6 to +6 or 0.5 to 1.5
  rate: number; // 0.6 to 1.8
  stability: number; // 0.0 to 1.0 (ElevenLabs style)
  claritySimilarity: number; // 0.0 to 1.0 (ElevenLabs style)
  styleExaggeration: number; // 0.0 to 1.0 (ElevenLabs style)
  emotionTone: VoiceEmotion;
  audioFx: VoiceAudioFx;
  customPromptClone?: string; // Custom Voice Design Prompt
  engine: 'vbee' | 'elevenlabs' | 'edge_neural' | 'gemini' | 'browser';
  customElevenLabsKey?: string;
  customVbeeToken?: string;
}

export interface StockAsset {
  id: string;
  title: string;
  type: 'video' | 'image';
  url: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  duration?: number;
  author: string;
  source: string;
  resolution: string;
}

export interface ResearchFact {
  fact: string;
  category: string;
  source: string;
  sceneIndex?: number;
}

export interface ResearchResult {
  scriptOverview: string;
  facts: ResearchFact[];
  suggestedKeywords: string[];
  recommendedStockAssets: StockAsset[];
}

export interface BgMusicTrack {
  id: string;
  name: string;
  genre: string;
  mood: string;
  tempo: number;
  themeType: 'cinematic' | 'tech' | 'ambient' | 'lofi' | 'epic';
}

export interface VideoProject {
  id: string;
  title: string;
  originalScript: string;
  stylePreset: VideoStylePreset;
  aspectRatio: AspectRatio;
  language: SupportedLanguage;
  scenes: Scene[];
  voiceSettings: VoiceConfig;
  sfxSettings: {
    enabled: boolean;
    masterVolume: number; // 0.0 to 1.0
    stylePreset?: string; // 'auto' | 'cinematic' | 'tech' | 'viral_tiktok' | 'nature' | 'minimal'
    customInstructions?: string;
  };
  bgMusic: {
    trackId: string;
    volume: number; // 0.0 to 1.0
    ducking: boolean;
    customInstructions?: string;
    mood?: string;
  };
  captionStyle: {
    theme: CaptionTheme;
    fontSize: number; // relative base size
    position: 'bottom' | 'middle' | 'top';
    showBackground: boolean;
  };
}
