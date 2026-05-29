#!/usr/bin/env bash
# =============================================================================
# VigilHealth — CloudPanel PostgreSQL Import Script
# =============================================================================
# Imports a Supabase SQL dump into a CloudPanel PostgreSQL database.
#
# Prerequisites:
#   - psql installed on the CloudPanel server
#   - PostgreSQL database created in CloudPanel
#   - SQL dump file from export-supabase.sh
#
# Usage:
#   chmod +x scripts/import-cloudpanel.sh
#   CLOUDPANEL_DB_URL="postgresql://..." DUMP_FILE="./backups/vigilhealth_export_*.sql" \
#     ./scripts/import-cloudpanel.sh
# =============================================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────

CLOUDPANEL_DB_URL="${CLOUDPANEL_DB_URL:-}"
DUMP_FILE="${DUMP_FILE:-}"

# ─── Validation ───────────────────────────────────────────────────────────────

if [ -z "${CLOUDPANEL_DB_URL}" ]; then
  echo "ERROR: CLOUDPANEL_DB_URL environment variable is not set."
  echo "Format: postgresql://user:password@localhost:5432/vigilhealth"
  exit 1
fi

if [ -z "${DUMP_FILE}" ]; then
  echo "ERROR: DUMP_FILE environment variable is not set."
  echo "Example: DUMP_FILE=./backups/vigilhealth_export_20240101_120000.sql"
  exit 1
fi

if [ ! -f "${DUMP_FILE}" ]; then
  echo "ERROR: Dump file not found: ${DUMP_FILE}"
  exit 1
fi

if ! command -v psql &> /dev/null; then
  echo "ERROR: psql not found. Install PostgreSQL client tools."
  exit 1
fi

# ─── Pre-import Checks ────────────────────────────────────────────────────────

echo "=== VigilHealth CloudPanel Import ==="
echo "Dump file: ${DUMP_FILE}"
echo "Target DB: ${CLOUDPANEL_DB_URL//:*@/:***@}"  # Mask password
echo ""

# Test connection
echo "Testing database connection..."
psql "${CLOUDPANEL_DB_URL}" -c "SELECT version();" > /dev/null
echo "Connection successful."

# ─── Enable Extensions ────────────────────────────────────────────────────────

echo "Enabling required PostgreSQL extensions..."
psql "${CLOUDPANEL_DB_URL}" <<'SQL'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
SQL
echo "Extensions enabled."

# ─── Import ───────────────────────────────────────────────────────────────────

echo "Importing database dump..."
psql \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  "${CLOUDPANEL_DB_URL}" \
  < "${DUMP_FILE}"

echo ""
echo "=== Import Complete ==="
echo ""
echo "Next steps:"
echo "1. Run scripts/verify-integrity.sh to compare row counts"
echo "2. Update .env.local with DEPLOYMENT_PHASE=phase2 and DATABASE_URL"
echo "3. Test the application against the new database"
