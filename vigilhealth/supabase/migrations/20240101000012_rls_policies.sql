-- ============================================================
-- Row Level Security Policies for VigilHealth
-- ============================================================
-- All tables have RLS enabled. Supabase Auth's auth.uid() is
-- used to identify the current user in all policies.
-- ============================================================

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- ------------------------------------------------------------
-- user_profiles
-- ------------------------------------------------------------
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY profiles_select_own ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY profiles_insert_own ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- risk_levels
-- ------------------------------------------------------------
ALTER TABLE risk_levels ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read risk levels
CREATE POLICY risk_levels_select_all ON risk_levels
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert and update are restricted to service role only
-- (no policy = no access for regular users; service role bypasses RLS)

-- ------------------------------------------------------------
-- community_reports
-- ------------------------------------------------------------
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all non-flagged reports
CREATE POLICY reports_select_public ON community_reports
  FOR SELECT
  TO authenticated
  USING (is_flagged = FALSE);

-- Authenticated users can insert their own reports
CREATE POLICY reports_insert_own ON community_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own flagged reports
CREATE POLICY reports_select_own_flagged ON community_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_flagged = TRUE);

-- ------------------------------------------------------------
-- supply_locations
-- ------------------------------------------------------------
ALTER TABLE supply_locations ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read supply locations
CREATE POLICY supply_locations_select_all ON supply_locations
  FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- supply_availability
-- ------------------------------------------------------------
ALTER TABLE supply_availability ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read supply availability
CREATE POLICY supply_availability_select_all ON supply_availability
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert availability reports
CREATE POLICY supply_availability_insert_authenticated ON supply_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- ------------------------------------------------------------
-- help_requests
-- ------------------------------------------------------------
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

-- Users can read pending requests within 2 miles of their primary location
CREATE POLICY help_requests_select_nearby ON help_requests
  FOR SELECT
  TO authenticated
  USING (
    status = 'pending' AND
    ST_DWithin(
      location,
      (SELECT primary_location FROM user_profiles WHERE id = auth.uid()),
      3218.69 -- 2 miles in meters
    )
  );

-- Users can read their own requests (any status)
CREATE POLICY help_requests_select_own ON help_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = volunteer_id);

-- Users can insert their own help requests
CREATE POLICY help_requests_insert_own ON help_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Volunteers can update requests they have accepted
CREATE POLICY help_requests_update_volunteer ON help_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = volunteer_id OR auth.uid() = requester_id);

-- ------------------------------------------------------------
-- volunteers
-- ------------------------------------------------------------
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read volunteer profiles
CREATE POLICY volunteers_select_all ON volunteers
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own volunteer record
CREATE POLICY volunteers_insert_own ON volunteers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own volunteer record
CREATE POLICY volunteers_update_own ON volunteers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ------------------------------------------------------------
-- questions
-- ------------------------------------------------------------
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read questions
CREATE POLICY questions_select_all ON questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert questions
CREATE POLICY questions_insert_authenticated ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own questions
CREATE POLICY questions_update_own ON questions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- answers
-- ------------------------------------------------------------
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read non-flagged answers
CREATE POLICY answers_select_non_flagged ON answers
  FOR SELECT
  TO authenticated
  USING (is_flagged = FALSE);

-- Authenticated users can insert answers
CREATE POLICY answers_insert_authenticated ON answers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own answers
CREATE POLICY answers_update_own ON answers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- business_organizations
-- ------------------------------------------------------------
ALTER TABLE business_organizations ENABLE ROW LEVEL SECURITY;

-- Users can read organizations they belong to
CREATE POLICY business_orgs_select_own ON business_organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM business_users WHERE user_id = auth.uid()
    )
  );

-- Users can update organizations they are admins of
CREATE POLICY business_orgs_update_admin ON business_organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM business_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- business_locations
-- ------------------------------------------------------------
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;

-- Users can read locations belonging to their organization
CREATE POLICY business_locations_select_own_org ON business_locations
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM business_users WHERE user_id = auth.uid()
    )
  );

-- Admins can insert locations for their organization
CREATE POLICY business_locations_insert_admin ON business_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM business_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- business_users
-- ------------------------------------------------------------
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- Users can read their own business_users records
CREATE POLICY business_users_select_own ON business_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all members of their organization
CREATE POLICY business_users_select_org_admin ON business_users
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM business_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- employee_wellness_reports
-- ------------------------------------------------------------
ALTER TABLE employee_wellness_reports ENABLE ROW LEVEL SECURITY;

-- Business users can read wellness reports for their organization
CREATE POLICY wellness_reports_select_own_org ON employee_wellness_reports
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM business_users WHERE user_id = auth.uid()
    )
  );

-- Business users can insert wellness reports for their organization
CREATE POLICY wellness_reports_insert_own_org ON employee_wellness_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM business_users WHERE user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- telehealth_referrals
-- ------------------------------------------------------------
ALTER TABLE telehealth_referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own referrals
CREATE POLICY telehealth_referrals_select_own ON telehealth_referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own referrals
CREATE POLICY telehealth_referrals_insert_own ON telehealth_referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
