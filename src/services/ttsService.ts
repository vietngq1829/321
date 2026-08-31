import { VoiceConfig, SubtitleWord, VoiceProfile, VoiceProvider } from '../types';
import { VOICE_PROFILES } from '../data/voiceProfiles';
import { getLanguageOption, SupportedLanguage } from '../data/languages';
import { audioEngine } from './audioEngine';

export interface TTSResult {
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  duration: number;
  subtitleWords: SubtitleWord[];
  provider?: string;
}

export class TTSService {
  // Available voices
  public static readonly AVAILABLE_VOICES = VOICE_PROFILES;

  // Find profile by ID
  public static getVoiceProfile(voiceId: string): VoiceProfile {
    return (
      VOICE_PROFILES.find((v) => v.id === voiceId) || VOICE_PROFILES[0]
    );
  }

  // Filter voices by provider
  public static getVoicesByProvider(provider: VoiceProvider): VoiceProfile[] {
    return VOICE_PROFILES.filter((v) => v.provider === provider);
  }

  // Get sample preview text for a specific language
  public static getSampleTextForLanguage(lang: SupportedLanguage): string {
    const langOpt = getLanguageOption(lang);
    return langOpt.sampleText;
  }

  // Get BCP-47 locale tag
  public static getLocaleTag(lang: SupportedLanguage): string {
    const langOpt = getLanguageOption(lang);
    return langOpt.locale;
  }

  // Helper to split text into words and calculate estimated timeline
  public static calculateWordTimings(text: string, totalDuration: number): SubtitleWord[] {
    const rawWords = text.trim().split(/\s+/).filter((w) => w.length > 0);
    if (rawWords.length === 0) return [];

    const durationPerWord = totalDuration / rawWords.length;
    return rawWords.map((word, i) => ({
      word,
      start: Number((i * durationPerWord).toFixed(2)),
      end: Number(((i + 1) * durationPerWord).toFixed(2)),
    }));
  }

  // Generate TTS Audio via API with ElevenLabs / Vbee AI Studio / Neural Engine
  public static async generateVoiceover(text: string, voiceConfig: VoiceConfig): Promise<TTSResult> {
    if (!text || text.trim().length === 0) {
      return { duration: 3, subtitleWords: [] };
    }

    try {
      const profile = this.getVoiceProfile(voiceConfig.voiceId);
      const targetGeminiVoice = profile ? profile.geminiVoice : (voiceConfig.voiceName || 'Kore');

      // Call backend multi-engine TTS endpoint
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceId: voiceConfig.voiceId,
          voiceName: targetGeminiVoice,
          provider: voiceConfig.provider || profile?.provider || 'vbee',
          vbeeCode: profile?.vbeeCode,
          elevenId: profile?.elevenId,
          elevenlabsApiKey: voiceConfig.customElevenLabsKey,
          vbeeToken: voiceConfig.customVbeeToken,
          pitch: voiceConfig.pitch,
          rate: voiceConfig.rate,
          lang: voiceConfig.lang,
          emotionTone: voiceConfig.emotionTone,
          stability: voiceConfig.stability,
          claritySimilarity: voiceConfig.claritySimilarity,
          styleExaggeration: voiceConfig.styleExaggeration,
          customPromptClone: voiceConfig.customPromptClone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          // Convert base64 to AudioBuffer
          const ctx = audioEngine.init();
          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }

          let audioBuffer: AudioBuffer | undefined;
          let calculatedDuration = data.duration || 4;

          try {
            if (data.isPcm && ctx) {
              const pcm16 = new Int16Array(bytes.buffer);
              const sampleRate = data.sampleRate || 24000;
              audioBuffer = ctx.createBuffer(1, pcm16.length, sampleRate);
              const channelData = audioBuffer.getChannelData(0);
              for (let i = 0; i < pcm16.length; i++) {
                channelData[i] = pcm16[i] / 32768.0;
              }
              calculatedDuration = audioBuffer.duration;
            } else if (ctx) {
              // Clone arrayBuffer before decoding to prevent detachment
              const bufferCopy = bytes.buffer.slice(0);
              audioBuffer = await ctx.decodeAudioData(bufferCopy);
              calculatedDuration = audioBuffer.duration;
            }
          } catch (e) {
            console.warn('Audio decoding fallback to audioUrl blob:', e);
          }

          const mime = data.mimeType || 'audio/mpeg';
          const blob = new Blob([bytes.buffer], { type: mime });
          const audioUrl = URL.createObjectURL(blob);
          const subtitleWords = this.calculateWordTimings(text, calculatedDuration);

          return {
            audioUrl,
            audioBuffer,
            duration: Math.max(2.5, Math.ceil(calculatedDuration * 10) / 10),
            subtitleWords,
            provider: data.provider,
          };
        }
      }
    } catch (err) {
      console.warn('Backend TTS call failed:', err);
    }

    // Fallback: Estimate duration and generate synthetic speech buffer
    const wordCount = text.trim().split(/\s+/).length;
    const rateFactor = voiceConfig.rate || 1.0;
    const estimatedDuration = Math.max(3.0, (wordCount / (2.5 * rateFactor)));
    const subtitleWords = this.calculateWordTimings(text, estimatedDuration);

    return {
      duration: Math.ceil(estimatedDuration * 10) / 10,
      subtitleWords,
    };
  }

  // Play audio buffer or Web Speech API with DSP filter chain
  public static playVoice(
    text: string, 
    audioBuffer: AudioBuffer | undefined, 
    audioUrl: string | undefined, 
    voiceConfig: VoiceConfig,
    onEnded?: () => void
  ): { stop: () => void } {
    const ctx = audioEngine.init();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (audioBuffer && ctx) {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      // Dynamic DSP nodes
      const biquad = ctx.createBiquadFilter();
      const eqPreset = voiceConfig.audioFx?.equalizer || 'studio';
      if (eqPreset === 'bass_boost') {
        biquad.type = 'lowshelf';
        biquad.frequency.value = 220;
        biquad.gain.value = 5.0;
      } else if (eqPreset === 'crisp_voice') {
        biquad.type = 'highshelf';
        biquad.frequency.value = 3200;
        biquad.gain.value = 4.0;
      } else if (eqPreset === 'cinematic_hall') {
        biquad.type = 'peaking';
        biquad.frequency.value = 1000;
        biquad.gain.value = 2.5;
      } else {
        biquad.type = 'allpass';
      }

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-22, ctx.currentTime);
      compressor.knee.setValueAtTime(28, ctx.currentTime);
      compressor.ratio.setValueAtTime(3.5, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);

      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0;

      source.connect(biquad);
      biquad.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.onended = () => {
        if (onEnded) onEnded();
      };

      source.start(0);
      return {
        stop: () => {
          try {
            source.stop();
            source.disconnect();
          } catch {
            // ignore
          }
        }
      };
    }

    // Direct HTML5 Audio playback if buffer decoding wasn't used
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      if (voiceConfig.rate) audio.playbackRate = voiceConfig.rate;
      audio.onended = () => {
        if (onEnded) onEnded();
      };
      audio.play().catch((err) => console.warn('HTML Audio play error:', err));
      return {
        stop: () => {
          audio.pause();
          audio.currentTime = 0;
        }
      };
    }

    // Web Speech API fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceConfig.rate || 1.0;
      utterance.pitch = Math.max(0.5, Math.min(1.5, 1.0 + (voiceConfig.pitch || 0) * 0.08));
      utterance.lang = this.getLocaleTag(voiceConfig.lang) || 'vi-VN';

      // Find suitable browser voice if any
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => {
        if (onEnded) onEnded();
      };
      utterance.onerror = () => {
        if (onEnded) onEnded();
      };

      window.speechSynthesis.speak(utterance);
      return {
        stop: () => {
          window.speechSynthesis.cancel();
        }
      };
    }

    // Fallback timer
    const words = text.split(/\s+/).length;
    const durationMs = (words / 2.5) * 1000;
    const timer = setTimeout(() => {
      if (onEnded) onEnded();
    }, durationMs);

    return {
      stop: () => clearTimeout(timer)
    };
  }
}
