import type { Episode, EpisodesIndex } from '@cuentame/shared';

interface RSSWorkerConfig {
  baseUrl: string;
  authToken?: string;
}

export class RSSWorkerClient {
  private config: RSSWorkerConfig;

  constructor(config: RSSWorkerConfig) {
    this.config = config;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`RSS Worker API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async getEpisodes(): Promise<Episode[]> {
    const response = await this.fetch('/debug-kv');
    const data = await response.json();
    return data.episodes || [];
  }

  async triggerRSSSync(): Promise<void> {
    await this.fetch('/trigger', { method: 'POST' });
  }

  async reprocessEpisodes(): Promise<void> {
    await this.fetch('/reprocess', { method: 'POST' });
  }

  async resetEpisodes(): Promise<void> {
    await this.fetch('/reset-kv', { method: 'POST' });
  }

  async updateEpisode(episode: Episode): Promise<void> {
    await this.fetch('/update-episode', {
      method: 'POST',
      body: JSON.stringify(episode),
    });
  }
}

// Create a configured client instance
export function createRSSWorkerClient(): RSSWorkerClient {
  const baseUrl = import.meta.env.RSS_WORKER_URL || 'http://localhost:8787';
  const authToken = import.meta.env.RSS_WORKER_AUTH_TOKEN;

  return new RSSWorkerClient({
    baseUrl,
    authToken,
  });
}