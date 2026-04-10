'use client';

import { useState, useEffect } from 'react';
import { GitBranch, Rocket, CheckCircle2, ExternalLink, Eye, EyeOff, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getAllEpisodes, getPodcastProfile } from '@/lib/store/episodes';
import { generateRssFeed } from '@/lib/rss/generator';
import { encodeToMp3 } from '@/lib/audio/encoder';
import { deployToGitHubPages, type DeployProgress, type DeployResult } from '@/lib/github/publisher';
import type { Episode } from '@/lib/types';
import { toast } from 'sonner';

const TOKEN_KEY = 'ps_github_token';
const REPO_KEY = 'ps_github_repo';

export function GitHubDeploy() {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('my-podcast');
  const [showToken, setShowToken] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [progress, setProgress] = useState<DeployProgress | null>(null);
  const [result, setResult] = useState<DeployResult | null>(null);

  // Persist token + repo in localStorage
  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY) ?? '');
    setRepo(localStorage.getItem(REPO_KEY) ?? 'my-podcast');
  }, []);

  const save = () => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REPO_KEY, repo);
  };

  const handleDeploy = async () => {
    if (!token.trim()) { toast.error('Enter your GitHub Personal Access Token'); return; }
    if (!repo.trim()) { toast.error('Enter a repository name'); return; }

    save();
    setDeploying(true);
    setProgress(null);
    setResult(null);

    try {
      const [profile, episodes] = await Promise.all([getPodcastProfile(), getAllEpisodes()]);
      const published = episodes.filter((e) => e.status === 'published' && e.audioBlob);

      if (published.length === 0) {
        toast.error('No published episodes with audio. Mark episodes as Published first.');
        setDeploying(false);
        return;
      }

      const pagesUrl = `https://github-user.github.io/${repo}`;

      // Encode audio blobs to MP3
      const encodedEpisodes: Array<{ id: string; title: string; audioBlob: Blob }> = [];
      for (const ep of published) {
        setProgress({ step: `Encoding "${ep.title}" to MP3…`, current: 0, total: published.length });
        const mp3 = await encodeToMp3(ep.audioBlob!, {});
        encodedEpisodes.push({ id: ep.id, title: ep.title, audioBlob: mp3 });
      }

      // Generate feed with the real GitHub Pages URL as base
      const deployedProfile = profile ?? { title: '', author: '', description: '', email: '', website: '', language: 'en', category: 'Technology', explicit: false };

      // First pass: deploy with placeholder to get the owner/URL, then re-upload feed with real URL
      const placeholderFeed = generateRssFeed(deployedProfile, episodes, 'https://placeholder');

      const deployResult = await deployToGitHubPages(
        { token, repo },
        placeholderFeed,
        encodedEpisodes,
        setProgress
      );

      // Second pass: re-upload feed.xml with the correct Pages URL now that we know the owner
      setProgress({ step: 'Finalising feed URLs…', current: deployResult ? 1 : 0, total: 1 });
      const realFeed = generateRssFeed(deployedProfile, episodes, deployResult.pagesUrl);
      await deployToGitHubPages({ token, repo }, realFeed, [], () => {});

      setResult(deployResult);
      toast.success('Deployed to GitHub Pages! 🎉');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Deploy failed');
    } finally {
      setDeploying(false);
    }
  };

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Deploy to GitHub Pages</h3>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Your podcast feed and audio files will be hosted for free at{' '}
        <span className="font-mono">https://you.github.io/{repo || 'my-podcast'}/</span>
      </p>

      {/* Token */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">
          GitHub Personal Access Token{' '}
          <a
            href="https://github.com/settings/tokens/new?scopes=repo,pages&description=PodcastStudio"
            target="_blank"
            rel="noopener"
            className="underline hover:text-foreground"
          >
            (create one ↗)
          </a>
        </Label>
        <div className="relative">
          <Input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="pr-10 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Needs <span className="font-mono">repo</span> and <span className="font-mono">pages</span> scopes. Stored locally in your browser only.
        </p>
      </div>

      {/* Repo name */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Repository name</Label>
        <Input
          value={repo}
          onChange={(e) => setRepo(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          placeholder="my-podcast"
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Created automatically if it doesn't exist.
        </p>
      </div>

      {/* Deploy button */}
      <Button
        className="w-full gap-2"
        onClick={handleDeploy}
        disabled={deploying}
      >
        {deploying ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Rocket className="w-4 h-4" />
        )}
        {deploying ? 'Deploying…' : 'Deploy Now'}
      </Button>

      {/* Progress */}
      {deploying && progress && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.step}</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Deployed successfully!
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <p className="text-muted-foreground mb-1">Your feed URL (submit this to podcast directories):</p>
              <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 font-mono">
                <span className="flex-1 truncate">{result.feedUrl}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(result.feedUrl); toast.success('Copied!'); }}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <Separator />

          <p className="text-xs text-muted-foreground">Submit your feed to go live on:</p>
          <div className="flex flex-col gap-2">
            <a
              href={`https://podcastindex.org/add?url=${encodeURIComponent(result.feedUrl)}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 text-xs text-foreground hover:text-primary underline"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              Submit to Podcast Index (free, instant, no account needed) ↗
            </a>
            <a
              href={`https://podcasters.spotify.com/pod/submit?rss=${encodeURIComponent(result.feedUrl)}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 text-xs text-foreground hover:text-primary underline"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              Submit to Spotify for Podcasters ↗
            </a>
            <a
              href={`https://podcastsconnect.apple.com/my-podcasts/new-feed`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 text-xs text-foreground hover:text-primary underline"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              Submit to Apple Podcasts (requires Apple ID) ↗
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: GitHub Pages may take 1–2 minutes to go live after first deploy.
          </p>
        </div>
      )}
    </div>
  );
}
