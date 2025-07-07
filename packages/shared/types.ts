export interface Episode {
  episodeId: string;
  episodeNumber: number;
  title: string;
  publishDate: string; // ISO 8601 format
  duration: string; // Format: "HH:MM:SS" or "MM:SS"
  description: string;
  audioUrl: string;
  shownotes: string; // Markdown content
  translations: Translation[];
  status: EpisodeStatus;
}

export interface Translation {
  spanish: string;
  english: string;
  startIndex: number;
  endIndex: number;
}

export type EpisodeStatus = 'draft' | 'pending_publish' | 'published';

export interface EpisodesIndex {
  episodes: Episode[];
  lastUpdated: string; // ISO 8601 format
}

// RSS Feed Types
export interface RSSItem {
  guid?: string;
  title?: string;
  description?: string;
  pubDate?: string;
  enclosure?: {
    url?: string;
  };
  'itunes:duration'?: string;
  'itunes:episode'?: string | number;
}

export interface RSSFeed {
  rss: {
    channel: {
      item: RSSItem | RSSItem[];
    };
  };
}

// Admin Types
export interface AdminSession {
  userId: string;
  expires: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Utility Types
export interface SortPreferences {
  sortBy: 'date' | 'episode';
  order: 'asc' | 'desc';
}

export interface SearchFilters {
  query: string;
  status?: EpisodeStatus;
}