'use client';

const GH_API = 'https://api.github.com';

export interface GitHubConfig {
  token: string;
  repo: string; // "my-podcast" — owner is inferred from token
}

export interface DeployProgress {
  step: string;
  current: number;
  total: number;
}

async function ghFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${GH_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/** Verify token and return the authenticated username */
export async function getAuthenticatedUser(token: string): Promise<string> {
  const res = await ghFetch('/user', token);
  if (!res.ok) throw new Error('Invalid GitHub token — check it and try again.');
  const data = await res.json();
  return data.login as string;
}

/** Ensure the repo exists; create it if not */
async function ensureRepo(token: string, owner: string, repo: string): Promise<void> {
  const check = await ghFetch(`/repos/${owner}/${repo}`, token);
  if (check.status === 404) {
    const create = await ghFetch('/user/repos', token, {
      method: 'POST',
      body: JSON.stringify({
        name: repo,
        description: 'Podcast hosted via PodcastStudio',
        private: false,
        auto_init: true, // creates main branch with README
      }),
    });
    if (!create.ok) {
      const err = await create.json();
      throw new Error(`Could not create repo: ${err.message}`);
    }
    // Wait briefly for GitHub to initialise the repo
    await new Promise((r) => setTimeout(r, 2000));
  }
}

/** Get the SHA of an existing file (needed to update it) */
async function getFileSha(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | undefined> {
  const res = await ghFetch(`/repos/${owner}/${repo}/contents/${path}`, token);
  if (res.status === 404) return undefined;
  const data = await res.json();
  return data.sha as string;
}

/** Upload (create or update) a file in the repo */
async function putFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string, // base64
  message: string
): Promise<void> {
  const sha = await getFileSha(token, owner, repo, path);
  const res = await ghFetch(`/repos/${owner}/${repo}/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify({ message, content, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to upload ${path}: ${err.message}`);
  }
}

/** Enable GitHub Pages from the root of main branch */
async function enablePages(token: string, owner: string, repo: string): Promise<void> {
  // Check if already enabled
  const check = await ghFetch(`/repos/${owner}/${repo}/pages`, token);
  if (check.ok) return; // already on

  const res = await ghFetch(`/repos/${owner}/${repo}/pages`, token, {
    method: 'POST',
    body: JSON.stringify({ source: { branch: 'main', path: '/' } }),
  });
  // 201 = created, 409 = already exists — both are fine
  if (!res.ok && res.status !== 409) {
    // Pages might need a moment after repo creation — ignore non-critical failure
    console.warn('GitHub Pages enable warning:', res.status);
  }
}

/** Convert a Blob to a base64 string */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]); // strip "data:...;base64,"
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface DeployResult {
  pagesUrl: string;
  feedUrl: string;
  owner: string;
}

export async function deployToGitHubPages(
  config: GitHubConfig,
  feedXml: string,
  episodes: Array<{ id: string; title: string; audioBlob: Blob }>,
  onProgress: (p: DeployProgress) => void
): Promise<DeployResult> {
  const total = 3 + episodes.length; // verify + repo + pages + each episode + feed
  let current = 0;

  const next = (step: string) => onProgress({ step, current: ++current, total });

  // 1. Verify token
  next('Verifying GitHub token…');
  const owner = await getAuthenticatedUser(config.token);

  // 2. Ensure repo exists
  next(`Setting up repo "${config.repo}"…`);
  await ensureRepo(config.token, owner, config.repo);

  // 3. Upload each episode MP3
  for (const ep of episodes) {
    next(`Uploading "${ep.title}"…`);
    const b64 = await blobToBase64(ep.audioBlob);
    await putFile(
      config.token,
      owner,
      config.repo,
      `episodes/${ep.id}.mp3`,
      b64,
      `Add episode: ${ep.title}`
    );
  }

  // 4. Upload feed.xml (with correct base URL already embedded)
  next('Uploading feed.xml…');
  const feedB64 = btoa(unescape(encodeURIComponent(feedXml)));
  await putFile(config.token, owner, config.repo, 'feed.xml', feedB64, 'Update RSS feed');

  // 5. Enable GitHub Pages
  next('Enabling GitHub Pages…');
  await enablePages(config.token, owner, config.repo);

  const pagesUrl = `https://${owner}.github.io/${config.repo}`;
  return { pagesUrl, feedUrl: `${pagesUrl}/feed.xml`, owner };
}
