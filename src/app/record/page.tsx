'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sidebar } from '@/components/Sidebar';
import { Recorder } from '@/components/Recorder';
import { createEpisode } from '@/lib/store/episodes';
import { toast } from 'sonner';

export default function RecordPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');

  const handleSave = async (blob: Blob, duration: number) => {
    const ep = await createEpisode({
      title: title.trim() || 'Untitled Episode',
      audioBlob: blob,
      audioDuration: duration,
      audioSize: blob.size,
      status: 'draft',
    });
    toast.success('Recording saved!');
    router.push(`/episode/${ep.id}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-16 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'w-8 h-8' })}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Recording Studio</h1>
              <p className="text-xs text-muted-foreground">Capture your episode</p>
            </div>
          </div>

          {/* Episode name */}
          <div className="mb-6">
            <Label htmlFor="rec-title" className="text-xs text-muted-foreground mb-1.5 block">
              Episode title (optional)
            </Label>
            <Input
              id="rec-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this recording a name…"
              className="text-base"
            />
          </div>

          {/* Recorder */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Recorder onSave={handleSave} />
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Recording uses your browser's microphone with echo cancellation and noise suppression.
            After recording, you can apply additional denoising and normalization in the editor.
          </p>
        </div>
      </main>
    </div>
  );
}
