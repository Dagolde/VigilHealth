-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Enable pg_trgm for fuzzy text search (duplicate question detection)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
