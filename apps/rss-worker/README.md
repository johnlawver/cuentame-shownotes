# RSS Worker

Cloudflare Worker that automatically monitors the Cuentame podcast RSS feed and imports episode metadata into Cloudflare Workers KV storage.

## 🎯 Purpose

The RSS Worker serves as the data ingestion pipeline for the Cuentame Shownotes application. It:

- Monitors the podcast RSS feed for new episodes
- Extracts episode metadata (title, description, audio URL, etc.)
- Stores episode data in Cloudflare KV for use by admin and public applications
- Prevents duplicate imports
- Runs on a scheduled basis via Cloudflare Cron Triggers

## 🏗️ Architecture

- **Runtime**: Cloudflare Workers
- **Storage**: Cloudflare Workers KV
- **Scheduling**: Cloudflare Cron Triggers
- **RSS Parsing**: fast-xml-parser library

## 📋 Prerequisites

1. **Cloudflare Account** with Workers plan
2. **Wrangler CLI** installed and authenticated
3. **Node.js 18+** and **pnpm**

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```bash
cd apps/rss-worker
pnpm install
```

### Step 2: Cloudflare Authentication

```bash
# Login to Cloudflare (if not already done)
wrangler login
```

### Step 3: Create KV Namespace

```bash
# Create production KV namespace
wrangler kv:namespace create "CUENTAME_SHOWNOTES_DATA"

# Create preview KV namespace for development
wrangler kv:namespace create "CUENTAME_SHOWNOTES_DATA" --preview
```

### Step 4: Configure wrangler.toml

Update the KV namespace IDs in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CUENTAME_SHOWNOTES_DATA"
id = "your-production-namespace-id"
preview_id = "your-preview-namespace-id"
```

### Step 5: Deploy

```bash
pnpm run deploy
```

## ⚙️ Configuration

### Environment Variables

Set in `wrangler.toml` under `[vars]`:

- **RSS_FEED_URL** - The podcast RSS feed URL (default: Cuentame feed)

### Authentication

Sensitive endpoints require bearer token authentication:

```bash
# Set the auth token as a secret (production)
wrangler secret put AUTH_TOKEN

# For local testing, create .env file with:
# AUTH_TOKEN="your-secret-token-here"
```

**Protected endpoints:**
- `/trigger` - Manual RSS processing
- `/reset-kv` - Clear all episodes (destructive)
- `/reprocess` - Rebuild episodes with preservation

**Public endpoints (no auth required):**
- `/health` - Health check
- `/debug-rss` - RSS structure inspection
- `/debug-kv` - Episodes listing

### Cron Schedule

The worker runs daily at 6:00 AM UTC. Modify in `wrangler.toml`:

```toml
[triggers]
crons = ["0 6 * * *"]  # Daily at 6 AM UTC
```

### KV Storage Structure

Episodes are stored in a single index under the key `episodes_index`:

```json
{
  "episodes": [
    {
      "episodeId": "uuid-v4",
      "episodeNumber": 101,
      "title": "Episode Title",
      "publishDate": "2025-07-15T09:00:00Z",
      "duration": "00:25:10",
      "description": "Episode description",
      "audioUrl": "https://...",
      "shownotes": "",
      "translations": [],
      "status": "draft"
    }
  ],
  "lastUpdated": "2025-07-06T10:30:00Z"
}
```

## 🛠️ Development

### Local Development

```bash
# Start local development server
pnpm run dev

# The worker will be available at http://localhost:8787
```

### Testing Endpoints

The worker exposes several endpoints for testing and maintenance:

```bash
# Health check (no auth required)
curl https://your-worker.workers.dev/health

# Debug RSS structure (no auth required)
curl https://your-worker.workers.dev/debug-rss

# Debug current KV episodes data (no auth required)
curl https://your-worker.workers.dev/debug-kv

# Manual RSS processing trigger (requires auth)
curl -X POST https://your-worker.workers.dev/trigger \
  -H "Authorization: Bearer your-secret-token"

# Reset/clear all episodes from KV (requires auth, use with caution)
curl -X POST https://your-worker.workers.dev/reset-kv \
  -H "Authorization: Bearer your-secret-token"

# Reprocess RSS with fixed episode numbering (requires auth, preserves shownotes)
curl -X POST https://your-worker.workers.dev/reprocess \
  -H "Authorization: Bearer your-secret-token"
```

### Local Testing Scripts

Convenience scripts in `package.json`:

```bash
# Debug RSS feed structure (no auth required)
pnpm run debug-rss

# Debug current KV episodes data (no auth required)  
pnpm run debug-kv

# Set your auth token in .env file for protected endpoints
# Edit .env and set: AUTH_TOKEN="your-secret-token-here"

# Test RSS processing manually (requires auth)
pnpm run trigger

# Reset/clear all episodes from KV (requires auth, use with caution)
pnpm run reset-kv

# Reprocess RSS with fixed episode numbering (requires auth, preserves shownotes)
pnpm run reprocess

# Monitor real-time logs
pnpm run tail
```

## 📊 Monitoring & Debugging

### View Logs

```bash
# Real-time log monitoring
pnpm run tail

# Or directly with wrangler
wrangler tail --name cuentame-rss-worker
```

### Check KV Data

```bash
# List all KV keys
wrangler kv:key list --namespace-id="your-namespace-id"

# View episodes index
wrangler kv:key get "episodes_index" --namespace-id="your-namespace-id" --pretty

# Count episodes
wrangler kv:key get "episodes_index" --namespace-id="your-namespace-id" | jq '.episodes | length'
```

### Common Debug Scenarios

**No episodes being imported:**

1. Check RSS feed URL is accessible
2. Verify KV namespace configuration
3. Use `/debug-rss` endpoint to inspect RSS structure
4. Review worker logs for parsing errors

**Duplicate episodes:**

- Worker has built-in duplicate detection by episode number and audio URL
- Check logs for "already exists, skipping" messages

**RSS parsing errors:**

- Use `/debug-rss` endpoint to see raw RSS structure
- Check logs for XML parsing errors
- Verify RSS feed format hasn't changed

## 🔧 Troubleshooting

### Common Issues

**1. KV Namespace Not Found**

```bash
Error: The namespace binding "CUENTAME_SHOWNOTES_DATA" is not defined
```

**Solution**: Update `wrangler.toml` with correct namespace IDs

**2. RSS Feed Not Accessible**

```bash
Failed to fetch RSS feed: 403 Forbidden
```

**Solution**: Verify RSS_FEED_URL is correct and accessible

**3. Cron Not Triggering**

```bash
# Check cron triggers are configured
wrangler cron trigger --cron "0 6 * * *"
```

**4. Parsing Errors**
Use the debug endpoint to inspect RSS structure:

```bash
curl https://your-worker.workers.dev/debug-rss
```

### Data Maintenance Operations

**Debug Current Episodes:**
```bash
curl https://your-worker.workers.dev/debug-kv
# Shows episode count, last updated time, and summary of all episodes
```

**Reprocess with Episode Number Fix:**
```bash
curl -X POST https://your-worker.workers.dev/reprocess
# Rebuilds episodes with correct numbering while preserving shownotes
```

**Reset All Episodes (Development Only):**
```bash
curl -X POST https://your-worker.workers.dev/reset-kv
# Completely clears all episode data
```

**Backup Episodes Data:**
```bash
wrangler kv:key get "episodes_index" --namespace-id="your-namespace-id" > episodes-backup.json
```

### Manual Operations

**Trigger RSS Processing:**

```bash
curl -X POST https://your-worker.workers.dev/trigger
```

**Clear All Episodes (Alternative Method):**

```bash
wrangler kv:key delete "episodes_index" --namespace-id="your-namespace-id"
```

## 📈 Performance

- **Cold Start**: ~100-200ms
- **Processing Time**: ~2-5 seconds for full RSS feed
- **Memory Usage**: ~10-20MB
- **KV Operations**: 1 read + 1 write per execution

## 🔄 Deployment

### Automatic Deployment

Set up GitHub Actions for automatic deployment on commit to main branch.

### Manual Deployment

```bash
# Deploy to production
pnpm run deploy

# Deploy with specific environment
wrangler deploy --env production
```

## 📚 Dependencies

- **fast-xml-parser**: RSS feed parsing
- **@cuentame/shared**: Shared types and utilities
- **wrangler**: Cloudflare Workers CLI

## 🔐 Security

- No sensitive data stored in worker
- RSS feed URL is configurable via environment variables
- KV namespace access controlled by Cloudflare permissions

## 📄 Output

The worker produces a structured episodes index in KV that serves as the data source for both admin panel and public website applications.

---

**Next Steps**: Once RSS Worker is operational, proceed to Phase 2 (Admin Panel) setup.
