-- MindPal Database Schema
-- Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/qnzntcgtnivgxwijcevv/editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT documents_userId_fkey FOREIGN KEY ("userId") 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS documents_userId_idx ON documents("userId");
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "nextReview" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    interval INTEGER NOT NULL DEFAULT 1,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT flashcards_documentId_fkey FOREIGN KEY ("documentId") 
        REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create flashcard indexes
CREATE INDEX IF NOT EXISTS flashcards_documentId_idx ON flashcards("documentId");
CREATE INDEX IF NOT EXISTS flashcards_nextReview_idx ON flashcards("nextReview");

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'documents');

-- Show table structures
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'documents'
ORDER BY ordinal_position;
