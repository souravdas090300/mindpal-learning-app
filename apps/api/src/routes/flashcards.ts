import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../lib/auth';
import { calculateNextReview } from '../lib/ai';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all flashcards due for review
router.get('/due', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    // Get all flashcards from user's documents that are due for review
    const flashcards = await prisma.flashcard.findMany({
      where: {
        document: { userId },
        nextReview: { lte: new Date() },
      },
      include: {
        document: { select: { id: true, title: true } },
      },
      orderBy: { nextReview: 'asc' },
    });

    res.json(flashcards);
  } catch (error) {
    console.error('Error fetching due flashcards:', error);
    res.status(500).json({ error: 'Failed to fetch due flashcards' });
  }
});

// Review a flashcard (submit quality rating)
router.post('/:id/review', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { quality } = req.body; // 0-5 scale
    const userId = req.user?.userId;

    if (quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({ error: 'Quality must be between 0 and 5' });
    }

    // Get flashcard and verify it belongs to user's document
    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id,
        document: { userId },
      },
    });

    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    // Calculate next review using SM-2 algorithm
    const { nextReview, newEaseFactor, newInterval } = calculateNextReview(
      quality,
      flashcard.easeFactor,
      flashcard.interval
    );

    // Update flashcard
    const updatedFlashcard = await prisma.flashcard.update({
      where: { id },
      data: {
        easeFactor: newEaseFactor,
        interval: newInterval,
        nextReview,
        reviewCount: flashcard.reviewCount + 1,
      },
    });

    res.json(updatedFlashcard);
  } catch (error) {
    console.error('Error reviewing flashcard:', error);
    res.status(500).json({ error: 'Failed to review flashcard' });
  }
});

// Get flashcards for a specific document
router.get('/document/:documentId', async (req: AuthRequest, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user?.userId;

    // Verify document belongs to user
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const flashcards = await prisma.flashcard.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(flashcards);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

export default router;
