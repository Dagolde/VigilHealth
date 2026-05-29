# Database Query Optimization Guide

## Overview

This guide documents query optimization strategies for VigilHealth's Supabase PostgreSQL database.

## Indexes

All indexes are defined in the migration files. Key indexes:

```sql
-- PostGIS spatial indexes (critical for radius queries)
CREATE INDEX idx_supply_locations_location ON supply_locations USING GIST (location);
CREATE INDEX idx_risk_levels_location ON risk_levels USING GIST (location);
CREATE INDEX idx_help_requests_location ON help_requests USING GIST (location);

-- Timestamp indexes for time-range queries
CREATE INDEX idx_supply_availability_created_at ON supply_availability (created_at DESC);
CREATE INDEX idx_community_reports_created_at ON community_reports (created_at DESC);
CREATE INDEX idx_telehealth_referrals_created_at ON telehealth_referrals (created_at DESC);

-- Foreign key indexes
CREATE INDEX idx_supply_availability_location_id ON supply_availability (location_id);
CREATE INDEX idx_answers_question_id ON answers (question_id);
CREATE INDEX idx_help_requests_requester_id ON help_requests (requester_id);
```

## EXPLAIN ANALYZE Usage

Run `EXPLAIN ANALYZE` on slow queries to identify bottlenecks:

```sql
EXPLAIN ANALYZE
SELECT sl.*, sa.status, sa.created_at as last_updated
FROM supply_locations sl
LEFT JOIN LATERAL (
  SELECT status, created_at
  FROM supply_availability
  WHERE location_id = sl.id
  ORDER BY created_at DESC
  LIMIT 1
) sa ON true
WHERE ST_DWithin(
  sl.location::geography,
  ST_MakePoint(-74.006, 40.7128)::geography,
  16093  -- 10 miles in meters
)
ORDER BY ST_Distance(sl.location::geography, ST_MakePoint(-74.006, 40.7128)::geography);
```

## Common Slow Query Patterns

### 1. Supply Search Without Spatial Index

**Problem**: Full table scan on `supply_locations` without PostGIS index.

**Solution**: Ensure `idx_supply_locations_location` GIST index exists. Use `ST_DWithin` instead of `ST_Distance` in WHERE clause (DWithin uses the index, Distance does not).

### 2. N+1 Queries in Availability Lookup

**Problem**: Fetching availability for each location separately.

**Solution**: Use a LATERAL JOIN to fetch the most recent availability record per location in a single query.

### 3. Unindexed Flag Queries

**Problem**: `SELECT * FROM answers WHERE is_flagged = true` without index.

**Solution**: Add partial index: `CREATE INDEX idx_answers_flagged ON answers (id) WHERE is_flagged = true;`

## Connection Pooling

Supabase uses PgBouncer for connection pooling. Configure via:

```
SUPABASE_DB_POOL_SIZE=10  # Default for free tier
```

For Phase 2 (CloudPanel), configure PgBouncer directly:

```ini
[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

## Query Result Caching

- Risk data: 6-hour edge cache (see `lib/cache/edge-cache.ts`)
- Supply search: 5-minute edge cache
- Geocoding results: 24-hour in-memory cache (see `lib/mapbox/geocoding.ts`)

## Free Tier Limits

Supabase free tier limits:
- 500 MB database storage
- 2 GB bandwidth/month
- 50,000 monthly active users

Monitor usage at: https://supabase.com/dashboard/project/_/settings/billing
