CREATE TABLE help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  task_type TEXT CHECK (task_type IN ('groceries', 'pharmacy', 'other')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')),
  status TEXT CHECK (status IN ('pending', 'accepted', 'fulfilled', 'cancelled')) DEFAULT 'pending',
  volunteer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ
);
CREATE INDEX idx_help_requests_location ON help_requests USING GIST(location);
CREATE INDEX idx_help_requests_status ON help_requests(status) WHERE status = 'pending';
CREATE INDEX idx_help_requests_created_at ON help_requests(created_at DESC);
