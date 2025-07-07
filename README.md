# Cuentame Shownotes PWA

A Progressive Web Application that serves as a learning companion for the Spanish-language podcast "Cuentame." The application provides episode shownotes (transcripts) with interactive translations to enhance vocabulary learning for Spanish language learners.

## 🎯 Project Overview

Cuentame Shownotes consists of three main components:

1. **RSS Worker** - Cloudflare Worker that automatically imports episode metadata from the podcast RSS feed
2. **Admin Panel** - Private dashboard for managing episode content and translations (Coming Soon)
3. **Public PWA** - Offline-capable web app for podcast listeners (Coming Soon)

## 🏗️ Architecture

- **Frontend**: Astro with Tailwind CSS
- **Backend**: Cloudflare Workers with KV storage
- **Data**: Single JSON index approach for optimal offline performance
- **Deployment**: Cloudflare Pages & Workers

## 📁 Project Structure

```
cuentame-shownotes/
├── apps/
│   ├── rss-worker/          # Cloudflare Worker for RSS ingestion
│   ├── admin/               # Admin panel (Astro) - Coming Soon
│   └── public/              # Public PWA site (Astro) - Coming Soon
├── packages/
│   └── shared/              # Shared TypeScript types and utilities
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **pnpm**
- **Cloudflare Account** with Workers enabled
- **Wrangler CLI**: `npm install -g wrangler@latest`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cuentame-shownotes

# Install dependencies
pnpm install

# Login to Cloudflare
wrangler login
```

### Development

```bash
# Start RSS Worker development
cd apps/rss-worker
pnpm run dev

# Deploy RSS Worker
pnpm run deploy
```

## 📊 Current Status

### ✅ Phase 1: RSS Worker (Complete)

- [x] Automatic RSS feed monitoring
- [x] Episode metadata extraction
- [x] Cloudflare KV storage
- [x] Duplicate detection
- [x] Cron scheduling

### 🚧 Phase 2: Admin Panel (In Progress)

- [ ] Authentication system
- [ ] Episode management dashboard
- [ ] Shownotes editor
- [ ] Publish workflow

### 📋 Phase 3: Public PWA (Planned)

- [ ] Episode listing
- [ ] Search and filtering
- [ ] Offline capability
- [ ] Mobile-first design

## 🛠️ Development Commands

```bash
# Install dependencies
pnpm install

# Run all applications in development mode
pnpm run dev

# Build all applications
pnpm run build

# Deploy RSS Worker
pnpm run deploy:rss
```

## 📚 Documentation

- [RSS Worker Setup](./apps/rss-worker/README.md) - Detailed setup and configuration
- [Product Requirements Document](./docs/PRD.md) - Complete project specifications
- [API Documentation](./docs/API.md) - API endpoints and schemas (Coming Soon)

## 🌍 Environment Variables

### RSS Worker

- `RSS_FEED_URL` - Podcast RSS feed URL (default: Cuentame feed)
- `CUENTAME_SHOWNOTES_DATA` - KV namespace binding

## 🔧 Technology Stack

- **Language**: TypeScript
- **Runtime**: Cloudflare Workers
- **Frontend**: Astro + Tailwind CSS
- **Database**: Cloudflare Workers KV
- **Package Manager**: pnpm (monorepo)
- **Deployment**: Cloudflare Pages & Workers

## 📈 Data Flow

1. **RSS Worker** monitors podcast feed and imports new episodes to KV
2. **Admin Panel** allows content managers to add shownotes and translations
3. **Public Site** serves published episodes with offline capability

## 🚨 Important Notes

- The RSS Worker runs on a daily cron schedule (6 AM UTC)
- Episodes start with `draft` status and require manual approval
- All data is stored in a single KV index for optimal performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

1. Check the documentation in `/docs`
2. Review application-specific READMEs
3. Open an issue on GitHub

---

**Current Version**: 1.0.0  
**Last Updated**: July 6, 2025
