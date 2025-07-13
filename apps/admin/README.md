# Cuentame Admin Panel

Web-based admin interface for managing Cuentame podcast episodes, shownotes, and translations.

## 🎯 Purpose

The Admin Panel provides content managers with tools to:

- View and manage episode metadata from RSS worker
- Edit episode shownotes and transcripts
- Manage translations and publish workflow
- Monitor episode import and processing status

## 🏗️ Architecture

- **Frontend**: Astro with Tailwind CSS
- **Backend**: Server-side rendering with Node.js adapter
- **Data Source**: RSS Worker API (Cloudflare Workers KV)
- **Authentication**: Session-based auth (Coming Soon)

## 📋 Prerequisites

1. **Node.js 18+** and **pnpm**
2. **RSS Worker** deployed and accessible
3. **AUTH_TOKEN** from RSS Worker for API access

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```bash
cd apps/admin
pnpm install
```

### Step 2: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your RSS Worker configuration:

```env
RSS_WORKER_URL=https://your-rss-worker.workers.dev
RSS_WORKER_AUTH_TOKEN=your-auth-token
```

### Step 3: Start Development Server

```bash
pnpm run dev
```

The admin panel will be available at http://localhost:3000

## ⚙️ Configuration

### Environment Variables

- **RSS_WORKER_URL** - URL of your deployed RSS Worker
- **RSS_WORKER_AUTH_TOKEN** - Bearer token for RSS Worker API authentication

## 🛠️ Development

```bash
# Start development server
pnpm run dev

# Type checking
pnpm run typecheck

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## 📊 Features

### ✅ Current Features

- **Episode Listing** - View all episodes from RSS worker
- **Episode Count** - Total episode statistics
- **Error Handling** - Displays connection issues with RSS worker
- **Responsive Design** - Mobile-friendly interface

### 🚧 Coming Soon

- **Authentication System** - Login/logout functionality
- **Episode Editor** - Edit shownotes and metadata
- **Translation Management** - Add and manage episode translations
- **Publish Workflow** - Draft → Review → Published status flow
- **User Management** - Multiple admin users and permissions

## 🔗 API Integration

The admin panel connects to the RSS Worker API:

```typescript
// Get all episodes
GET /debug-kv

// Sync from RSS feed (authenticated)
POST /trigger

// Reprocess episodes (authenticated)
POST /reprocess
```

## 📱 Pages

- **Dashboard** (`/`) - Overview and navigation
- **Episodes** (`/episodes`) - Episode listing and management
- **Episode Editor** (`/episodes/[id]`) - Individual episode editing (Coming Soon)

## 🔐 Security

- Environment variables for sensitive configuration
- RSS Worker API authentication via bearer tokens
- Input validation and error handling
- HTTPS-only configuration for production

## 🚨 Troubleshooting

### Common Issues

**1. "Failed to fetch episodes" Error**

```bash
# Check RSS Worker URL is accessible
curl https://your-rss-worker.workers.dev/health

# Verify auth token is correct
curl https://your-rss-worker.workers.dev/debug-kv \
  -H "Authorization: Bearer your-token"
```

**2. Environment Variables Not Loading**

Ensure `.env` file is in the admin app root directory and properly formatted.

**3. Build Errors**

```bash
# Clear Astro cache
rm -rf .astro

# Reinstall dependencies
pnpm install
```

## 📈 Performance

- **SSR Rendering** - Fast initial page loads
- **Optimized Assets** - Tailwind CSS purging and optimization
- **API Caching** - Smart caching of RSS Worker responses (Coming Soon)

## 🔄 Deployment

### Cloudflare Pages (Recommended)

```bash
# Build for production
pnpm run build

# Deploy to Cloudflare Pages
# Set environment variables in Cloudflare Pages dashboard
```

### Docker Deployment

```bash
# Build Docker image
docker build -t cuentame-admin .

# Run container
docker run -p 3000:3000 \
  -e RSS_WORKER_URL="https://your-worker.workers.dev" \
  -e RSS_WORKER_AUTH_TOKEN="your-token" \
  cuentame-admin
```

## 📄 Output

The admin panel provides a user-friendly interface for content management, connecting directly to the RSS Worker data source for real-time episode management.

---

**Next Steps**: Complete authentication system and episode editing functionality.