import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { hashPassword, comparePassword, generateToken } from '../lib/auth';
import cuid from 'cuid';

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
    const userId = cuid();

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

export default router;
