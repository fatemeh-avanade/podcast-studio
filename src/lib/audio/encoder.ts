'use client';

// lamejs must be statically imported — dynamic import breaks its internal globals
import { Mp3Encoder } from '@breezystack/lamejs';
import { audioBufferToWav } from './denoiser';

export interface EncoderOptions {
  onProgress?: (pct: number) => void;
}

/** Encode a Blob (any format) to WAV */
export async function encodeToWav(
  inputBlob: Blob,
  opts: EncoderOptions = {}
): Promise<Blob> {
  opts.onProgress?.(0);
  const arrayBuffer = await inputBlob.arrayBuffer();
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  audioCtx.close();
  opts.onProgress?.(80);
  const wav = audioBufferToWav(decoded);
  opts.onProgress?.(100);
  return wav;
}

/** Encode a Blob to MP3 using lamejs */
export async function encodeToMp3(
  inputBlob: Blob,
  opts: EncoderOptions = {}
): Promise<Blob> {
  opts.onProgress?.(0);

  const arrayBuffer = await inputBlob.arrayBuffer();
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  audioCtx.close();

  opts.onProgress?.(20);

  const sampleRate = decoded.sampleRate;
  const numChannels = decoded.numberOfChannels;
  const kbps = 128;
  const encoder = new Mp3Encoder(numChannels, sampleRate, kbps);

  const mp3Chunks: (Int8Array | Uint8Array)[] = [];
  const blockSize = 1152;
  const leftData = decoded.getChannelData(0);
  const rightData = numChannels > 1 ? decoded.getChannelData(1) : leftData;

  const toInt16 = (f32: Float32Array) => {
    const i16 = new Int16Array(f32.length);
    for (let i = 0; i < f32.length; i++) {
      i16[i] = Math.max(-32768, Math.min(32767, f32[i] * 32767));
    }
    return i16;
  };

  const leftInt = toInt16(leftData);
  const rightInt = toInt16(rightData);

  for (let i = 0; i < leftInt.length; i += blockSize) {
    const left = leftInt.subarray(i, i + blockSize);
    const right = rightInt.subarray(i, i + blockSize);
    const encoded =
      numChannels > 1
        ? encoder.encodeBuffer(left, right)
        : encoder.encodeBuffer(left);
    if (encoded.length > 0) mp3Chunks.push(encoded as Uint8Array);

    if (i % (blockSize * 50) === 0) {
      opts.onProgress?.(20 + Math.round((i / leftInt.length) * 75));
    }
  }

  const finalChunk = encoder.flush();
  if (finalChunk.length > 0) mp3Chunks.push(finalChunk as Uint8Array);

  opts.onProgress?.(100);
  return new Blob(mp3Chunks, { type: 'audio/mp3' });
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
