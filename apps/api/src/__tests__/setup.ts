/**
 * Test Setup for API
 * 
 * Global setup and teardown for Jest tests
 */

import '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
export const mockPrismaClient = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  document: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  flashcard: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  review: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  sharedDocument: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting API tests...');
});

// Global test teardown
afterAll(() => {
  console.log('✅ API tests completed!');
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
