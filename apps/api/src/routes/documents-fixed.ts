import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authenticateToken, AuthRequest } from '../lib/auth';
import { generateSummary, generateFlashcards } from '../lib/ai';
import cuid from 'cuid';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all documents for authenticated user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    // Get documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select(`
        *,
        flashcards (*)
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (docsError) throw docsError;

    res.json(documents || []);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get a single document
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const { data: document, error } = await supabase
      .from('documents')
      .select(`
        *,
        flashcards (*)
      `)
      .eq('id', id)
      .eq('userId', userId)
      .single();

    if (error || !document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Create a new document with AI-generated summary and flashcards
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user?.userId;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Generate AI content in parallel
    const [summary, flashcardData] = await Promise.all([
      generateSummary(content),
      generateFlashcards(content),
    ]);

    // Generate unique IDs
    const documentId = cuid();

    // Create document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        title,
        content,
        summary,
        userId: userId,
      })
      .select()
      .single();

    if (docError) throw docError;

    // Create flashcards
    if (flashcardData.length > 0) {
      const flashcardsToInsert = flashcardData.map((fc) => ({
        id: cuid(),  // Generate ID for each flashcard
        documentId: document.id,
        question: fc.question,
        answer: fc.answer,
      }));

      const { data: flashcards, error: flashcardsError } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert)
        .select();

      if (flashcardsError) {
        console.error('Error creating flashcards:', flashcardsError);
      } else {
        document.flashcards = flashcards;
      }
    }

    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document with AI processing' });
  }
});

// Update a document
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary } = req.body;
    const userId = req.user?.userId;

    // Check if document exists and belongs to user
    const { data: existingDocument, error: checkError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('userId', userId)
      .single();

    if (checkError || !existingDocument) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Update document
    const { data: document, error: updateError } = await supabase
      .from('documents')
      .update({
        title: title || existingDocument.title,
        content: content || existingDocument.content,
        summary: summary !== undefined ? summary : existingDocument.summary,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete a document
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Check if document exists and belongs to user
    const { data: existingDocument, error: checkError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('userId', userId)
      .single();

    if (checkError || !existingDocument) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete flashcards first (cascade delete)
    await supabase
      .from('flashcards')
      .delete()
      .eq('documentId', id);

    // Delete document
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
