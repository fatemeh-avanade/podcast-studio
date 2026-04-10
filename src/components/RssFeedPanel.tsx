'use client';

import { useState, useEffect } from 'react';
import { Copy, Download, RefreshCw, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { generateRssFeed } from '@/lib/rss/generator';
import { getAllEpisodes, getPodcastProfile } from '@/lib/store/episodes';
import type { Episode, PodcastProfile } from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function RssFeedPanel() {
  const [profile, setProfile] = useState<PodcastProfile>(DEFAULT_PROFILE);
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const [xmlPreview, setXmlPreview] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [prof, eps] = await Promise.all([getPodcastProfile(), getAllEpisodes()]);
      if (prof) setProfile(prof);
      setEpisodes(eps);
      setLoading(false);
    })();
  }, []);

  const regenerate = () => {
    const xml = generateRssFeed(profile, episodes, baseUrl);
    setXmlPreview(xml);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlPreview);
    toast.success('RSS XML copied to clipboard');
  };

  const handleDownload = () => {
    const blob = new Blob([xmlPreview], { type: 'application/rss+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feed.xml';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('feed.xml downloaded');
  };

  const publishedCount = episodes.filter((e) => e.status === 'published').length;

  if (loading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="space-y-5">
      {/* Nudge to Settings if profile is empty */}
      {!profile.title && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <span>Set up your podcast profile before generating a feed.</span>
          <Link href="/settings" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5' })}>
            <Settings className="w-3.5 h-3.5" />
            Go to Settings
          </Link>
        </div>
      )}

      {/* Feed generation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">RSS Feed</h3>
          <Badge variant="secondary">{publishedCount} published</Badge>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Base URL <span className="text-muted-foreground/60">(optional — used for audio file links in the feed)</span>
          </Label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:3000"
          />
        </div>

        <Button variant="outline" size="sm" className="gap-2 w-full" onClick={regenerate}>
          <RefreshCw className="w-4 h-4" />
          Generate RSS Feed
        </Button>

        {xmlPreview && (
          <>
            <div className="rounded-xl border border-border bg-muted/30 p-3 overflow-auto max-h-64">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                {xmlPreview}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={handleCopy}>
                <Copy className="w-3.5 h-3.5" />
                Copy XML
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={handleDownload}>
                <Download className="w-3.5 h-3.5" />
                Download feed.xml
              </Button>
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Host this file publicly, then submit your feed URL to{' '}
              <a
                href="https://podcastsconnect.apple.com/"
                target="_blank"
                rel="noopener"
                className="underline hover:text-foreground"
              >
                Apple Podcasts
              </a>
              ,{' '}
              <a
                href="https://podcasters.spotify.com/"
                target="_blank"
                rel="noopener"
                className="underline hover:text-foreground"
              >
                Spotify
              </a>
              , or Anchor.
            </p>
          </>
        )}
      </div>
    </div>
  );
}


