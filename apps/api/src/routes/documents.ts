import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authenticateToken, AuthRequest } from '../lib/auth';
import { generateSummary, generateFlashcards } from '../lib/ai';
import { storeDocumentVector, searchSimilarDocuments, updateDocumentVector, deleteDocumentVector } from '../lib/pinecone';
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

    res.json({ documents: documents || [] });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Search documents using semantic similarity (MUST be before /:id route)
router.get('/search', async (req: AuthRequest, res) => {
  try {
    const { query } = req.query;
    const userId = req.user?.userId;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Search for similar documents using Pinecone
    const vectorResults = await searchSimilarDocuments(query, userId);

    if (vectorResults.length === 0) {
      return res.json({ results: [] });
    }

    // Fetch full document details from database
    const documentIds = vectorResults.map((r) => r.documentId).filter(Boolean);
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select(`
        *,
        flashcards (*)
      `)
      .in('id', documentIds)
      .eq('userId', userId);

    if (dbError) throw dbError;

    // Combine vector results with full document data
    const enhancedResults = vectorResults.map((vectorResult) => {
      const fullDocument = documents?.find((doc) => doc.id === vectorResult.documentId);
      return {
        ...vectorResult,
        document: fullDocument,
      };
    });

    res.json({ results: enhancedResults });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
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

    res.json({ document });
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

    // Generate AI content in parallel (optional - fallback if it fails)
    let summary = null;
    let flashcardData: Array<{ question: string; answer: string }> = [];
    
    try {
      [summary, flashcardData] = await Promise.all([
        generateSummary(content),
        generateFlashcards(content),
      ]);
    } catch (aiError) {
      console.error('AI generation failed (continuing without AI features):', aiError instanceof Error ? aiError.message : aiError);
      // Continue without AI - document will still be created
    }

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

    // Store document vector in Pinecone (async, don't block response)
    storeDocumentVector(document.id, userId, content, title)
      .catch((error) => console.error('Vector storage error:', error));

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
    const { title, content } = req.body;
    const userId = req.user?.userId;

    console.log(`📥 PUT /api/documents/${id} - Body:`, { title, content: content?.substring(0, 50) + '...' });

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

    // Regenerate AI content if content changed
    let summary = existingDocument.summary;
    const contentChanged = content && content !== existingDocument.content;

    if (contentChanged) {
      try {
        console.log('🤖 Regenerating AI summary for updated content...');
        summary = await generateSummary(content);
      } catch (aiError: any) {
        console.error('AI generation failed (continuing without AI features):', aiError.message);
        summary = null;
      }
    }

    // Update document
    const { data: document, error: updateError } = await supabase
      .from('documents')
      .update({
        title: title || existingDocument.title,
        content: content || existingDocument.content,
        summary: summary,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Regenerate flashcards if content changed
    if (contentChanged) {
      try {
        console.log('🤖 Regenerating AI flashcards for updated content...');
        
        // Delete old flashcards
        await supabase
          .from('flashcards')
          .delete()
          .eq('documentId', id);

        // Generate new flashcards
        const flashcardData = await generateFlashcards(content);
        
        if (flashcardData && flashcardData.length > 0) {
          const flashcardsToInsert = flashcardData.map((fc: { question: string; answer: string }) => ({
            id: cuid(),
            documentId: id,
            question: fc.question,
            answer: fc.answer,
            createdAt: new Date().toISOString(),
          }));

          await supabase
            .from('flashcards')
            .insert(flashcardsToInsert);
        }
      } catch (aiError: any) {
        console.error('Flashcard generation failed:', aiError.message);
      }
    }

    // Fetch updated document with flashcards
    const { data: updatedDocument, error: fetchError } = await supabase
      .from('documents')
      .select(`
        *,
        flashcards (*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Update vector in Pinecone if content changed (async, don't block response)
    if (contentChanged) {
      updateDocumentVector(id, userId!, content, title || existingDocument.title)
        .catch((error) => console.error('Vector update error:', error));
    }

    res.json({ document: updatedDocument });
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

    // Delete vector from Pinecone (async, don't block response)
    deleteDocumentVector(id)
      .catch((error) => console.error('Vector deletion error:', error));

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
