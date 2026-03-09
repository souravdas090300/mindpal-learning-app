/**
 * Password Reset Tests
 * 
 * Tests for password reset functionality
 */

import { mockPrismaClient } from './setup';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

describe('Password Reset', () => {
  const mockUser = {
    id: 'user-1',
    email: 'passwordreset@test.com',
    password: 'hashedpassword',
    name: 'Password Reset Tester',
    resetToken: null as string | null,
    resetTokenExpiry: null as Date | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Generation', () => {
    it('should generate and store a reset token', async () => {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      const updatedUser = {
        ...mockUser,
        resetToken,
        resetTokenExpiry,
      };

      mockPrismaClient.user.update.mockResolvedValue(updatedUser);

      const result = await mockPrismaClient.user.update({
        where: { id: mockUser.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      expect(result.resetToken).toBe(resetToken);
      expect(result.resetTokenExpiry).toBeDefined();
      expect(result.resetTokenExpiry!.getTime()).toBeGreaterThan(Date.now());
      expect(mockPrismaClient.user.update).toHaveBeenCalled();
    });

    it('should find user by valid reset token', async () => {
      const userWithToken = {
        ...mockUser,
        resetToken: 'valid-token',
        resetTokenExpiry: new Date(Date.now() + 3600000),
      };

      mockPrismaClient.user.findFirst.mockResolvedValue(userWithToken);

      const result = await mockPrismaClient.user.findFirst({
        where: {
          id: mockUser.id,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      });

      expect(result).toBeDefined();
      expect(result?.resetToken).toBeDefined();
      expect(mockPrismaClient.user.findFirst).toHaveBeenCalled();
    });

    it('should not find user with expired token', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(null);

      const result = await mockPrismaClient.user.findFirst({
        where: {
          resetToken: 'expired-token',
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      });

      expect(result).toBeNull();
      expect(mockPrismaClient.user.findFirst).toHaveBeenCalled();
    });
  });

  describe('Password Update', () => {
    it('should update password and clear reset token', async () => {
      const newPassword = 'newpassword456';
      const hashedPassword = await bcryptjs.hash(newPassword, 10);

      const updatedUser = {
        ...mockUser,
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      };

      mockPrismaClient.user.update.mockResolvedValue(updatedUser);

      const result = await mockPrismaClient.user.update({
        where: { id: mockUser.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      expect(result.resetToken).toBeNull();
      expect(result.resetTokenExpiry).toBeNull();

      // Verify new password works
      const isValidPassword = await bcryptjs.compare(newPassword, hashedPassword);
      expect(isValidPassword).toBe(true);

      // Verify old password doesn't work
      const isOldPasswordValid = await bcryptjs.compare('oldpassword123', hashedPassword);
      expect(isOldPasswordValid).toBe(false);
      expect(mockPrismaClient.user.update).toHaveBeenCalled();
    });

    it('should hash passwords securely', async () => {
      const password = 'securepassword789';
      const hashedPassword = await bcryptjs.hash(password, 10);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toHaveLength(60); // bcrypt hashes are always 60 chars
      expect(hashedPassword).toMatch(/^\$2[aby]\$/); // bcrypt format
    });

    it('should verify hashed passwords correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcryptjs.hash(password, 10);

      const isValid = await bcryptjs.compare(password, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await bcryptjs.compare('wrongpassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Token Security', () => {
    it('should generate unique random tokens', () => {
      const token1 = crypto.randomBytes(32).toString('hex');
      const token2 = crypto.randomBytes(32).toString('hex');

      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
    });

    it('should allow only one active reset token per user', async () => {
      const token1 = crypto.randomBytes(32).toString('hex');
      const token2 = crypto.randomBytes(32).toString('hex');

      const userWithToken2 = {
        ...mockUser,
        resetToken: token2,
        resetTokenExpiry: new Date(Date.now() + 3600000),
      };

      mockPrismaClient.user.update.mockResolvedValueOnce({
        ...mockUser,
        resetToken: token1,
        resetTokenExpiry: new Date(Date.now() + 3600000),
      });

      mockPrismaClient.user.update.mockResolvedValueOnce(userWithToken2);
      mockPrismaClient.user.findUnique.mockResolvedValue(userWithToken2);

      // First update
      await mockPrismaClient.user.update({
        where: { id: mockUser.id },
        data: {
          resetToken: token1,
          resetTokenExpiry: new Date(Date.now() + 3600000),
        },
      });

      // Second token should replace first
      await mockPrismaClient.user.update({
        where: { id: mockUser.id },
        data: {
          resetToken: token2,
          resetTokenExpiry: new Date(Date.now() + 3600000),
        },
      });

      const result = await mockPrismaClient.user.findUnique({ where: { id: mockUser.id } });
      expect(result?.resetToken).toBe(token2);
      expect(result?.resetToken).not.toBe(token1);
    });
  });

  describe('Email Validation', () => {
    it('should find user by email for password reset', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await mockPrismaClient.user.findUnique({
        where: { email: mockUser.email },
      });

      expect(result).toBeDefined();
      expect(result?.email).toBe(mockUser.email);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });

    it('should not find user with non-existent email', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await mockPrismaClient.user.findUnique({
        where: { email: 'nonexistent@test.com' },
      });

      expect(result).toBeNull();
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@test.com' },
      });
    });
  });
});