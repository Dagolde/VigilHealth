CREATE TABLE community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  observation_type TEXT CHECK (observation_type IN ('symptom', 'supply', 'other')),
  description TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_community_reports_location ON community_reports USING GIST(location);
CREATE INDEX idx_community_reports_created_at ON community_reports(created_at DESC);
CREATE INDEX idx_community_reports_flagged ON community_reports(is_flagged) WHERE is_flagged = TRUE;
