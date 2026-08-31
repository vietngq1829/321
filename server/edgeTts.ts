import WebSocket from 'ws';
import crypto from 'crypto';

const EDGE_TTS_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';

export interface EdgeTtsOptions {
  voice?: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export async function synthesizeEdgeTts(text: string, options: EdgeTtsOptions = {}): Promise<{ audioBuffer: Buffer; mimeType: string }> {
  const voice = options.voice || 'vi-VN-HoaiMyNeural';
  const lang = options.lang || (voice.startsWith('vi-') ? 'vi-VN' : 'en-US');
  
  // Format pitch and rate for SSML
  const rateVal = options.rate || 1.0;
  const ratePercent = Math.round((rateVal - 1.0) * 100);
  const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

  const pitchVal = options.pitch || 0;
  const pitchHz = Math.round(pitchVal * 8);
  const pitchStr = pitchHz >= 0 ? `+${pitchHz}Hz` : `${pitchHz}Hz`;

  // Escape XML characters
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const requestId = crypto.randomUUID().replace(/-/g, '');
  const timestamp = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(EDGE_TTS_URL, {
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      },
    });

    const audioChunks: Buffer[] = [];
    let isFinished = false;

    const timeout = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        try { ws.close(); } catch {}
        if (audioChunks.length > 0) {
          resolve({ audioBuffer: Buffer.concat(audioChunks), mimeType: 'audio/mpeg' });
        } else {
          reject(new Error('Edge TTS synthesis timed out after 12s'));
        }
      }
    }, 12000);

    ws.on('open', () => {
      // Step 1: Send speech.config
      const configMessage = 
        `X-Timestamp:${timestamp}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: 'false',
                  wordBoundaryEnabled: 'false',
                },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
              },
            },
          },
        });

      ws.send(configMessage);

      // Step 2: Send SSML
      const ssmlMessage = 
        `X-RequestId:${requestId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${timestamp}\r\n` +
        `Path:ssml\r\n\r\n` +
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'>` +
        `<voice name='${voice}'>` +
        `<prosody pitch='${pitchStr}' rate='${rateStr}' volume='+0%'>` +
        `${escapedText}` +
        `</prosody>` +
        `</voice>` +
        `</speak>`;

      ws.send(ssmlMessage);
    });

    ws.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
      if (isBinary) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
        // Binary message contains 2-byte header length, followed by header string, then binary audio data
        if (buffer.length > 2) {
          const headerLength = buffer.readUInt16BE(0);
          if (buffer.length > 2 + headerLength) {
            const headerStr = buffer.subarray(2, 2 + headerLength).toString('utf-8');
            if (headerStr.includes('Path:audio')) {
              const audioData = buffer.subarray(2 + headerLength);
              if (audioData.length > 0) {
                audioChunks.push(audioData);
              }
            }
          }
        }
      } else {
        const textMessage = data.toString('utf-8');
        if (textMessage.includes('Path:turn.end')) {
          if (!isFinished) {
            isFinished = true;
            clearTimeout(timeout);
            try { ws.close(); } catch {}
            if (audioChunks.length > 0) {
              resolve({ audioBuffer: Buffer.concat(audioChunks), mimeType: 'audio/mpeg' });
            } else {
              reject(new Error('No audio data received from Edge TTS'));
            }
          }
        }
      }
    });

    ws.on('error', (err) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timeout);
        try { ws.close(); } catch {}
        if (audioChunks.length > 0) {
          resolve({ audioBuffer: Buffer.concat(audioChunks), mimeType: 'audio/mpeg' });
        } else {
          reject(err);
        }
      }
    });

    ws.on('close', () => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timeout);
        if (audioChunks.length > 0) {
          resolve({ audioBuffer: Buffer.concat(audioChunks), mimeType: 'audio/mpeg' });
        }
      }
    });
  });
}
