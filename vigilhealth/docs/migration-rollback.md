# VigilHealth Migration Rollback Procedure

## Overview

This document describes the rollback procedure for reverting from Phase 2 (CloudPanel) back to Phase 1 (Vercel + Supabase) in case of migration issues.

## Pre-Migration Checklist

Before migrating, ensure:

- [ ] Full database export completed (`scripts/export-supabase.sh`)
- [ ] Export file stored in a safe location (not on the server being migrated)
- [ ] Row count verification passed (`scripts/verify-integrity.sh`)
- [ ] All environment variables documented
- [ ] DNS TTL reduced to 60 seconds (for fast rollback)
- [ ] Vercel deployment still active (do not delete until migration is confirmed stable)

## Rollback Decision Criteria

Initiate rollback if any of the following occur within 24 hours of migration:

- Application error rate > 1% (check Vercel/PM2 logs)
- Database query failures
- Authentication failures
- Data integrity issues discovered
- Performance degradation > 50% vs baseline

## Rollback Steps

### Step 1: Switch DNS Back to Vercel

```bash
# Update DNS A record to point back to Vercel
# In your DNS provider, change:
#   A record: YOUR_DOMAIN → [Vercel IP]
# Or update CNAME:
#   CNAME: YOUR_DOMAIN → cname.vercel-dns.com
```

DNS propagation takes 1-5 minutes with TTL=60.

### Step 2: Revert Environment Variables

In Vercel dashboard, ensure these are set:

```
DEPLOYMENT_PHASE=phase1
NEXT_PUBLIC_SUPABASE_URL=<original value>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<original value>
SUPABASE_SERVICE_ROLE_KEY=<original value>
```

### Step 3: Redeploy on Vercel

```bash
# Trigger a new Vercel deployment
vercel --prod
# Or push to main branch if auto-deploy is configured
git push origin main
```

### Step 4: Verify Supabase Data Integrity

Check that no data was lost during the migration window:

```bash
# Compare row counts between CloudPanel and Supabase
SUPABASE_DB_URL="..." CLOUDPANEL_DB_URL="..." ./scripts/verify-integrity.sh
```

### Step 5: Sync Any New Data (if needed)

If users created data during the migration window on CloudPanel, sync it back to Supabase:

```bash
# Export only new records from CloudPanel
pg_dump \
  --table=community_reports \
  --where="created_at > '2024-01-01T00:00:00Z'" \
  "${CLOUDPANEL_DB_URL}" \
  > /tmp/new_data.sql

# Import into Supabase
psql "${SUPABASE_DB_URL}" < /tmp/new_data.sql
```

### Step 6: Stop CloudPanel Services

```bash
# Stop PM2 processes
pm2 stop vigilhealth
pm2 delete vigilhealth

# Stop Nginx (optional — keep running for other sites)
# sudo systemctl stop nginx
```

## Post-Rollback Verification

- [ ] Application loads correctly on Vercel URL
- [ ] Authentication works
- [ ] Supply Finder returns results
- [ ] Risk Radar map loads
- [ ] No error spikes in Vercel logs

## Root Cause Analysis

After rollback, document:

1. What failed during migration
2. Error messages and logs
3. Steps taken to diagnose
4. Recommended fixes before re-attempting migration

## Contact

For migration support: admin@vigilhealth.app

## Related Documents

- `scripts/export-supabase.sh` — Database export
- `scripts/import-cloudpanel.sh` — Database import
- `scripts/verify-integrity.sh` — Row count verification
- `deploy/nginx.conf` — Nginx configuration
- `deploy/ecosystem.config.js` — PM2 configuration
- `docs/security.md` — Security configuration
