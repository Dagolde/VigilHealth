CREATE TABLE risk_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  location_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT,
  disease TEXT NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  case_count INTEGER,
  source TEXT CHECK (source IN ('who', 'cdc', 'community')),
  source_url TEXT,
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_risk_levels_location ON risk_levels USING GIST(location);
CREATE INDEX idx_risk_levels_disease ON risk_levels(disease);
CREATE INDEX idx_risk_levels_valid_from ON risk_levels(valid_from DESC);
CREATE INDEX idx_risk_levels_source ON risk_levels(source);
