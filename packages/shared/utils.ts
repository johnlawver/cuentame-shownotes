import type { Episode, EpisodesIndex, SortPreferences } from './types.js';

/**
 * Extract Google Docs URLs from HTML description
 */
export function extractGoogleDocsUrls(htmlDescription: string): string[] {
  if (!htmlDescription) return [];
  
  const googleDocsUrls: string[] = [];
  
  // Regex to match Google Docs URLs in href attributes
  const hrefRegex = /href=["']([^"']*https:\/\/docs\.google\.com\/document[^"']*)["']/gi;
  
  // Also match standalone URLs (not in href)
  const standaloneRegex = /https:\/\/docs\.google\.com\/document\/[^\s<>"'()]+/gi;
  
  let match;
  
  // Extract from href attributes
  while ((match = hrefRegex.exec(htmlDescription)) !== null) {
    const url = match[1];
    if (url && !googleDocsUrls.includes(url)) {
      googleDocsUrls.push(url);
    }
  }
  
  // Extract standalone URLs
  while ((match = standaloneRegex.exec(htmlDescription)) !== null) {
    const url = match[0];
    if (url && !googleDocsUrls.includes(url)) {
      googleDocsUrls.push(url);
    }
  }
  
  return googleDocsUrls;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Parse duration from various formats to seconds
 */
export function parseDuration(duration: string): number {
  if (!duration) return 0;
  
  const parts = duration.split(':').map(Number);
  
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }
  
  return 0;
}

/**
 * Format duration from seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Create a URL-friendly slug from episode title
 */
export function createSlug(title: string, episodeNumber: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return `${episodeNumber}-${slug}`;
}

/**
 * Parse episode number from various formats
 */
export function parseEpisodeNumber(episodeStr: string | number): number {
  if (typeof episodeStr === 'number') return episodeStr;
  
  const num = parseInt(episodeStr, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Sort episodes based on preferences
 */
export function sortEpisodes(episodes: Episode[], preferences: SortPreferences): Episode[] {
  const sorted = [...episodes].sort((a, b) => {
    if (preferences.sortBy === 'date') {
      const dateA = new Date(a.publishDate).getTime();
      const dateB = new Date(b.publishDate).getTime();
      return preferences.order === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return preferences.order === 'asc' 
        ? a.episodeNumber - b.episodeNumber
        : b.episodeNumber - a.episodeNumber;
    }
  });
  
  return sorted;
}

/**
 * Filter episodes by search query
 */
export function searchEpisodes(episodes: Episode[], query: string): Episode[] {
  if (!query.trim()) return episodes;
  
  const searchTerm = query.toLowerCase();
  
  return episodes.filter(episode => {
    const titleMatch = episode.title.toLowerCase().includes(searchTerm);
    const episodeMatch = episode.episodeNumber.toString().includes(searchTerm);
    const descriptionMatch = episode.description.toLowerCase().includes(searchTerm);
    
    return titleMatch || episodeMatch || descriptionMatch;
  });
}

/**
 * Validate episode data
 */
export function validateEpisode(episode: Partial<Episode>): string[] {
  const errors: string[] = [];
  
  if (!episode.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (!episode.episodeNumber || episode.episodeNumber < 1) {
    errors.push('Valid episode number is required');
  }
  
  if (!episode.publishDate) {
    errors.push('Publish date is required');
  } else if (isNaN(Date.parse(episode.publishDate))) {
    errors.push('Valid publish date is required');
  }
  
  if (!episode.audioUrl?.trim()) {
    errors.push('Audio URL is required');
  }
  
  return errors;
}

/**
 * Create empty episodes index
 */
export function createEmptyIndex(): EpisodesIndex {
  return {
    episodes: [],
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Update episodes index with new episode
 */
export function addEpisodeToIndex(index: EpisodesIndex, episode: Episode): EpisodesIndex {
  // Check if episode already exists
  const existingIndex = index.episodes.findIndex(e => 
    e.episodeId === episode.episodeId || 
    e.episodeNumber === episode.episodeNumber
  );
  
  const updatedEpisodes = [...index.episodes];
  
  if (existingIndex >= 0) {
    // Update existing episode
    updatedEpisodes[existingIndex] = episode;
  } else {
    // Add new episode
    updatedEpisodes.push(episode);
  }
  
  return {
    episodes: updatedEpisodes,
    lastUpdated: new Date().toISOString()
  };
}