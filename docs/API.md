# Cuentame Shownotes API Documentation

## Overview

This document outlines the API endpoints available in the Cuentame Shownotes system. The system is currently in Phase 1 with the RSS Worker implementation providing automated episode processing.

## RSS Worker API

The RSS Worker provides endpoints for episode processing, debugging, and health monitoring.

**Base URL:** `https://cuentame-rss-worker.davesmetalworks.workers.dev`

### Endpoints

#### POST /trigger
Manually trigger RSS feed processing.

**Purpose:** Testing and manual episode processing  
**Method:** POST  
**Authentication:** None required  
**Request Body:** Empty  

**Response:**
- **200 OK:** `RSS processing completed`
- **500 Internal Server Error:** `RSS processing failed: {error details}`

**Example:**
```bash
curl -X POST https://cuentame-rss-worker.davesmetalworks.workers.dev/trigger
```

#### GET /debug-rss
Inspect RSS feed structure and sample episodes.

**Purpose:** Development and debugging  
**Method:** GET  
**Authentication:** None required  

**Response:**
```json
{
  "totalItems": 45,
  "sampleItems": [
    {
      "title": "Episode 1: Introduction",
      "description": "Welcome to the show...",
      "pubDate": "2024-01-15T10:00:00Z",
      "enclosure": {
        "url": "https://example.com/episode1.mp3",
        "@_type": "audio/mpeg"
      },
      "itunes:duration": "00:45:32",
      "itunes:episode": "1"
    }
  ]
}
```

#### GET /health
Health check endpoint.

**Purpose:** Monitoring and uptime checks  
**Method:** GET  
**Authentication:** None required  

**Response:**
- **200 OK:** `RSS Worker is healthy`

### Scheduled Processing

The RSS Worker automatically processes the RSS feed daily at 6:00 AM UTC via Cloudflare Cron Triggers.

**Schedule:** `0 6 * * *` (Daily at 6 AM UTC)

## Data Processing

### RSS Feed Processing Flow

1. **Fetch RSS Feed** - Retrieves latest episodes from configured RSS URL
2. **Parse XML** - Converts RSS XML to structured data
3. **Extract Episodes** - Processes each RSS item into episode format
4. **Google Docs Detection** - Automatically extracts Google Docs URLs from descriptions
5. **Deduplication** - Checks against existing episodes to prevent duplicates
6. **Store Data** - Saves new episodes to Cloudflare KV storage

### Episode Data Structure

Each processed episode includes:
- **Episode ID**: Unique identifier
- **Episode Number**: Sequential number or extracted from RSS
- **Title**: Episode title
- **Description**: Episode description
- **Audio URL**: Direct link to audio file
- **Duration**: Episode length (HH:MM:SS format)
- **Publish Date**: ISO 8601 timestamp
- **Status**: Processing status (draft, processing, complete)
- **Google Docs URLs**: Automatically extracted document links
- **Shownotes**: Initially empty, populated by future processing
- **Translations**: Initially empty, populated by future processing

## Future API Endpoints (Planned)

### Admin API (Phase 2)
- `GET /admin/episodes` - List all episodes
- `POST /admin/episodes/{id}/process` - Trigger episode processing
- `PUT /admin/episodes/{id}` - Update episode metadata
- `DELETE /admin/episodes/{id}` - Delete episode

### Public API (Phase 3)
- `GET /api/episodes` - Public episode listing
- `GET /api/episodes/{id}` - Public episode details
- `GET /api/episodes/{id}/shownotes` - Episode shownotes
- `GET /api/search` - Search episodes and shownotes

## Error Handling

All endpoints return appropriate HTTP status codes:
- **200 OK**: Successful operation
- **400 Bad Request**: Invalid request
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error with details

Error responses include descriptive messages for debugging.

## Rate Limiting

Currently no rate limiting is implemented. This will be added in future phases as needed.

## Authentication

Phase 1 endpoints require no authentication. Future admin endpoints will implement proper authentication and authorization.

## Monitoring

The RSS Worker includes comprehensive logging for monitoring:
- RSS feed fetch operations
- Episode processing results
- Error conditions and recovery
- Performance metrics

Logs are available through Cloudflare Workers dashboard.

---

**Version:** 1.0  
**Last Updated:** July 7, 2025  
**Status:** Phase 1 Complete