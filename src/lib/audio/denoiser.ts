'use client';

/**
 * Browser-based noise reduction using Web Audio API filters.
 * Applies: high-pass (remove rumble), high-shelf cut (reduce hiss),
 * notch filters, and dynamics compression to reduce background noise.
 */
export async function denoiseAudioBlob(
  inputBlob: Blob,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  onProgress?.(0);

  const arrayBuffer = await inputBlob.arrayBuffer();
  const audioCtx = new OfflineAudioContext(1, 1, 48000);

  // Decode to determine duration / sample count
  let decoded: AudioBuffer;
  try {
    decoded = await audioCtx.decodeAudioData(arrayBuffer);
  } catch {
    // If decode fails (e.g. webm not supported in offline), return original
    return inputBlob;
  }

  onProgress?.(20);

  const sampleRate = decoded.sampleRate;
  const length = decoded.length;
  const numChannels = decoded.numberOfChannels;

  const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;

  // 1. High-pass filter — remove low-frequency rumble below 80 Hz
  const highPass = offlineCtx.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = 80;
  highPass.Q.value = 0.7;

  // 2. High shelf cut — reduce hiss above 10 kHz
  const highShelf = offlineCtx.createBiquadFilter();
  highShelf.type = 'highshelf';
  highShelf.frequency.value = 10000;
  highShelf.gain.value = -6;

  // 3. Notch at 60 Hz — common electrical hum (US)
  const notch60 = offlineCtx.createBiquadFilter();
  notch60.type = 'notch';
  notch60.frequency.value = 60;
  notch60.Q.value = 30;

  // 4. Dynamics compressor — even out levels and reduce noise floor
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -40;
  compressor.knee.value = 10;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.1;

  source.connect(highPass);
  highPass.connect(notch60);
  notch60.connect(highShelf);
  highShelf.connect(compressor);
  compressor.connect(offlineCtx.destination);

  source.start(0);
  onProgress?.(40);

  const renderedBuffer = await offlineCtx.startRendering();
  onProgress?.(80);

  const wavBlob = audioBufferToWav(renderedBuffer);
  onProgress?.(100);
  return wavBlob;
}

/** Convert an AudioBuffer to a WAV Blob */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = length * numChannels * (bitsPerSample / 8);
  const bufferSize = 44 + dataSize;

  const ab = new ArrayBuffer(bufferSize);
  const view = new DataView(ab);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);          // PCM chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channels
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([ab], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
