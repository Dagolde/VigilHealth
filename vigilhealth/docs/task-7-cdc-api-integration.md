# Task 7: CDC NNDSS Feed Integration

## Overview

This document describes the implementation of CDC National Notifiable Diseases Surveillance System (NNDSS) feed integration for the VigilHealth Community Platform.

## Implementation Summary

### Components Implemented

1. **CDC API Client** (`lib/external/cdc-api-client.ts`)
   - Fetches disease case reports from CDC NNDSS via Socrata Open Data API
   - Implements retry logic with exponential backoff
   - 15-second timeout for API requests
   - Error handling for network failures and API errors

2. **CDC Data Parser** (`lib/external/cdc-data-parser.ts`)
   - Parses raw CDC case reports into structured format
   - Validates required fields (disease, state, FIPS code, reporting week)
   - Validates FIPS code format (5-digit string)
   - Handles optional county field
   - Normalizes case counts to non-negative integers

3. **FIPS Geocoder** (`lib/external/fips-geocoder.ts`)
   - Maps US county FIPS codes to geographic coordinates
   - Includes 200+ major US counties
   - Returns county centroids for location data
   - Supports batch geocoding

4. **CDC Data Mapper** (`lib/external/cdc-data-mapper.ts`)
   - Maps parsed CDC data to internal `InternalRiskData` schema
   - Geocodes FIPS codes to coordinates
   - Calculates severity levels based on case counts:
     - Low: < 50 cases
     - Moderate: 50-199 cases
     - High: 200-999 cases
     - Critical: ≥ 1000 cases
   - Filters out records with unsupported FIPS codes

5. **CDC Cache** (`lib/cache/cdc-cache.ts`)
   - 24-hour TTL for CDC data
   - In-memory cache (can be replaced with Redis in production)
   - Fallback to expired cache on API failure
   - Cache metadata tracking

6. **CDC Cron Job** (`app/api/cron/fetch-cdc-data/route.ts`)
   - Runs daily at 2 AM UTC
   - Fetches, parses, and stores CDC data
   - Implements CDC-over-WHO priority for US locations
   - Stores data in `risk_levels` table with 95% confidence
   - Falls back to cached data on API failure

### Data Flow

```
CDC NNDSS API (Socrata)
  ↓
CDC API Client (fetch with retry)
  ↓
CDC Data Parser (validate & structure)
  ↓
FIPS Geocoder (FIPS → coordinates)
  ↓
CDC Data Mapper (map to internal format)
  ↓
CDC Cache (24-hour TTL)
  ↓
Database (risk_levels table)
```

### CDC-over-WHO Priority Logic

For US locations, CDC data takes priority over WHO data:

1. **Higher Confidence**: CDC data stored with 95% confidence vs WHO's 90%
2. **County-Level Precision**: CDC provides county-level data vs WHO's country-level
3. **US-Specific**: CDC focuses on US surveillance vs WHO's global coverage
4. **Daily Updates**: CDC updates daily vs WHO's 6-hour updates

The database query layer prioritizes higher confidence sources when multiple sources exist for the same location.

## API Endpoint

### Cron Job Endpoint

**URL**: `GET /api/cron/fetch-cdc-data`

**Schedule**: Daily at 2 AM UTC (`0 2 * * *`)

**Authentication**: Bearer token via `CRON_SECRET` environment variable

**Response**:
```json
{
  "success": true,
  "source": "api" | "cache" | "fallback",
  "recordCount": 150,
  "storedCount": 150,
  "message": "Successfully processed CDC data from api"
}
```

## Database Schema

CDC data is stored in the `risk_levels` table:

```sql
INSERT INTO risk_levels (
  location,           -- PostGIS POINT(lng, lat)
  location_name,      -- "County, State"
  state,              -- State name
  country,            -- "United States"
  disease,            -- Disease name
  risk_level,         -- low | moderate | high | critical
  risk_score,         -- 30 | 50 | 70 | 90
  case_count,         -- Number of cases
  source,             -- 'cdc'
  source_url,         -- CDC data portal URL
  confidence,         -- 95 (higher than WHO)
  valid_from,         -- Reporting week timestamp
  valid_until         -- NULL (no expiration)
)
```

## Testing

### Property-Based Tests

**File**: `lib/external/__tests__/cdc-data-parser.pbt.test.ts`

Tests the round-trip property: `parse → format → parse` produces semantically equivalent data.

**Properties Tested**:
1. Round-trip parsing preserves data
2. Parsing is idempotent
3. Array parsing preserves valid records
4. Invalid FIPS codes are rejected
5. Case count is always non-negative
6. Empty/whitespace fields are rejected
7. Format preserves all fields

**Test Coverage**: 100 runs per property (700 total test cases)

### Integration Tests

**File**: `lib/external/__tests__/cdc-integration.test.ts`

Tests the complete CDC data flow from API to cache.

**Test Suites**:
1. FIPS Geocoder (3 tests)
2. CDC Data Parser (2 tests)
3. CDC Data Mapper (3 tests)
4. CDC Cache (5 tests)
5. Complete CDC Data Flow (1 test)

**Total Tests**: 14 integration tests

## Configuration

### Environment Variables

```bash
# CDC NNDSS API base URL
CDC_NNDSS_BASE_URL=https://data.cdc.gov/resource

# Cron job authentication
CRON_SECRET=your_cron_secret_here
```

### Vercel Cron Configuration

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-cdc-data",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## FIPS Code Coverage

The FIPS geocoder includes 200+ major US counties covering:

- All 50 states
- Major metropolitan areas
- High-population counties
- State capitals

**Sample Coverage**:
- California: 11 counties (LA, SF, San Diego, etc.)
- New York: 5 counties (NYC boroughs)
- Texas: 4 counties (Houston, Dallas, Austin, San Antonio)
- Florida: 6 counties (Miami, Orlando, Tampa, etc.)
- Illinois: 3 counties (Chicago metro)

For production, expand coverage or integrate with a comprehensive FIPS database.

## Error Handling

### API Failures

1. **Retry Logic**: 3 attempts with exponential backoff (2s, 4s, 8s)
2. **Timeout**: 15-second timeout per request
3. **Fallback**: Use cached data (even if expired) on API failure
4. **Logging**: All errors logged with context

### Data Validation

1. **Required Fields**: Disease, state, FIPS code, reporting week
2. **FIPS Format**: Must be 5-digit string
3. **Case Count**: Must be non-negative integer
4. **Empty Strings**: Rejected after trimming

### Cache Failures

1. **Cache Miss**: Fetch from API
2. **API Failure**: Use fallback cache (expired data)
3. **No Cache**: Return error response

## Performance Considerations

### API Performance

- **Request Timeout**: 15 seconds
- **Retry Delay**: 2-8 seconds (exponential backoff)
- **Max Execution Time**: 60 seconds (Vercel limit)

### Cache Performance

- **Cache Hit**: < 1ms (in-memory)
- **Cache Miss**: 15-30 seconds (API fetch + processing)
- **TTL**: 24 hours

### Database Performance

- **Batch Insert**: All records in single transaction
- **Upsert**: Prevents duplicates
- **Indexes**: PostGIS spatial index on location

## Future Enhancements

1. **Expand FIPS Coverage**: Add all 3,143 US counties
2. **Redis Cache**: Replace in-memory cache for persistence
3. **Real-time Updates**: WebSocket notifications on new data
4. **Historical Data**: Store time-series data for trend analysis
5. **Data Quality**: Implement anomaly detection for case counts
6. **API Rate Limiting**: Track and optimize Socrata API usage

## References

- [CDC NNDSS Data Portal](https://data.cdc.gov/NNDSS/NNDSS-Table-1/pwn4-m3yp)
- [Socrata Open Data API](https://dev.socrata.com/)
- [US Census Bureau FIPS Codes](https://www.census.gov/library/reference/code-lists/ansi.html)
- [PostGIS Geography Type](https://postgis.net/docs/geography.html)

## Completion Status

✅ Task 7.1: Create CDC NNDSS API client  
✅ Task 7.2: Build CDC data parser  
✅ Task 7.3: Implement FIPS-to-coordinates geocoding  
✅ Task 7.4: Create Vercel cron job  
✅ Task 7.5: Implement CDC-over-WHO priority logic  
✅ Task 7.6: Write property-based tests  

**All subtasks completed successfully.**
