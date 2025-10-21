/**
 * Google OAuth Routes
 * 
 * Handles Google authentication for web and mobile
 */

import express, { Request, Response } from 'express';
import passport from '../lib/passport';
import { generateToken } from '../lib/passport';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        const errorUrl = `${process.env.WEB_APP_URL || 'http://localhost:3000'}/auth/error?message=Authentication failed`;
        return res.redirect(errorUrl);
      }

      const token = generateToken(user.id);
      
      // For web - redirect with token
      if (req.query.state === 'web') {
        const redirectUrl = `${process.env.WEB_APP_URL || 'http://localhost:3000'}/auth/success?token=${token}`;
        return res.redirect(redirectUrl);
      }
      
      // For mobile - return JSON
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('Google callback error:', error);
      const errorUrl = `${process.env.WEB_APP_URL || 'http://localhost:3000'}/auth/error?message=Authentication failed`;
      res.redirect(errorUrl);
    }
  }
);

// Get Google OAuth URL for mobile
router.get('/google/url', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `response_type=code&` +
    `scope=profile email&` +
    `access_type=offline&` +
    `state=mobile`;
  
  res.json({ authUrl });
});

// Mobile token verification endpoint
router.post('/google/mobile', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'No ID token provided' });
    }

    // Verify the Google ID token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: payload.sub },
          { email: payload.email }
        ]
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name || 'Google User',
          avatar: payload.picture,
          password: '', // OAuth users don't have passwords
        }
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          googleId: payload.sub,
          avatar: payload.picture || user.avatar,
        }
      });
    }

    const token = generateToken(user.id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Google mobile auth error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

export default router;
