import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { hashPassword, comparePassword, generateToken, authenticateToken, AuthRequest } from '../lib/auth';
import { createId } from '@paralleldrive/cuid2';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../lib/email';

const router = Router();

// Signup/Register handler
const signupHandler = async (req: any, res: any) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate unique ID
    const userId = createId();

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        password: hashedPassword,
        name: name || null,
      })
      .select('id, email, name, createdAt')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      }, 
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Register new user (support both /signup and /register)
router.post('/signup', signupHandler);
router.post('/register', signupHandler);

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    const response = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
    };

    console.log('✅ Login successful for:', user.email);
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // Always return success to prevent email enumeration
    if (error || !user) {
      return res.json({ 
        message: 'If an account exists with that email, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to database
    await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
      })
      .eq('id', user.id);

    // Send reset email
    const resetUrl = `${process.env.WEB_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    try {
      await sendPasswordResetEmail(email, resetToken, resetUrl);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ 
      message: 'If an account exists with that email, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find user with valid token
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', token)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check token expiry
    if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq('id', user.id);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * Change password (authenticated)
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
