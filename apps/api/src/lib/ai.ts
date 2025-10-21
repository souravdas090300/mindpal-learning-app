/**
 * AI Integration Module - Multi-Provider Support
 * 
 * This module provides AI-powered features with support for multiple providers:
 * - Google Gemini (default, free tier)
 * - OpenAI (GPT-4, GPT-3.5-turbo)
 * - Anthropic Claude
 * 
 * Features:
 * - Text summarization (streaming and non-streaming)
 * - Educational flashcard generation
 * - Spaced repetition scheduling (SM-2 algorithm)
 * 
 * @requires GOOGLE_API_KEY environment variable for Gemini
 * @requires OPENAI_API_KEY environment variable for OpenAI
 * @requires ANTHROPIC_API_KEY environment variable for Claude
 */

import { AIProviderFactory, AIProvider, GeminiProvider } from "./ai-providers";

// Log available providers
console.log('🤖 AI Providers Status:');
console.log('  - Gemini:', process.env.GOOGLE_API_KEY ? '✅' : '❌');
console.log('  - OpenAI:', process.env.OPENAI_API_KEY ? '✅' : '❌');
console.log('  - Claude:', process.env.ANTHROPIC_API_KEY ? '✅' : '❌');

/**
 * Default AI provider (Gemini for backward compatibility)
 */
const defaultProvider: AIProvider = new GeminiProvider();

/**
 * Generate a concise summary of the given text
 * 
 * @param {string} content - The text content to summarize
 * @param {string} provider - The AI provider to use ('gemini', 'openai', 'claude')
 * @param {string} model - Optional specific model name
 * @returns {Promise<string>} A concise summary of the content
 * @throws {Error} If the AI API call fails
 */
export async function generateSummary(
  content: string,
  provider: string = "gemini",
  model?: string
): Promise<string> {
  const aiProvider = AIProviderFactory.create(provider, model);
  return await aiProvider.generateSummary(content);
}

/**
 * Generate summary with real-time streaming support
 * 
 * @param {string} content - The text content to summarize
 * @param {string} provider - The AI provider to use ('gemini', 'openai', 'claude')
 * @param {string} model - Optional specific model name
 * @yields {string} Chunks of the summary text as they're generated
 * @returns {AsyncGenerator<string>} An async generator of text chunks
 */
export async function* generateSummaryStream(
  content: string,
  provider: string = "gemini",
  model?: string
): AsyncGenerator<string> {
  const aiProvider = AIProviderFactory.create(provider, model);
  yield* aiProvider.generateSummaryStream(content);
}

/**
 * Generate educational flashcards from the given text
 * 
 * @param {string} content - The educational content to generate flashcards from
 * @param {string} provider - The AI provider to use ('gemini', 'openai', 'claude')
 * @param {string} model - Optional specific model name
 * @returns {Promise<Array<{question: string, answer: string}>>} Array of flashcard objects
 */
export async function generateFlashcards(
  content: string,
  provider: string = "gemini",
  model?: string
): Promise<Array<{ question: string; answer: string }>> {
  const aiProvider = AIProviderFactory.create(provider, model);
  return await aiProvider.generateFlashcards(content);
}

/**
 * Calculate next review date using SM-2 algorithm
 * Used for spaced repetition
 */
export function calculateNextReview(
  quality: number, // 0-5 rating of how well user remembered
  easeFactor: number,
  interval: number
): { nextReview: Date; newEaseFactor: number; newInterval: number } {
  // SM-2 Algorithm
  let newEaseFactor = easeFactor;
  let newInterval = interval;

  if (quality >= 3) {
    // Correct response
    if (interval === 0) {
      newInterval = 1;
    } else if (interval === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }

    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    // Incorrect response
    newInterval = 1;
  }

  // Ensure ease factor doesn't go below 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return { nextReview, newEaseFactor, newInterval };
}
