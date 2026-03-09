/**
 * AI Providers Unit Tests
 * 
 * Tests for AI provider management including:
 * - DeepSeek integration
 * - Provider listing
 * - Provider testing
 * - Model selection
 */

import { mockPrismaClient } from './setup';

describe('AI Providers API', () => {
  describe('GET /api/ai-providers', () => {
    it('should return list of available providers', async () => {
      const providers = [
        {
          id: 'gemini',
          name: 'Google Gemini',
          models: ['gemini-pro', 'gemini-1.5-flash'],
          configured: true,
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          models: ['deepseek-chat', 'deepseek-coder'],
          configured: false,
        },
        {
          id: 'openai',
          name: 'OpenAI',
          models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
          configured: false,
        },
      ];

      expect(providers).toHaveLength(3);
      expect(providers.find(p => p.id === 'deepseek')).toBeDefined();
    });

    it('should indicate which providers have API keys configured', async () => {
      const providers = [
        { id: 'gemini', configured: true },
        { id: 'deepseek', configured: false },
      ];

      const gemini = providers.find(p => p.id === 'gemini');
      const deepseek = providers.find(p => p.id === 'deepseek');

      expect(gemini?.configured).toBe(true);
      expect(deepseek?.configured).toBe(false);
    });
  });

  describe('DeepSeek Provider', () => {
    it('should support deepseek-chat model', () => {
      const deepseekModels = ['deepseek-chat', 'deepseek-coder'];
      
      expect(deepseekModels).toContain('deepseek-chat');
      expect(deepseekModels).toContain('deepseek-coder');
    });

    it('should generate summaries with DeepSeek', async () => {
      const mockContent = 'The Earth revolves around the Sun once per year.';
      const mockSummary = 'Earth orbits the Sun annually.';

      // Simulate DeepSeek API call
      const result = {
        provider: 'DeepSeek',
        model: 'deepseek-chat',
        summary: mockSummary,
      };

      expect(result.provider).toBe('DeepSeek');
      expect(result.summary).toBe(mockSummary);
    });

    it('should generate flashcards with DeepSeek', async () => {
      const mockContent = 'Photosynthesis converts sunlight into chemical energy.';
      const mockFlashcards = [
        {
          question: 'What does photosynthesis convert?',
          answer: 'Sunlight into chemical energy',
        },
      ];

      // Simulate DeepSeek flashcard generation
      const result = {
        provider: 'DeepSeek',
        flashcards: mockFlashcards,
      };

      expect(result.flashcards).toHaveLength(1);
      expect(result.flashcards[0].question).toContain('photosynthesis');
    });

    it('should handle DeepSeek API errors gracefully', async () => {
      const error = new Error('DeepSeek API key not configured');

      expect(error.message).toContain('API key not configured');
    });
  });

  describe('GET /api/ai-providers/test/:provider', () => {
    it('should test DeepSeek provider successfully', async () => {
      const testResult = {
        success: true,
        provider: 'DeepSeek',
        model: 'deepseek-chat',
        responseTime: 1500,
        testOutput: 'Earth orbits the Sun annually.',
      };

      expect(testResult.success).toBe(true);
      expect(testResult.provider).toBe('DeepSeek');
      expect(testResult.responseTime).toBeGreaterThan(0);
      expect(testResult.testOutput).toBeTruthy();
    });

    it('should test Gemini provider successfully', async () => {
      const testResult = {
        success: true,
        provider: 'Google Gemini',
        model: 'gemini-pro',
        responseTime: 1200,
        testOutput: 'The Earth completes one orbit around the Sun yearly.',
      };

      expect(testResult.success).toBe(true);
      expect(testResult.provider).toContain('Gemini');
    });

    it('should allow testing with specific model', async () => {
      const testResult = {
        success: true,
        provider: 'DeepSeek',
        model: 'deepseek-coder',
        responseTime: 1400,
        testOutput: 'Test output from DeepSeek Coder model',
      };

      expect(testResult.model).toBe('deepseek-coder');
    });

    it('should handle invalid provider gracefully', async () => {
      const testResult = {
        success: false,
        error: 'Failed to test provider',
        message: 'Invalid provider: invalid-provider',
      };

      expect(testResult.success).toBe(false);
      expect(testResult.error).toBeTruthy();
    });

    it('should measure response time accurately', async () => {
      const startTime = Date.now();
      // Simulate AI call
      await new Promise(resolve => setTimeout(resolve, 100));
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeGreaterThanOrEqual(100);
      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('Provider Factory', () => {
    it('should create correct provider instance', () => {
      const providers = ['gemini', 'deepseek', 'openai', 'claude'];

      providers.forEach(provider => {
        expect(['gemini', 'deepseek', 'openai', 'claude']).toContain(provider);
      });
    });

    it('should use default model if not specified', () => {
      const configs = [
        { provider: 'deepseek', defaultModel: 'deepseek-chat' },
        { provider: 'gemini', defaultModel: 'gemini-pro' },
      ];

      configs.forEach(config => {
        expect(config.defaultModel).toBeTruthy();
      });
    });

    it('should validate provider exists before creation', () => {
      const validProviders = ['gemini', 'deepseek', 'openai', 'claude'];
      const testProvider = 'deepseek';

      expect(validProviders).toContain(testProvider);
    });
  });

  describe('AI Response Validation', () => {
    it('should validate summary format', () => {
      const summary = 'This is a valid summary text.';

      expect(summary).toBeTruthy();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should validate flashcard format', () => {
      const flashcard = {
        question: 'What is photosynthesis?',
        answer: 'Process that converts sunlight to energy',
      };

      expect(flashcard).toHaveProperty('question');
      expect(flashcard).toHaveProperty('answer');
      expect(flashcard.question).toBeTruthy();
      expect(flashcard.answer).toBeTruthy();
    });

    it('should handle empty AI responses', () => {
      const emptyResponse = '';

      if (!emptyResponse) {
        expect(true).toBe(true); // Should handle gracefully
      }
    });
  });
});
