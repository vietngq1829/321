import { Scene, VideoProject, CaptionTheme, AspectRatio } from '../types';
import { audioEngine } from './audioEngine';

export interface RenderState {
  currentSceneIndex: number;
  sceneProgress: number; // 0 to 1
  currentTime: number; // in seconds
  totalDuration: number;
  isPlaying: boolean;
}

export class VideoRenderer {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private videoCache: Map<string, HTMLVideoElement> = new Map();

  // Preload a video URL into HTMLVideoElement
  public async preloadVideo(url: string): Promise<HTMLVideoElement> {
    if (this.videoCache.has(url)) {
      return this.videoCache.get(url)!;
    }

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.muted = true;
      video.loop = true;
      video.preload = 'auto';

      video.onloadeddata = () => {
        this.videoCache.set(url, video);
        video.play().catch(() => {});
        resolve(video);
      };
      video.onerror = () => {
        resolve(video);
      };
      video.src = url;
    });
  }

  // Preload an image URL into HTMLImageElement
  public async preloadImage(url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = () => {
        // Fallback procedural canvas graphic
        const fallback = this.createFallbackImageCanvas('Scene Visual');
        this.imageCache.set(url, fallback);
        resolve(fallback);
      };
      img.src = url;
    });
  }

  private createFallbackImageCanvas(text: string): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;
    
    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 1280, 720);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);

    // Decorative grid
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1280; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
    for (let y = 0; y < 720; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }

    // Text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 640, 360);

    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }

  // Draw a frame on the target canvas
  public drawFrame(
    ctx: CanvasRenderingContext2D,
    project: VideoProject,
    currentTime: number,
    width: number,
    height: number
  ) {
    const scenes = project.scenes;
    if (!scenes || scenes.length === 0) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    // Determine current scene and timing
    let accumulatedTime = 0;
    let currentScene = scenes[0];
    let sceneIndex = 0;
    let sceneStartTime = 0;

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (currentTime >= accumulatedTime && currentTime < accumulatedTime + scene.duration) {
        currentScene = scene;
        sceneIndex = i;
        sceneStartTime = accumulatedTime;
        break;
      }
      accumulatedTime += scene.duration;
      if (i === scenes.length - 1) {
        currentScene = scene;
        sceneIndex = i;
        sceneStartTime = accumulatedTime - scene.duration;
      }
    }

    const sceneElapsed = Math.max(0, currentTime - sceneStartTime);
    const sceneProgress = Math.min(1, Math.max(0, sceneElapsed / currentScene.duration));

    // Clear canvas
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Visual Layer (Video or Image with Ken Burns Motion)
    if (currentScene.mediaType === 'video' && currentScene.videoUrl) {
      let video = this.videoCache.get(currentScene.videoUrl);
      if (!video) {
        this.preloadVideo(currentScene.videoUrl);
        video = this.videoCache.get(currentScene.videoUrl);
      }

      if (video && video.readyState >= 2) {
        // Sync video time
        if (Math.abs(video.currentTime - (sceneElapsed % (video.duration || 10))) > 0.3) {
          video.currentTime = sceneElapsed % (video.duration || 10);
        }
        this.drawVideoKenBurns(ctx, video, currentScene.cameraMotion, sceneProgress, width, height);
      } else {
        const img = this.imageCache.get(currentScene.visualUrl);
        if (img && img.complete) {
          this.drawKenBurns(ctx, img, currentScene.cameraMotion, sceneProgress, width, height);
        } else {
          this.drawPlaceholderBackground(ctx, currentScene, width, height);
        }
      }
    } else {
      const img = this.imageCache.get(currentScene.visualUrl);
      if (img && img.complete) {
        this.drawKenBurns(ctx, img, currentScene.cameraMotion, sceneProgress, width, height);
      } else {
        this.drawPlaceholderBackground(ctx, currentScene, width, height);
      }
    }

    // 2. Cinematic Vignette & Lighting
    this.drawCinematicVignette(ctx, width, height);

    // 3. Source Citation Pill / Badge (if documentary or stock source attached)
    if (currentScene.sourceInfo) {
      this.drawSourceCitationBadge(ctx, currentScene.sourceInfo, width, height);
    }

    // 3. Scene Transition (Crossfade with next scene during last 0.5s)
    const transitionDuration = 0.5;
    const timeLeftInScene = currentScene.duration - sceneElapsed;
    if (timeLeftInScene < transitionDuration && sceneIndex < scenes.length - 1) {
      const nextScene = scenes[sceneIndex + 1];
      const nextImg = this.imageCache.get(nextScene.visualUrl);
      if (nextImg && nextImg.complete) {
        const transProgress = 1 - (timeLeftInScene / transitionDuration);
        ctx.save();
        ctx.globalAlpha = transProgress;
        this.drawKenBurns(ctx, nextImg, nextScene.cameraMotion, 0.05, width, height);
        this.drawCinematicVignette(ctx, width, height);
        ctx.restore();
      }
    }

    // 4. Subtitles Overlay with Karaoke Highlighting
    this.drawSubtitles(
      ctx,
      currentScene,
      sceneElapsed,
      project.captionStyle.theme,
      project.captionStyle.position,
      width,
      height,
      project.aspectRatio
    );

    // 5. Subtle Scene Progress Indicator Bar (at the top)
    this.drawProgressBar(ctx, currentTime, scenes, width, height);
  }

  // Draw Ken Burns Camera Motion
  private drawKenBurns(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    motion: string,
    progress: number,
    width: number,
    height: number
  ) {
    ctx.save();

    let scale = 1.0;
    let dx = 0;
    let dy = 0;

    switch (motion) {
      case 'zoom-in':
        scale = 1.0 + progress * 0.16; // 1.0 -> 1.16
        break;
      case 'zoom-out':
        scale = 1.16 - progress * 0.16; // 1.16 -> 1.0
        break;
      case 'pan-left':
        scale = 1.12;
        dx = (progress - 0.5) * (width * 0.08);
        break;
      case 'pan-right':
        scale = 1.12;
        dx = (0.5 - progress) * (width * 0.08);
        break;
      case 'subtle-drift':
        scale = 1.06 + Math.sin(progress * Math.PI) * 0.06;
        dy = Math.sin(progress * Math.PI * 0.5) * (height * 0.03);
        break;
      case 'static':
      default:
        scale = 1.0;
        break;
    }

    // Calculate crop for aspect ratio fill (cover)
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;

    let drawW = width * scale;
    let drawH = height * scale;

    if (canvasAspect > imgAspect) {
      drawH = drawW / imgAspect;
    } else {
      drawW = drawH * imgAspect;
    }

    const drawX = (width - drawW) / 2 + dx;
    const drawY = (height - drawH) / 2 + dy;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  // Draw Ken Burns Camera Motion for HTMLVideoElement
  private drawVideoKenBurns(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    motion: string,
    progress: number,
    width: number,
    height: number
  ) {
    ctx.save();

    let scale = 1.0;
    let dx = 0;
    let dy = 0;

    switch (motion) {
      case 'zoom-in':
        scale = 1.0 + progress * 0.12;
        break;
      case 'zoom-out':
        scale = 1.12 - progress * 0.12;
        break;
      case 'pan-left':
        scale = 1.08;
        dx = (progress - 0.5) * (width * 0.05);
        break;
      case 'pan-right':
        scale = 1.08;
        dx = (0.5 - progress) * (width * 0.05);
        break;
      case 'subtle-drift':
        scale = 1.04 + Math.sin(progress * Math.PI) * 0.04;
        dy = Math.sin(progress * Math.PI * 0.5) * (height * 0.02);
        break;
      case 'static':
      default:
        scale = 1.0;
        break;
    }

    const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
    const canvasAspect = width / height;

    let drawW = width * scale;
    let drawH = height * scale;

    if (canvasAspect > videoAspect) {
      drawH = drawW / videoAspect;
    } else {
      drawW = drawH * videoAspect;
    }

    const drawX = (width - drawW) / 2 + dx;
    const drawY = (height - drawH) / 2 + dy;

    try {
      ctx.drawImage(video, drawX, drawY, drawW, drawH);
    } catch {
      // ignore
    }
    ctx.restore();
  }

  // Draw discrete source citation / copyright pill on top-left of canvas
  private drawSourceCitationBadge(
    ctx: CanvasRenderingContext2D,
    source: { title: string; source: string; author?: string },
    width: number,
    height: number
  ) {
    ctx.save();
    const fontSize = Math.max(11, Math.floor(width * 0.015));
    ctx.font = `500 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    
    const label = `📁 Nguồn tư liệu: ${source.title} (${source.source})`;
    const textWidth = ctx.measureText(label).width;
    const paddingX = 10;
    const paddingY = 6;
    const boxW = textWidth + paddingX * 2;
    const boxH = fontSize + paddingY * 2;
    const x = 20;
    const y = 20;

    // Glass pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 6);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + paddingX, y + boxH / 2);
    ctx.restore();
  }

  private drawPlaceholderBackground(
    ctx: CanvasRenderingContext2D,
    scene: Scene,
    width: number,
    height: number
  ) {
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.1,
      width / 2, height / 2, width * 0.8
    );
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.6, '#0f172a');
    grad.addColorStop(1, '#020617');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative cinematic badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `600 ${Math.max(16, Math.floor(width * 0.024))}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`Phân cảnh ${scene.order}`, width / 2, height / 2 - 20);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = `400 ${Math.max(14, Math.floor(width * 0.018))}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(scene.visualPrompt.slice(0, 60) + '...', width / 2, height / 2 + 20);
  }

  private drawCinematicVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.4,
      width / 2, height / 2, Math.max(width, height) * 0.75
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private drawSubtitles(
    ctx: CanvasRenderingContext2D,
    scene: Scene,
    elapsed: number,
    theme: CaptionTheme,
    position: 'bottom' | 'middle' | 'top',
    width: number,
    height: number,
    aspectRatio: AspectRatio
  ) {
    if (!scene.narration || scene.narration.trim().length === 0) return;

    ctx.save();

    // Scale font size according to canvas dimensions & aspect ratio
    const baseFontSize = aspectRatio === '9:16' ? Math.floor(width * 0.058) : Math.floor(height * 0.048);
    const fontSize = Math.max(22, baseFontSize);

    ctx.font = `700 ${fontSize}px "Outfit", "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = scene.subtitleWords || [];
    const fullText = scene.narration;

    // Y position calculation
    let y = height * 0.82;
    if (position === 'middle') y = height * 0.5;
    if (position === 'top') y = height * 0.18;
    if (aspectRatio === '9:16' && position === 'bottom') y = height * 0.75;

    // Wrap words into lines (max characters per line based on aspect ratio)
    const maxLineLength = aspectRatio === '9:16' ? 24 : 45;
    const lines = this.wrapWordsIntoLines(words.length > 0 ? words.map(w => w.word) : fullText.split(' '), maxLineLength);

    const lineHeight = fontSize * 1.35;
    const totalLinesHeight = lines.length * lineHeight;
    const startY = y - (totalLinesHeight / 2) + (lineHeight / 2);

    let globalWordIndex = 0;

    lines.forEach((lineWords, lineIdx) => {
      const lineY = startY + lineIdx * lineHeight;
      const lineStr = lineWords.join(' ');
      const lineWidth = ctx.measureText(lineStr).width;

      // 1. Draw subtitle background pill
      const paddingX = fontSize * 0.8;
      const paddingY = fontSize * 0.35;
      const bgX = (width - lineWidth) / 2 - paddingX;
      const bgY = lineY - fontSize * 0.7;
      const bgW = lineWidth + paddingX * 2;
      const bgH = fontSize * 1.4;

      if (theme === 'bold_banner') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.roundRect(ctx, bgX, bgY, bgW, bgH, 10);
        ctx.fill();
      } else if (theme === 'tiktok_yellow') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        this.roundRect(ctx, bgX, bgY, bgW, bgH, 8);
        ctx.fill();
      } else if (theme === 'neon_cyber') {
        ctx.fillStyle = 'rgba(10, 10, 30, 0.85)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        this.roundRect(ctx, bgX, bgY, bgW, bgH, 8);
        ctx.fill();
        ctx.stroke();
      }

      // 2. Draw Karaoke Word-by-Word
      let currentX = (width - lineWidth) / 2;

      lineWords.forEach((word) => {
        const wordInfo = words[globalWordIndex];
        const wordWidth = ctx.measureText(word + ' ').width;
        const textCenter = currentX + wordWidth / 2;

        const isCurrentlySpoken = wordInfo && elapsed >= wordInfo.start && elapsed <= wordInfo.end;
        const isPastWord = wordInfo && elapsed > wordInfo.end;

        // Apply theme color
        if (theme === 'tiktok_yellow') {
          if (isCurrentlySpoken) {
            ctx.fillStyle = '#fde047'; // Bright Yellow
            ctx.shadowColor = 'rgba(250, 204, 21, 0.8)';
            ctx.shadowBlur = 12;
          } else if (isPastWord) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.shadowBlur = 0;
          }
        } else if (theme === 'neon_cyber') {
          if (isCurrentlySpoken) {
            ctx.fillStyle = '#38bdf8'; // Cyan
            ctx.shadowColor = '#0284c7';
            ctx.shadowBlur = 14;
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
          }
        } else if (theme === 'karaoke_glow') {
          if (isCurrentlySpoken) {
            ctx.fillStyle = '#a855f7'; // Purple glow
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 16;
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 5;
          }
        } else {
          // Cinematic minimal
          ctx.fillStyle = isCurrentlySpoken ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
          ctx.shadowColor = 'rgba(0,0,0,0.95)';
          ctx.shadowBlur = 6;
        }

        // Draw text stroke for legibility
        ctx.lineWidth = Math.max(3, fontSize * 0.1);
        ctx.strokeStyle = '#000000';
        ctx.strokeText(word, textCenter, lineY);
        ctx.fillText(word, textCenter, lineY);

        currentX += wordWidth;
        globalWordIndex++;
      });
    });

    ctx.restore();
  }

  private wrapWordsIntoLines(words: string[], maxCharsPerLine: number): string[][] {
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentLength = 0;

    words.forEach((w) => {
      if (currentLength + w.length + 1 > maxCharsPerLine && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [w];
        currentLength = w.length;
      } else {
        currentLine.push(w);
        currentLength += w.length + 1;
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    return lines;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private drawProgressBar(
    ctx: CanvasRenderingContext2D,
    currentTime: number,
    scenes: Scene[],
    width: number,
    height: number
  ) {
    const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
    if (totalDuration <= 0) return;

    ctx.save();
    const barHeight = 4;
    const barY = 8;
    const padding = 16;
    const barWidth = width - padding * 2;

    // Background track
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.roundRect(ctx, padding, barY, barWidth, barHeight, 2);
    ctx.fill();

    // Scene dividers
    let curAcc = 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    scenes.forEach((s) => {
      curAcc += s.duration;
      const divX = padding + (curAcc / totalDuration) * barWidth;
      ctx.fillRect(divX - 1, barY, 2, barHeight);
    });

    // Active progress
    const activeWidth = Math.min(barWidth, (currentTime / totalDuration) * barWidth);
    ctx.fillStyle = '#6366f1'; // Indigo accent
    this.roundRect(ctx, padding, barY, activeWidth, barHeight, 2);
    ctx.fill();

    ctx.restore();
  }

  // Export full video to MP4 / WebM with complete synchronized audio!
  public async exportVideo(
    project: VideoProject,
    onProgress: (progress: number, statusText: string) => void
  ): Promise<Blob> {
    const totalDuration = project.scenes.reduce((acc, s) => acc + s.duration, 0);
    const canvas = document.createElement('canvas');
    
    // Set export resolution
    if (project.aspectRatio === '9:16') {
      canvas.width = 1080;
      canvas.height = 1920;
    } else if (project.aspectRatio === '1:1') {
      canvas.width = 1080;
      canvas.height = 1080;
    } else {
      canvas.width = 1920;
      canvas.height = 1080;
    }

    const ctx = canvas.getContext('2d')!;

    // 1. Preload all scene images
    onProgress(0.05, 'Đang chuẩn bị hình ảnh phân cảnh...');
    for (let i = 0; i < project.scenes.length; i++) {
      const scene = project.scenes[i];
      if (scene.visualUrl) {
        await this.preloadImage(scene.visualUrl);
      }
    }

    // 2. Set up Audio Context & Mix for Recording
    onProgress(0.15, 'Đang hòa âm lời lồng tiếng và nhạc nền...');
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();

    // Render BGM Buffer
    const bgmBuffer = await audioEngine.renderBgmBuffer(project.bgMusic.trackId, totalDuration);
    const bgmSource = audioCtx.createBufferSource();
    bgmSource.buffer = bgmBuffer;
    const bgmGain = audioCtx.createGain();
    bgmGain.gain.value = project.bgMusic.volume || 0.25;
    bgmSource.connect(bgmGain);
    bgmGain.connect(dest);

    // Schedule voiceover buffers and SFX sound effects
    let accTime = 0;
    const sfxMasterVol = project.sfxSettings?.enabled !== false ? (project.sfxSettings?.masterVolume ?? 0.75) : 0;

    project.scenes.forEach((scene) => {
      // 1. Voiceover
      if (scene.audioBuffer) {
        const vSource = audioCtx.createBufferSource();
        vSource.buffer = scene.audioBuffer;
        const vGain = audioCtx.createGain();
        vGain.gain.value = 1.0;
        vSource.connect(vGain);
        vGain.connect(dest);
        vSource.start(audioCtx.currentTime + accTime);
      }

      // 2. Sound Effects (SFX)
      if (sfxMasterVol > 0 && scene.sfxType && scene.sfxType !== 'none') {
        let timingOffset = 0.05;
        if (scene.sfxTiming === 'mid') {
          timingOffset = Math.max(0.05, scene.duration * 0.45);
        } else if (scene.sfxTiming === 'end') {
          timingOffset = Math.max(0.05, scene.duration - 0.8);
        }

        const sfxVol = (scene.sfxVolume ?? 0.8) * sfxMasterVol;
        audioEngine.renderSfxToContext(
          audioCtx,
          dest,
          scene.sfxType,
          audioCtx.currentTime + accTime + timingOffset,
          sfxVol
        );
      }

      accTime += scene.duration;
    });

    // 3. Set up MediaRecorder
    onProgress(0.25, 'Đang tiến hành dựng và xuất video...');
    const videoStream = canvas.captureStream(30);
    const audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) {
      videoStream.addTrack(audioTrack);
    }

    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    let selectedMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';

    const recorder = new MediaRecorder(videoStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: 6000000, // 6 Mbps high quality
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        audioCtx.close();
        const finalBlob = new Blob(chunks, { type: selectedMime });
        onProgress(1.0, 'Hoàn tất xuất video!');
        resolve(finalBlob);
      };

      recorder.onerror = (err) => {
        audioCtx.close();
        reject(err);
      };

      recorder.start();
      bgmSource.start(0);

      // Render frames at 30 fps in sync with real-time
      const fps = 30;
      const totalFrames = Math.ceil(totalDuration * fps);
      let currentFrame = 0;

      const renderInterval = setInterval(() => {
        const curTime = (currentFrame / fps);
        if (curTime >= totalDuration) {
          clearInterval(renderInterval);
          this.drawFrame(ctx, project, totalDuration - 0.01, canvas.width, canvas.height);
          setTimeout(() => {
            recorder.stop();
          }, 300);
          return;
        }

        this.drawFrame(ctx, project, curTime, canvas.width, canvas.height);
        currentFrame++;

        const pct = 0.25 + (currentFrame / totalFrames) * 0.7;
        onProgress(pct, `Đang render khung hình: ${currentFrame}/${totalFrames}`);
      }, 1000 / fps);
    });
  }
}

export const videoRenderer = new VideoRenderer();
