export type EpisodeStatus = 'draft' | 'ready' | 'published';

export interface Episode {
  id: string;
  title: string;
  description: string;
  season?: number;
  episodeNumber?: number;
  tags: string[];
  coverArtUrl?: string;
  audioBlob?: Blob;
  audioDuration?: number; // seconds
  audioSize?: number;     // bytes
  status: EpisodeStatus;
  hidden?: boolean;       // exclude from RSS feed without deleting
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

export interface PodcastProfile {
  title: string;
  author: string;
  description: string;
  email: string;
  website: string;
  language: string;
  category: string;
  coverArtUrl?: string;
  explicit: boolean;
  blocked?: boolean;      // adds <itunes:block> to signal removal from directories
}

export const DEFAULT_PROFILE: PodcastProfile = {
  title: '',
  author: '',
  description: '',
  email: '',
  website: '',
  language: 'en',
  category: 'Technology',
  explicit: false,
};
