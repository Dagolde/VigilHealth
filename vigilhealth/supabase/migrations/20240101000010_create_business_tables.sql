CREATE TABLE business_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'basic', 'premium')) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE business_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES business_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_business_locations_org ON business_locations(organization_id);

-- Junction table: which users belong to which business org (as admins)
CREATE TABLE business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES business_organizations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);
CREATE INDEX idx_business_users_user ON business_users(user_id);
CREATE INDEX idx_business_users_org ON business_users(organization_id);

CREATE TABLE employee_wellness_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES business_organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES business_locations(id) ON DELETE SET NULL,
  employee_id TEXT NOT NULL,
  symptoms TEXT[],
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  is_absent BOOLEAN DEFAULT FALSE,
  reported_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_wellness_reports_org ON employee_wellness_reports(organization_id);
CREATE INDEX idx_wellness_reports_location ON employee_wellness_reports(location_id);
CREATE INDEX idx_wellness_reports_date ON employee_wellness_reports(reported_at DESC);
