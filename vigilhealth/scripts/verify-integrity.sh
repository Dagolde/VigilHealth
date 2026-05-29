#!/usr/bin/env bash
# =============================================================================
# VigilHealth — Data Integrity Verification Script
# =============================================================================
# Compares row counts between Supabase and CloudPanel PostgreSQL databases
# to verify a successful migration.
#
# Usage:
#   chmod +x scripts/verify-integrity.sh
#   SUPABASE_DB_URL="postgresql://..." CLOUDPANEL_DB_URL="postgresql://..." \
#     ./scripts/verify-integrity.sh
# =============================================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────

SUPABASE_DB_URL="${SUPABASE_DB_URL:-}"
CLOUDPANEL_DB_URL="${CLOUDPANEL_DB_URL:-}"

TABLES=(
  "users"
  "user_profiles"
  "risk_levels"
  "community_reports"
  "supply_locations"
  "supply_availability"
  "help_requests"
  "volunteers"
  "questions"
  "answers"
  "business_organizations"
  "business_locations"
  "business_users"
  "employee_wellness_reports"
  "telehealth_referrals"
)

# ─── Validation ───────────────────────────────────────────────────────────────

if [ -z "${SUPABASE_DB_URL}" ] || [ -z "${CLOUDPANEL_DB_URL}" ]; then
  echo "ERROR: Both SUPABASE_DB_URL and CLOUDPANEL_DB_URL must be set."
  exit 1
fi

# ─── Row Count Comparison ─────────────────────────────────────────────────────

echo "=== VigilHealth Data Integrity Verification ==="
echo ""
printf "%-35s %15s %15s %10s\n" "Table" "Supabase" "CloudPanel" "Match"
printf "%-35s %15s %15s %10s\n" "-----" "--------" "----------" "-----"

PASS=0
FAIL=0

for TABLE in "${TABLES[@]}"; do
  SUPABASE_COUNT=$(psql "${SUPABASE_DB_URL}" -t -c "SELECT COUNT(*) FROM public.${TABLE};" 2>/dev/null | tr -d ' ' || echo "ERROR")
  CLOUDPANEL_COUNT=$(psql "${CLOUDPANEL_DB_URL}" -t -c "SELECT COUNT(*) FROM public.${TABLE};" 2>/dev/null | tr -d ' ' || echo "ERROR")

  if [ "${SUPABASE_COUNT}" = "${CLOUDPANEL_COUNT}" ]; then
    MATCH="✓ PASS"
    PASS=$((PASS + 1))
  else
    MATCH="✗ FAIL"
    FAIL=$((FAIL + 1))
  fi

  printf "%-35s %15s %15s %10s\n" "${TABLE}" "${SUPABASE_COUNT}" "${CLOUDPANEL_COUNT}" "${MATCH}"
done

echo ""
echo "=== Summary ==="
echo "Passed: ${PASS}/${#TABLES[@]}"
echo "Failed: ${FAIL}/${#TABLES[@]}"

if [ "${FAIL}" -gt 0 ]; then
  echo ""
  echo "WARNING: Row count mismatches detected. Review the failed tables before proceeding."
  exit 1
else
  echo ""
  echo "All row counts match. Migration integrity verified. ✓"
fi
