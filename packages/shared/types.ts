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
  googleDocsUrls: string[]; // Google Docs URLs extracted from description
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
export interface RSSEnclosure {
  url?: string;
  '@_url'?: string;
  [key: string]: any; // Allow for other XML attributes
}

export interface RSSItem {
  guid?: string;
  title?: string;
  description?: string;
  pubDate?: string;
  enclosure?: RSSEnclosure;
  'itunes:duration'?: string;
  'itunes:episode'?: string | number;
  [key: string]: any; // Allow for other RSS fields
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