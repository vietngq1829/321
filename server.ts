import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { synthesizeEdgeTts } from './server/edgeTts.js';

// Helper to wrap raw 16-bit PCM into standard RIFF WAV container
function pcmToWav(pcmData: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  pcmData.copy(buffer, 44);
  return buffer;
}

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to get natural language name from code
function getLanguageName(code: string): string {
  const map: Record<string, string> = {
    vi: 'Vietnamese (Tiếng Việt)',
    en: 'English (United States)',
    'en-GB': 'English (British)',
    ja: 'Japanese (日本語)',
    ko: 'Korean (한국어)',
    zh: 'Chinese Mandarin (中文普通话)',
    fr: 'French (Français)',
    de: 'German (Deutsch)',
    es: 'Spanish (Español)',
    th: 'Thai (ภาษาไทย)',
    pt: 'Portuguese (Português)',
    id: 'Indonesian (Bahasa Indonesia)',
    ru: 'Russian (Русский)',
    it: 'Italian (Italiano)',
  };
  return map[code] || 'Vietnamese (Tiếng Việt)';
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// 2. AI Script & Storyboard Generator (with SFX & BGM Intelligent Sound Design)
app.post('/api/storyboard/generate', async (req, res) => {
  try {
    const { 
      script, 
      stylePreset, 
      aspectRatio, 
      language, 
      sfxPreferences, 
      sfxStylePreset, 
      bgmPreferences, 
      bgmTrackId 
    } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        error: 'Chưa cấu hình GEMINI_API_KEY.',
      });
    }

    const targetLangName = getLanguageName(language || 'vi');

    const audioDirectives = [];
    if (sfxPreferences) audioDirectives.push(`User Custom SFX Instructions: "${sfxPreferences}"`);
    if (sfxStylePreset && sfxStylePreset !== 'auto') audioDirectives.push(`SFX Theme Preference: ${sfxStylePreset}`);
    if (bgmPreferences) audioDirectives.push(`User Custom BGM Instructions: "${bgmPreferences}"`);
    if (bgmTrackId) audioDirectives.push(`User Selected BGM Track: ${bgmTrackId}`);

    const audioDirectivesText = audioDirectives.length > 0
      ? `\n\nUSER SOUND DESIGN & MUSIC PREFERENCES:\n${audioDirectives.join('\n')}\n*CRITICAL*: Carefully adhere to these SFX and BGM specifications for sound design and music selection.`
      : '';

    const systemPrompt = `You are an elite AI Video Director, Sound Designer, and Screenwriter.
Convert the user's input text/script into a professional, compelling, scene-by-scene video storyboard with synchronized narrations, rich cinematic visual prompts, and bespoke sound design (SFX sound effects & BGM background music).
Language for spoken voiceover narration and title: ${targetLangName}.
Style Preset: ${stylePreset || 'cinematic'}.
Aspect Ratio: ${aspectRatio || '16:9'}.${audioDirectivesText}

Requirements:
1. Split the content into 3 to 6 impactful, well-paced scenes.
2. For each scene:
   - "narration": A concise, natural, spoken voiceover script sentence in ${targetLangName} (lời thuyết minh tự nhiên, đúng ngữ điệu của ngôn ngữ này).
   - "visualPrompt": Highly descriptive cinematic prompt in English for image generation (lighting, atmosphere, camera angle, photorealistic, 8k, dramatic lighting, detailed background, no text inside image).
   - "duration": Estimated duration in seconds (between 4 and 8 seconds based on narration length).
   - "cameraMotion": One of ["zoom-in", "zoom-out", "pan-left", "pan-right", "subtle-drift"].
   - "transition": One of ["crossfade", "fade-black", "slide-left", "zoom"].
   - "sfx": Descriptive, vivid sound effect title in ${targetLangName} matching the scene action and user SFX preferences (e.g. "Whoosh chuyển cảnh điện ảnh & Bass trầm", "Tiếng sấm sét & Mưa rơi", "Tiếng gõ phím cơ sắc nét", "Tiếng chớp đèn màn trập máy ảnh", "Âm chuông pha lê ngân vang", "Âm thanh khoa học viễn tưởng Sci-Fi", v.v.).
   - "sfxType": The exact synth trigger key matching the action. Must be one of:
     ["whoosh", "boom_impact", "riser", "bass_drop", "shutter", "typewriter", "cyber_beep", "laser", "glitch", "bell", "magic_sparkle", "applause", "ambient_nature", "none"]
   - "sfxTiming": When the SFX plays within the scene: "start", "mid", or "end".
   - "sfxVolume": Recommended volume from 0.4 to 1.0 (default around 0.75 - 0.85).
3. Sound Design & BGM Recommendations:
   - "recommendedBgmTrackId": Recommend the best fitting background music track: one of ["cinematic-ambient", "epic-inspiration", "tech-pulse", "lofi-chill", "deep-space"].
   - "recommendedBgmMood": Short mood description (e.g. "Hùng tráng, lôi cuốn").
   - "recommendedBgmVolume": Optimal background music volume level (0.15 to 0.45).
   - "recommendedDucking": Boolean true if BGM should automatically lower when voiceover speaks.
4. Generate a compelling, catchy "title" in ${targetLangName}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: script,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Catchy video title' },
            recommendedBgmTrackId: { 
              type: Type.STRING, 
              enum: ['cinematic-ambient', 'epic-inspiration', 'tech-pulse', 'lofi-chill', 'deep-space'],
              description: 'Recommended BGM track' 
            },
            recommendedBgmMood: { type: Type.STRING, description: 'BGM mood description' },
            recommendedBgmVolume: { type: Type.NUMBER, description: 'BGM volume level (0.15 to 0.45)' },
            recommendedDucking: { type: Type.BOOLEAN, description: 'Whether BGM ducking is recommended' },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  order: { type: Type.INTEGER },
                  narration: { type: Type.STRING, description: 'Spoken voiceover script' },
                  visualPrompt: { type: Type.STRING, description: 'Detailed cinematic image prompt in English' },
                  duration: { type: Type.NUMBER, description: 'Duration in seconds (e.g. 5.5)' },
                  cameraMotion: {
                    type: Type.STRING,
                    enum: ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'subtle-drift'],
                  },
                  transition: {
                    type: Type.STRING,
                    enum: ['crossfade', 'fade-black', 'slide-left', 'zoom'],
                  },
                  sfx: { type: Type.STRING, description: 'Descriptive SFX title' },
                  sfxType: {
                    type: Type.STRING,
                    enum: [
                      'whoosh',
                      'boom_impact',
                      'riser',
                      'bass_drop',
                      'shutter',
                      'typewriter',
                      'cyber_beep',
                      'laser',
                      'glitch',
                      'bell',
                      'magic_sparkle',
                      'applause',
                      'ambient_nature',
                      'none',
                    ],
                  },
                  sfxTiming: {
                    type: Type.STRING,
                    enum: ['start', 'mid', 'end'],
                  },
                  sfxVolume: { type: Type.NUMBER },
                },
                required: ['order', 'narration', 'visualPrompt', 'duration', 'cameraMotion', 'transition'],
              },
            },
          },
          required: ['title', 'scenes'],
        },
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
      throw new Error('Empty response from AI model');
    }

    const data = JSON.parse(jsonText);
    res.json(data);
  } catch (error: unknown) {
    console.error('Error generating storyboard:', error);
    const message = error instanceof Error ? error.message : 'Lỗi khi tạo phân cảnh kịch bản';
    res.status(500).json({ error: message });
  }
});

// 3. AI Script Expander / Brainstormer
app.post('/api/script/enhance', async (req, res) => {
  try {
    const { topic, mode, stylePreset, language } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ error: 'Chưa cấu hình GEMINI_API_KEY.' });
    }

    const targetLangName = getLanguageName(language || 'vi');

    let instruction = '';
    if (mode === 'expand') {
      instruction = `Viết một kịch bản video hoàn chỉnh, hấp dẫn từ ý tưởng/chủ đề sau. Phong cách: ${stylePreset}. Ngôn ngữ: ${targetLangName}. Hãy có phần mở đầu lôi cuốn (Hook), thân bài mạch lạc và kết thúc đọng lại cảm xúc.`;
    } else if (mode === 'hook') {
      instruction = `Viết lại phần mở đầu video (Hook 3 giây đầu tiên) sao cho siêu cuốn hút, kích thích sự tò mò của người xem. Ngôn ngữ: ${targetLangName}.`;
    } else {
      instruction = `Tối ưu hóa và làm mượt mà đoạn văn bản thành lời thoại video chuyên nghiệp. Ngôn ngữ: ${targetLangName}.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: topic,
      config: {
        systemInstruction: instruction,
      },
    });

    res.json({ script: response.text || '' });
  } catch (error: unknown) {
    console.error('Error enhancing script:', error);
    const message = error instanceof Error ? error.message : 'Lỗi khi nâng cấp kịch bản';
    res.status(500).json({ error: message });
  }
});

// 3.5 AI Auto-Dubbing & Translation (Chuyển ngữ kịch bản & phân cảnh sang ngôn ngữ mới)
app.post('/api/dubbing/translate', async (req, res) => {
  try {
    const { scenes, title, targetLanguage } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ error: 'Chưa cấu hình GEMINI_API_KEY.' });
    }

    const targetLangName = getLanguageName(targetLanguage || 'en');

    const systemPrompt = `You are a professional Video Localization & Dubbing Master.
Translate and adapt the provided video scenes narration into ${targetLangName}.
Ensure the translated voiceover lines sound 100% natural, colloquial, and rhythmically suited for spoken video voiceovers, preserving the emotional impact and core message.
Do NOT do literal robotic translations; make them sound like a native video creator speaking ${targetLangName}.
Also translate the title into ${targetLangName}.`;

    const inputData = {
      title: title || '',
      scenes: (scenes || []).map((s: { id: string; narration: string }) => ({
        id: s.id,
        narration: s.narration,
      })),
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: JSON.stringify(inputData),
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedTitle: { type: Type.STRING },
            translatedScenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  narration: { type: Type.STRING, description: 'Natural spoken voiceover narration in target language' },
                },
                required: ['id', 'narration'],
              },
            },
          },
          required: ['translatedScenes'],
        },
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) throw new Error('Empty response from translation model');
    const data = JSON.parse(jsonText);
    res.json(data);
  } catch (error: unknown) {
    console.error('Error translating and dubbing scenes:', error);
    const message = error instanceof Error ? error.message : 'Lỗi khi dịch và lồng tiếng kịch bản';
    res.status(500).json({ error: message });
  }
});

// 4. AI Voiceover Generator (Multi-Engine: ElevenLabs, Vbee AI Studio & Gemini Neural Engine)
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { 
      text, 
      voiceId,
      voiceName, 
      provider, 
      vbeeCode, 
      elevenId, 
      elevenlabsApiKey, 
      vbeeToken, 
      emotionTone, 
      pitch, 
      rate, 
      stability, 
      claritySimilarity, 
      styleExaggeration, 
      customPromptClone,
      lang 
    } = req.body;

    const textToSynthesize = (text || '').trim();
    if (!textToSynthesize) {
      return res.status(400).json({ error: 'Nội dung thuyết minh không được để trống.' });
    }

    // Estimate duration based on word count & speaking rate
    const words = textToSynthesize.split(/\s+/).length;
    const estDuration = Math.max(2.5, words / (2.5 * (rate || 1.0)));

    // ----------------------------------------------------
    // Engine 1: ElevenLabs Official API (elevenlabs.io)
    // ----------------------------------------------------
    const targetElevenId = elevenId || (voiceId?.startsWith('eleven-') ? voiceId.replace('eleven-', '') : null) || '21m00Tcm4TlvDq8ikWAM';
    const effectiveElevenKey = elevenlabsApiKey || process.env.ELEVENLABS_API_KEY;

    if (provider === 'elevenlabs' && effectiveElevenKey) {
      try {
        console.log(`[TTS] Calling ElevenLabs API for voice ${targetElevenId}...`);
        const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetElevenId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': effectiveElevenKey,
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: textToSynthesize,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: stability ?? 0.75,
              similarity_boost: claritySimilarity ?? 0.85,
              style: styleExaggeration ?? 0.4,
              use_speaker_boost: true,
            },
          }),
        });

        if (elevenRes.ok) {
          const arrayBuf = await elevenRes.arrayBuffer();
          const base64Audio = Buffer.from(arrayBuf).toString('base64');
          return res.json({
            audioBase64: base64Audio,
            mimeType: 'audio/mpeg',
            duration: estDuration,
            provider: 'elevenlabs',
            isPcm: false,
          });
        } else {
          const errData = await elevenRes.text();
          console.warn(`[ElevenLabs API Warning]: ${errData}. Falling back to Neural Studio...`);
        }
      } catch (elevenErr) {
        console.warn('[ElevenLabs Request Error]:', elevenErr);
      }
    }

    // ----------------------------------------------------
    // Engine 2: Vbee AI Studio API (studio.vbee.vn)
    // ----------------------------------------------------
    const targetVbeeCode = vbeeCode || 'vi_male_manhdung';
    const effectiveVbeeToken = vbeeToken || process.env.VBEE_TOKEN;

    if (provider === 'vbee' && effectiveVbeeToken) {
      try {
        console.log(`[TTS] Calling Vbee AI Studio API for voice ${targetVbeeCode}...`);
        const vbeeRes = await fetch('https://api.vbee.vn/api/v1/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveVbeeToken}`,
          },
          body: JSON.stringify({
            voice_code: targetVbeeCode,
            input_text: textToSynthesize,
            rate: rate || 1.0,
            audio_type: 'mp3',
          }),
        });

        if (vbeeRes.ok) {
          const vbeeData: any = await vbeeRes.json();
          const audioLink = vbeeData?.audio_link || vbeeData?.result?.audio_link;
          if (audioLink) {
            const audioFetch = await fetch(audioLink);
            if (audioFetch.ok) {
              const arrayBuf = await audioFetch.arrayBuffer();
              const base64Audio = Buffer.from(arrayBuf).toString('base64');
              return res.json({
                audioBase64: base64Audio,
                audioUrl: audioLink,
                mimeType: 'audio/mpeg',
                duration: estDuration,
                provider: 'vbee',
                isPcm: false,
              });
            }
          }
        }
      } catch (vbeeErr) {
        console.warn('[Vbee Request Error]:', vbeeErr);
      }
    }

    // ----------------------------------------------------
    // Engine 3: Edge Neural Voice Studio (Authentic Broadcast-Grade Neural Voices)
    // ----------------------------------------------------
    try {
      const selectedLang = lang || 'vi';
      let edgeVoice = 'vi-VN-HoaiMyNeural';
      let computedPitch = pitch || 0;
      let computedRate = rate || 1.0;

      if (selectedLang === 'vi') {
        // Vietnamese Neural Voice Mapping with accurate regional pitch & speed
        if (voiceId === 'vbee-manhdung' || voiceId === 'edge-namminh' || voiceId === 'eleven-adam') {
          edgeVoice = 'vi-VN-NamMinhNeural';
          computedPitch = (pitch || 0) - 1.5;
          computedRate = rate || 1.0;
        } else if (voiceId === 'vbee-maiphuong' || voiceId === 'edge-hoaimy' || voiceId === 'eleven-rachel') {
          edgeVoice = 'vi-VN-HoaiMyNeural';
          computedPitch = (pitch || 0);
          computedRate = rate || 1.0;
        } else if (voiceId === 'vbee-ngochuyen' || voiceId === 'eleven-bella') {
          edgeVoice = 'vi-VN-HoaiMyNeural';
          computedPitch = (pitch || 0) + 2.0;
          computedRate = (rate || 1.0) * 1.06;
        } else if (voiceId === 'vbee-minhhoang' || voiceId === 'eleven-josh') {
          edgeVoice = 'vi-VN-NamMinhNeural';
          computedPitch = (pitch || 0) + 1.5;
          computedRate = (rate || 1.0) * 1.08;
        } else if (voiceId === 'vbee-huonggiang') {
          edgeVoice = 'vi-VN-HoaiMyNeural';
          computedPitch = (pitch || 0) + 1.0;
          computedRate = (rate || 1.0) * 1.04;
        } else if (voiceId === 'vbee-truongson' || voiceId === 'eleven-arnold') {
          edgeVoice = 'vi-VN-NamMinhNeural';
          computedPitch = (pitch || 0) - 3.5;
          computedRate = (rate || 1.0) * 0.94;
        } else if (voiceId === 'vbee-thuha' || voiceId === 'eleven-nicole') {
          edgeVoice = 'vi-VN-HoaiMyNeural';
          computedPitch = (pitch || 0) - 1.0;
          computedRate = (rate || 1.0) * 0.92;
        } else if (voiceId === 'vbee-ductoan' || voiceId === 'eleven-antoni') {
          edgeVoice = 'vi-VN-NamMinhNeural';
          computedPitch = (pitch || 0) - 2.0;
          computedRate = (rate || 1.0) * 0.98;
        } else if (vbeeCode?.includes('female') || voiceName?.toLowerCase().includes('nữ') || voiceName?.toLowerCase().includes('female')) {
          edgeVoice = 'vi-VN-HoaiMyNeural';
        } else {
          edgeVoice = 'vi-VN-NamMinhNeural';
        }
      } else if (selectedLang === 'en') {
        if (voiceId?.includes('rachel') || voiceId?.includes('bella') || voiceId?.includes('nicole')) {
          edgeVoice = 'en-US-JennyNeural';
        } else if (voiceId?.includes('arnold') || voiceId?.includes('truongson')) {
          edgeVoice = 'en-US-EricNeural';
        } else if (voiceId?.includes('josh')) {
          edgeVoice = 'en-US-ChristopherNeural';
        } else {
          edgeVoice = 'en-US-GuyNeural';
        }
      } else if (selectedLang === 'ja') {
        edgeVoice = voiceName?.toLowerCase().includes('nữ') ? 'ja-JP-NanamiNeural' : 'ja-JP-KeitaNeural';
      } else if (selectedLang === 'ko') {
        edgeVoice = voiceName?.toLowerCase().includes('nữ') ? 'ko-KR-SunHiNeural' : 'ko-KR-InJoonNeural';
      } else if (selectedLang === 'zh') {
        edgeVoice = voiceName?.toLowerCase().includes('nữ') ? 'zh-CN-XiaoxiaoNeural' : 'zh-CN-YunxiNeural';
      } else if (selectedLang === 'fr') {
        edgeVoice = voiceName?.toLowerCase().includes('nữ') ? 'fr-FR-DeniseNeural' : 'fr-FR-HenriNeural';
      } else if (selectedLang === 'es') {
        edgeVoice = voiceName?.toLowerCase().includes('nữ') ? 'es-ES-ElviraNeural' : 'es-ES-AlvaroNeural';
      } else if (selectedLang === 'de') {
        edgeVoice = voiceName?.toLowerCase().includes('nữ') ? 'de-DE-KatjaNeural' : 'de-DE-ConradNeural';
      }

      console.log(`[TTS Edge Neural] Synthesizing "${textToSynthesize.substring(0, 30)}..." with voice ${edgeVoice}`);
      const edgeResult = await synthesizeEdgeTts(textToSynthesize, {
        voice: edgeVoice,
        lang: selectedLang,
        rate: computedRate,
        pitch: computedPitch,
      });

      if (edgeResult && edgeResult.audioBuffer && edgeResult.audioBuffer.length > 0) {
        const base64Audio = edgeResult.audioBuffer.toString('base64');
        return res.json({
          audioBase64: base64Audio,
          mimeType: edgeResult.mimeType || 'audio/mpeg',
          duration: estDuration,
          provider: provider || 'neural_hd',
          voiceUsed: edgeVoice,
          isPcm: false,
        });
      }
    } catch (edgeErr) {
      console.warn('[Edge Neural TTS Error, falling back to Gemini TTS]:', edgeErr);
    }

    // ----------------------------------------------------
    // Engine 4: Gemini Speech Fallback with Standard WAV Packaging
    // ----------------------------------------------------
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: 'Không thể kết nối đến máy chủ tổng hợp âm thanh.' });
    }

    let selectedVoice = voiceName || 'Kore';
    if (provider === 'vbee') {
      selectedVoice = targetVbeeCode.includes('female') ? 'Kore' : 'Fenrir';
    } else if (provider === 'elevenlabs') {
      if (targetElevenId.includes('21m') || targetElevenId.includes('EXA') || targetElevenId.includes('piT')) {
        selectedVoice = 'Kore';
      } else if (targetElevenId.includes('VR6') || targetElevenId.includes('JBF')) {
        selectedVoice = 'Charon';
      } else {
        selectedVoice = 'Fenrir';
      }
    }

    let conditionedText = textToSynthesize
      .replace(/\s+/g, ' ')
      .replace(/([.,!?:;])\s*/g, '$1 ')
      .trim();

    console.log(`[TTS Gemini Fallback] Voice: ${selectedVoice}`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: `Đọc đoạn văn bản này bằng tiếng Việt tự nhiên, truyền cảm, nhả chữ rõ ràng: "${conditionedText}"` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const candidatePart = response.candidates?.[0]?.content?.parts?.[0];
    const rawData = candidatePart?.inlineData?.data;
    const rawMime = candidatePart?.inlineData?.mimeType || 'audio/pcm';

    if (!rawData) {
      return res.status(404).json({ error: 'Không nhận được dữ liệu âm thanh.' });
    }

    // Convert raw PCM to standard 44-byte RIFF WAV
    const pcmBuffer = Buffer.from(rawData, 'base64');
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
    const wavBase64 = wavBuffer.toString('base64');

    res.json({
      audioBase64: wavBase64,
      mimeType: 'audio/wav',
      duration: estDuration,
      isPcm: false,
      sampleRate: 24000,
      provider: 'gemini_wav',
    });
  } catch (error: unknown) {
    console.error('Error generating TTS:', error);
    const message = error instanceof Error ? error.message : 'Lỗi khi tạo giọng đọc lồng tiếng AI';
    res.status(500).json({ error: message });
  }
});

// 5. AI Research & Source Finder (Tìm kiếm tài liệu, dẫn chứng, video B-Roll & stock photos liên quan đến kịch bản)
app.post('/api/research/sources', async (req, res) => {
  try {
    const { script, sceneNarration, stylePreset, language } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ error: 'Chưa cấu hình GEMINI_API_KEY.' });
    }

    const promptText = sceneNarration || script;

    const systemPrompt = `You are a professional Investigative Journalist, Documentary Researcher, and Visual Asset Curator.
Your job is to analyze the provided script/scene and find:
1. "facts": Array of 3 to 6 verified, fascinating documentary facts, scientific statistics, historical context, or expert insights directly related to this topic.
2. "suggestedKeywords": 5 to 8 search keywords for finding motion B-Roll videos and stock photos (in both English and Vietnamese).
3. "scriptOverview": A concise 2-sentence summary of the core message and documentary theme.
4. "brollPrompts": 3 descriptive prompts for cinematic B-roll camera shots.

Language for facts & overview: ${language === 'en' ? 'English' : 'Vietnamese'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scriptOverview: { type: Type.STRING },
            facts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fact: { type: Type.STRING, description: 'Fascinating documentary fact or research insight' },
                  category: { type: Type.STRING, description: 'Category e.g. Khoa học, Lịch sử, Thống kê, Bí ẩn' },
                  source: { type: Type.STRING, description: 'Origin or citation e.g. NASA, Nature, World Bank, Wikipedia' },
                },
                required: ['fact', 'category', 'source'],
              },
            },
            suggestedKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            brollPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['scriptOverview', 'facts', 'suggestedKeywords', 'brollPrompts'],
        },
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
      throw new Error('Empty response from AI model');
    }

    const data = JSON.parse(jsonText);
    res.json(data);
  } catch (error: unknown) {
    console.error('Error finding research sources:', error);
    const message = error instanceof Error ? error.message : 'Lỗi khi tìm kiếm tài liệu & nguồn tư liệu AI';
    res.status(500).json({ error: message });
  }
});

// 6. AI Scene Image Generator
app.post('/api/image/generate', async (req, res) => {
  try {
    const { visualPrompt, aspectRatio } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ error: 'Chưa cấu hình GEMINI_API_KEY.' });
    }

    // Map aspect ratio to valid Gemini values: "1:1", "3:4", "4:3", "9:16", "16:9"
    let validAspect: '16:9' | '9:16' | '1:1' = '16:9';
    if (aspectRatio === '9:16') validAspect = '9:16';
    if (aspectRatio === '1:1') validAspect = '1:1';

    const enhancedPrompt = `${visualPrompt}, master visual, 8k resolution, cinematic atmosphere, vivid lighting, award-winning cinematography, no text, no watermark, photorealistic quality`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: enhancedPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: validAspect,
        },
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      return res.status(404).json({ error: 'Không nhận được hình ảnh từ AI.' });
    }

    res.json({ imageUrl });
  } catch (error: unknown) {
    console.error('Error generating scene image:', error);
    const message = error instanceof Error ? error.message : 'Lỗi khi tạo ảnh bối cảnh AI';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
