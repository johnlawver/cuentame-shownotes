import type { APIRoute } from 'astro';
import type { Episode } from '@cuentame/shared';
import { createRSSWorkerClient } from '../../../lib/rss-worker';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.episodeId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Episode ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert form data to proper Episode object
    const episode: Episode = {
      episodeId: data.episodeId,
      episodeNumber: parseInt(data.episodeNumber) || 0,
      title: data.title || '',
      publishDate: data.publishDate ? new Date(data.publishDate).toISOString() : new Date().toISOString(),
      duration: data.duration || '00:00:00',
      description: data.description || '',
      audioUrl: data.audioUrl || '',
      shownotes: data.shownotes || '',
      translations: data.translations || [],
      googleDocsUrls: data.googleDocsUrls || [],
      status: data.status || 'draft',
    };

    // Validate episode data
    const errors = validateEpisode(episode);
    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Validation failed: ${errors.join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = createRSSWorkerClient();
    await client.updateEpisode(episode);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Episode update failed:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function validateEpisode(episode: Episode): string[] {
  const errors: string[] = [];
  
  if (!episode.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (!episode.episodeNumber || episode.episodeNumber < 0) {
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
  
  if (episode.status && !['draft', 'pending_publish', 'published'].includes(episode.status)) {
    errors.push('Invalid status');
  }
  
  return errors;
}