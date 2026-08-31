import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Type, 
  Sparkles,
  Layers,
  Eye,
  Settings2
} from 'lucide-react';
import { VideoProject, CaptionTheme, Scene } from '../types';
import { videoRenderer } from '../services/videoRenderer';
import { audioEngine } from '../services/audioEngine';
import { TTSService } from '../services/ttsService';

interface VideoPlayerProps {
  project: VideoProject;
  onUpdateProject: (updates: Partial<VideoProject>) => void;
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
}

const CAPTION_THEMES: { id: CaptionTheme; label: string; icon: string }[] = [
  { id: 'tiktok_yellow', label: 'TikTok Vàng', icon: '⚡' },
  { id: 'cinematic_minimal', label: 'Điện ảnh Tinh gọn', icon: '🎬' },
  { id: 'neon_cyber', label: 'Neon Cyber', icon: '🌐' },
  { id: 'karaoke_glow', label: 'Karaoke Phát sáng', icon: '🎤' },
  { id: 'bold_banner', label: 'Banner Nền đen', icon: '⬛' },
];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  project,
  onUpdateProject,
  activeSceneIndex,
  onSelectScene,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptionMenu, setShowCaptionMenu] = useState(false);

  const totalDuration = project.scenes.reduce((acc, s) => acc + s.duration, 0);

  // Playback refs for requestAnimationFrame loop
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const activeVoiceCtrlRef = useRef<{ stop: () => void } | null>(null);
  const currentSceneIndexRef = useRef(0);

  isPlayingRef.current = isPlaying;
  currentTimeRef.current = currentTime;

  // Preload scene visuals whenever scenes update
  useEffect(() => {
    project.scenes.forEach((scene) => {
      if (scene.visualUrl) {
        videoRenderer.preloadImage(scene.visualUrl);
      }
    });
  }, [project.scenes]);

  // Determine current active scene index from currentTime
  const getSceneIndexAtTime = useCallback((time: number): number => {
    let acc = 0;
    for (let i = 0; i < project.scenes.length; i++) {
      if (time >= acc && time < acc + project.scenes[i].duration) {
        return i;
      }
      acc += project.scenes[i].duration;
    }
    return Math.max(0, project.scenes.length - 1);
  }, [project.scenes]);

  // Render a single frame
  const renderCanvas = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    videoRenderer.drawFrame(ctx, project, time, canvas.width, canvas.height);
  }, [project]);

  // Handle play scene voice and SFX
  const triggerSceneVoice = useCallback((sceneIndex: number) => {
    if (activeVoiceCtrlRef.current) {
      activeVoiceCtrlRef.current.stop();
      activeVoiceCtrlRef.current = null;
    }

    const scene = project.scenes[sceneIndex];
    if (!scene) return;

    if (!isMuted) {
      // 1. Play Scene Voiceover
      if (scene.narration) {
        audioEngine.setDucking(true);
        const ctrl = TTSService.playVoice(
          scene.narration,
          scene.audioBuffer,
          scene.audioUrl,
          project.voiceSettings,
          () => {
            audioEngine.setDucking(false);
          }
        );
        activeVoiceCtrlRef.current = ctrl;
      }

      // 2. Play Scene SFX
      const isSfxEnabled = project.sfxSettings?.enabled !== false;
      if (isSfxEnabled && scene.sfxType && scene.sfxType !== 'none') {
        const masterVol = project.sfxSettings?.masterVolume ?? 0.75;
        const sfxVol = (scene.sfxVolume ?? 0.8) * masterVol;
        audioEngine.playSfx(scene.sfxType, sfxVol);
      }
    }
  }, [project.scenes, project.voiceSettings, project.sfxSettings, isMuted]);

  // Main playback animation loop
  useEffect(() => {
    let animationFrameId: number;

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlayingRef.current && totalDuration > 0) {
        let nextTime = currentTimeRef.current + delta;
        if (nextTime >= totalDuration) {
          nextTime = 0;
          setIsPlaying(false);
          isPlayingRef.current = false;
          audioEngine.stopBgm();
          if (activeVoiceCtrlRef.current) {
            activeVoiceCtrlRef.current.stop();
          }
        }

        currentTimeRef.current = nextTime;
        setCurrentTime(nextTime);

        // Check if scene changed
        const newSceneIndex = getSceneIndexAtTime(nextTime);
        if (newSceneIndex !== currentSceneIndexRef.current) {
          currentSceneIndexRef.current = newSceneIndex;
          onSelectScene(newSceneIndex);
          triggerSceneVoice(newSceneIndex);
        }
      }

      renderCanvas(currentTimeRef.current);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [totalDuration, getSceneIndexAtTime, onSelectScene, triggerSceneVoice, renderCanvas]);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (project.scenes.length === 0) return;

    if (isPlaying) {
      setIsPlaying(false);
      audioEngine.stopBgm();
      if (activeVoiceCtrlRef.current) {
        activeVoiceCtrlRef.current.stop();
      }
    } else {
      audioEngine.init();
      if (!isMuted) {
        audioEngine.startBgm(project.bgMusic.trackId);
        audioEngine.setBgmVolume(project.bgMusic.volume);
      }
      setIsPlaying(true);
      lastTimeRef.current = null;

      // Start voice for current scene
      const curIdx = getSceneIndexAtTime(currentTime);
      currentSceneIndexRef.current = curIdx;
      triggerSceneVoice(curIdx);
    }
  };

  // Seek timeline
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    currentTimeRef.current = time;
    const newIdx = getSceneIndexAtTime(time);
    currentSceneIndexRef.current = newIdx;
    onSelectScene(newIdx);
    if (isPlaying) {
      triggerSceneVoice(newIdx);
    }
    renderCanvas(time);
  };

  // Seek relative
  const handleSeekDelta = (seconds: number) => {
    const nextTime = Math.max(0, Math.min(totalDuration, currentTime + seconds));
    setCurrentTime(nextTime);
    currentTimeRef.current = nextTime;
    const newIdx = getSceneIndexAtTime(nextTime);
    currentSceneIndexRef.current = newIdx;
    onSelectScene(newIdx);
    if (isPlaying) {
      triggerSceneVoice(newIdx);
    }
    renderCanvas(nextTime);
  };

  // Fullscreen
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Calculate canvas aspect ratio styles
  const getCanvasDimensions = () => {
    if (project.aspectRatio === '9:16') {
      return { width: 720, height: 1280, aspectClass: 'aspect-[9/16] max-h-[580px]' };
    }
    if (project.aspectRatio === '1:1') {
      return { width: 1080, height: 1080, aspectClass: 'aspect-square max-h-[580px]' };
    }
    return { width: 1280, height: 720, aspectClass: 'aspect-video max-h-[580px]' };
  };

  const { width, height, aspectClass } = getCanvasDimensions();

  // Resize canvas when aspect ratio changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      renderCanvas(currentTime);
    }
  }, [width, height, project.aspectRatio, renderCanvas, currentTime]);

  return (
    <div className="h-full flex flex-col bg-slate-950 p-4 sm:p-5 overflow-y-auto">
      {/* Top Player Status Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-200 truncate max-w-xs sm:max-w-md">
            {project.title || 'Video Xem Trước'}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            (Cảnh {activeSceneIndex + 1}/{Math.max(1, project.scenes.length)})
          </span>
        </div>

        {/* Subtitle Style Quick Switcher Toggle */}
        <div className="relative">
          <button
            id="btn-caption-style-menu"
            type="button"
            onClick={() => setShowCaptionMenu(!showCaptionMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-all shadow-sm"
          >
            <Type className="w-3.5 h-3.5 text-yellow-400" />
            <span>Phụ đề: {CAPTION_THEMES.find(t => t.id === project.captionStyle.theme)?.label}</span>
          </button>

          {showCaptionMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-2 z-50 space-y-1">
              <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Kiểu Chữ Phụ Đề Karaoke
              </div>
              {CAPTION_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    onUpdateProject({
                      captionStyle: {
                        ...project.captionStyle,
                        theme: theme.id,
                      },
                    });
                    setShowCaptionMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    project.captionStyle.theme === theme.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{theme.icon}</span>
                    <span>{theme.label}</span>
                  </span>
                </button>
              ))}

              <div className="border-t border-slate-800 my-1 pt-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">Vị trí hiển thị:</div>
                <div className="grid grid-cols-3 gap-1 px-1">
                  {(['top', 'middle', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => {
                        onUpdateProject({
                          captionStyle: {
                            ...project.captionStyle,
                            position: pos,
                          },
                        });
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        project.captionStyle.position === pos
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pos === 'bottom' ? 'Dưới' : pos === 'middle' ? 'Giữa' : 'Trên'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Video Canvas Frame */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-slate-950/80 rounded-2xl border border-slate-800/80 p-2 sm:p-4 min-h-[360px] relative overflow-hidden group shadow-2xl"
      >
        <div className={`relative ${aspectClass} rounded-xl overflow-hidden shadow-2xl border border-slate-800/60 flex items-center justify-center bg-slate-950`}>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />

          {/* Big Play Overlay when paused */}
          {!isPlaying && project.scenes.length > 0 && (
            <button
              id="btn-overlay-play"
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/50 backdrop-blur-sm border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer z-20"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}

          {/* Active scene badge overlay */}
          <div className="absolute top-3 left-3 bg-slate-950/75 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white/90 flex items-center gap-1.5 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>Phân cảnh {activeSceneIndex + 1}: {project.scenes[activeSceneIndex]?.cameraMotion || 'zoom-in'}</span>
          </div>

          {/* Active SFX badge overlay if scene has SFX */}
          {project.scenes[activeSceneIndex]?.sfx && project.scenes[activeSceneIndex]?.sfxType !== 'none' && (
            <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-purple-500/30 px-2.5 py-1 rounded-lg text-[11px] font-medium text-purple-300 flex items-center gap-1.5 pointer-events-none shadow-sm animate-fade-in">
              <span className="text-xs">🔊</span>
              <span className="truncate max-w-[180px]">{project.scenes[activeSceneIndex]?.sfx}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Timeline Controls */}
      <div className="mt-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3 sm:p-4 space-y-3 shadow-xl">
        {/* Timeline Scrubber */}
        <div className="space-y-1.5">
          <div className="relative flex items-center">
            <input
              id="timeline-scrubber"
              type="range"
              min="0"
              max={Math.max(0.1, totalDuration)}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Time & Scenes Breakdown */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-200 font-bold">{currentTime.toFixed(1)}s</span>
              <span>/</span>
              <span>{totalDuration.toFixed(1)}s</span>
            </div>
            <div className="flex items-center gap-1">
              {project.scenes.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    let acc = 0;
                    for (let i = 0; i < idx; i++) acc += project.scenes[i].duration;
                    setCurrentTime(acc);
                    currentTimeRef.current = acc;
                    onSelectScene(idx);
                    renderCanvas(acc);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    idx === activeSceneIndex
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Cảnh ${idx + 1} (${s.duration}s)`}
                >
                  Cảnh {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Player Buttons Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              id="btn-rewind-5"
              type="button"
              onClick={() => handleSeekDelta(-3)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Lùi 3 giây"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="btn-main-play-pause"
              type="button"
              onClick={togglePlay}
              className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              id="btn-forward-5"
              type="button"
              onClick={() => handleSeekDelta(3)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Tiến 3 giây"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Mute/Unmute */}
            <button
              id="btn-toggle-mute"
              type="button"
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                if (nextMute) {
                  audioEngine.stopBgm();
                  if (activeVoiceCtrlRef.current) activeVoiceCtrlRef.current.stop();
                } else if (isPlaying) {
                  audioEngine.startBgm(project.bgMusic.trackId);
                }
              }}
              className={`p-2 rounded-xl border transition-all ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
              title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-fullscreen"
              type="button"
              onClick={handleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Toàn màn hình"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
