import type { APIRoute } from 'astro';
import { createRSSWorkerClient } from '../../lib/rss-worker';

export const POST: APIRoute = async ({ request }) => {
  try {
    const client = createRSSWorkerClient();
    await client.triggerRSSSync();
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('RSS sync failed:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};