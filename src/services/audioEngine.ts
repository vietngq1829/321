import { BgMusicTrack, SfxType } from '../types';

export interface SfxInfo {
  id: SfxType;
  name: string;
  icon: string;
  description: string;
  category: 'cinematic' | 'foley' | 'tech' | 'musical' | 'nature';
}

export const SFX_PRESETS: SfxInfo[] = [
  {
    id: 'whoosh',
    name: 'Whoosh chuyển cảnh',
    icon: '💨',
    description: 'Âm thanh lướt gió điện ảnh tốc độ cao',
    category: 'cinematic',
  },
  {
    id: 'boom_impact',
    name: 'Boom trầm kịch tính (Impact)',
    icon: '💥',
    description: 'Âm va đập sub-bass trầm hùng tạo điểm nhấn',
    category: 'cinematic',
  },
  {
    id: 'riser',
    name: 'Riser dồn dập (Tension)',
    icon: '📈',
    description: 'Tăng tiến tần số đẩy cao trào cảm xúc',
    category: 'cinematic',
  },
  {
    id: 'bass_drop',
    name: 'Bass Drop sâu lắng',
    icon: '🔊',
    description: 'Âm bass hạ trầm lan tỏa bao quát không gian',
    category: 'cinematic',
  },
  {
    id: 'shutter',
    name: 'Chụp ảnh flash (Camera Shutter)',
    icon: '📸',
    description: 'Âm tách màn trập máy ảnh chuyên nghiệp',
    category: 'foley',
  },
  {
    id: 'typewriter',
    name: 'Gõ phím sắc nét (Typewriter)',
    icon: '⌨️',
    description: 'Tiếng gõ phím cơ nhịp nhàng, tập trung',
    category: 'foley',
  },
  {
    id: 'cyber_beep',
    name: 'Công nghệ Sci-Fi (Cyber Beep)',
    icon: '🤖',
    description: 'Âm báo telemetry tương lai vi tính',
    category: 'tech',
  },
  {
    id: 'laser',
    name: 'Tia Laser (Sci-Fi Zap)',
    icon: '⚡',
    description: 'Âm quét laser năng lượng cao',
    category: 'tech',
  },
  {
    id: 'glitch',
    name: 'Glitch nhiễu sóng (Digital Glitch)',
    icon: '👾',
    description: 'Hiệu ứng giật lag số kỹ thuật số',
    category: 'tech',
  },
  {
    id: 'bell',
    name: 'Chuông pha lê (Crystal Bell)',
    icon: '🔔',
    description: 'Tiếng chuông ngân trong trẻo, điểm nhấn tinh tế',
    category: 'musical',
  },
  {
    id: 'magic_sparkle',
    name: 'Phép thuật lấp lánh (Sparkle)',
    icon: '✨',
    description: 'Hợp âm thăng hoa kỳ ảo và lung linh',
    category: 'musical',
  },
  {
    id: 'applause',
    name: 'Vỗ tay tán thưởng (Applause)',
    icon: '👏',
    description: 'Tiếng vỗ tay náo nhiệt, chúc mừng thành công',
    category: 'foley',
  },
  {
    id: 'ambient_nature',
    name: 'Thiên nhiên gió thoảng (Wind Ambient)',
    icon: '🍃',
    description: 'Tiếng gió và không gian tự nhiên thanh bình',
    category: 'nature',
  },
  {
    id: 'none',
    name: 'Không dùng SFX',
    icon: '🔇',
    description: 'Chỉ có giọng thuyết minh và nhạc nền',
    category: 'nature',
  },
];

export const BG_MUSIC_TRACKS: BgMusicTrack[] = [
  {
    id: 'cinematic-ambient',
    name: 'Điện ảnh trầm lắng (Cinematic Ambient)',
    genre: 'Cinematic',
    mood: 'Sâu lắng, kỳ vĩ, gợi mở',
    tempo: 75,
    themeType: 'cinematic',
  },
  {
    id: 'epic-inspiration',
    name: 'Khởi sắc truyền cảm (Inspirational Epic)',
    genre: 'Orchestral',
    mood: 'Hùng tráng, thúc đẩy, dồn dập',
    tempo: 95,
    themeType: 'epic',
  },
  {
    id: 'tech-pulse',
    name: 'Công nghệ tương lai (Cyber Tech)',
    genre: 'Electronic',
    mood: 'Hiện đại, sắc nét, chuyển động nhanh',
    tempo: 110,
    themeType: 'tech',
  },
  {
    id: 'lofi-chill',
    name: 'Lo-Fi Thư thái (Peaceful Story)',
    genre: 'Lo-Fi Chill',
    mood: 'Nhẹ nhàng, ấm áp, lắng đọng',
    tempo: 85,
    themeType: 'lofi',
  },
  {
    id: 'deep-space',
    name: 'Không gian huyền ảo (Cosmic Ambient)',
    genre: 'Ambient',
    mood: 'Bí ẩn, bao la, vũ trụ',
    tempo: 60,
    themeType: 'ambient',
  },
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private intervalId: number | null = null;

  public init(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.25;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.75;
      this.sfxGain.connect(this.masterGain);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = 1.0;
      this.voiceGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getDestination(): AudioNode | null {
    return this.masterGain;
  }

  public setBgmVolume(volume: number) {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }
  }

  public setSfxMasterVolume(volume: number) {
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }
  }

  public setDucking(isSpeaking: boolean) {
    if (this.bgmGain && this.ctx) {
      const targetVolume = isSpeaking ? 0.08 : 0.25;
      this.bgmGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.1);
    }
  }

  public startBgm(trackId: string = 'cinematic-ambient') {
    this.init();
    this.stopBgm();
    this.isPlaying = true;

    if (!this.ctx || !this.bgmGain) return;

    const track = BG_MUSIC_TRACKS.find((t) => t.id === trackId) || BG_MUSIC_TRACKS[0];
    this.scheduleNotes(track.themeType);
  }

  private scheduleNotes(theme: string) {
    if (!this.ctx || !this.bgmGain || !this.isPlaying) return;

    const scale = this.getScale(theme);
    let step = 0;

    const tick = () => {
      if (!this.isPlaying || !this.ctx || !this.bgmGain) return;

      const rootFreq = scale[step % scale.length];

      // Base pad drone
      if (step % 4 === 0) {
        this.playPad(rootFreq * 0.5, 3.5, 0.12);
        this.playPad(rootFreq * 0.75, 3.5, 0.08);
      }

      // Melodic arpeggio note
      if (theme === 'tech' || theme === 'lofi' || step % 2 === 0) {
        const noteFreq = scale[(step * 2 + 1) % scale.length];
        this.playPluck(noteFreq, 1.2, 0.09);
      }

      // Ethereal shimmer
      if (theme === 'cinematic' || theme === 'ambient' || theme === 'epic') {
        if (step % 3 === 0) {
          const highFreq = scale[(step + 2) % scale.length] * 2;
          this.playShimmer(highFreq, 2.5, 0.05);
        }
      }

      step++;
    };

    tick();
    const intervalMs = theme === 'tech' ? 450 : theme === 'lofi' ? 650 : 800;
    this.intervalId = window.setInterval(tick, intervalMs);
  }

  private getScale(theme: string): number[] {
    switch (theme) {
      case 'cinematic':
        return [146.83, 174.61, 196.0, 220.0, 261.63, 293.66, 349.23];
      case 'tech':
        return [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
      case 'lofi':
        return [130.81, 164.81, 196.0, 246.94, 293.66, 329.63];
      case 'epic':
        return [155.56, 196.0, 233.08, 261.63, 311.13, 349.23];
      case 'ambient':
      default:
        return [174.61, 207.65, 233.08, 261.63, 311.13, 349.23];
    }
  }

  private playPad(freq: number, duration: number, maxGain: number) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + duration);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(maxGain, now + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playPluck(freq: number, duration: number, maxGain: number) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(maxGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playShimmer(freq: number, duration: number, maxGain: number) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(freq * 1.01, this.ctx.currentTime + duration * 0.5);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(maxGain, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  public stopBgm() {
    this.isPlaying = false;
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // ==========================================
  // PROCEDURAL SFX SYNTHESIZER (HIGH QUALITY)
  // ==========================================

  public playSfx(sfxType?: SfxType | string, volume: number = 0.8) {
    if (!sfxType || sfxType === 'none') return;
    const ctx = this.init();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const targetGainNode = this.sfxGain;
    const vol = Math.max(0, Math.min(1.2, volume));

    switch (sfxType) {
      case 'whoosh':
        this.synthWhoosh(ctx, targetGainNode, now, vol);
        break;
      case 'boom_impact':
        this.synthBoomImpact(ctx, targetGainNode, now, vol);
        break;
      case 'riser':
        this.synthRiser(ctx, targetGainNode, now, vol);
        break;
      case 'bass_drop':
        this.synthBassDrop(ctx, targetGainNode, now, vol);
        break;
      case 'shutter':
        this.synthShutter(ctx, targetGainNode, now, vol);
        break;
      case 'typewriter':
        this.synthTypewriter(ctx, targetGainNode, now, vol);
        break;
      case 'cyber_beep':
        this.synthCyberBeep(ctx, targetGainNode, now, vol);
        break;
      case 'laser':
        this.synthLaser(ctx, targetGainNode, now, vol);
        break;
      case 'glitch':
        this.synthGlitch(ctx, targetGainNode, now, vol);
        break;
      case 'bell':
        this.synthCrystalBell(ctx, targetGainNode, now, vol);
        break;
      case 'magic_sparkle':
        this.synthMagicSparkle(ctx, targetGainNode, now, vol);
        break;
      case 'applause':
        this.synthApplause(ctx, targetGainNode, now, vol);
        break;
      case 'ambient_nature':
        this.synthNatureWind(ctx, targetGainNode, now, vol);
        break;
      default:
        this.synthWhoosh(ctx, targetGainNode, now, vol);
        break;
    }
  }

  // 1. Whoosh (Filtered noise swoosh with exponential filter sweep)
  private synthWhoosh(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const dur = 0.75;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.5, startTime);
    filter.frequency.setValueAtTime(150, startTime);
    filter.frequency.exponentialRampToValueAtTime(2800, startTime + dur * 0.5);
    filter.frequency.exponentialRampToValueAtTime(100, startTime + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.65 * vol, startTime + dur * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + dur);
  }

  // 2. Boom Impact (Sub punch + sine 808 drop + filtered noise tail)
  private synthBoomImpact(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const dur = 1.4;

    // Sub-bass Sine drop
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, startTime);
    osc.frequency.exponentialRampToValueAtTime(32, startTime + 0.35);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.85 * vol, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + dur);

    // Initial Transient Punch Click
    const punch = ctx.createOscillator();
    punch.type = 'triangle';
    punch.frequency.setValueAtTime(280, startTime);
    punch.frequency.exponentialRampToValueAtTime(40, startTime + 0.06);

    const punchGain = ctx.createGain();
    punchGain.gain.setValueAtTime(0.9 * vol, startTime);
    punchGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08);

    punch.connect(punchGain);
    punchGain.connect(dest);
    punch.start(startTime);
    punch.stop(startTime + 0.08);
  }

  // 3. Riser (Tension pitch sweep upwards with resonance)
  private synthRiser(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const dur = 1.2;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, startTime);
    osc.frequency.exponentialRampToValueAtTime(880, startTime + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(4.0, startTime);
    filter.frequency.setValueAtTime(150, startTime);
    filter.frequency.exponentialRampToValueAtTime(3500, startTime + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.linearRampToValueAtTime(0.55 * vol, startTime + dur * 0.9);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(startTime);
    osc.stop(startTime + dur);
  }

  // 4. Bass Drop (Deep low frequency drop)
  private synthBassDrop(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const dur = 1.6;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, startTime);
    osc.frequency.exponentialRampToValueAtTime(28, startTime + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9 * vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + dur);
  }

  // 5. Camera Shutter (Mechanical double click)
  private synthShutter(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const makeClick = (t: number, f: number, clickDur: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + clickDur);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.4 * vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + clickDur);

      osc.connect(g);
      g.connect(dest);
      osc.start(t);
      osc.stop(t + clickDur);
    };

    makeClick(startTime, 1200, 0.025);
    makeClick(startTime + 0.045, 800, 0.04);
  }

  // 6. Typewriter (Crisp key stroke click)
  private synthTypewriter(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2400, startTime);
    osc.frequency.exponentialRampToValueAtTime(300, startTime + 0.035);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5 * vol, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

    osc.connect(g);
    g.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + 0.04);
  }

  // 7. Cyber Beep (Dual tone harmonic futuristic chime)
  private synthCyberBeep(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const dur = 0.22;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(1760, startTime); // A6
    osc2.frequency.setValueAtTime(2637.02, startTime + 0.04); // E7

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35 * vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);

    osc1.start(startTime);
    osc1.stop(startTime + dur);
    osc2.start(startTime + 0.04);
    osc2.stop(startTime + dur);
  }

  // 8. Laser Zap (Retro-futuristic frequency zap)
  private synthLaser(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const dur = 0.25;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1900, startTime);
    osc.frequency.exponentialRampToValueAtTime(90, startTime + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45 * vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + dur);
  }

  // 9. Glitch (Digital bit-stutter noise)
  private synthGlitch(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const bursts = 4;
    for (let b = 0; b < bursts; b++) {
      const t = startTime + b * 0.035;
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300 + Math.random() * 1200, t);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3 * vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      osc.connect(g);
      g.connect(dest);
      osc.start(t);
      osc.stop(t + 0.025);
    }
  }

  // 10. Crystal Bell (Resonant FM harmonic partials)
  private synthCrystalBell(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const dur = 1.8;
    const baseFreq = 1046.5; // C6
    const harmonics = [1, 2.76, 5.4, 8.93];
    const gains = [0.4, 0.25, 0.15, 0.08];

    harmonics.forEach((h, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * h, startTime);

      const g = ctx.createGain();
      g.gain.setValueAtTime(gains[idx] * vol, startTime);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur / (idx + 1));

      osc.connect(g);
      g.connect(dest);
      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  }

  // 11. Magic Sparkle (Ascending harp triad shimmer)
  private synthMagicSparkle(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
    freqs.forEach((f, i) => {
      const t = startTime + i * 0.06;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.28 * vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      osc.connect(g);
      g.connect(dest);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // 12. Applause (Crowd cheering noise texture)
  private synthApplause(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const dur = 1.5;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin((i / bufferSize) * Math.PI));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, startTime);
    filter.Q.setValueAtTime(1.5, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.35 * vol, startTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(startTime);
    noise.stop(startTime + dur);
  }

  // 13. Nature Wind (Low filtered wind ambient)
  private synthNatureWind(ctx: BaseAudioContext, dest: AudioNode, startTime: number, vol: number) {
    const dur = 2.0;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, startTime);
    filter.frequency.linearRampToValueAtTime(550, startTime + dur * 0.5);
    filter.frequency.linearRampToValueAtTime(280, startTime + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.4 * vol, startTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(startTime);
    noise.stop(startTime + dur);
  }

  // Render an offline audio buffer for export recording
  public async renderBgmBuffer(trackId: string, durationSec: number): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const length = Math.max(1, Math.ceil(sampleRate * durationSec));
    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

    const track = BG_MUSIC_TRACKS.find((t) => t.id === trackId) || BG_MUSIC_TRACKS[0];
    const scale = this.getScale(track.themeType);
    const stepInterval = track.themeType === 'tech' ? 0.45 : track.themeType === 'lofi' ? 0.65 : 0.8;
    const totalSteps = Math.ceil(durationSec / stepInterval);

    for (let step = 0; step < totalSteps; step++) {
      const time = step * stepInterval;
      if (time >= durationSec) break;

      const rootFreq = scale[step % scale.length];

      // Pad
      if (step % 4 === 0) {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(rootFreq * 0.5, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 1.0);
        gain.gain.exponentialRampToValueAtTime(0.001, Math.min(durationSec, time + 3.5));

        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(time);
        osc.stop(Math.min(durationSec, time + 3.5));
      }

      // Pluck
      const noteFreq = scale[(step * 2 + 1) % scale.length];
      const oscPluck = offlineCtx.createOscillator();
      const gainPluck = offlineCtx.createGain();
      oscPluck.type = 'sine';
      oscPluck.frequency.setValueAtTime(noteFreq, time);

      gainPluck.gain.setValueAtTime(0.08, time);
      gainPluck.gain.exponentialRampToValueAtTime(0.0001, Math.min(durationSec, time + 1.2));

      oscPluck.connect(gainPluck);
      gainPluck.connect(offlineCtx.destination);
      oscPluck.start(time);
      oscPluck.stop(Math.min(durationSec, time + 1.2));
    }

    return await offlineCtx.startRendering();
  }

  // Render SFX directly onto an OfflineAudioContext node for export
  public renderSfxToContext(
    offlineCtx: BaseAudioContext,
    dest: AudioNode,
    sfxType: SfxType | string,
    startTime: number,
    volume: number = 0.8
  ) {
    if (!sfxType || sfxType === 'none') return;
    const vol = Math.max(0, Math.min(1.2, volume));

    switch (sfxType) {
      case 'whoosh':
        this.synthWhoosh(offlineCtx, dest, startTime, vol);
        break;
      case 'boom_impact':
        this.synthBoomImpact(offlineCtx, dest, startTime, vol);
        break;
      case 'riser':
        this.synthRiser(offlineCtx, dest, startTime, vol);
        break;
      case 'bass_drop':
        this.synthBassDrop(offlineCtx, dest, startTime, vol);
        break;
      case 'shutter':
        this.synthShutter(offlineCtx, dest, startTime, vol);
        break;
      case 'typewriter':
        this.synthTypewriter(offlineCtx, dest, startTime, vol);
        break;
      case 'cyber_beep':
        this.synthCyberBeep(offlineCtx, dest, startTime, vol);
        break;
      case 'laser':
        this.synthLaser(offlineCtx, dest, startTime, vol);
        break;
      case 'glitch':
        this.synthGlitch(offlineCtx, dest, startTime, vol);
        break;
      case 'bell':
        this.synthCrystalBell(offlineCtx, dest, startTime, vol);
        break;
      case 'magic_sparkle':
        this.synthMagicSparkle(offlineCtx, dest, startTime, vol);
        break;
      case 'applause':
        this.synthApplause(offlineCtx, dest, startTime, vol);
        break;
      case 'ambient_nature':
        this.synthNatureWind(offlineCtx, dest, startTime, vol);
        break;
      default:
        this.synthWhoosh(offlineCtx, dest, startTime, vol);
        break;
    }
  }
}

export const audioEngine = new AudioEngine();
