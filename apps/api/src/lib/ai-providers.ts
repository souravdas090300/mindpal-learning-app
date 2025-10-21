/**
 * AI Provider Abstraction Layer
 * 
 * This module provides a unified interface for multiple AI providers:
 * - Google Gemini (gemini-2.5-flash) - Default, free tier
 * - OpenAI (GPT-4, GPT-3.5-turbo) - Paid, high quality
 * - Anthropic Claude (claude-3-5-sonnet) - Paid, nuanced responses
 * 
 * Each provider implements the same interface for:
 * - Text summarization (streaming and non-streaming)
 * - Educational flashcard generation
 * 
 * Usage:
 * ```typescript
 * const provider = AIProviderFactory.create('openai', 'gpt-4');
 * const summary = await provider.generateSummary(content);
 * ```
 * 
 * @requires GOOGLE_API_KEY environment variable for Gemini
 * @requires OPENAI_API_KEY environment variable for OpenAI
 * @requires ANTHROPIC_API_KEY environment variable for Claude
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Base interface that all AI providers must implement
 */
export interface AIProvider {
  /**
   * Generate a concise summary of the given text
   * @param content - The text content to summarize
   * @returns A concise summary (2-3 sentences)
   */
  generateSummary(content: string): Promise<string>;

  /**
   * Generate summary with real-time streaming
   * @param content - The text content to summarize
   * @yields Chunks of the summary text as they're generated
   */
  generateSummaryStream(content: string): AsyncGenerator<string>;

  /**
   * Generate educational flashcards from the given text
   * @param content - The educational content to generate flashcards from
   * @returns Array of flashcard objects with question and answer
   */
  generateFlashcards(
    content: string
  ): Promise<Array<{ question: string; answer: string }>>;

  /**
   * Get the name of this provider
   */
  getName(): string;

  /**
   * Get the model being used
   */
  getModel(): string;
}

/**
 * Google Gemini AI Provider
 * Model: gemini-2.5-flash
 * - Fast response times
 * - Free tier available
 * - Excellent for educational content
 */
export class GeminiProvider implements AIProvider {
  private model: any;
  private modelName: string;

  constructor(modelName: string = "gemini-2.5-flash") {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY environment variable is not set");
    }
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = genAI.getGenerativeModel({ model: modelName });
    this.modelName = modelName;
    console.log(`✅ Gemini Provider initialized: ${modelName}`);
  }

  getName(): string {
    return "Google Gemini";
  }

  getModel(): string {
    return this.modelName;
  }

  async generateSummary(content: string): Promise<string> {
    const prompt = `Please provide a concise summary of the following text. Focus on the key points and main ideas in 2-3 sentences:
    
${content}

SUMMARY:`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }

  async *generateSummaryStream(content: string): AsyncGenerator<string> {
    const prompt = `Please provide a concise summary of the following text. Focus on the key points and main ideas in 2-3 sentences:
    
${content}

SUMMARY:`;

    const result = await this.model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      yield text;
    }
  }

  async generateFlashcards(
    content: string
  ): Promise<Array<{ question: string; answer: string }>> {
    const prompt = `Based on the following text, generate 3-5 educational flashcards with clear questions and concise answers. 
Format your response as a valid JSON array like this:
[{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}]

TEXT: ${content}

FLASHCARDS (JSON only, no extra text):`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const flashcards = JSON.parse(jsonMatch[0]);
        return flashcards.slice(0, 5);
      }
    } catch (error) {
      console.error("Failed to parse flashcards JSON:", error);
    }

    // Fallback
    const summary = await this.generateSummary(content);
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
}

/**
 * OpenAI Provider
 * Models: GPT-4, GPT-3.5-turbo
 * - High quality responses
 * - Excellent for complex content
 * - Requires API key (paid)
 */
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private modelName: string;

  constructor(modelName: string = "gpt-4o-mini") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.modelName = modelName;
    console.log(`✅ OpenAI Provider initialized: ${modelName}`);
  }

  getName(): string {
    return "OpenAI";
  }

  getModel(): string {
    return this.modelName;
  }

  async generateSummary(content: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates concise summaries. Provide summaries in 2-3 sentences focusing on key points.",
        },
        {
          role: "user",
          content: `Please summarize the following text:\n\n${content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return completion.choices[0].message.content?.trim() || "";
  }

  async *generateSummaryStream(content: string): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates concise summaries. Provide summaries in 2-3 sentences focusing on key points.",
        },
        {
          role: "user",
          content: `Please summarize the following text:\n\n${content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        yield text;
      }
    }
  }

  async generateFlashcards(
    content: string
  ): Promise<Array<{ question: string; answer: string }>> {
    const completion = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        {
          role: "system",
          content:
            "You are an educational assistant that creates study flashcards. Always respond with valid JSON array format.",
        },
        {
          role: "user",
          content: `Based on the following text, generate 3-5 educational flashcards with clear questions and concise answers. 
Format your response as a valid JSON array like this:
[{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}]

TEXT: ${content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0].message.content || "";

    try {
      // Try to parse as JSON object first (OpenAI's JSON mode wraps in object)
      const parsed = JSON.parse(text);
      
      // If it's an object with a flashcards key, extract that
      if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
        return parsed.flashcards.slice(0, 5);
      }
      
      // If it's directly an array
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 5);
      }

      // Try to find array in the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const flashcards = JSON.parse(jsonMatch[0]);
        return flashcards.slice(0, 5);
      }
    } catch (error) {
      console.error("Failed to parse OpenAI flashcards:", error);
    }

    // Fallback
    const summary = await this.generateSummary(content);
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
}

/**
 * Anthropic Claude Provider
 * Model: claude-3-5-sonnet-20241022
 * - Nuanced, thoughtful responses
 * - Excellent for educational content
 * - Requires API key (paid)
 */
export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private modelName: string;

  constructor(modelName: string = "claude-3-5-sonnet-20241022") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.modelName = modelName;
    console.log(`✅ Claude Provider initialized: ${modelName}`);
  }

  getName(): string {
    return "Anthropic Claude";
  }

  getModel(): string {
    return this.modelName;
  }

  async generateSummary(content: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.modelName,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Please provide a concise summary of the following text in 2-3 sentences:\n\n${content}`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === "text");
    return textContent && "text" in textContent ? textContent.text.trim() : "";
  }

  async *generateSummaryStream(content: string): AsyncGenerator<string> {
    const stream = await this.client.messages.create({
      model: this.modelName,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Please provide a concise summary of the following text in 2-3 sentences:\n\n${content}`,
        },
      ],
      stream: true,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }

  async generateFlashcards(
    content: string
  ): Promise<Array<{ question: string; answer: string }>> {
    const message = await this.client.messages.create({
      model: this.modelName,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Based on the following text, generate 3-5 educational flashcards with clear questions and concise answers. 
Format your response as a valid JSON array like this:
[{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}]

TEXT: ${content}

Respond with ONLY the JSON array, no additional text.`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === "text");
    const text = textContent && "text" in textContent ? textContent.text : "";

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const flashcards = JSON.parse(jsonMatch[0]);
        return flashcards.slice(0, 5);
      }
    } catch (error) {
      console.error("Failed to parse Claude flashcards:", error);
    }

    // Fallback
    const summary = await this.generateSummary(content);
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
}

/**
 * Factory class to create AI provider instances
 */
export class AIProviderFactory {
  /**
   * Create an AI provider instance
   * @param provider - The provider name ('gemini', 'openai', 'claude')
   * @param model - Optional specific model name
   * @returns An instance of the requested AI provider
   */
  static create(provider: string, model?: string): AIProvider {
    switch (provider.toLowerCase()) {
      case "gemini":
      case "google":
        return new GeminiProvider(model || "gemini-2.5-flash");

      case "openai":
      case "gpt":
        return new OpenAIProvider(model || "gpt-4o-mini");

      case "claude":
      case "anthropic":
        return new ClaudeProvider(model || "claude-3-5-sonnet-20241022");

      default:
        console.warn(`Unknown provider: ${provider}, using Gemini as default`);
        return new GeminiProvider();
    }
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders(): Array<{
    id: string;
    name: string;
    models: string[];
    requiresKey: boolean;
  }> {
    return [
      {
        id: "gemini",
        name: "Google Gemini",
        models: ["gemini-2.5-flash", "gemini-pro"],
        requiresKey: !!process.env.GOOGLE_API_KEY,
      },
      {
        id: "openai",
        name: "OpenAI",
        models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
        requiresKey: !!process.env.OPENAI_API_KEY,
      },
      {
        id: "claude",
        name: "Anthropic Claude",
        models: [
          "claude-3-5-sonnet-20241022",
          "claude-3-opus-20240229",
          "claude-3-sonnet-20240229",
        ],
        requiresKey: !!process.env.ANTHROPIC_API_KEY,
      },
    ];
  }
}

/**
 * Default export: Gemini provider for backward compatibility
 */
export default new GeminiProvider();
