/**
 * Document Sharing API Routes
 * 
 * Endpoints for managing document sharing and collaboration:
 * - Share documents with specific users
 * - Manage permissions (view/edit)
 * - Generate shareable links
 * - Access shared documents
 * 
 * @module routes/sharing
 */

import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { authenticateToken, AuthRequest } from "../lib/auth";
import cuid from "cuid";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/sharing/share
 * Share a document with another user
 * 
 * @body documentId - Document to share
 * @body userEmail - Email of user to share with
 * @body permission - 'view' or 'edit'
 */
router.post("/share", async (req: AuthRequest, res: Response) => {
  try {
    const { documentId, userEmail, permission } = req.body;
    const ownerId = req.user?.userId;

    if (!documentId || !userEmail || !permission) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["view", "edit"].includes(permission)) {
      return res.status(400).json({ error: "Invalid permission type" });
    }

    // Verify document ownership
    const { data: document } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("userId", ownerId)
      .single();

    if (!document) {
      return res.status(404).json({ error: "Document not found or not owned by you" });
    }

    // Find user by email
    const { data: userToShareWith } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("email", userEmail)
      .single();

    if (!userToShareWith) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userToShareWith.id === ownerId) {
      return res.status(400).json({ error: "Cannot share with yourself" });
    }

    // Create or update share
    const shareId = cuid();
    const { data: share, error } = await supabase
      .from("document_shares")
      .upsert({
        id: shareId,
        document_id: documentId,
        owner_id: ownerId,
        shared_with_user_id: userToShareWith.id,
        permission,
        shared_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error sharing document:", error);
      return res.status(500).json({ error: "Failed to share document" });
    }

    res.json({
      success: true,
      share: {
        ...share,
        user: userToShareWith,
      },
    });
  } catch (error) {
    console.error("Error in share endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/sharing/document/:documentId
 * Get all shares for a document
 */
router.get("/document/:documentId", async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.userId;

    // Verify ownership
    const { data: document } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("userId", userId)
      .single();

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Get all shares
    const { data: shares } = await supabase
      .from("document_shares")
      .select("*")
      .eq("document_id", documentId);

    // Get user details for each share
    const sharesWithUsers = await Promise.all(
      (shares || []).map(async (share) => {
        const { data: user } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("id", share.shared_with_user_id)
          .single();

        return {
          ...share,
          user,
        };
      })
    );

    res.json(sharesWithUsers);
  } catch (error) {
    console.error("Error getting shares:", error);
    res.status(500).json({ error: "Failed to get shares" });
  }
});

/**
 * DELETE /api/sharing/:shareId
 * Remove a share
 */
router.delete("/:shareId", async (req: AuthRequest, res: Response) => {
  try {
    const { shareId } = req.params;
    const userId = req.user?.userId;

    // Verify ownership
    const { data: share } = await supabase
      .from("document_shares")
      .select("*")
      .eq("id", shareId)
      .eq("owner_id", userId)
      .single();

    if (!share) {
      return res.status(404).json({ error: "Share not found" });
    }

    // Delete share
    await supabase.from("document_shares").delete().eq("id", shareId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing share:", error);
    res.status(500).json({ error: "Failed to remove share" });
  }
});

/**
 * PUT /api/sharing/:shareId/permission
 * Update share permission
 */
router.put("/:shareId/permission", async (req: AuthRequest, res: Response) => {
  try {
    const { shareId } = req.params;
    const { permission } = req.body;
    const userId = req.user?.userId;

    if (!["view", "edit"].includes(permission)) {
      return res.status(400).json({ error: "Invalid permission type" });
    }

    // Verify ownership
    const { data: share } = await supabase
      .from("document_shares")
      .select("*")
      .eq("id", shareId)
      .eq("owner_id", userId)
      .single();

    if (!share) {
      return res.status(404).json({ error: "Share not found" });
    }

    // Update permission
    const { data: updated } = await supabase
      .from("document_shares")
      .update({ permission, updated_at: new Date().toISOString() })
      .eq("id", shareId)
      .select()
      .single();

    res.json(updated);
  } catch (error) {
    console.error("Error updating permission:", error);
    res.status(500).json({ error: "Failed to update permission" });
  }
});

/**
 * GET /api/sharing/shared-with-me
 * Get all documents shared with the current user
 */
router.get("/shared-with-me", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get all shares
    const { data: shares } = await supabase
      .from("document_shares")
      .select("*")
      .eq("shared_with_user_id", userId);

    // Get document details for each share
    const sharedDocuments = await Promise.all(
      (shares || []).map(async (share) => {
        const { data: document } = await supabase
          .from("documents")
          .select("*")
          .eq("id", share.document_id)
          .single();

        const { data: owner } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("id", share.owner_id)
          .single();

        // Get flashcards if user has edit permission
        let flashcards = null;
        if (share.permission === "edit" || true) {
          const { data: cards } = await supabase
            .from("flashcards")
            .select("*")
            .eq("documentId", share.document_id);
          flashcards = cards;
        }

        return {
          ...document,
          flashcards,
          sharedBy: owner,
          permission: share.permission,
          sharedAt: share.shared_at,
        };
      })
    );

    res.json(sharedDocuments);
  } catch (error) {
    console.error("Error getting shared documents:", error);
    res.status(500).json({ error: "Failed to get shared documents" });
  }
});

/**
 * POST /api/sharing/link
 * Generate a shareable link for a document
 * 
 * @body documentId - Document to share
 * @body permission - 'view' or 'edit'
 * @body expiresInDays - Number of days until expiration (optional)
 */
router.post("/link", async (req: AuthRequest, res: Response) => {
  try {
    const { documentId, permission, expiresInDays } = req.body;
    const ownerId = req.user?.userId;

    if (!documentId || !permission) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["view", "edit"].includes(permission)) {
      return res.status(400).json({ error: "Invalid permission type" });
    }

    // Verify ownership
    const { data: document } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("userId", ownerId)
      .single();

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Generate unique token
    const shareToken = cuid();
    const linkId = cuid();

    // Calculate expiration
    let expiresAt = null;
    if (expiresInDays) {
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + expiresInDays);
      expiresAt = expiration.toISOString();
    }

    // Create share link
    const { data: shareLink, error } = await supabase
      .from("share_links")
      .insert({
        id: linkId,
        document_id: documentId,
        owner_id: ownerId,
        share_token: shareToken,
        permission,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        is_active: true,
        access_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating share link:", error);
      return res.status(500).json({ error: "Failed to create share link" });
    }

    res.json({
      success: true,
      link: shareLink,
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/shared/${shareToken}`,
    });
  } catch (error) {
    console.error("Error in link endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/sharing/links/:documentId
 * Get all share links for a document
 */
router.get("/links/:documentId", async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.userId;

    // Verify ownership
    const { data: document } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("userId", userId)
      .single();

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Get all share links
    const { data: links } = await supabase
      .from("share_links")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });

    const linksWithUrls = (links || []).map((link) => ({
      ...link,
      url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/shared/${link.share_token}`,
    }));

    res.json(linksWithUrls);
  } catch (error) {
    console.error("Error getting share links:", error);
    res.status(500).json({ error: "Failed to get share links" });
  }
});

/**
 * DELETE /api/sharing/link/:linkId
 * Deactivate a share link
 */
router.delete("/link/:linkId", async (req: AuthRequest, res: Response) => {
  try {
    const { linkId } = req.params;
    const userId = req.user?.userId;

    // Verify ownership
    const { data: link } = await supabase
      .from("share_links")
      .select("*")
      .eq("id", linkId)
      .eq("owner_id", userId)
      .single();

    if (!link) {
      return res.status(404).json({ error: "Share link not found" });
    }

    // Deactivate link
    await supabase
      .from("share_links")
      .update({ is_active: false })
      .eq("id", linkId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deactivating link:", error);
    res.status(500).json({ error: "Failed to deactivate link" });
  }
});

/**
 * GET /api/sharing/public/:token
 * Access a document via share token (no auth required)
 */
router.get("/public/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find share link
    const { data: link } = await supabase
      .from("share_links")
      .select("*")
      .eq("share_token", token)
      .eq("is_active", true)
      .single();

    if (!link) {
      return res.status(404).json({ error: "Share link not found or expired" });
    }

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ error: "Share link has expired" });
    }

    // Get document
    const { data: document } = await supabase
      .from("documents")
      .select("*")
      .eq("id", link.document_id)
      .single();

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Get flashcards
    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("*")
      .eq("documentId", link.document_id);

    // Increment access count
    await supabase
      .from("share_links")
      .update({
        access_count: link.access_count + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq("id", link.id);

    res.json({
      document: {
        ...document,
        flashcards,
      },
      permission: link.permission,
      sharedAt: link.created_at,
    });
  } catch (error) {
    console.error("Error accessing shared document:", error);
    res.status(500).json({ error: "Failed to access shared document" });
  }
});

export default router;
