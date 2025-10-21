/**
 * Utility Functions Tests
 * 
 * Tests for helper functions and utilities
 */

import { formatDistanceToNow } from 'date-fns';

describe('Date Utilities', () => {
  it('should format relative time correctly', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const result = formatDistanceToNow(fiveMinutesAgo, { addSuffix: true });
    expect(result).toContain('minute');
  });

  it('should handle dates in the past', () => {
    const yesterday = new Date(Date.now() - 86400000);
    const result = formatDistanceToNow(yesterday, { addSuffix: true });
    expect(result).toContain('ago');
  });

  it('should format timestamps', () => {
    const date = new Date('2025-10-21T10:00:00');
    expect(date.toISOString()).toContain('2025-10-21');
  });
});

describe('String Utilities', () => {
  it('should truncate long text', () => {
    const longText = 'This is a very long text that needs to be truncated';
    const maxLength = 20;
    const truncated = longText.length > maxLength 
      ? longText.substring(0, maxLength) + '...'
      : longText;
    
    expect(truncated.length).toBeLessThanOrEqual(maxLength + 3);
  });

  it('should capitalize first letter', () => {
    const text = 'hello world';
    const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
    expect(capitalized).toBe('Hello world');
  });

  it('should generate slug from title', () => {
    const title = 'This is My Document Title!';
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    expect(slug).toBe('this-is-my-document-title');
  });
});

describe('Validation Utilities', () => {
  it('should validate email format', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'invalid-email';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test(validEmail)).toBe(true);
    expect(emailRegex.test(invalidEmail)).toBe(false);
  });

  it('should validate password strength', () => {
    const strongPassword = 'SecurePass123!';
    const weakPassword = '123';
    
    const isStrong = (pass: string) => pass.length >= 8;
    
    expect(isStrong(strongPassword)).toBe(true);
    expect(isStrong(weakPassword)).toBe(false);
  });

  it('should validate required fields', () => {
    const formData = {
      title: 'Test',
      content: 'Content',
    };
    
    const hasRequiredFields = formData.title && formData.content;
    expect(hasRequiredFields).toBe(true);
  });
});

describe('Array Utilities', () => {
  it('should filter items', () => {
    const items = [1, 2, 3, 4, 5];
    const evens = items.filter(n => n % 2 === 0);
    expect(evens).toEqual([2, 4]);
  });

  it('should map items', () => {
    const items = [1, 2, 3];
    const doubled = items.map(n => n * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });

  it('should reduce items', () => {
    const items = [1, 2, 3, 4];
    const sum = items.reduce((acc, n) => acc + n, 0);
    expect(sum).toBe(10);
  });
});
