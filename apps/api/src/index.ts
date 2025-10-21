/**
 * MindPal Learning App - API Server
 * 
 * Main entry point for the Express.js backend server.
 * This server provides REST API endpoints for:
 * - User authentication (signup, login)
 * - Document management (CRUD operations)
 * - AI-powered document summarization
 * - Flashcard generation and study features
 * - Real-time streaming of AI-generated content
 * 
 * Technology Stack:
 * - Express.js - Web framework
 * - Supabase - PostgreSQL database
 * - Google Gemini AI - AI content generation
 * - JWT - Authentication
 * 
 * @author Sourav Das
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passport from './lib/passport';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import documentStreamRoutes from './routes/documents-stream';
import flashcardRoutes from './routes/flashcards';
import reviewRoutes from './routes/reviews';
import testAIRoutes from './routes/test-ai';
import aiProviderRoutes from './routes/ai-providers';
import analyticsRoutes from './routes/analytics';
import sharingRoutes from './routes/sharing';
import googleAuthRoutes from './routes/google-auth';
import { prisma } from './lib/prisma';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

/**
 * Helmet - Security middleware
 * Adds various HTTP headers to protect against common vulnerabilities
 */
app.use(helmet());

/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * Allows the frontend (Next.js) and mobile app (React Native) to communicate with the API
 * 
 * Supported origins:
 * - Local development servers (localhost:3000, 3001, 3002)
 * - Expo development servers (localhost:19000, 8081)
 * - LAN development (192.168.x.x for mobile testing)
 * - Production Vercel deployments
 * - Expo published apps
 */
const allowedOrigins = [
  'http://localhost:3000',           // Next.js dev
  'http://localhost:3001',           // API dev
  'http://localhost:19000',          // Expo dev server
  'http://localhost:19006',          // Expo web
  'http://localhost:8081',           // Metro bundler
  'exp://localhost:19000',           // Expo dev (exp protocol)
  /^exp:\/\/192\.168\.\d+\.\d+:19000$/,  // Expo LAN (exp protocol)
  /^http:\/\/192\.168\.\d+\.\d+:19000$/,  // Expo LAN (http)
  /^http:\/\/192\.168\.\d+\.\d+:8081$/,   // Metro bundler LAN
  /^https:\/\/.*\.vercel\.app$/,    // All Vercel deployments
  /^https:\/\/mindpal.*\.vercel\.app$/, // MindPal Vercel apps
  /^exp:\/\/.*\.expo\.dev$/,        // Expo development
  /^https:\/\/.*\.expo\.dev$/,      // Expo development (https)
];

app.use(cors({
  origin: function (origin, callback) {
    /**
     * Allow requests with no origin
     * This is necessary for:
     * - Mobile applications (React Native)
     * - Development tools (Postman, curl)
     * - Server-to-server requests
     */
    if (!origin) return callback(null, true);
    
    /**
     * Check if the request origin matches any allowed pattern
     * Supports both exact string matching and regex patterns
     */
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('⚠️  Blocked by CORS:', origin);
      callback(null, false); // Reject but don't throw error
    }
  },
  credentials: true, // Allow cookies and authentication headers
}));

/**
 * JSON body parser
 * Limit set to 10MB to support large document content
 */
app.use(express.json({ limit: '10mb' }));

/**
 * Initialize Passport.js for authentication
 */
app.use(passport.initialize());

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, and truncated body
 * Useful for debugging and monitoring API usage
 */
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, req.body ? `- Body: ${JSON.stringify(req.body).substring(0, 100)}` : '');
  next();
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Verifies that the API server and database are operational.
 * Used by monitoring tools and deployment platforms to check service health.
 * 
 * @returns {Object} status - OK or ERROR
 * @returns {string} timestamp - ISO timestamp of the check
 * @returns {string} database - Connection status (Connected/Disconnected)
 */
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Test Endpoint
 * GET /api/test
 * 
 * Simple endpoint to verify the API is running.
 * Returns a static JSON response.
 */
app.get('/api/test', (req, res) => {
  res.json({ message: 'MindPal API is running!' });
});

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * Authentication Routes (/api/auth)
 * - POST /signup - Register new user
 * - POST /login - Authenticate user
 * - GET /google - Initiate Google OAuth
 * - GET /google/callback - Google OAuth callback
 * - GET /google/url - Get Google OAuth URL for mobile
 */
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);

/**
 * Document Routes (/api/documents)
 * - GET / - Get all user documents
 * - POST / - Create new document
 * - GET /:id - Get single document
 * - PUT /:id - Update document
 * - DELETE /:id - Delete document
 */
app.use('/api/documents', documentRoutes);

/**
 * Document Streaming Routes (/api/documents-stream)
 * - POST /stream - Create document with real-time AI streaming
 * Uses Server-Sent Events (SSE) for live updates
 */
app.use('/api/documents-stream', documentStreamRoutes);

/**
 * Review Routes (/api/reviews)
 * - GET /due - Get flashcards due for review
 * - POST /:flashcardId - Submit a review with quality rating
 * - GET /stats - Get user's review statistics
 * - GET /history - Get review history
 * Implements SM-2 spaced repetition algorithm
 */
app.use('/api/reviews', reviewRoutes);

/**
 * Flashcard Routes (/api/flashcards)
 * - GET /document/:documentId - Get flashcards for a document
 */
app.use('/api/flashcards', flashcardRoutes);

/**
 * AI Provider Routes (/api/ai-providers)
 * - GET / - Get list of available AI providers
 * - GET /test/:provider - Test a specific provider
 */
app.use('/api/ai-providers', aiProviderRoutes);

/**
 * Analytics Routes (/api/analytics)
 * - GET /overview - Overall statistics
 * - GET /study-time - Study time by day
 * - GET /mastery-progress - Mastery level distribution
 * - GET /activity-heatmap - Activity heatmap data
 * - GET /performance - Performance metrics
 * - GET /streak - Streak information
 */
app.use('/api/analytics', analyticsRoutes);

/**
 * Sharing Routes (/api/sharing)
 * - POST /share - Share document with user
 * - GET /document/:documentId - Get shares for document
 * - DELETE /:shareId - Remove share
 * - PUT /:shareId/permission - Update permission
 * - GET /shared-with-me - Get documents shared with me
 * - POST /link - Generate shareable link
 * - GET /links/:documentId - Get share links for document
 * - DELETE /link/:linkId - Deactivate share link
 * - GET /public/:token - Access document via share link (no auth)
 */
app.use('/api/sharing', sharingRoutes);

app.use('/api/test-ai', testAIRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API URL: http://localhost:${PORT}`);
  console.log(`� Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
