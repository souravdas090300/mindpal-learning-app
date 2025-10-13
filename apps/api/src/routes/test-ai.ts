import { Router } from 'express';
import { generateSummary, generateFlashcards } from '../lib/ai';

const router = Router();

// Test AI endpoint - no authentication required for testing
router.post('/test-summary', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    console.log('🧪 Testing AI Summary Generation...');
    const summary = await generateSummary(content);
    console.log('✅ Summary generated:', summary);

    res.json({ 
      success: true,
      summary,
      message: 'AI is working!'
    });
  } catch (error) {
    console.error('❌ AI Test Failed:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

router.post('/test-flashcards', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    console.log('🧪 Testing AI Flashcard Generation...');
    const flashcards = await generateFlashcards(content);
    console.log('✅ Flashcards generated:', flashcards.length);

    res.json({ 
      success: true,
      flashcards,
      count: flashcards.length,
      message: 'AI is working!'
    });
  } catch (error) {
    console.error('❌ AI Test Failed:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

export default router;
