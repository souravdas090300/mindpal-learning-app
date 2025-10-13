-- Fix database schema to auto-generate IDs
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update users table to auto-generate id
ALTER TABLE users 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Update documents table to auto-generate id
ALTER TABLE documents 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Update flashcards table to auto-generate id
ALTER TABLE flashcards 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Verify the changes
SELECT 
  table_name,
  column_name,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'documents', 'flashcards')
  AND column_name = 'id';
