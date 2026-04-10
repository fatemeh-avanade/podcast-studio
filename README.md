# 🎙️ PodcastStudio

A professional, browser-only podcast recording and publishing app built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Record** — capture audio directly in the browser with a live waveform meter
- **Edit** — denoise, normalize, and export episodes as WAV or MP3
- **Manage** — episode library with Draft → Ready → Live status pipeline
- **Publish** — generate a valid RSS 2.0 / iTunes feed and deploy to GitHub Pages in one click
- **Submit** — direct links to submit your feed to Podcast Index, Spotify, and Apple Podcasts

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (base-ui) |
| Audio | Web Audio API, WaveSurfer.js, @breezystack/lamejs |
| Storage | IndexedDB (via `idb`) |
| Publishing | GitHub REST API → GitHub Pages |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Publishing a Podcast

1. Fill in your **Podcast Profile** in Settings
2. Record and edit episodes, set each to **Live** status
3. Go to **Publish** → GitHub Deploy
4. Enter a [GitHub Personal Access Token](https://github.com/settings/tokens/new?scopes=repo,pages&description=PodcastStudio) with `repo` and `pages` scopes
5. Click **Deploy to GitHub Pages** — your RSS feed will be live at `https://<username>.github.io/<repo>/feed.xml`
6. Submit that URL to Podcast Index, Spotify, or Apple Podcasts

> ⚠️ Your GitHub PAT is stored only in your browser's `localStorage` and is never committed to source control.

## Security

- No backend — all processing happens in the browser
- No secrets in source code
- `.env*` files are git-ignored
- Audio data is stored locally in IndexedDB only
