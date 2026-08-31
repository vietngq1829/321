import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Volume2, 
  Image as ImageIcon, 
  MoveUp, 
  MoveDown, 
  Clock, 
  Video, 
  Camera, 
  RefreshCw,
  Edit3,
  Play,
  Music2,
  VolumeX
} from 'lucide-react';
import { Scene, CameraMotion, SfxType, VideoProject } from '../types';
import { SFX_PRESETS, audioEngine } from '../services/audioEngine';

interface TimelineScenesProps {
  project: VideoProject;
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onAddScene: (afterIndex: number) => void;
  onDeleteScene: (sceneId: string) => void;
  onMoveScene: (index: number, direction: 'up' | 'down') => void;
  onRegenerateSceneVisual: (scene: Scene) => Promise<void>;
  onRegenerateSceneVoice: (scene: Scene) => Promise<void>;
  onOpenResearchSources?: (scene: Scene) => void;
  onOpenVoiceStudio?: () => void;
}

const CAMERA_MOTIONS: { id: CameraMotion; label: string; icon: string }[] = [
  { id: 'zoom-in', label: 'Thu phóng vào (Zoom In)', icon: '🔍' },
  { id: 'zoom-out', label: 'Thu phóng ra (Zoom Out)', icon: '🔎' },
  { id: 'pan-left', label: 'Quét sang trái (Pan Left)', icon: '⬅️' },
  { id: 'pan-right', label: 'Quét sang phải (Pan Right)', icon: '➡️' },
  { id: 'subtle-drift', label: 'Trôi góc máy (Drift)', icon: '🌊' },
  { id: 'static', label: 'Cố định (Static)', icon: '⏹️' },
];

export const TimelineScenes: React.FC<TimelineScenesProps> = ({
  project,
  activeSceneIndex,
  onSelectScene,
  onUpdateScene,
  onAddScene,
  onDeleteScene,
  onMoveScene,
  onRegenerateSceneVisual,
  onRegenerateSceneVoice,
  onOpenResearchSources,
}) => {
  const [editingPromptSceneId, setEditingPromptSceneId] = useState<string | null>(null);
  const [playingSfxSceneId, setPlayingSfxSceneId] = useState<string | null>(null);

  const handlePreviewSfx = (scene: Scene) => {
    if (!scene.sfxType || scene.sfxType === 'none') return;
    setPlayingSfxSceneId(scene.id);
    audioEngine.playSfx(scene.sfxType, scene.sfxVolume ?? 0.85);
    setTimeout(() => {
      setPlayingSfxSceneId(null);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/60 border-l border-slate-800 p-4 sm:p-5 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-400" />
            Phân Cảnh Kịch Bản ({project.scenes.length})
          </h3>
          <p className="text-[11px] text-slate-400">
            Chỉnh sửa chi tiết lời thoại, hình ảnh, âm thanh SFX & chuyển động camera
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-new-scene"
            type="button"
            onClick={() => onAddScene(project.scenes.length - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm cảnh</span>
          </button>
        </div>
      </div>

      {/* Scenes List */}
      <div className="space-y-3.5">
        {project.scenes.map((scene, index) => {
          const isActive = index === activeSceneIndex;
          const isVideoMedia = scene.mediaType === 'video' || !!scene.videoUrl;
          const currentSfxPreset = SFX_PRESETS.find(s => s.id === (scene.sfxType || 'none')) || SFX_PRESETS[0];

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(index)}
              className={`rounded-2xl border transition-all p-3.5 cursor-pointer relative ${
                isActive
                  ? 'bg-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              {/* Scene Card Header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    Phân cảnh {index + 1}
                  </span>

                  {/* Media Type Badge */}
                  {isVideoMedia ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full flex items-center gap-1">
                      <Video className="w-2.5 h-2.5" /> Video B-Roll
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400 rounded-full">
                      Ảnh AI/Stock
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {/* Duration adjust */}
                  <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <input
                      type="number"
                      min="2"
                      max="20"
                      step="0.5"
                      value={scene.duration}
                      onChange={(e) => onUpdateScene(scene.id, { duration: Math.max(2, parseFloat(e.target.value) || 3) })}
                      className="w-10 bg-transparent text-center focus:outline-none text-slate-100 font-bold"
                    />
                    <span>s</span>
                  </div>

                  {/* Move Up/Down */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onMoveScene(index, 'up')}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                    title="Di chuyển lên"
                  >
                    <MoveUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={index === project.scenes.length - 1}
                    onClick={() => onMoveScene(index, 'down')}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                    title="Di chuyển xuống"
                  >
                    <MoveDown className="w-3 h-3" />
                  </button>

                  {/* Delete */}
                  {project.scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteScene(scene.id)}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Xóa cảnh này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Thumbnail & Prompt Preview */}
              <div className="flex gap-3 mb-3" onClick={(e) => e.stopPropagation()}>
                <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 group/img">
                  {scene.visualUrl ? (
                    <img
                      src={scene.visualUrl}
                      alt={`Scene ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  {/* Regenerate Visual Overlay Button */}
                  <button
                    type="button"
                    onClick={() => onRegenerateSceneVisual(scene)}
                    disabled={scene.isGeneratingVisual}
                    className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold text-white transition-opacity gap-1 cursor-pointer"
                  >
                    {scene.isGeneratingVisual ? (
                      <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Tạo lại ảnh</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Visual Prompt info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                      <span>Mô tả hình ảnh (Visual Prompt):</span>
                      <button
                        type="button"
                        onClick={() => setEditingPromptSceneId(editingPromptSceneId === scene.id ? null : scene.id)}
                        className="text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <Edit3 className="w-2.5 h-2.5" /> Sửa
                      </button>
                    </div>

                    {editingPromptSceneId === scene.id ? (
                      <textarea
                        rows={2}
                        value={scene.visualPrompt}
                        onChange={(e) => onUpdateScene(scene.id, { visualPrompt: e.target.value })}
                        className="w-full text-xs bg-slate-950 border border-indigo-500/50 rounded-lg p-1.5 text-slate-200 focus:outline-none"
                      />
                    ) : (
                      <p className="text-xs text-slate-300 line-clamp-2 italic">
                        "{scene.visualPrompt}"
                      </p>
                    )}
                  </div>

                  {/* Camera Motion & Source Hunter Buttons */}
                  <div className="mt-1.5 flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Camera className="w-3 h-3 text-slate-400" />
                      <select
                        value={scene.cameraMotion}
                        onChange={(e) => onUpdateScene(scene.id, { cameraMotion: e.target.value as CameraMotion })}
                        className="bg-slate-950 border border-slate-800 rounded-md px-2 py-0.5 text-[10px] text-slate-300 font-medium focus:outline-none"
                      >
                        {CAMERA_MOTIONS.map((cm) => (
                          <option key={cm.id} value={cm.id}>
                            {cm.icon} {cm.label.split('(')[0]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {onOpenResearchSources && (
                      <button
                        type="button"
                        onClick={() => onOpenResearchSources(scene)}
                        className="px-2 py-0.5 bg-cyan-950/50 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/40 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                        Tìm nguồn ảnh/video
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Source Attribution (if available) */}
              {scene.sourceInfo && (
                <div className="mb-2 px-2.5 py-1 bg-slate-950/60 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span className="truncate">📁 Nguồn: <b className="text-slate-300">{scene.sourceInfo.title}</b> ({scene.sourceInfo.source})</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateScene(scene.id, { sourceInfo: undefined, mediaType: 'image', videoUrl: undefined });
                    }}
                    className="text-slate-500 hover:text-rose-400 ml-2"
                  >
                    Gỡ nguồn
                  </button>
                </div>
              )}

              {/* SFX Sound Effects Customization Bar */}
              <div 
                className="mb-2.5 p-2 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300">
                    <Music2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Hiệu ứng âm thanh (SFX):</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {scene.sfxType && scene.sfxType !== 'none' && (
                      <button
                        type="button"
                        onClick={() => handlePreviewSfx(scene)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                          playingSfxSceneId === scene.id
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-purple-900/60 hover:bg-purple-900 text-purple-200 border border-purple-700/50'
                        }`}
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Thử SFX ({currentSfxPreset.icon})</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {/* SFX Type Selector */}
                  <select
                    value={scene.sfxType || 'whoosh'}
                    onChange={(e) => {
                      const newType = e.target.value as SfxType;
                      const preset = SFX_PRESETS.find(p => p.id === newType);
                      onUpdateScene(scene.id, {
                        sfxType: newType,
                        sfx: preset ? preset.name : scene.sfx,
                      });
                    }}
                    className="w-full bg-slate-950 border border-purple-900/50 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                  >
                    {SFX_PRESETS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>

                  {/* SFX Descriptive Label or custom title */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={scene.sfx || ''}
                      onChange={(e) => onUpdateScene(scene.id, { sfx: e.target.value })}
                      placeholder="Mô tả SFX (ví dụ: Whoosh, Tiếng nổ, v.v.)..."
                      className="w-full bg-slate-950 border border-purple-900/40 rounded-lg px-2 py-1 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none"
                    />

                    {/* SFX Timing dropdown */}
                    <select
                      value={scene.sfxTiming || 'start'}
                      onChange={(e) => onUpdateScene(scene.id, { sfxTiming: e.target.value as 'start' | 'mid' | 'end' })}
                      className="bg-slate-950 border border-purple-900/40 rounded-lg px-1.5 py-1 text-[10px] text-purple-300 focus:outline-none shrink-0"
                    >
                      <option value="start">Đầu cảnh</option>
                      <option value="mid">Giữa cảnh</option>
                      <option value="end">Cuối cảnh</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Narration (Thuyết minh) Input */}
              <div onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-emerald-400" />
                    Lời thuyết minh (Voiceover):
                  </label>

                  <button
                    type="button"
                    onClick={() => onRegenerateSceneVoice(scene)}
                    disabled={scene.isGeneratingAudio || !scene.narration.trim()}
                    className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {scene.isGeneratingAudio ? (
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-2.5 h-2.5" />
                    )}
                    <span>Tạo giọng AI</span>
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={scene.narration}
                  onChange={(e) => onUpdateScene(scene.id, { narration: e.target.value })}
                  placeholder="Nhập lời thoại AI sẽ đọc cho phân cảnh này..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans leading-relaxed"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
