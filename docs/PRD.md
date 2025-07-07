# Product Requirements Document: Cuentame Shownotes PWA

**Document Version:** 2.1  
**Date:** July 7, 2025  
**Author:** John Lawver

## 0. Project Directory Structure

```
cuentame-shownotes/
├── .github/
│   └── workflows/
│       └── deploy.yml       # Handles RSS Worker, Admin, and Public Site deployments
├── docs/
│   ├── PRD.md              # This document
│   ├── API.md              # API endpoint documentation
│   └── KV-Schema.md        # Cloudflare KV schema documentation
├── scripts/
│   └── deploy.js           # Utility scripts for deployment triggers
├── packages/
│   └── shared/             # Shared TypeScript types and utilities
│       ├── types.ts        # Episode, Translation interfaces
│       └── utils.ts        # Common utility functions
├── apps/
│   ├── rss-worker/         # Cloudflare Worker for RSS ingestion
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── wrangler.toml
│   │   └── package.json
│   ├── admin/              # Astro admin panel
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── login.astro
│   │   │   │   ├── dashboard.astro
│   │   │   │   ├── episode/
│   │   │   │   │   └── [id].astro
│   │   │   │   └── deploy.astro
│   │   │   ├── components/
│   │   │   ├── api/
│   │   │   │   ├── auth/
│   │   │   │   ├── episodes/
│   │   │   │   └── deploy/
│   │   │   └── layouts/
│   │   ├── astro.config.mjs
│   │   └── package.json
│   └── public/             # Public PWA site
│       ├── src/
│       │   ├── pages/
│       │   │   ├── index.astro
│       │   │   └── episode/
│       │   │       └── [slug].astro
│       │   ├── components/
│       │   ├── layouts/
│       │   └── services/
│       │       └── sw.js    # Service Worker
│       ├── public/
│       │   ├── manifest.json
│       │   └── icons/
│       └── astro.config.mjs
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 1. Overview

Cuentame Shownotes is a Progressive Web Application (PWA) that serves as a learning companion for the Spanish-language podcast "Cuentame." The application provides episode shownotes (transcripts) with future support for interactive Spanish-to-English translations to enhance vocabulary learning.

### 1.1 Goal

Create an offline-capable learning companion that provides easy access to episode transcripts while streamlining content management for podcast administrators.

### 1.2 Target Audience

- **Podcast Listeners**: Spanish learners who want transcript access for better comprehension
- **Podcast Administrator**: Content creator who needs to manage episode transcripts efficiently

## 2. Data Architecture

### 2.1 Cloudflare KV Structure

Single index approach for optimal offline performance and static site generation.

**Key:** `episodes_index`

**Value Structure:**

```json
{
  "episodes": [
    {
      "episodeId": "uuid-v4",
      "episodeNumber": 101,
      "title": "A Conversation in Madrid",
      "publishDate": "2025-07-15T09:00:00Z",
      "duration": "00:25:10",
      "description": "Episode description from RSS",
      "audioUrl": "https://anchor.fm/episode101.mp3",
      "shownotes": "", // Markdown content added by admin
      "translations": [   // Future enhancement - Spanish word translations
        {
          "spanish": "conversación",
          "english": "conversation",
          "startIndex": 42,
          "endIndex": 54
        }
      ],
      "googleDocsUrls": [  // Google Docs URLs extracted from RSS description
        "https://docs.google.com/document/d/1abc123/edit",
        "https://docs.google.com/document/d/1xyz789/edit"
      ],
      "status": "draft" | "processing" | "complete" | "error"
    }
  ],
  "lastUpdated": "2025-07-06T10:30:00Z"
}
```

### 2.2 Episode Status Workflow

1. **draft**: New episodes imported from RSS feed
2. **processing**: Episodes being processed for shownotes/translations
3. **complete**: Episodes fully processed with shownotes and translations
4. **error**: Processing failed, requires attention

## 3. Phase 1: RSS Worker (Build First) ✅ COMPLETE

### 3.1 Requirements

**User Stories:**

- As a system, I want to automatically import new episodes from the RSS feed, so administrators don't need manual episode creation ✅
- As a system, I want to avoid duplicate imports, maintaining data integrity ✅
- As a system, I want to set new episodes to "draft" status for admin review ✅

### 3.2 Features

- **Cloudflare Worker** with cron trigger (daily execution at 6:00 AM UTC) ✅
- **RSS Feed Processing** from https://anchor.fm/s/4baec630/podcast/rss ✅
- **Episode Detection** to identify new episodes vs. existing ✅
- **Google Docs URL Extraction** from episode descriptions for quick access to translations ✅
- **KV Operations** to read existing index and append new episodes ✅
- **Metadata Extraction**: title, description, publish date, duration, audio URL, Google Docs links ✅
- **Debug Endpoints**: `/debug-rss`, `/trigger`, `/health` for monitoring and testing ✅
- **Error Handling**: Comprehensive error handling and logging ✅
- **Manual Trigger**: POST `/trigger` endpoint for manual processing ✅

### 3.3 Technical Implementation

- Uses `fast-xml-parser` for RSS parsing ✅
- Generates UUID v4 for new episode IDs ✅
- Updates single `episodes_index` key in KV ✅
- Comprehensive error logging to Cloudflare Worker logs ✅
- Advanced RSS parsing with multiple fallback strategies ✅
- Sophisticated episode number detection and auto-generation ✅
- Google Docs URL extraction using regex patterns ✅
- Comprehensive data validation before storage ✅

### 3.4 Implementation Status

**Deployed and Functional:**
- RSS Worker deployed at `https://cuentame-rss-worker.davesmetalworks.workers.dev`
- Daily cron schedule active: `0 6 * * *`
- All endpoints operational and tested
- KV storage integration working
- Google Docs URL extraction operational
- Error handling and logging comprehensive

## 4. Phase 2: Admin Panel Foundation (Build Second)

### 4.1 Authentication Requirements

**User Stories:**

- As an administrator, I want secure login access to protect content management
- As an administrator, I want session persistence for reasonable periods
- As an unauthorized user, I want to be redirected to login when accessing admin content

### 4.2 Features

- **Astro Project Setup** with Cloudflare adapter
- **Session Management** with HTTP-only cookies
- **Protected Routes** for all `/admin/*` paths
- **Login/Logout** functionality
- **Single Admin User** with credentials in Cloudflare Secrets

## 5. Phase 3: Admin Panel Functionality (Build Third)

### 5.1 Requirements

**User Stories:**

- As an administrator, I want to see all episodes with their current status
- As an administrator, I want to add/edit shownotes for draft episodes
- As an administrator, I want to approve episodes for publication
- As an administrator, I want to trigger public site rebuilds when ready

### 5.2 Features

#### Dashboard (`/admin/dashboard`)

- **Episode List** with status indicators
- **Filtering** by status (draft, processing, complete, error)
- **Quick Actions** for editing and status management

#### Episode Editor (`/admin/episode/[id]`)

- **Metadata Display** (read-only RSS data)
- **Google Docs Links** - Quick access buttons to translation documents found in RSS
- **Shownotes Editor** - large textarea for markdown content
- **Status Management** - buttons to change episode status
- **Save Functionality** - updates KV data

#### Deploy Manager (`/admin/deploy`)

- **Complete Episodes** - shows all episodes in `complete` status
- **Deploy Action** - triggers public site rebuild
- **Status Update** - marks deployed episodes as `published`

### 5.3 Technical Implementation

- **KV Read/Write** through Astro API routes
- **Markdown Storage** for shownotes content
- **Status Validation** ensures proper workflow progression
- **Deploy Trigger** via Cloudflare Pages webhook or GitHub Actions

## 6. Phase 4: Public PWA Website (Build Last)

### 6.1 Requirements

**User Stories:**

- As a listener, I want to browse all published episodes easily
- As a listener, I want to search episodes by title or number
- As a listener, I want to sort episodes by date or episode number
- As a listener, I want to read transcripts on mobile and desktop
- As a listener, I want offline access to previously viewed episodes

### 6.2 Features

#### Landing Page (`/`)

- **Header Navigation** with podcast creator links (social media, buy me a coffee, email)
- **Episode List** with title, episode number, duration, publish date
- **Search Input** for fuzzy finding by title or episode number
- **Sort Options** (release order/newest first) saved in URL params and localStorage
- **Mobile-First Design** with Tailwind CSS

#### Episode Pages (`/episode/[slug]`)

- **Back Button** that disappears on scroll
- **Episode Metadata** display
- **Shownotes Content** rendered from markdown
- **Readable Typography** optimized for mobile and desktop

#### PWA Features

- **Service Worker** for offline capability
- **App Manifest** for "Add to Home Screen"
- **Caching Strategy** for episode data and static assets
- **Single JSON Load** for complete episode index

### 6.3 Technical Implementation

- **Astro Static Generation** for optimal performance
- **Tailwind CSS** for responsive design
- **Workbox** for Service Worker management
- **Fuzzy Search** client-side implementation
- **localStorage** for user preferences

## 7. Future Enhancements (Out of Scope for V1)

### 7.1 Planned Enhancements

- **Google Docs Integration**: Worker to automatically import shownotes from Google Docs
- **Rich Text Editor**: Replace textarea with proper markdown/HTML editor
- **Interactive Translations**: Hover/tap popups for Spanish-to-English translations
- **Translation Management**: Admin interface for managing word translation tuples
- **Audio Integration**: Embedded player with text synchronization

### 7.2 Technical Considerations

- **Translation Data Structure**: Already modeled in episode schema
- **Google Docs API**: Future worker implementation for automated import
- **Rich Text Storage**: Markdown supports future HTML conversion
- **Translation Highlighting**: Client-side JavaScript for interactive features

## 8. Deployment Strategy

### 8.1 Environments

- **RSS Worker**: Cloudflare Workers with cron triggers
- **Admin Panel**: Cloudflare Pages with Functions
- **Public Site**: Cloudflare Pages with static generation
- **Data Storage**: Cloudflare Workers KV

### 8.2 CI/CD Pipeline

- **GitHub Actions** for automated deployments
- **Separate Deploy Action** for public site rebuilds
- **Environment-specific** configurations
- **Rollback Capabilities** for failed deployments

## 9. Performance Targets

### 9.1 Public Site Metrics

- **Lighthouse Score**: 90+ on all metrics
- **First Load**: Complete episode index available offline
- **Mobile Performance**: Optimized for 3G networks
- **Offline Capability**: Full functionality without network

### 9.2 Admin Panel Metrics

- **Response Time**: < 2 seconds for all operations
- **KV Operations**: Efficient read/write patterns
- **Error Handling**: Graceful degradation and user feedback
