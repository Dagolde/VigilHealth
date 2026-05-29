#!/usr/bin/env bash
# =============================================================================
# VigilHealth — Supabase Database Export Script
# =============================================================================
# Exports the Supabase PostgreSQL database to a SQL dump file.
# Run this script before migrating to CloudPanel.
#
# Prerequisites:
#   - pg_dump installed (PostgreSQL client tools)
#   - SUPABASE_DB_URL environment variable set
#     Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
#
# Usage:
#   chmod +x scripts/export-supabase.sh
#   SUPABASE_DB_URL="postgresql://..." ./scripts/export-supabase.sh
# =============================================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────

EXPORT_DIR="${EXPORT_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_FILE="${EXPORT_DIR}/vigilhealth_export_${TIMESTAMP}.sql"
SCHEMA_FILE="${EXPORT_DIR}/vigilhealth_schema_${TIMESTAMP}.sql"

# ─── Validation ───────────────────────────────────────────────────────────────

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "ERROR: SUPABASE_DB_URL environment variable is not set."
  echo "Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
  exit 1
fi

if ! command -v pg_dump &> /dev/null; then
  echo "ERROR: pg_dump not found. Install PostgreSQL client tools."
  echo "  macOS: brew install postgresql"
  echo "  Ubuntu: sudo apt-get install postgresql-client"
  exit 1
fi

# ─── Export ───────────────────────────────────────────────────────────────────

mkdir -p "${EXPORT_DIR}"

echo "=== VigilHealth Database Export ==="
echo "Timestamp: ${TIMESTAMP}"
echo "Export file: ${EXPORT_FILE}"
echo ""

# Export schema only
echo "Exporting schema..."
pg_dump \
  --schema-only \
  --no-owner \
  --no-acl \
  --schema=public \
  "${SUPABASE_DB_URL}" \
  > "${SCHEMA_FILE}"

echo "Schema exported to: ${SCHEMA_FILE}"

# Export full data dump
echo "Exporting data..."
pg_dump \
  --no-owner \
  --no-acl \
  --schema=public \
  --format=plain \
  --verbose \
  "${SUPABASE_DB_URL}" \
  > "${EXPORT_FILE}"

echo "Data exported to: ${EXPORT_FILE}"

# Verify export
EXPORT_SIZE=$(du -sh "${EXPORT_FILE}" | cut -f1)
echo ""
echo "=== Export Complete ==="
echo "File size: ${EXPORT_SIZE}"
echo "Schema: ${SCHEMA_FILE}"
echo "Data: ${EXPORT_FILE}"
echo ""
echo "Next step: Run scripts/import-cloudpanel.sh on your CloudPanel server."
