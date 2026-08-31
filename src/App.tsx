/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScriptPanel } from './components/ScriptPanel';
import { VideoPlayer } from './components/VideoPlayer';
import { TimelineScenes } from './components/TimelineScenes';
import { TemplateModal } from './components/TemplateModal';
import { ExportModal } from './components/ExportModal';
import { VoiceStudioModal } from './components/VoiceStudioModal';
import { ResearchSourceModal } from './components/ResearchSourceModal';
import { GenerationProgressModal, GenerationProgressState } from './components/GenerationProgressModal';
import { VideoProject, Scene, AspectRatio, VideoStylePreset, VoiceConfig, StockAsset, ResearchFact } from './types';
import { SCRIPT_TEMPLATES, ScriptTemplate } from './data/templates';
import { TTSService } from './services/ttsService';
import { videoRenderer } from './services/videoRenderer';
import { Edit3, Play, ListOrdered } from 'lucide-react';

const INITIAL_TEMPLATE = SCRIPT_TEMPLATES[0];

export default function App() {
  // Main Project State
  const [project, setProject] = useState<VideoProject>(() => {
    return {
      id: 'proj-' + Date.now(),
      title: INITIAL_TEMPLATE.title,
      originalScript: INITIAL_TEMPLATE.script,
      stylePreset: INITIAL_TEMPLATE.stylePreset,
      aspectRatio: INITIAL_TEMPLATE.aspectRatio,
      language: 'vi',
      voiceSettings: {
        voiceId: 'vbee-manhdung',
        voiceName: 'Mạnh Dũng (Hà Nội - Nam)',
        provider: 'vbee',
        gender: 'male',
        accent: 'bac_bo',
        lang: 'vi',
        pitch: 0.0,
        rate: 1.0,
        stability: 0.88,
        claritySimilarity: 0.95,
        styleExaggeration: 0.3,
        emotionTone: 'authoritative',
        engine: 'vbee',
        audioFx: {
          equalizer: 'studio',
          reverb: 0,
          compression: true,
        },
      },
      sfxSettings: {
        enabled: true,
        masterVolume: 0.75,
        stylePreset: 'auto',
        customInstructions: '',
      },
      bgMusic: {
        trackId: 'cinematic-ambient',
        volume: 0.25,
        ducking: true,
      },
      captionStyle: {
        theme: 'tiktok_yellow',
        fontSize: 28,
        position: 'bottom',
        showBackground: true,
      },
      scenes: INITIAL_TEMPLATE.initialScenes.map((s, idx) => ({
        id: 'scene-' + idx + '-' + Date.now(),
        order: idx + 1,
        narration: s.narration,
        visualPrompt: s.visualPrompt,
        visualUrl: s.visualUrl,
        duration: s.duration,
        cameraMotion: s.cameraMotion,
        transition: 'crossfade',
        sfx: s.sfx,
        sfxType: s.sfxType,
        sfxTiming: s.sfxTiming || 'start',
        sfxVolume: 0.85,
      })),
    };
  });

  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [researchTargetScene, setResearchTargetScene] = useState<Scene | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  // Export States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Mobile layout tab switcher
  const [mobileTab, setMobileTab] = useState<'script' | 'player' | 'timeline'>('player');

  // Preload and generate voiceover buffers on mount
  useEffect(() => {
    // Generate initial voiceover audio for scenes
    const initVoiceovers = async () => {
      const updatedScenes = [...project.scenes];
      let hasChanges = false;

      for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (!scene.audioBuffer && scene.narration) {
          const res = await TTSService.generateVoiceover(scene.narration, project.voiceSettings);
          updatedScenes[i] = {
            ...scene,
            audioBuffer: res.audioBuffer,
            audioUrl: res.audioUrl,
            subtitleWords: res.subtitleWords,
          };
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setProject(prev => ({ ...prev, scenes: updatedScenes }));
      }
    };

    initVoiceovers();
  }, []);

  // Update Project Helper
  const handleUpdateProject = (updates: Partial<VideoProject>) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  // Update Aspect Ratio
  const handleUpdateAspectRatio = (ratio: AspectRatio) => {
    setProject(prev => ({ ...prev, aspectRatio: ratio }));
  };

  // Select Template
  const handleSelectTemplate = (template: ScriptTemplate) => {
    const newScenes: Scene[] = template.initialScenes.map((s, idx) => ({
      id: 'scene-' + idx + '-' + Date.now(),
      order: idx + 1,
      narration: s.narration,
      visualPrompt: s.visualPrompt,
      visualUrl: s.visualUrl,
      duration: s.duration,
      cameraMotion: s.cameraMotion,
      transition: 'crossfade',
      sfx: s.sfx || 'Whoosh chuyển cảnh',
      sfxType: s.sfxType || 'whoosh',
      sfxTiming: s.sfxTiming || 'start',
      sfxVolume: 0.85,
    }));

    setProject(prev => ({
      ...prev,
      title: template.title,
      originalScript: template.script,
      stylePreset: template.stylePreset,
      aspectRatio: template.aspectRatio,
      scenes: newScenes,
    }));
    setActiveSceneIndex(0);

    // Generate voiceovers in background
    setTimeout(async () => {
      for (let i = 0; i < newScenes.length; i++) {
        const res = await TTSService.generateVoiceover(newScenes[i].narration, project.voiceSettings);
        setProject(p => {
          const scenes = [...p.scenes];
          if (scenes[i]) {
            scenes[i] = {
              ...scenes[i],
              audioBuffer: res.audioBuffer,
              audioUrl: res.audioUrl,
              subtitleWords: res.subtitleWords,
            };
          }
          return { ...p, scenes };
        });
      }
    }, 100);
  };

  // AI Storyboard, Sound Design & Voiceover Full Pipeline Generation
  const handleGenerateStoryboard = async (
    script: string, 
    stylePreset: VideoStylePreset,
    sfxPreferences?: string,
    sfxStylePreset?: string,
    bgmPreferences?: string,
    bgmTrackId?: string
  ) => {
    setIsGenerating(true);
    setGenerationStep('Gemini AI đang phân tích kịch bản, thiết kế âm thanh SFX & nhạc nền BGM...');

    try {
      // 1. Call Backend to generate scenes with intelligent audio design
      const res = await fetch('/api/storyboard/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          stylePreset,
          aspectRatio: project.aspectRatio,
          language: project.language,
          sfxPreferences: sfxPreferences || project.sfxSettings?.customInstructions,
          sfxStylePreset: sfxStylePreset || project.sfxSettings?.stylePreset,
          bgmPreferences: bgmPreferences || project.bgMusic?.customInstructions,
          bgmTrackId: bgmTrackId || project.bgMusic.trackId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi tạo phân cảnh');
      }

      const data = await res.json();
      const rawScenes: any[] = data.scenes || [];
      const title: string = data.title || project.title;

      setGenerationStep('Đang khởi tạo hình ảnh, âm thanh SFX & giọng lồng tiếng AI...');

      // 2. Build new scene list with curated or generated visuals + SFX attributes
      const initialScenes: Scene[] = rawScenes.map((s, idx) => {
        // Find matching curated image fallback based on style or index
        const fallbackImgs = SCRIPT_TEMPLATES[0].initialScenes.map(sc => sc.visualUrl);
        const visualUrl = fallbackImgs[idx % fallbackImgs.length];

        return {
          id: 'scene-' + idx + '-' + Date.now(),
          order: idx + 1,
          narration: s.narration,
          visualPrompt: s.visualPrompt,
          visualUrl: visualUrl,
          duration: Math.max(3.5, s.duration || 5),
          cameraMotion: s.cameraMotion || 'zoom-in',
          transition: s.transition || 'crossfade',
          sfx: s.sfx || 'Whoosh chuyển cảnh điện ảnh',
          sfxType: s.sfxType || 'whoosh',
          sfxTiming: s.sfxTiming || 'start',
          sfxVolume: s.sfxVolume ?? 0.85,
          isGeneratingVisual: true,
          isGeneratingAudio: true,
        };
      });

      setProject(prev => ({
        ...prev,
        title,
        originalScript: script,
        stylePreset,
        scenes: initialScenes,
        bgMusic: {
          ...prev.bgMusic,
          trackId: data.recommendedBgmTrackId || prev.bgMusic.trackId,
          volume: data.recommendedBgmVolume ?? prev.bgMusic.volume,
          ducking: data.recommendedDucking ?? prev.bgMusic.ducking,
          mood: data.recommendedBgmMood,
        },
      }));
      setActiveSceneIndex(0);

      // 3. Concurrently generate TTS voiceovers and scene images
      for (let i = 0; i < initialScenes.length; i++) {
        const scene = initialScenes[i];
        setGenerationStep(`Đang lồng tiếng AI cho phân cảnh ${i + 1}/${initialScenes.length}...`);

        // Generate Voiceover
        try {
          const ttsResult = await TTSService.generateVoiceover(scene.narration, project.voiceSettings);
          setProject(p => {
            const scs = [...p.scenes];
            if (scs[i]) {
              scs[i] = {
                ...scs[i],
                duration: ttsResult.duration,
                audioBuffer: ttsResult.audioBuffer,
                audioUrl: ttsResult.audioUrl,
                subtitleWords: ttsResult.subtitleWords,
                isGeneratingAudio: false,
              };
            }
            return { ...p, scenes: scs };
          });
        } catch (e) {
          console.warn('TTS error on scene', i, e);
        }

        // Try AI Image generation
        try {
          const imgRes = await fetch('/api/image/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visualPrompt: scene.visualPrompt,
              aspectRatio: project.aspectRatio,
            }),
          });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            if (imgData.imageUrl) {
              await videoRenderer.preloadImage(imgData.imageUrl);
              setProject(p => {
                const scs = [...p.scenes];
                if (scs[i]) {
                  scs[i] = {
                    ...scs[i],
                    visualUrl: imgData.imageUrl,
                    isGeneratingVisual: false,
                  };
                }
                return { ...p, scenes: scs };
              });
            }
          }
        } catch (e) {
          console.warn('Image generation fallback for scene', i, e);
        }

        // Clear generating flags
        setProject(p => {
          const scs = [...p.scenes];
          if (scs[i]) {
            scs[i] = {
              ...scs[i],
              isGeneratingVisual: false,
              isGeneratingAudio: false,
            };
          }
          return { ...p, scenes: scs };
        });
      }
    } catch (err: any) {
      console.error('Error generating storyboard:', err);
      alert(err.message || 'Có lỗi xảy ra khi tạo video kịch bản AI.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Update Individual Scene
  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => (s.id === sceneId ? { ...s, ...updates } : s)),
    }));
  };

  // Add Scene
  const handleAddScene = (afterIndex: number) => {
    const newScene: Scene = {
      id: 'scene-' + Date.now(),
      order: afterIndex + 2,
      narration: 'Nội dung phân cảnh mới...',
      visualPrompt: 'Cinematic landscape at sunset, photorealistic 8k',
      visualUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      duration: 5.0,
      cameraMotion: 'zoom-in',
      transition: 'crossfade',
    };

    const newScenes = [...project.scenes];
    newScenes.splice(afterIndex + 1, 0, newScene);
    // Re-index orders
    newScenes.forEach((s, idx) => {
      s.order = idx + 1;
    });

    setProject(prev => ({ ...prev, scenes: newScenes }));
    setActiveSceneIndex(afterIndex + 1);
  };

  // Delete Scene
  const handleDeleteScene = (sceneId: string) => {
    if (project.scenes.length <= 1) return;
    const newScenes = project.scenes.filter(s => s.id !== sceneId);
    newScenes.forEach((s, idx) => {
      s.order = idx + 1;
    });
    setProject(prev => ({ ...prev, scenes: newScenes }));
    setActiveSceneIndex(prev => Math.min(prev, newScenes.length - 1));
  };

  // Move Scene
  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.scenes.length) return;

    const newScenes = [...project.scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[targetIndex];
    newScenes[targetIndex] = temp;

    newScenes.forEach((s, idx) => {
      s.order = idx + 1;
    });

    setProject(prev => ({ ...prev, scenes: newScenes }));
    setActiveSceneIndex(targetIndex);
  };

  // Regenerate Scene Visual
  const handleRegenerateSceneVisual = async (scene: Scene) => {
    handleUpdateScene(scene.id, { isGeneratingVisual: true });
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualPrompt: scene.visualPrompt,
          aspectRatio: project.aspectRatio,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          await videoRenderer.preloadImage(data.imageUrl);
          handleUpdateScene(scene.id, {
            visualUrl: data.imageUrl,
            isGeneratingVisual: false,
          });
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    handleUpdateScene(scene.id, { isGeneratingVisual: false });
  };

  // Regenerate Scene Voiceover
  const handleRegenerateSceneVoice = async (scene: Scene) => {
    handleUpdateScene(scene.id, { isGeneratingAudio: true });
    try {
      const tts = await TTSService.generateVoiceover(scene.narration, project.voiceSettings);
      handleUpdateScene(scene.id, {
        duration: tts.duration,
        audioBuffer: tts.audioBuffer,
        audioUrl: tts.audioUrl,
        subtitleWords: tts.subtitleWords,
        isGeneratingAudio: false,
      });
    } catch (e) {
      console.error(e);
      handleUpdateScene(scene.id, { isGeneratingAudio: false });
    }
  };

  // Save Voice Configuration & optionally update active voice
  const handleSaveVoiceConfig = (newVoiceConfig: VoiceConfig) => {
    setProject((prev) => ({
      ...prev,
      voiceSettings: newVoiceConfig,
    }));
  };

  // Re-generate TTS audio for all scenes using the customized ElevenLabs profile
  const handleApplyVoiceToAllScenes = async () => {
    const scenes = [...project.scenes];
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].narration) {
        try {
          const tts = await TTSService.generateVoiceover(scenes[i].narration, project.voiceSettings);
          scenes[i] = {
            ...scenes[i],
            duration: tts.duration,
            audioBuffer: tts.audioBuffer,
            audioUrl: tts.audioUrl,
            subtitleWords: tts.subtitleWords,
          };
        } catch (e) {
          console.error(e);
        }
      }
    }
    setProject((prev) => ({ ...prev, scenes }));
  };

  // Apply a selected Stock Asset (Video / Photo) to a Scene
  const handleApplyAssetToScene = (sceneId: string, asset: StockAsset) => {
    if (asset.type === 'video') {
      videoRenderer.preloadVideo(asset.url);
      handleUpdateScene(sceneId, {
        mediaType: 'video',
        videoUrl: asset.url,
        visualUrl: asset.thumbnailUrl || asset.url,
        sourceInfo: {
          title: asset.title,
          source: asset.source,
          author: asset.author,
        },
      });
    } else {
      videoRenderer.preloadImage(asset.url);
      handleUpdateScene(sceneId, {
        mediaType: 'image',
        visualUrl: asset.url,
        videoUrl: undefined,
        sourceInfo: {
          title: asset.title,
          source: asset.source,
          author: asset.author,
        },
      });
    }
  };

  // 1-Click Auto-Populate all scenes with matched video/photo assets & research citations
  const handleAutoPopulateAllScenes = (recommendedAssets: StockAsset[], facts: ResearchFact[]) => {
    const updatedScenes = project.scenes.map((sc, idx) => {
      const asset = recommendedAssets[idx % recommendedAssets.length];
      if (asset) {
        if (asset.type === 'video') {
          videoRenderer.preloadVideo(asset.url);
          return {
            ...sc,
            mediaType: 'video' as const,
            videoUrl: asset.url,
            visualUrl: asset.thumbnailUrl || asset.url,
            sourceInfo: {
              title: asset.title,
              source: asset.source,
              author: asset.author,
            },
          };
        } else {
          videoRenderer.preloadImage(asset.url);
          return {
            ...sc,
            mediaType: 'image' as const,
            visualUrl: asset.url,
            videoUrl: undefined,
            sourceInfo: {
              title: asset.title,
              source: asset.source,
              author: asset.author,
            },
          };
        }
      }
      return sc;
    });

    setProject((prev) => ({ ...prev, scenes: updatedScenes }));
  };

  // Insert verified research fact into a scene's narration and regenerate its voiceover
  const handleInsertFactIntoNarration = async (sceneId: string, factText: string) => {
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    const newNarration = `${scene.narration} Theo tư liệu khoa học, ${factText}`;
    handleUpdateScene(sceneId, { narration: newNarration, isGeneratingAudio: true });

    try {
      const tts = await TTSService.generateVoiceover(newNarration, project.voiceSettings);
      handleUpdateScene(sceneId, {
        narration: newNarration,
        duration: tts.duration,
        audioBuffer: tts.audioBuffer,
        audioUrl: tts.audioUrl,
        subtitleWords: tts.subtitleWords,
        isGeneratingAudio: false,
      });
    } catch {
      handleUpdateScene(sceneId, { isGeneratingAudio: false });
    }
  };

  // Update Language
  const handleUpdateLanguage = (lang: any) => {
    setProject(prev => ({
      ...prev,
      language: lang,
      voiceSettings: {
        ...prev.voiceSettings,
        lang,
      },
    }));
  };

  // 1-Click AI Auto-Dubbing: Translate scenes & regenerate localized voiceovers
  const handleAutoDubbing = async (targetLanguage: any) => {
    if (project.scenes.length === 0) return;
    setIsGenerating(true);
    setGenerationStep(`AI đang dịch và chuyển ngữ kịch bản sang ngôn ngữ mới...`);

    try {
      const res = await fetch('/api/dubbing/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          scenes: project.scenes,
          targetLanguage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi dịch thuật lồng tiếng');
      }

      const data = await res.json();
      const translatedScenesMap = new Map<string, string>();
      (data.translatedScenes || []).forEach((ts: { id: string; narration: string }) => {
        translatedScenesMap.set(ts.id, ts.narration);
      });

      const updatedVoiceSettings: VoiceConfig = {
        ...project.voiceSettings,
        lang: targetLanguage,
      };

      const updatedScenes = [...project.scenes];

      // Update text and regenerate audio for each scene
      for (let i = 0; i < updatedScenes.length; i++) {
        const sc = updatedScenes[i];
        const newNarration = translatedScenesMap.get(sc.id) || sc.narration;
        setGenerationStep(`Đang lồng tiếng AI phân cảnh ${i + 1}/${updatedScenes.length}...`);

        try {
          const ttsRes = await TTSService.generateVoiceover(newNarration, updatedVoiceSettings);
          updatedScenes[i] = {
            ...sc,
            narration: newNarration,
            duration: ttsRes.duration,
            audioBuffer: ttsRes.audioBuffer,
            audioUrl: ttsRes.audioUrl,
            subtitleWords: ttsRes.subtitleWords,
          };
        } catch {
          updatedScenes[i] = {
            ...sc,
            narration: newNarration,
          };
        }
      }

      setProject(prev => ({
        ...prev,
        title: data.translatedTitle || prev.title,
        language: targetLanguage,
        voiceSettings: updatedVoiceSettings,
        scenes: updatedScenes,
      }));
    } catch (err: any) {
      console.error('Error auto-dubbing project:', err);
      alert(err.message || 'Có lỗi xảy ra khi lồng tiếng đa ngôn ngữ.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Export Video Handler
  const handleExportVideo = async () => {
    setIsExportModalOpen(true);
    setExportProgress(0.02);
    setExportStatusText('Đang khởi tạo trình dựng video...');
    setExportedBlob(null);
    setExportedUrl(null);
    setExportError(null);

    try {
      const blob = await videoRenderer.exportVideo(project, (prog, text) => {
        setExportProgress(prog);
        setExportStatusText(text);
      });

      const url = URL.createObjectURL(blob);
      setExportedBlob(blob);
      setExportedUrl(url);
    } catch (err: any) {
      console.error('Export video error:', err);
      setExportError(err.message || 'Có lỗi xảy ra khi xuất video.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* 1. Header */}
      <Header
        project={project}
        onUpdateAspectRatio={handleUpdateAspectRatio}
        onUpdateLanguage={handleUpdateLanguage}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
        onExportVideo={handleExportVideo}
        isExporting={isExportModalOpen && !exportedBlob && !exportError}
        exportProgress={exportProgress}
      />

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 p-1">
        <button
          type="button"
          onClick={() => setMobileTab('script')}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileTab === 'script' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Kịch bản & AI</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('player')}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileTab === 'player' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Trình phát Video</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('timeline')}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileTab === 'timeline' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Phân cảnh ({project.scenes.length})</span>
        </button>
      </div>

      {/* 2. Main Studio 3-Column Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Script & AI Generation Settings */}
        <section className={`lg:col-span-3 h-full overflow-hidden ${
          mobileTab === 'script' ? 'block' : 'hidden lg:block'
        }`}>
          <ScriptPanel
            project={project}
            onUpdateProject={handleUpdateProject}
            onGenerateStoryboard={handleGenerateStoryboard}
            onAutoDubbing={handleAutoDubbing}
            onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
            onOpenResearchSources={() => {
              setResearchTargetScene(project.scenes[activeSceneIndex]);
              setIsResearchModalOpen(true);
            }}
            isGenerating={isGenerating}
            generationStep={generationStep}
          />
        </section>

        {/* Center Column: Synchronized Video Player Canvas */}
        <section className={`lg:col-span-5 h-full overflow-hidden ${
          mobileTab === 'player' ? 'block' : 'hidden lg:block'
        }`}>
          <VideoPlayer
            project={project}
            onUpdateProject={handleUpdateProject}
            activeSceneIndex={activeSceneIndex}
            onSelectScene={setActiveSceneIndex}
          />
        </section>

        {/* Right Column: Scene Storyboard & Timeline Editor */}
        <section className={`lg:col-span-4 h-full overflow-hidden ${
          mobileTab === 'timeline' ? 'block' : 'hidden lg:block'
        }`}>
          <TimelineScenes
            project={project}
            activeSceneIndex={activeSceneIndex}
            onSelectScene={setActiveSceneIndex}
            onUpdateScene={handleUpdateScene}
            onAddScene={handleAddScene}
            onDeleteScene={handleDeleteScene}
            onMoveScene={handleMoveScene}
            onRegenerateSceneVisual={handleRegenerateSceneVisual}
            onRegenerateSceneVoice={handleRegenerateSceneVoice}
            onOpenResearchSources={(scene) => {
              setResearchTargetScene(scene);
              setIsResearchModalOpen(true);
            }}
            onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
          />
        </section>
      </main>

      {/* 3. Template Selection Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* 4. ElevenLabs Voice Studio Modal */}
      <VoiceStudioModal
        isOpen={isVoiceStudioOpen}
        onClose={() => setIsVoiceStudioOpen(false)}
        voiceConfig={project.voiceSettings}
        onSaveVoiceConfig={handleSaveVoiceConfig}
        onApplyToAllScenes={handleApplyVoiceToAllScenes}
      />

      {/* 5. AI Research & Stock Media Hunter Modal */}
      <ResearchSourceModal
        isOpen={isResearchModalOpen}
        onClose={() => setIsResearchModalOpen(false)}
        targetScene={researchTargetScene || project.scenes[activeSceneIndex]}
        allScenes={project.scenes}
        script={project.originalScript}
        language={project.language}
        onApplyAssetToScene={handleApplyAssetToScene}
        onAutoPopulateAllScenes={handleAutoPopulateAllScenes}
        onInsertFactIntoNarration={handleInsertFactIntoNarration}
      />

      {/* 6. Export Video Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportedBlob(null);
          setExportedUrl(null);
        }}
        progress={exportProgress}
        statusText={exportStatusText}
        videoBlob={exportedBlob}
        videoUrl={exportedUrl}
        projectTitle={project.title}
        error={exportError}
      />
    </div>
  );
}
