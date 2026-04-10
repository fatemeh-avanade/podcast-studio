'use client';

import { audioBufferToWav } from './denoiser';

/**
 * Normalizes audio to a target peak level (default -1 dBFS).
 */
export async function normalizeAudio(
  inputBlob: Blob,
  targetDbfs = -1,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  onProgress?.(0);
  const arrayBuffer = await inputBlob.arrayBuffer();

  let decoded: AudioBuffer;
  try {
    const offlineCtx = new OfflineAudioContext(1, 1, 48000);
    decoded = await offlineCtx.decodeAudioData(arrayBuffer);
  } catch {
    return inputBlob;
  }

  onProgress?.(30);

  const numChannels = decoded.numberOfChannels;
  const length = decoded.length;
  const sampleRate = decoded.sampleRate;

  // Find peak amplitude across all channels
  let peak = 0;
  for (let ch = 0; ch < numChannels; ch++) {
    const data = decoded.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }

  onProgress?.(50);

  if (peak === 0) return inputBlob;

  const targetLinear = Math.pow(10, targetDbfs / 20);
  const gain = targetLinear / peak;

  // Apply gain via OfflineAudioContext
  const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;

  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = gain;

  source.connect(gainNode);
  gainNode.connect(offlineCtx.destination);
  source.start(0);

  onProgress?.(70);
  const rendered = await offlineCtx.startRendering();
  onProgress?.(90);

  const wav = audioBufferToWav(rendered);
  onProgress?.(100);
  return wav;
}
