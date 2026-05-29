CREATE TABLE supply_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('pharmacy', 'testing_site', 'telehealth', 'other')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  hours TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  has_safe_badge BOOLEAN DEFAULT FALSE,
  safe_badge_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_supply_locations_location ON supply_locations USING GIST(location);
CREATE INDEX idx_supply_locations_type ON supply_locations(type);
CREATE INDEX idx_supply_locations_premium ON supply_locations(is_premium) WHERE is_premium = TRUE;

CREATE TABLE supply_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES supply_locations(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock', 'unknown')),
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_supply_availability_location ON supply_availability(location_id);
CREATE INDEX idx_supply_availability_item ON supply_availability(item_name);
CREATE INDEX idx_supply_availability_created_at ON supply_availability(created_at DESC);
