-- Migration: Add Missing Features
-- Date: March 8, 2026
-- Description: Adds password reset fields and study rooms table

-- Add password reset fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Create study_rooms table
CREATE TABLE IF NOT EXISTS study_rooms (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id VARCHAR(255) NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  max_participants INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_study_rooms_creator ON study_rooms(creator_id);
CREATE INDEX IF NOT EXISTS idx_study_rooms_public ON study_rooms(is_public);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Add comments
COMMENT ON COLUMN users.reset_token IS 'Token for password reset';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiration time for reset token';
COMMENT ON TABLE study_rooms IS 'Virtual study rooms for real-time collaboration';
