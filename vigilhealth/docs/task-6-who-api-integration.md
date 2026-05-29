# Task 6: WHO Disease API Integration

## Overview

This document describes the implementation of the WHO Disease Outbreak News API integration for the VigilHealth Community Platform. The integration fetches disease outbreak data from WHO every 6 hours, parses it, maps it to our internal schema, and stores it in the database with a 6-hour cache.

## Implementation Summary

### Components Implemented

1. **WHO API Client** (`lib/external/who-api-client.ts`)
   - Fetches data from WHO Disease Outbreak News API
   - Implements error handling and retry logic
   - 10-second timeout for API requests
   - Exponential backoff retry strategy (3 attempts)

2. **WHO Data Parser** (`lib/external/who-data-parser.ts`)
   - Parses WHO API responses into structured format
   - Extracts disease name, regions, countries, case counts
   - Validates required fields and data types
   - Filters out invalid records

3. **WHO Data Mapper** (`lib/external/who-data-mapper.ts`)
   - Maps parsed WHO data to internal `InternalRiskData` schema
   - Geocodes countries to coordinates (using built-in mapping)
   - Calculates severity levels based on case counts
   - Normalizes data for database storage

4. **WHO Cache** (`lib/cache/who-cache.ts`)
   - In-memory cache with 6-hour TTL
   - Provides fallback to cached data on API failure
   - Cache metadata tracking (timestamp, expiration, age)

5. **Cron Job Endpoint** (`app/api/cron/fetch-who-data/route.ts`)
   - Vercel cron job that runs every 6 hours
   - Fetches, parses, maps, and stores WHO data
   - Falls back to cached data if API fails
   - Stores data in `risk_levels` table

6. **Property-Based Tests** (`lib/external/__tests__/who-data-parser.pbt.test.ts`)
   - Tests round-trip property: parse → format → parse
   - Validates data integrity through transformation pipeline
   - 100+ test cases with fast-check library
   - All tests passing ✅

7. **Integration Tests** (`lib/external/__tests__/who-integration.test.ts`)
   - Tests complete WHO data pipeline
   - Validates caching functionality
   - Tests severity calculation
   - All tests passing ✅

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Cron Job                          │
│              (Every 6 hours: 0 */6 * * *)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   WHO API Client                            │
│  - Fetch from WHO Disease Outbreak News API                 │
│  - Retry logic (3 attempts, exponential backoff)            │
│  - 10-second timeout                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   WHO Data Parser                           │
│  - Parse disease, regions, countries, case counts           │
│  - Validate required fields                                 │
│  - Filter invalid records                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   WHO Data Mapper                           │
│  - Map to InternalRiskData schema                           │
│  - Geocode countries to coordinates                         │
│  - Calculate severity (low/moderate/high/critical)          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   WHO Cache (6-hour TTL)                    │
│  - Store in memory                                          │
│  - Provide fallback on API failure                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Database (risk_levels)                │
│  - Store with PostGIS geography                             │
│  - Upsert to avoid duplicates                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. WHO API Response Format

```typescript
interface WHOOutbreak {
  disease: string;
  regions: string[];
  countries: string[];
  caseCount?: number;
  publishedDate: string;
  url: string;
}
```

### 2. Parsed WHO Data Format

```typescript
interface ParsedWHOData {
  disease: string;
  regions: string[];
  countries: string[];
  caseCount: number;
  publishedDate: string;
  sourceUrl: string;
}
```

### 3. Internal Risk Data Format

```typescript
interface InternalRiskData {
  source: 'who';
  disease: string;
  locations: Array<{
    country: string;
    lat: number;
    lng: number;
  }>;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  caseCount: number;
  timestamp: string;
  sourceUrl: string;
}
```

### 4. Database Schema (risk_levels table)

```sql
{
  location: POINT(lng, lat),
  location_name: country,
  city: null,
  state: null,
  country: country,
  disease: disease,
  risk_level: severity,
  risk_score: calculated_score,
  case_count: caseCount,
  source: 'who',
  source_url: sourceUrl,
  confidence: 90,
  valid_from: timestamp,
  valid_until: null
}
```

## Severity Calculation

The severity level is calculated based on case count:

- **Low**: 0-99 cases
- **Moderate**: 100-999 cases
- **High**: 1,000-9,999 cases
- **Critical**: 10,000+ cases

This is a simplified heuristic for MVP. In production, consider:
- Disease-specific thresholds
- Population-adjusted rates
- Transmission rates
- WHO risk assessments

## Caching Strategy

### Cache Behavior

1. **Valid Cache (< 6 hours old)**
   - Return cached data immediately
   - No API call made
   - Fast response time

2. **Expired Cache (> 6 hours old)**
   - Attempt to fetch fresh data from API
   - If API succeeds: Update cache and database
   - If API fails: Fall back to expired cache data

3. **No Cache**
   - Fetch from API
   - If API fails: Return error (no fallback available)

### Cache Implementation

The cache is currently in-memory and will be reset on server restart. For production:
- Consider using Redis for persistent cache
- Implement cache warming on server startup
- Add cache invalidation endpoints for manual refresh

## Cron Job Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-who-data",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Schedule**: Every 6 hours at minute 0 (00:00, 06:00, 12:00, 18:00 UTC)

### Cron Job Security

The endpoint checks for a `CRON_SECRET` environment variable:

```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Setup**: Add `CRON_SECRET` to Vercel environment variables.

## Testing

### Property-Based Tests

**Validates: Requirements 21.6**

Tests the round-trip property: `parse → format → parse` produces semantically equivalent data.

```bash
npm test -- lib/external/__tests__/who-data-parser.pbt.test.ts
```

**Test Coverage**:
- Round-trip equivalence (100 test cases)
- Disease name preservation
- Regions array preservation
- Countries array preservation
- Case count preservation
- Source URL preservation
- Timestamp preservation
- Array parsing round-trip
- Edge cases (empty arrays, zero counts, large counts, special characters)
- Idempotence property

**Result**: ✅ All 13 tests passing

### Integration Tests

Tests the complete WHO data pipeline from API to database.

```bash
npm test -- lib/external/__tests__/who-integration.test.ts
```

**Test Coverage**:
- Complete pipeline processing
- Invalid record filtering
- Unknown country filtering
- Cache functionality
- Cache expiration
- Fallback data
- Cache metadata
- Severity calculation

**Result**: ✅ All 8 tests passing

## Environment Variables

Add these to `.env.local` and Vercel:

```bash
# WHO API
WHO_API_BASE_URL=https://www.who.int/emergencies/disease-outbreak-news/api

# Cron Job Security (optional but recommended)
CRON_SECRET=your_secure_random_string_here
```

## Manual Testing

### Test the Cron Job Locally

```bash
# Start the development server
npm run dev

# In another terminal, trigger the cron job
curl http://localhost:3000/api/cron/fetch-who-data
```

### Test with Cron Secret

```bash
curl -H "Authorization: Bearer your_secret" \
  http://localhost:3000/api/cron/fetch-who-data
```

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Vercel will automatically deploy
3. Cron job will be configured automatically from `vercel.json`
4. Add environment variables in Vercel dashboard:
   - `WHO_API_BASE_URL`
   - `CRON_SECRET` (optional)

### Monitoring

Check cron job execution in Vercel dashboard:
- Go to your project
- Click "Cron Jobs" tab
- View execution logs and status

## Known Limitations

1. **Country Geocoding**: Uses a built-in mapping of ~150 countries. Unknown countries are filtered out. Consider using a geocoding service for production.

2. **In-Memory Cache**: Cache is reset on server restart. Consider Redis for production.

3. **Severity Calculation**: Uses simple case count thresholds. Consider disease-specific logic for production.

4. **WHO API Format**: Implementation assumes a specific API response format. May need updates if WHO changes their API.

5. **Rate Limiting**: No rate limiting implemented. WHO API may have rate limits.

## Future Enhancements

1. **Geocoding Service**: Integrate Mapbox or Google Geocoding API for accurate country coordinates
2. **Redis Cache**: Replace in-memory cache with Redis for persistence
3. **Disease-Specific Severity**: Implement disease-specific severity thresholds
4. **WHO API Monitoring**: Add monitoring for API availability and response times
5. **Data Validation**: Add more robust data validation and sanitization
6. **Historical Data**: Store historical outbreak data for trend analysis
7. **Alert System**: Trigger alerts when new outbreaks are detected
8. **Admin Dashboard**: Create admin UI to view WHO data fetch status and logs

## Troubleshooting

### Cron Job Not Running

1. Check Vercel cron job logs in dashboard
2. Verify `vercel.json` is committed to repository
3. Ensure project is deployed (cron jobs don't run in development)

### API Fetch Failing

1. Check WHO API status: https://www.who.int/emergencies/disease-outbreak-news
2. Verify `WHO_API_BASE_URL` environment variable
3. Check network connectivity
4. Review error logs in Vercel

### Cache Not Working

1. Cache is in-memory and resets on server restart
2. Check cache metadata endpoint: `/api/cron/fetch-who-data`
3. Verify cache TTL (6 hours)

### Database Insert Failing

1. Check Supabase connection
2. Verify `risk_levels` table exists
3. Check RLS policies allow service role inserts
4. Review database logs in Supabase dashboard

## Related Files

- `lib/external/who-api-client.ts` - API client
- `lib/external/who-data-parser.ts` - Data parser
- `lib/external/who-data-mapper.ts` - Data mapper
- `lib/cache/who-cache.ts` - Cache implementation
- `app/api/cron/fetch-who-data/route.ts` - Cron job endpoint
- `lib/external/__tests__/who-data-parser.pbt.test.ts` - Property-based tests
- `lib/external/__tests__/who-integration.test.ts` - Integration tests
- `vercel.json` - Cron job configuration

## Completion Status

✅ **Task 6.1**: Create WHO API client with fetch and error handling
✅ **Task 6.2**: Build WHO data parser (disease name, regions, countries, case counts)
✅ **Task 6.3**: Implement WHO-to-internal data mapper (normalize to `InternalRiskData` schema)
✅ **Task 6.4**: Create Vercel cron job to fetch WHO data every 6 hours (`0 */6 * * *`)
✅ **Task 6.5**: Implement 6-hour cache with fallback to cached data on API failure
✅ **Task 6.6**: Write property-based tests for WHO data parser round-trip

**All subtasks completed successfully!**
