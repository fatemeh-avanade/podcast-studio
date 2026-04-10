'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Volume2, Download, Wand2, BarChart2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDuration, formatFileSize } from '@/lib/audio/encoder';
import { denoiseAudioBlob } from '@/lib/audio/denoiser';
import { normalizeAudio } from '@/lib/audio/normalizer';
import { encodeToMp3 } from '@/lib/audio/encoder';
import { toast } from 'sonner';

interface WaveformEditorProps {
  audioBlob: Blob;
  duration: number;
  onUpdate: (newBlob: Blob) => void;
}

export function WaveformEditor({ audioBlob, duration, onUpdate }: WaveformEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [processing, setProcessing] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentBlob, setCurrentBlob] = useState(audioBlob);
  const objectUrlRef = useRef<string>('');

  useEffect(() => {
    if (!containerRef.current) return;

    const url = URL.createObjectURL(currentBlob);
    objectUrlRef.current = url;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'oklch(0.6 0.05 280)',
      progressColor: 'oklch(0.65 0.22 292)',
      cursorColor: 'oklch(0.65 0.22 292)',
      barWidth: 2,
      barGap: 1.5,
      barRadius: 2,
      height: 96,
      normalize: true,
      url,
    });

    ws.on('timeupdate', (t) => setCurrentTime(t));
    ws.on('play', () => setPlaying(true));
    ws.on('pause', () => setPlaying(false));
    ws.on('finish', () => setPlaying(false));

    wsRef.current = ws;
    return () => {
      ws.destroy();
      URL.revokeObjectURL(url);
    };
  }, [currentBlob]);

  useEffect(() => {
    wsRef.current?.setVolume(volume / 100);
  }, [volume]);

  const runProcess = async (
    label: string,
    fn: () => Promise<Blob>
  ) => {
    setProcessing(label);
    setProgress(0);
    try {
      const result = await fn();
      setCurrentBlob(result);
      onUpdate(result);
      toast.success(`${label} complete`);
    } catch (e) {
      toast.error(`${label} failed`);
      console.error(e);
    } finally {
      setProcessing(null);
      setProgress(0);
    }
  };

  const handleDenoise = () =>
    runProcess('Denoising', () =>
      denoiseAudioBlob(currentBlob, setProgress)
    );

  const handleNormalize = () =>
    runProcess('Normalizing', () =>
      normalizeAudio(currentBlob, -1, setProgress)
    );

  const handleExportMp3 = async () => {
    setProcessing('Exporting MP3');
    setProgress(0);
    try {
      const mp3 = await encodeToMp3(currentBlob, { onProgress: setProgress });
      const url = URL.createObjectURL(mp3);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'episode.mp3';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('MP3 exported');
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setProcessing(null);
      setProgress(0);
    }
  };

  const handleExportWav = () => {
    const url = URL.createObjectURL(currentBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'episode.wav';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('WAV exported');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Waveform */}
      <div
        ref={containerRef}
        className="w-full rounded-xl bg-muted/40 border border-border overflow-hidden px-3 pt-2"
      />

      {/* Time + size info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">{formatDuration(currentTime)} / {formatDuration(duration)}</span>
        <span>{formatFileSize(currentBlob.size)}</span>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 rounded-full"
          onClick={() => wsRef.current?.playPause()}
          disabled={!!processing}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <div className="flex items-center gap-2 flex-1">
          <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <Slider
            min={0}
            max={100}
            step={1}
            value={[volume]}
            onValueChange={(v) => setVolume(Array.isArray(v) ? v[0] : v)}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8 text-right">{volume}%</span>
        </div>
      </div>

      {/* Processing tools */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleDenoise}
          disabled={!!processing}
        >
          {processing === 'Denoising' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          Denoise
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleNormalize}
          disabled={!!processing}
        >
          {processing === 'Normalizing' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BarChart2 className="w-4 h-4" />
          )}
          Normalize
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExportMp3}
          disabled={!!processing}
        >
          {processing === 'Exporting MP3' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export MP3
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExportWav}
          disabled={!!processing}
        >
          <Download className="w-4 h-4" />
          Export WAV
        </Button>
      </div>

      {/* Progress bar for processing */}
      {processing && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{processing}…</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
