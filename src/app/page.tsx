'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mic2, Plus, Trash2, Edit3,
  FileAudio, Headphones
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/Sidebar';
import { StatusPipelineMini } from '@/components/StatusPipeline';
import { getAllEpisodes, deleteEpisode, createEpisode } from '@/lib/store/episodes';
import { formatDuration, formatFileSize } from '@/lib/audio/encoder';
import type { Episode } from '@/lib/types';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setEpisodes(await getAllEpisodes());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleNew = async () => {
    const ep = await createEpisode();
    router.push(`/episode/${ep.id}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    await deleteEpisode(id);
    setEpisodes((prev) => prev.filter((ep) => ep.id !== id));
    toast.success('Episode deleted');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-16 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Episodes</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {episodes.length} episode{episodes.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/record" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2' })}>
                  <Mic2 className="w-4 h-4" />
                  Record New
                </Link>
              <Button size="sm" className="gap-2" onClick={handleNew}>
                <Plus className="w-4 h-4" />
                New Episode
              </Button>
            </div>
          </div>

          {/* Empty state */}
          {!loading && episodes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Headphones className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">No episodes yet</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Start recording your first podcast episode or create a blank draft.
              </p>
              <div className="flex gap-3">
                <Link href="/record" className={buttonVariants({ className: 'gap-2' })}>
                    <Mic2 className="w-4 h-4" />
                    Record Now
                  </Link>
                <Button variant="outline" onClick={handleNew}>Create Draft</Button>
              </div>
            </div>
          )}

          {/* Episode list */}
          {!loading && episodes.length > 0 && (
            <div className="space-y-2">
              {episodes.map((ep) => {
                return (
                  <Link
                    key={ep.id}
                    href={`/episode/${ep.id}`}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/40 transition-colors"
                  >
                    {/* Cover art */}
                    <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden">
                      {ep.coverArtUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ep.coverArtUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileAudio className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{ep.title || 'Untitled'}</span>
                        {ep.season && ep.episodeNumber && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            S{ep.season}E{ep.episodeNumber}
                          </Badge>
                        )}
                        {ep.hidden && (
                          <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">hidden</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <StatusPipelineMini status={ep.status} />
                        {ep.audioDuration && (
                          <>
                            <span>·</span>
                            <span>{formatDuration(ep.audioDuration)}</span>
                          </>
                        )}
                        {ep.audioSize && (
                          <>
                            <span>·</span>
                            <span>{formatFileSize(ep.audioSize)}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{new Date(ep.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/episode/${ep.id}`);
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 hover:text-destructive"
                        onClick={(e) => handleDelete(ep.id, e)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

