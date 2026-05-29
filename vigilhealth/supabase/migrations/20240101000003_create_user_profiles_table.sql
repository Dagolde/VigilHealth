CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  primary_location GEOGRAPHY(POINT, 4326),
  primary_city TEXT,
  primary_state TEXT,
  search_radius_miles INTEGER DEFAULT 5 CHECK (search_radius_miles BETWEEN 1 AND 50),
  notification_preferences JSONB DEFAULT '{"push": true, "email": true, "sms": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_profiles_location ON user_profiles USING GIST(primary_location);
