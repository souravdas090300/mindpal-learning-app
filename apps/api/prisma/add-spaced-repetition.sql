-- Add Spaced Repetition columns to flashcards table
-- This migration adds SM-2 algorithm fields for tracking review progress

-- Add columns for SM-2 algorithm
ALTER TABLE flashcards
ADD COLUMN IF NOT EXISTS repetition INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS easiness_factor DECIMAL(3,2) DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS times_reviewed INTEGER DEFAULT 0;

-- Create index for efficient querying of due cards
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review 
ON flashcards(next_review_date, user_id);

-- Create index for user's review statistics
CREATE INDEX IF NOT EXISTS idx_flashcards_user_repetition 
ON flashcards(user_id, repetition);

-- Create review_sessions table to track study sessions
CREATE TABLE IF NOT EXISTS review_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id TEXT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  quality INTEGER NOT NULL CHECK (quality >= 0 AND quality <= 5),
  review_date TIMESTAMP NOT NULL DEFAULT NOW(),
  time_spent_seconds INTEGER,
  previous_interval INTEGER,
  new_interval INTEGER,
  previous_easiness DECIMAL(3,2),
  new_easiness DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for review_sessions
CREATE INDEX IF NOT EXISTS idx_review_sessions_user 
ON review_sessions(user_id, review_date DESC);

CREATE INDEX IF NOT EXISTS idx_review_sessions_flashcard 
ON review_sessions(flashcard_id, review_date DESC);

-- Create user_stats table for tracking overall progress
CREATE TABLE IF NOT EXISTS user_stats (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_reviews INTEGER DEFAULT 0,
  cards_mastered INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_review_date DATE,
  total_study_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for user_stats
CREATE INDEX IF NOT EXISTS idx_user_stats_user 
ON user_stats(user_id);

-- Add comments for documentation
COMMENT ON COLUMN flashcards.repetition IS 'Number of successful reviews (SM-2)';
COMMENT ON COLUMN flashcards.easiness_factor IS 'Easiness factor for interval calculation (SM-2, default 2.5)';
COMMENT ON COLUMN flashcards.interval_days IS 'Days until next review (SM-2)';
COMMENT ON COLUMN flashcards.next_review_date IS 'Date when card should be reviewed next';
COMMENT ON COLUMN flashcards.last_reviewed_at IS 'Timestamp of last review';
COMMENT ON COLUMN flashcards.times_reviewed IS 'Total number of times card has been reviewed';

COMMENT ON TABLE review_sessions IS 'Individual flashcard review records for analytics';
COMMENT ON TABLE user_stats IS 'Aggregated user study statistics and progress tracking';
