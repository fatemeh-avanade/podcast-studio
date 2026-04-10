# 🎙️ PodcastStudio

> A professional, browser-only podcast recording and publishing app — built entirely through an interactive conversation with [GitHub Copilot CLI](https://githubnext.com/projects/copilot-cli).

---

## What is PodcastStudio?

PodcastStudio is a sleek, self-contained web app that lets you record, edit, and publish podcasts without installing any desktop software or paying for hosting. Everything runs in your browser.

### Features

| Area | What you can do |
|------|----------------|
| 🎤 **Record** | Capture microphone audio with a live waveform level meter |
| ✂️ **Edit** | Denoise background noise, normalize loudness, export as WAV or MP3 |
| 📋 **Manage** | Episode library with a visual **Draft → Ready → Live** status pipeline |
| 📡 **Publish** | Generate a valid RSS 2.0 / iTunes-compatible feed and deploy to GitHub Pages in one click |
| 🌍 **Distribute** | Submit your feed directly to Podcast Index (free), Spotify, and Apple Podcasts |
| 🔒 **Privacy** | Hide individual episodes from the feed, or block the whole podcast from directories |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (base-ui) |
| Audio processing | Web Audio API, WaveSurfer.js, @breezystack/lamejs |
| Local storage | IndexedDB via `idb` |
| Publishing | GitHub REST API → GitHub Pages |

No backend. No database. No subscription. Your audio lives in your browser's IndexedDB until you choose to publish it.

---

## How We Built It — A Copilot CLI Story

This project was built from scratch in a single interactive session between a developer and **GitHub Copilot CLI** — a conversational coding agent running directly in the terminal.

The developer had an idea and a blank folder. Copilot CLI had tools, code generation, and a problem-solving loop. Here's how it went:

### The conversation-driven workflow

Rather than writing a spec and handing it to a tool, the developer described what they wanted in plain language — and Copilot CLI responded by planning, scaffolding, writing, fixing, and iterating in real time.

```
Developer: "I want to build a professional looking app for recording
            and publishing podcasts with some useful but basic tools
            like denoising background voices. Keep it compact and
            efficient, but sleek and nice."

Copilot CLI: [asked clarifying questions about platform, stack,
             publishing targets, browser-only vs server]
             → created a structured plan
             → scaffolded Next.js 16
             → installed dependencies
             → built all lib files, components, and pages
```

Every feature in this app came from a short message. A few real examples:

| Developer said | Copilot CLI did |
|---------------|----------------|
| *"mark the optional fields with (optional)"* | Updated labels across two pages |
| *"why do I see Podcast Profile in two places?"* | Diagnosed a duplicate component, removed it, fixed the resulting build error |
| *"could you make these two steps also programmatic?"* | Built a full GitHub API publisher + deploy UI from scratch |
| *"make the status change more clear, maybe like a lineage"* | Designed and built `StatusPipeline.tsx` — a connected stepper component |
| *"change the record icon to something like a classic cassette"* | Searched the installed icon library, found `CassetteTape`, swapped it in |
| *"add a top bar with a title"* | Built `TopBar.tsx` with brand + current-page label, adjusted layout offsets |
| *"make sure no secrets will be exposed"* | Scanned the codebase, verified the gitignore, explained the security model |

### Debugging together

When errors came up — and they did — the loop stayed tight:

- **`MPEGMode is not defined`** — Copilot CLI diagnosed that `lamejs` (a legacy CJS module) breaks when dynamically imported by webpack. It researched an ESM-compatible fork (`@breezystack/lamejs`), updated the import and type declaration, and told the developer exactly which `npm` command to run.
- **`Export Github doesn't exist`** — Caught a non-existent Lucide icon name, replaced it with the correct one.
- **Build errors from duplicate exports** — Traced to a refactor where a component existed in two places, resolved cleanly.

### The human's role

The developer provided:
- The original vision
- Real-world feedback after testing ("the Google Podcasts link redirects to YouTube")
- Design taste ("something like a classic cassette", "like a lineage")
- Decisions when Copilot asked ("which icon?", "what should the app be called?")

Copilot CLI handled everything else — architecture decisions, file structure, TypeScript types, API integration, UI layout, error diagnosis, git setup, and this README.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Publishing Your Podcast

1. Go to **Settings** → fill in your Podcast Profile
2. Record episodes in the **Studio**, mark them **Live**
3. Go to **Publish** → GitHub Deploy
4. Paste a [GitHub Personal Access Token](https://github.com/settings/tokens/new?scopes=repo,pages&description=PodcastStudio) with `repo` + `pages` scopes
5. Click **Deploy** — your feed goes live at `https://<you>.github.io/<repo>/feed.xml`
6. Submit that URL to Podcast Index, Spotify, or Apple Podcasts

> Your PAT is stored only in `localStorage` in your browser. It is never committed to source control or sent anywhere except the GitHub API.

### Two repos, one clear purpose

When you click Deploy, PodcastStudio creates a **second GitHub repository** — separate from this code repo — to host your podcast content:

| Repository | What it contains | Who it's for |
|-----------|-----------------|--------------|
| `podcast-studio` ← **this repo** | App source code (TypeScript, components, config) | Developers / you |
| `<your-podcast-name>` ← **created on deploy** | `feed.xml` + `episodes/*.mp3` served via GitHub Pages | Your listeners & podcast directories |

Your recorded audio and RSS feed **never touch this code repository**. They live in a dedicated content repo with its own GitHub Pages URL. This keeps code and content cleanly separated.

---

## Security

- No backend — zero server-side attack surface
- No hardcoded secrets anywhere in the codebase
- `.env*` files are git-ignored
- Audio stays in your browser (IndexedDB) until you explicitly deploy
- GitHub PAT is runtime-only, masked in the UI, and deletable by clearing site data

