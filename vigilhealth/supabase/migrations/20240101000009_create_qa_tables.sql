CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);
-- Trigram index for duplicate detection
CREATE INDEX idx_questions_title_trgm ON questions USING GIN(title gin_trgm_ops);

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_verified BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_upvotes ON answers(upvotes DESC);
CREATE INDEX idx_answers_flagged ON answers(is_flagged) WHERE is_flagged = TRUE;
