// apps/rss-worker/src/index.ts

import { XMLParser } from 'fast-xml-parser';
import type { 
  Episode, 
  EpisodesIndex, 
  RSSFeed, 
  RSSItem 
} from '@cuentame/shared';
import { 
  generateUUID, 
  parseEpisodeNumber, 
  createEmptyIndex,
  addEpisodeToIndex,
  validateEpisode,
  extractGoogleDocsUrls 
} from '@cuentame/shared/utils';

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}


interface Env {
  CUENTAME_SHOWNOTES_DATA: KVNamespace;
  RSS_FEED_URL: string;
  AUTH_TOKEN: string;
}

interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env
  ): Promise<void> {
    console.log(`RSS Worker triggered at ${new Date(event.scheduledTime).toISOString()}`);
    
    try {
      await processRSSFeed(env);
      console.log('RSS processing completed successfully');
    } catch (error) {
      console.error('RSS processing failed:', error);
      throw error;
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Manual trigger endpoint for testing
    if (url.pathname === '/trigger' && request.method === 'POST') {
      if (!checkAuthentication(request, env)) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      try {
        await processRSSFeed(env);
        return new Response('RSS processing completed', { status: 200 });
      } catch (error) {
        return new Response(`RSS processing failed: ${error}`, { status: 500 });
      }
    }
    
    // Debug endpoint to inspect RSS structure
    if (url.pathname === '/debug-rss' && request.method === 'GET') {
      try {
        const rssUrl = env.RSS_FEED_URL || 'https://anchor.fm/s/4baec630/podcast/rss';
        const response = await fetch(rssUrl);
        const rssText = await response.text();
        
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          textNodeName: '#text'
        });
        
        const rssData: RSSFeed = parser.parse(rssText);
        const items = Array.isArray(rssData.rss?.channel?.item) 
          ? rssData.rss.channel.item 
          : [rssData.rss?.channel?.item];
        
        // Return first few items for inspection
        return new Response(JSON.stringify({
          totalItems: items.length,
          sampleItems: items.slice(0, 3)
        }, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(`Debug failed: ${error}`, { status: 500 });
      }
    }
    
    // Debug endpoint to inspect current KV episodes index
    if (url.pathname === '/debug-kv' && request.method === 'GET') {
      try {
        const existingIndexText = await env.CUENTAME_SHOWNOTES_DATA.get('episodes_index');
        if (!existingIndexText) {
          return new Response(JSON.stringify({ message: 'No episodes index found in KV' }, null, 2), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const episodesIndex = JSON.parse(existingIndexText);
        return new Response(JSON.stringify({
          totalEpisodes: episodesIndex.episodes.length,
          lastUpdated: episodesIndex.lastUpdated,
          episodes: episodesIndex.episodes.map((ep: Episode) => ({
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            publishDate: ep.publishDate,
            status: ep.status,
            hasShownotes: !!ep.shownotes
          }))
        }, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(`Debug KV failed: ${error}`, { status: 500 });
      }
    }
    
    // Reset/clear KV episodes index
    if (url.pathname === '/reset-kv' && request.method === 'POST') {
      if (!checkAuthentication(request, env)) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      try {
        await env.CUENTAME_SHOWNOTES_DATA.put('episodes_index', JSON.stringify(createEmptyIndex()));
        return new Response('Episodes index cleared successfully', { status: 200 });
      } catch (error) {
        return new Response(`Reset KV failed: ${error}`, { status: 500 });
      }
    }
    
    // Reprocess RSS with fixed logic (preserves shownotes and other manual data)
    if (url.pathname === '/reprocess' && request.method === 'POST') {
      if (!checkAuthentication(request, env)) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      try {
        await reprocessRSSWithPreservation(env);
        return new Response('RSS reprocessing completed with fixed episode numbering (shownotes preserved)', { status: 200 });
      } catch (error) {
        return new Response(`Reprocess failed: ${error}`, { status: 500 });
      }
    }
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response('RSS Worker is healthy', { status: 200 });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

function checkAuthentication(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization');
  const expectedToken = `Bearer ${env.AUTH_TOKEN}`;
  
  console.log(`Auth check: header=${authHeader ? 'present' : 'missing'}, token=${env.AUTH_TOKEN ? 'configured' : 'not configured'}`);
  
  if (authHeader === expectedToken) {
    console.log('Authentication successful');
    return true;
  } else {
    console.log('Authentication failed: Invalid or missing token');
    return false;
  }
}

async function processRSSFeed(env: Env): Promise<void> {
  console.log('Starting RSS feed processing...');
  
  // Fetch RSS feed
  const rssUrl = env.RSS_FEED_URL || 'https://anchor.fm/s/4baec630/podcast/rss';
  console.log(`Fetching RSS from: ${rssUrl}`);
  
  const response = await fetch(rssUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
  }
  
  const rssText = await response.text();
  console.log(`RSS feed fetched, size: ${rssText.length} characters`);
  
  // Parse RSS XML
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text'
  });
  
  const rssData: RSSFeed = parser.parse(rssText);
  console.log('RSS feed parsed successfully');
  
  // Extract items
  const channel = rssData.rss?.channel;
  if (!channel) {
    throw new Error('Invalid RSS feed structure: missing channel');
  }
  
  const items = Array.isArray(channel.item) ? channel.item : [channel.item];
  console.log(`Found ${items.length} episodes in RSS feed`);
  
  // Get existing episodes index from KV
  const existingIndexText = await env.CUENTAME_SHOWNOTES_DATA.get('episodes_index');
  let episodesIndex: EpisodesIndex;
  
  if (existingIndexText && existingIndexText.trim()) {
    try {
      episodesIndex = JSON.parse(existingIndexText);
      console.log(`Loaded existing index with ${episodesIndex.episodes.length} episodes`);
    } catch (error) {
      console.error('Failed to parse existing index, creating new one:', error);
      episodesIndex = createEmptyIndex();
    }
  } else {
    episodesIndex = createEmptyIndex();
    console.log('Created new episodes index');
  }
  
  // Process each RSS item
  let newEpisodesCount = 0;
  
  for (const item of items) {
    if (!item) continue;
    
    try {
      const episode = await convertRSSItemToEpisode(item, episodesIndex);
      
      if (episode) {
        episodesIndex = addEpisodeToIndex(episodesIndex, episode);
        newEpisodesCount++;
        console.log(`Added new episode: ${episode.episodeNumber} - ${episode.title}`);
      }
    } catch (error) {
      console.error('Error processing RSS item:', error);
      // Continue processing other items
    }
  }
  
  // Save updated index back to KV
  if (newEpisodesCount > 0) {
    await env.CUENTAME_SHOWNOTES_DATA.put(
      'episodes_index',
      JSON.stringify(episodesIndex)
    );
    console.log(`Updated episodes index with ${newEpisodesCount} new episodes`);
  } else {
    console.log('No new episodes found');
  }
}

async function convertRSSItemToEpisode(
  item: RSSItem, 
  existingIndex: EpisodesIndex
): Promise<Episode | null> {
  
  // Debug logging to understand RSS structure
  console.log('Processing RSS item:', JSON.stringify(item, null, 2));
  
  // Extract basic info with multiple fallback strategies
  const title = item.title?.trim() || item['title']?.trim();
  const description = item.description?.trim() || item['description']?.trim() || '';
  
  // Try multiple ways to get audio URL
  let audioUrl = item.enclosure?.url?.trim() || 
                 item.enclosure?.['@_url']?.trim() ||
                 item['enclosure']?.url?.trim() ||
                 item['enclosure']?.['@_url']?.trim();
  
  const publishDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
  const duration = item['itunes:duration']?.trim() || '00:00:00';
  
  // Extract Google Docs URLs from description
  const googleDocsUrls = extractGoogleDocsUrls(description);
  
  if (googleDocsUrls.length > 0) {
    console.log(`Found ${googleDocsUrls.length} Google Docs URLs for episode:`, googleDocsUrls);
  }
  
  if (!title || !audioUrl) {
    console.warn('Skipping item with missing title or audio URL', { title: !!title, audioUrl: !!audioUrl });
    return null;
  }
  
  // Extract episode number with proper initialization
  let episodeNumber = 0;
  
  // Prioritize title parsing since it's the source of truth for this podcast
  if (title) {
    // Check if this is the intro episode
    if (title.includes('¡Cuéntame! -What is this podcast all about?')) {
      episodeNumber = 0;
    } else {
      // Try to match number at the beginning of title (e.g., "194. La inteligencia artificial")
      const titlePrefixMatch = title.match(/^(\d+)\.\s*/);
      if (titlePrefixMatch) {
        episodeNumber = parseInt(titlePrefixMatch[1], 10);
      } else {
        // Episode doesn't follow standard pattern - try iTunes episode as fallback
        if (item['itunes:episode']) {
          episodeNumber = parseEpisodeNumber(item['itunes:episode']);
          console.warn(`Using iTunes episode number ${episodeNumber} for non-standard title: "${title}"`);
        } else {
          console.warn(`Episode title doesn't follow standard pattern, requires manual review: "${title}"`);
          return null; // Skip episodes that don't follow the pattern
        }
      }
    }
  }
  
  // Check if episode already exists (with better error handling)
  const existingEpisode = existingIndex.episodes.find(e => {
    try {
      return e.episodeNumber === episodeNumber || 
             e.audioUrl === audioUrl ||
             (e.title === title && e.publishDate === publishDate);
    } catch (error) {
      console.warn('Error checking existing episode:', error);
      return false;
    }
  });
  
  if (existingEpisode) {
    console.log(`Episode ${episodeNumber} already exists, skipping`);
    return null;
  }
  
  console.log(`Creating new episode: ${episodeNumber} - ${title}`);
  
  // Create new episode
  const episode: Episode = {
    episodeId: generateUUID(),
    episodeNumber,
    title,
    publishDate,
    duration,
    description,
    audioUrl,
    shownotes: '', // Empty initially
    translations: [], // Empty initially
    googleDocsUrls, // Extracted Google Docs URLs
    status: 'draft' // New episodes start as draft
  };
  
  // Validate episode
  const validationErrors = validateEpisode(episode);
  if (validationErrors.length > 0) {
    console.error('Episode validation failed:', validationErrors);
    return null;
  }
  
  return episode;
}

async function reprocessRSSWithPreservation(env: Env): Promise<void> {
  console.log('Starting RSS reprocessing with preservation of manual data...');
  
  // First, get existing episodes to preserve shownotes and other manual data
  const existingIndexText = await env.CUENTAME_SHOWNOTES_DATA.get('episodes_index');
  const existingEpisodes = new Map<number, Episode>();
  
  if (existingIndexText && existingIndexText.trim()) {
    try {
      const existingIndex = JSON.parse(existingIndexText);
      for (const episode of existingIndex.episodes) {
        existingEpisodes.set(episode.episodeNumber, episode);
      }
      console.log(`Loaded ${existingEpisodes.size} existing episodes for preservation`);
    } catch (error) {
      console.error('Failed to parse existing index:', error);
    }
  }
  
  // Fetch and parse RSS feed (same as processRSSFeed)
  const rssUrl = env.RSS_FEED_URL || 'https://anchor.fm/s/4baec630/podcast/rss';
  console.log(`Fetching RSS from: ${rssUrl}`);
  
  const response = await fetch(rssUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
  }
  
  const rssText = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text'
  });
  
  const rssData: RSSFeed = parser.parse(rssText);
  const channel = rssData.rss?.channel;
  if (!channel) {
    throw new Error('Invalid RSS feed structure: missing channel');
  }
  
  const items = Array.isArray(channel.item) ? channel.item : [channel.item];
  console.log(`Found ${items.length} episodes in RSS feed`);
  
  // Start with empty index
  let episodesIndex = createEmptyIndex();
  let processedCount = 0;
  
  // Process each RSS item with preservation logic
  for (const item of items) {
    if (!item) continue;
    
    try {
      const newEpisode = await convertRSSItemToEpisode(item, episodesIndex);
      
      if (newEpisode) {
        // Check if we have existing data for this episode number
        const existingEpisode = existingEpisodes.get(newEpisode.episodeNumber);
        
        if (existingEpisode) {
          // Preserve manual data from existing episode
          const mergedEpisode: Episode = {
            ...newEpisode, // Use new RSS data as base
            shownotes: existingEpisode.shownotes || newEpisode.shownotes, // Preserve shownotes
            translations: existingEpisode.translations || newEpisode.translations, // Preserve translations
            status: existingEpisode.status === 'draft' ? 'draft' : newEpisode.status, // Keep non-draft status
            episodeId: existingEpisode.episodeId // Preserve original ID
          };
          
          episodesIndex = addEpisodeToIndex(episodesIndex, mergedEpisode);
          console.log(`Reprocessed episode ${newEpisode.episodeNumber} (preserved shownotes: ${!!existingEpisode.shownotes})`);
        } else {
          episodesIndex = addEpisodeToIndex(episodesIndex, newEpisode);
          console.log(`Added new episode: ${newEpisode.episodeNumber} - ${newEpisode.title}`);
        }
        
        processedCount++;
      }
    } catch (error) {
      console.error('Error processing RSS item during reprocess:', error);
    }
  }
  
  // Save updated index
  await env.CUENTAME_SHOWNOTES_DATA.put(
    'episodes_index',
    JSON.stringify(episodesIndex)
  );
  
  console.log(`Reprocessing completed: ${processedCount} episodes processed with preservation of manual data`);
}