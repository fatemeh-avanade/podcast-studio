'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, Square, Pause, Play, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AudioRecorder, type RecorderState } from '@/lib/audio/recorder';
import { formatDuration } from '@/lib/audio/encoder';

interface RecorderProps {
  onSave: (blob: Blob, duration: number) => void;
}

export function Recorder({ onSave }: RecorderProps) {
  const [recState, setRecState] = useState<RecorderState>('idle');
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveDataRef = useRef<number[]>([]);
  const animFrameRef = useRef<number>(0);

  // Draw live waveform
  const drawWave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const data = waveDataRef.current;
    if (data.length === 0) {
      animFrameRef.current = requestAnimationFrame(drawWave);
      return;
    }

    const barWidth = 3;
    const gap = 1.5;
    const maxBars = Math.floor(width / (barWidth + gap));
    const slice = data.slice(-maxBars);

    ctx.fillStyle = 'rgba(139, 92, 246, 0.85)'; // purple
    slice.forEach((v, i) => {
      const barH = Math.max(3, v * height * 0.9);
      const x = i * (barWidth + gap);
      const y = (height - barH) / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 1.5);
      ctx.fill();
    });

    animFrameRef.current = requestAnimationFrame(drawWave);
  }, []);

  useEffect(() => {
    if (recState === 'recording') {
      animFrameRef.current = requestAnimationFrame(drawWave);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [recState, drawWave]);

  const handleStart = async () => {
    const rec = new AudioRecorder({
      onStateChange: setRecState,
      onLevelUpdate: (v) => {
        setLevel(v);
        waveDataRef.current = [...waveDataRef.current.slice(-300), v];
      },
    });
    recorderRef.current = rec;
    await rec.start();
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000));
    }, 500);
  };

  const handlePause = () => {
    recorderRef.current?.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    pausedTimeRef.current += Date.now() - startTimeRef.current - elapsed * 1000;
  };

  const handleResume = () => {
    recorderRef.current?.resume();
    startTimeRef.current = Date.now() - elapsed * 1000;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  };

  const handleStop = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const blob = await recorderRef.current?.stop();
    if (blob && blob.size > 0) {
      onSave(blob, elapsed);
    }
    waveDataRef.current = [];
    setElapsed(0);
    setLevel(0);
  };

  const handleDiscard = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.discard();
    waveDataRef.current = [];
    setElapsed(0);
    setLevel(0);
  };

  const isIdle = recState === 'idle' || recState === 'stopped';
  const isRecording = recState === 'recording';
  const isPaused = recState === 'paused';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Waveform canvas */}
      <div className="w-full h-28 rounded-2xl bg-muted/50 border border-border overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          width={800}
          height={112}
        />
        {isIdle && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            Press record to start
          </div>
        )}
      </div>

      {/* Mic level bar */}
      <div className="w-full flex items-center gap-3">
        <Mic className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-75',
              level > 0.7 ? 'bg-destructive' : level > 0.4 ? 'bg-yellow-400' : 'bg-primary'
            )}
            style={{ width: `${level * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground w-14 text-right">
          {formatDuration(elapsed)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {isIdle && (
          <Button
            size="lg"
            className="gap-2 px-8 rounded-full shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90"
            onClick={handleStart}
          >
            <Mic className="w-4 h-4" />
            Record
          </Button>
        )}

        {(isRecording || isPaused) && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full"
              onClick={handleDiscard}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>

            {isRecording ? (
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={handlePause}
              >
                <Pause className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={handleResume}
              >
                <Play className="w-5 h-5" />
              </Button>
            )}

            <Button
              size="icon"
              className={cn(
                'w-14 h-14 rounded-full shadow-lg',
                isRecording
                  ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/30 animate-pulse'
                  : 'bg-primary hover:bg-primary/90 shadow-primary/30'
              )}
              onClick={handleStop}
            >
              {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Check className="w-5 h-5" />}
            </Button>
          </>
        )}
      </div>

      {(isRecording || isPaused) && (
        <p className="text-xs text-muted-foreground">
          {isRecording ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse inline-block" />
              Recording…
            </span>
          ) : (
            'Paused — press ▶ to resume or ✓ to finish'
          )}
        </p>
      )}
    </div>
  );
}
