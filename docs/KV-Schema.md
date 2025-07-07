# Cloudflare KV Schema Documentation

## Overview

This document defines the data schema and structure used in Cloudflare KV storage for the Cuentame Shownotes system.

## KV Namespace

**Namespace:** `CUENTAME_SHOWNOTES_DATA`  
**Environment:** Production and development environments use separate namespaces

## Data Structure

### Episodes Index

**Key:** `episodes_index`  
**Type:** JSON Object  
**Description:** Main index containing all episodes and metadata

#### Schema

```typescript
interface EpisodesIndex {
  episodes: Episode[];
  lastUpdated: string;
  totalEpisodes: number;
  version: string;
}
```

#### Example

```json
{
  "episodes": [
    {
      "episodeId": "uuid-v4-string",
      "episodeNumber": 1,
      "title": "Episode 1: Introduction to the Show",
      "publishDate": "2024-01-15T10:00:00.000Z",
      "duration": "00:45:32",
      "description": "Welcome to our podcast...",
      "audioUrl": "https://example.com/episode1.mp3",
      "shownotes": "",
      "translations": [],
      "googleDocsUrls": [
        "https://docs.google.com/document/d/example123"
      ],
      "status": "draft"
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "totalEpisodes": 1,
  "version": "1.0"
}
```

### Episode Object Schema

```typescript
interface Episode {
  episodeId: string;           // UUID v4
  episodeNumber: number;       // Sequential episode number
  title: string;              // Episode title
  publishDate: string;        // ISO 8601 timestamp
  duration: string;           // HH:MM:SS format
  description: string;        // Episode description
  audioUrl: string;           // Direct audio file URL
  shownotes: string;          // Generated shownotes (initially empty)
  translations: Translation[]; // Array of translations (initially empty)
  googleDocsUrls: string[];   // Extracted Google Docs URLs
  status: EpisodeStatus;      // Processing status
}
```

### Translation Object Schema

```typescript
interface Translation {
  language: string;    // Language code (e.g., 'en', 'es', 'fr')
  title: string;       // Translated title
  description: string; // Translated description
  shownotes: string;   // Translated shownotes
}
```

### Episode Status Enum

```typescript
type EpisodeStatus = 'draft' | 'processing' | 'complete' | 'error';
```

**Status Definitions:**
- `draft`: Episode created but not yet processed
- `processing`: Episode is being processed for shownotes/translations
- `complete`: Episode fully processed with shownotes and translations
- `error`: Processing failed, requires attention

## Data Operations

### Read Operations

#### Get All Episodes
```typescript
const indexText = await env.CUENTAME_SHOWNOTES_DATA.get('episodes_index');
const index: EpisodesIndex = JSON.parse(indexText);
```

#### Get Single Episode
```typescript
const index = await getEpisodesIndex();
const episode = index.episodes.find(e => e.episodeId === targetId);
```

### Write Operations

#### Add New Episode
```typescript
const index = await getEpisodesIndex();
const updatedIndex = addEpisodeToIndex(index, newEpisode);
await env.CUENTAME_SHOWNOTES_DATA.put('episodes_index', JSON.stringify(updatedIndex));
```

#### Update Episode
```typescript
const index = await getEpisodesIndex();
const episodeIndex = index.episodes.findIndex(e => e.episodeId === targetId);
if (episodeIndex >= 0) {
  index.episodes[episodeIndex] = updatedEpisode;
  index.lastUpdated = new Date().toISOString();
  await env.CUENTAME_SHOWNOTES_DATA.put('episodes_index', JSON.stringify(index));
}
```

## Data Validation

### Episode Validation Rules

All episodes must pass validation before storage:

```typescript
interface ValidationRule {
  field: string;
  required: boolean;
  type: string;
  validation?: (value: any) => boolean;
}

const episodeValidationRules: ValidationRule[] = [
  { field: 'episodeId', required: true, type: 'string' },
  { field: 'episodeNumber', required: true, type: 'number' },
  { field: 'title', required: true, type: 'string' },
  { field: 'publishDate', required: true, type: 'string', validation: isValidISODate },
  { field: 'duration', required: true, type: 'string', validation: isValidDuration },
  { field: 'audioUrl', required: true, type: 'string', validation: isValidUrl },
  { field: 'status', required: true, type: 'string', validation: isValidStatus }
];
```

### Data Integrity Checks

- **Unique Episode IDs**: No duplicate `episodeId` values
- **Sequential Numbers**: Episode numbers should be sequential (gaps allowed)
- **Valid URLs**: All URLs must be properly formatted
- **Date Formats**: All dates must be valid ISO 8601 strings
- **Duration Format**: Duration must be in HH:MM:SS format

## Storage Limits

### Cloudflare KV Limits
- **Key Size**: Maximum 512 bytes
- **Value Size**: Maximum 25 MB
- **Operations**: 1,000 writes per day (free tier)

### Current Usage
- **episodes_index**: Approximately 1KB per episode
- **Estimated Capacity**: ~25,000 episodes per 25MB limit

## Backup and Recovery

### Data Backup Strategy
1. **Daily Snapshots**: Episodes index backed up daily
2. **Version Control**: Index includes version field for schema migrations
3. **Rollback Capability**: Previous versions stored for recovery

### Recovery Procedures
1. **Corruption Detection**: Validate JSON structure on read
2. **Automatic Recovery**: Fall back to empty index if corrupted
3. **Manual Recovery**: Restore from backup snapshots

## Schema Evolution

### Version History
- **v1.0**: Initial schema with basic episode structure
- **v1.1**: Added Google Docs URLs extraction
- **v1.2**: Added translation support structure

### Migration Strategy
When schema changes are needed:
1. **Backward Compatibility**: New fields are optional
2. **Gradual Migration**: Episodes updated as they're processed
3. **Version Tracking**: Schema version tracked in index

## Performance Considerations

### Optimization Strategies
- **Single Index**: All episodes stored in one KV entry for atomic operations
- **Lazy Loading**: Future implementations may partition large datasets
- **Caching**: Consider CDN caching for read-heavy operations

### Monitoring
- **Size Monitoring**: Track index size growth
- **Operation Limits**: Monitor KV operation usage
- **Performance Metrics**: Track read/write latency

## Security

### Data Protection
- **No Sensitive Data**: No personal information stored
- **Public Content**: All stored data is public podcast content
- **Access Control**: KV namespace access controlled by Cloudflare

### Encryption
- **At Rest**: Data encrypted by Cloudflare KV
- **In Transit**: HTTPS for all API operations

---

**Version:** 1.0  
**Last Updated:** July 7, 2025  
**Schema Version:** 1.1  
**Status:** Phase 1 Implementation