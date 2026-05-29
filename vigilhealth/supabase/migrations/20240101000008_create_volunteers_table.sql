CREATE TABLE volunteers (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_method TEXT,
  average_rating DECIMAL(3,2),
  completed_tasks INTEGER DEFAULT 0,
  flag_count INTEGER DEFAULT 0,
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_volunteers_verified ON volunteers(is_verified) WHERE is_verified = TRUE;
