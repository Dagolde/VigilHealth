-- ============================================================
-- Additional composite and performance indexes
-- ============================================================

-- Composite index for risk level queries (disease + level + time)
CREATE INDEX IF NOT EXISTS idx_risk_levels_composite 
ON risk_levels(disease, risk_level, valid_from DESC);

-- Composite index for supply search (type + premium + badge)
CREATE INDEX IF NOT EXISTS idx_supply_locations_search
ON supply_locations(type, is_premium DESC, has_safe_badge DESC);

-- Composite index for help request volunteer matching
CREATE INDEX IF NOT EXISTS idx_help_requests_volunteer_match
ON help_requests(status, created_at DESC) WHERE status = 'pending';

-- Composite index for telehealth commission tracking
CREATE INDEX IF NOT EXISTS idx_telehealth_commission
ON telehealth_referrals(status, commission_paid) WHERE status = 'completed';

-- Composite index for wellness report pattern detection
CREATE INDEX IF NOT EXISTS idx_wellness_outbreak_detection
ON employee_wellness_reports(organization_id, reported_at DESC);

-- Partial index for active safe badges
CREATE INDEX IF NOT EXISTS idx_supply_active_safe_badge
ON supply_locations(has_safe_badge, safe_badge_expires_at)
WHERE has_safe_badge = TRUE;
