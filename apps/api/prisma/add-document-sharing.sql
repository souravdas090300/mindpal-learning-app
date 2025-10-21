/**
 * Database Migration: Document Sharing & Collaboration
 * 
 * This migration adds support for sharing documents with other users.
 * Features:
 * - Share documents with specific users
 * - Permission levels (view, edit)
 * - Shareable links with expiration
 * - Track who shared and when
 * 
 * Tables Created:
 * 1. document_shares - User-to-user sharing with permissions
 * 2. share_links - Public shareable links with tokens
 * 
 * Run this SQL in your Supabase Dashboard → SQL Editor
 */

-- ============================================================================
-- TABLE: document_shares
-- Purpose: Track document sharing between users with permission levels
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_shares (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
  shared_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate shares
  UNIQUE(document_id, shared_with_user_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with ON document_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_owner_id ON document_shares(owner_id);

-- ============================================================================
-- TABLE: share_links
-- Purpose: Generate shareable links for documents (public or private)
-- ============================================================================

CREATE TABLE IF NOT EXISTS share_links (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMP,
  access_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_share_links_document_id ON share_links(document_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_share_links_owner_id ON share_links(owner_id);
CREATE INDEX IF NOT EXISTS idx_share_links_active ON share_links(is_active);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE document_shares IS 'Tracks document sharing between registered users';
COMMENT ON TABLE share_links IS 'Generates shareable links for documents with optional expiration';

COMMENT ON COLUMN document_shares.permission IS 'Permission level: view (read-only) or edit (read-write)';
COMMENT ON COLUMN share_links.share_token IS 'Unique token for public sharing (used in URL)';
COMMENT ON COLUMN share_links.expires_at IS 'Link expiration date (NULL = never expires)';
COMMENT ON COLUMN share_links.is_active IS 'Whether the link is currently active (can be deactivated)';
COMMENT ON COLUMN share_links.access_count IS 'Number of times the link has been accessed';

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get all documents shared with a user
-- SELECT d.*, ds.permission, ds.shared_at 
-- FROM documents d 
-- JOIN document_shares ds ON d.id = ds.document_id 
-- WHERE ds.shared_with_user_id = 'user-id';

-- Get all users a document is shared with
-- SELECT u.id, u.name, u.email, ds.permission, ds.shared_at 
-- FROM users u 
-- JOIN document_shares ds ON u.id = ds.shared_with_user_id 
-- WHERE ds.document_id = 'document-id';

-- Get active share links for a document
-- SELECT * FROM share_links 
-- WHERE document_id = 'document-id' 
-- AND is_active = TRUE 
-- AND (expires_at IS NULL OR expires_at > NOW());

-- Increment share link access count
-- UPDATE share_links 
-- SET access_count = access_count + 1, last_accessed_at = NOW() 
-- WHERE share_token = 'token';
