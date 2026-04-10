'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sidebar } from '@/components/Sidebar';
import { WaveformEditor } from '@/components/WaveformEditor';
import { EpisodeForm } from '@/components/EpisodeForm';
import { StatusPipeline } from '@/components/StatusPipeline';
import { getEpisode, saveEpisode } from '@/lib/store/episodes';
import type { Episode, EpisodeStatus } from '@/lib/types';
import { toast } from 'sonner';

const statusCycle: Record<EpisodeStatus, EpisodeStatus> = {
  draft: 'ready',
  ready: 'published',
  published: 'draft',
};

export default function EpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getEpisode(id).then((ep) => {
      if (!ep) { router.push('/'); return; }
      setEpisode(ep);
    });
  }, [id, router]);

  const update = (updates: Partial<Episode>) => {
    setEpisode((prev) => prev ? { ...prev, ...updates } : null);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!episode) return;
    setSaving(true);
    await saveEpisode(episode);
    setSaving(false);
    setDirty(false);
    toast.success('Saved');
  };

  const handleStatusSelect = async (next: EpisodeStatus) => {
    if (!episode || next === episode.status) return;
    const updated = { ...episode, status: next, ...(next === 'published' ? { publishedAt: Date.now() } : {}) };
    setEpisode(updated);
    await saveEpisode(updated);
    toast.success(`Marked as ${next}`);
  };

  const handleAudioUpdate = (newBlob: Blob) => {
    update({ audioBlob: newBlob, audioSize: newBlob.size });
  };

  if (!episode) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-16 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'w-8 h-8' })}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight truncate max-w-xs">
                  {episode.title || 'Untitled Episode'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Last saved {new Date(episode.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <StatusPipeline status={episode.status} onSelect={handleStatusSelect} />
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleSave}
                disabled={!dirty || saving}
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={episode.audioBlob ? 'audio' : 'details'}>
            <TabsList className="mb-6">
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="audio">
              {episode.audioBlob ? (
                <WaveformEditor
                  audioBlob={episode.audioBlob}
                  duration={episode.audioDuration ?? 0}
                  onUpdate={handleAudioUpdate}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground text-sm mb-4">No audio recorded yet</p>
                  <Link href="/record" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Go to Studio
                </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details">
              <EpisodeForm episode={episode} onChange={update} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
