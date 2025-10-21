/**
 * AI Providers API Routes
 * 
 * Endpoints for managing AI provider selection and configuration:
 * - GET / - Get list of available providers
 * - GET /test/:provider - Test a specific provider
 * 
 * @module routes/ai-providers
 */

import { Router, Request, Response } from "express";
import { AIProviderFactory } from "../lib/ai-providers";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * GET /api/ai-providers
 * Get list of available AI providers and their models
 * 
 * Returns information about:
 * - Provider ID and name
 * - Available models for each provider
 * - Whether API key is configured
 * 
 * @returns {Array} List of available providers
 */
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const providers = AIProviderFactory.getAvailableProviders();
    res.json(providers);
  } catch (error) {
    console.error("Error getting providers:", error);
    res.status(500).json({ 
      error: "Failed to get providers",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/ai-providers/test/:provider
 * Test a specific AI provider with a simple prompt
 * 
 * @param provider - The provider to test ('gemini', 'openai', 'claude')
 * @query model - Optional specific model to test
 * 
 * @returns {Object} Test results with response time and sample output
 */
router.get("/test/:provider", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { model } = req.query;

    const testContent = "The Earth revolves around the Sun once per year.";
    
    const startTime = Date.now();
    const aiProvider = AIProviderFactory.create(provider, model as string);
    const summary = await aiProvider.generateSummary(testContent);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      provider: aiProvider.getName(),
      model: aiProvider.getModel(),
      responseTime,
      testOutput: summary,
    });
  } catch (error) {
    console.error("Error testing provider:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test provider",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
