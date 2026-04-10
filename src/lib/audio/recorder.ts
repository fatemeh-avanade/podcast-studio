'use client';

export type RecorderState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface RecorderOptions {
  onDataAvailable?: (chunk: Blob) => void;
  onStateChange?: (state: RecorderState) => void;
  onLevelUpdate?: (level: number) => void;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private state: RecorderState = 'idle';
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private levelInterval: ReturnType<typeof setInterval> | null = null;
  private opts: RecorderOptions;

  constructor(opts: RecorderOptions = {}) {
    this.opts = opts;
  }

  get currentState(): RecorderState {
    return this.state;
  }

  get liveStream(): MediaStream | null {
    return this.stream;
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 48000,
        channelCount: 1,
      },
    });

    this.audioContext = new AudioContext({ sampleRate: 48000 });
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    this.levelInterval = setInterval(() => {
      if (!this.analyser) return;
      const buf = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      this.opts.onLevelUpdate?.(Math.min(1, Math.sqrt(sum / buf.length) * 8));
    }, 50);

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.chunks = [];

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
        this.opts.onDataAvailable?.(e.data);
      }
    };

    this.mediaRecorder.start(250);
    this.setState('recording');
  }

  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      this.setState('paused');
    }
  }

  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
      this.setState('recording');
    }
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder!.mimeType });
        this.cleanup();
        this.setState('stopped');
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }

  discard(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
    this.setState('idle');
  }

  private cleanup(): void {
    if (this.levelInterval) clearInterval(this.levelInterval);
    this.levelInterval = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.stream = null;
  }

  private setState(s: RecorderState): void {
    this.state = s;
    this.opts.onStateChange?.(s);
  }
}
