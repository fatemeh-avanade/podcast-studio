'use client';

import { openDB, type IDBPDatabase } from 'idb';
import type { Episode, PodcastProfile } from '@/lib/types';

const DB_NAME = 'podcast-studio';
const DB_VERSION = 1;
const EPISODES_STORE = 'episodes';
const PROFILE_STORE = 'profile';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(EPISODES_STORE)) {
          const store = db.createObjectStore(EPISODES_STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('status', 'status');
        }
        if (!db.objectStoreNames.contains(PROFILE_STORE)) {
          db.createObjectStore(PROFILE_STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllEpisodes(): Promise<Episode[]> {
  const db = await getDB();
  const episodes = await db.getAll(EPISODES_STORE);
  return episodes.sort((a: Episode, b: Episode) => b.createdAt - a.createdAt);
}

export async function getEpisode(id: string): Promise<Episode | undefined> {
  const db = await getDB();
  return db.get(EPISODES_STORE, id);
}

export async function saveEpisode(episode: Episode): Promise<void> {
  const db = await getDB();
  await db.put(EPISODES_STORE, { ...episode, updatedAt: Date.now() });
}

export async function deleteEpisode(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(EPISODES_STORE, id);
}

export async function createEpisode(partial: Partial<Episode> = {}): Promise<Episode> {
  const now = Date.now();
  const episode: Episode = {
    id: crypto.randomUUID(),
    title: 'Untitled Episode',
    description: '',
    tags: [],
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
  await saveEpisode(episode);
  return episode;
}

export async function getPodcastProfile(): Promise<PodcastProfile | undefined> {
  const db = await getDB();
  return db.get(PROFILE_STORE, 'profile');
}

export async function savePodcastProfile(profile: PodcastProfile): Promise<void> {
  const db = await getDB();
  await db.put(PROFILE_STORE, profile, 'profile');
}
