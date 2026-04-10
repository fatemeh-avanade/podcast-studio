'use client';

import { PenLine, CheckCircle2, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EpisodeStatus } from '@/lib/types';

const STEPS: { status: EpisodeStatus; label: string; icon: React.ElementType }[] = [
  { status: 'draft',     label: 'Draft',     icon: PenLine     },
  { status: 'ready',     label: 'Ready',     icon: CheckCircle2 },
  { status: 'published', label: 'Live',      icon: Radio        },
];

const ORDER: Record<EpisodeStatus, number> = { draft: 0, ready: 1, published: 2 };

/** Full horizontal stepper — used in episode editor header */
export function StatusPipeline({
  status,
  onSelect,
}: {
  status: EpisodeStatus;
  onSelect?: (s: EpisodeStatus) => void;
}) {
  const current = ORDER[status];

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const idx = ORDER[step.status];
        const isActive = idx === current;
        const isDone   = idx < current;
        const Icon     = step.icon;

        return (
          <div key={step.status} className="flex items-center">
            {/* Node */}
            <button
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(step.status)}
              className={cn(
                'flex flex-col items-center gap-1 group',
                onSelect ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200',
                  isActive && 'border-primary bg-primary text-primary-foreground shadow-[0_0_10px_2px_hsl(var(--primary)/0.35)]',
                  isDone   && 'border-primary/50 bg-primary/15 text-primary',
                  !isActive && !isDone && 'border-border bg-muted/40 text-muted-foreground',
                  onSelect && !isActive && 'group-hover:border-primary/60 group-hover:text-primary',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium tracking-wide',
                  isActive && 'text-primary',
                  isDone   && 'text-primary/70',
                  !isActive && !isDone && 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-10 h-0.5 mb-4 mx-1 rounded-full transition-colors duration-200',
                  current > i ? 'bg-primary/50' : 'bg-border',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Compact dot pipeline — used in episode list cards */
export function StatusPipelineMini({ status }: { status: EpisodeStatus }) {
  const current = ORDER[status];

  return (
    <div className="flex items-center gap-0.5">
      {STEPS.map((step, i) => {
        const idx = ORDER[step.status];
        const isActive = idx === current;
        const isDone   = idx < current;

        return (
          <div key={step.status} className="flex items-center gap-0.5">
            <div
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                isActive && 'bg-primary ring-2 ring-primary/30',
                isDone   && 'bg-primary/50',
                !isActive && !isDone && 'bg-border',
              )}
            />
            {i < STEPS.length - 1 && (
              <div className={cn('w-3 h-px', current > i ? 'bg-primary/40' : 'bg-border')} />
            )}
          </div>
        );
      })}
      <span
        className={cn(
          'ml-1.5 text-xs font-medium',
          status === 'published' && 'text-green-400',
          status === 'ready'     && 'text-yellow-400',
          status === 'draft'     && 'text-muted-foreground',
        )}
      >
        {STEPS[current].label}
      </span>
    </div>
  );
}
