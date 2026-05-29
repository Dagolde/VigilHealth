CREATE TABLE telehealth_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  symptom_summary TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  commission_amount DECIMAL(10,2),
  commission_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_telehealth_referrals_user ON telehealth_referrals(user_id);
CREATE INDEX idx_telehealth_referrals_code ON telehealth_referrals(referral_code);
CREATE INDEX idx_telehealth_referrals_status ON telehealth_referrals(status);
