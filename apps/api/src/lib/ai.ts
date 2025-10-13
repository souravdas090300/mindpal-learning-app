/**
 * AI Integration Module - Google Gemini
 * 
 * This module provides AI-powered features using Google's Gemini API:
 * - Text summarization (streaming and non-streaming)
 * - Educational flashcard generation
 * - Spaced repetition scheduling (SM-2 algorithm)
 * 
 * Model Used: gemini-2.5-flash
 * - Fast response times
 * - High quality output
 * - Free tier available
 * - Supports streaming responses
 * 
 * @requires GOOGLE_API_KEY environment variable
 * @see https://ai.google.dev/
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Verify API key is loaded from environment
console.log('🔑 Gemini API Key loaded:', process.env.GOOGLE_API_KEY ? 'YES ✅' : 'NO ❌');

/**
 * Initialize Google Gemini AI client
 * Uses the FREE tier API key from environment variables
 */
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

/**
 * Initialize the Gemini model
 * Model: gemini-2.5-flash
 * - Stable and production-ready
 * - Fast inference times
 * - Cost-effective (free tier available)
 */
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
});

/**
 * Generate a concise summary of the given text
 * 
 * This function uses Google Gemini AI to create a 2-3 sentence summary
 * that captures the main ideas and key points of the input content.
 * 
 * @param {string} content - The text content to summarize
 * @returns {Promise<string>} A concise summary of the content
 * @throws {Error} If the AI API call fails
 * 
 * @example
 * const summary = await generateSummary("Long article text here...");
 * console.log(summary); // "This article discusses..."
 */
export async function generateSummary(content: string): Promise<string> {
  const prompt = `Please provide a concise summary of the following text. Focus on the key points and main ideas in 2-3 sentences:
    
${content}

SUMMARY:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

/**
 * Generate summary with real-time streaming support
 * 
 * This function uses Server-Sent Events (SSE) to stream the AI-generated
 * summary character-by-character as it's being generated. This provides
 * a better user experience with live "typing" animation.
 * 
 * Unlike generateSummary(), this returns an async generator that yields
 * text chunks as they arrive from the AI model.
 * 
 * @param {string} content - The text content to summarize
 * @yields {string} Chunks of the summary text as they're generated
 * @returns {AsyncGenerator<string>} An async generator of text chunks
 * @throws {Error} If the AI streaming fails
 * 
 * @example
 * for await (const chunk of generateSummaryStream(content)) {
 *   process.stdout.write(chunk); // Print each chunk as it arrives
 * }
 */
export async function* generateSummaryStream(content: string): AsyncGenerator<string> {
  const prompt = `Please provide a concise summary of the following text. Focus on the key points and main ideas in 2-3 sentences:
    
${content}

SUMMARY:`;

  const result = await model.generateContentStream(prompt);
  
  for await (const chunk of result.stream) {
    const text = chunk.text();
    yield text;
  }
}

/**
 * Generate educational flashcards from the given text
 * 
 * Uses AI to analyze the content and create 3-5 meaningful flashcards
 * for study purposes. Each flashcard contains a question and a concise answer.
 * 
 * The AI is instructed to:
 * - Focus on key concepts and important facts
 * - Create clear, educational questions
 * - Provide concise, accurate answers
 * - Return results in JSON format
 * 
 * Fallback: If AI generation or JSON parsing fails, returns 2 generic
 * flashcards based on a text summary.
 * 
 * @param {string} content - The educational content to generate flashcards from
 * @returns {Promise<Array<{question: string, answer: string}>>} Array of flashcard objects
 * @throws {Error} If both AI generation and fallback fail
 * 
 * @example
 * const flashcards = await generateFlashcards("The Earth revolves around the Sun...");
 * // Returns: [{question: "What does the Earth revolve around?", answer: "The Sun"}]
 */
export async function generateFlashcards(
  content: string
): Promise<Array<{ question: string; answer: string }>> {
  const prompt = `Based on the following text, generate 3-5 educational flashcards with clear questions and concise answers. 
Format your response as a valid JSON array like this:
[{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}]

TEXT: ${content}

FLASHCARDS (JSON only, no extra text):`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    // Clean the response to get only the JSON part
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const flashcards = JSON.parse(jsonMatch[0]);
      return flashcards.slice(0, 5); // Limit to 5 flashcards
    }
  } catch (error) {
    console.error("Failed to parse flashcards JSON:", error);
  }

  // Fallback flashcards if parsing fails
  const summary = await generateSummary(content);
  return [
    {
      question: "What is the main topic of this content?",
      answer: summary,
    },
    {
      question: "What are the key points covered?",
      answer: "Key points from the provided content.",
    },
  ];
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
