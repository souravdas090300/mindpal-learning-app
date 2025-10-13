/**
 * Supabase Database Client
 * 
 * This module initializes and exports the Supabase client for database operations.
 * Supabase provides a PostgreSQL database with a REST API interface.
 * 
 * Database Tables:
 * - users: User accounts and authentication
 * - documents: User-created documents with AI summaries
 * - flashcards: Generated flashcards linked to documents
 * 
 * Features:
 * - Row Level Security (RLS) for data protection
 * - Real-time subscriptions (not currently used)
 * - Built-in authentication support
 * - REST API for all CRUD operations
 * 
 * @requires SUPABASE_URL environment variable
 * @requires SUPABASE_ANON_KEY environment variable
 * @see https://supabase.com/docs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Supabase Configuration
 * These credentials are required to connect to the database
 */
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

/**
 * Validate Environment Variables
 * Ensures that required Supabase credentials are present
 * Throws an error if any are missing to prevent runtime failures
 */
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  console.error('SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY are required');
}

/**
 * Initialize Supabase Client
 * This client is used throughout the application for all database operations
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// TypeScript Database Types
// ============================================================================

/**
 * User Interface
 * Represents a user account in the system
 */
export interface User {
  /** Unique user identifier (CUID format) */
  id: string;
  
  /** User's email address (used for login) */
  email: string;
  
  /** Hashed password (bcrypt) - never sent to client */
  password: string;
  
  /** Optional display name */
  name: string | null;
  
  /** Account creation timestamp */
  created_at: string;
  
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Document Interface
 * Represents a user-created document with AI-generated content
 */
export interface Document {
  /** Unique document identifier (CUID format) */
  id: string;
  
  /** Foreign key to users table */
  user_id: string;
  
  /** Document title */
  title: string;
  
  /** Full document content/text */
  content: string;
  
  /** AI-generated summary (nullable until AI processes it) */
  summary: string | null;
  
  /** Creation timestamp */
  created_at: string;
  
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Flashcard Interface
 * Represents an educational flashcard generated from document content
 */
export interface Flashcard {
  /** Unique flashcard identifier (CUID format) */
  id: string;
  
  /** Foreign key to documents table */
  document_id: string;
  
  /** Flashcard question text */
  question: string;
  
  /** Flashcard answer text */
  answer: string;
  
  /** Creation timestamp */
  created_at: string;
}
