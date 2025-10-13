# 🚀 Setup Guide

Complete installation and configuration guide for MindPal Learning App.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| Node.js | 18.0.0+ | https://nodejs.org/ |
| npm | 8.0.0+ | (included with Node.js) |
| Git | Latest | https://git-scm.com/ |

### Required Accounts

1. **Supabase Account** (Free)
   - Sign up at: https://supabase.com
   - Create a new project
   - Note your Project URL and anon/public API key

2. **Google AI Account** (Free)
   - Sign up at: https://ai.google.dev/
   - Get a free Gemini API key
   - Enable Gemini API

---

## 🔧 Installation Steps

### 1. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/souravdas090300/mindpal-learning-app.git

# Or using SSH
git clone git@github.com:souravdas090300/mindpal-learning-app.git

# Navigate to project directory
cd mindpal-learning-app
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# This will install dependencies for all workspaces:
# - apps/api (backend)
# - apps/web (frontend)
# - apps/mobile (React Native - optional)
```

### 3. Setup Supabase Database

#### 3.1 Create Tables

Log into your Supabase dashboard and run the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcards table
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_documents_userId ON documents("userId");
CREATE INDEX idx_flashcards_documentId ON flashcards("documentId");
CREATE INDEX idx_users_email ON users(email);
```

#### 3.2 (Optional) Enable Row Level Security

```sql
-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own documents
CREATE POLICY documents_user_policy ON documents
  FOR ALL
  USING ("userId" = auth.uid());

-- Note: This requires Supabase Auth integration
-- For JWT-based auth (current setup), RLS is optional
```

### 4. Configure Environment Variables

#### 4.1 Backend (API) Environment

Create `.env` file in `apps/api/`:

```bash
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...

# Google Gemini AI
GOOGLE_API_KEY=AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# JWT Secret (Generate a secure random string)
# Must be at least 32 characters
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Server Port
PORT=3001
```

**How to get your keys:**

1. **SUPABASE_URL and SUPABASE_ANON_KEY:**
   - Go to your Supabase project dashboard
   - Click on "Settings" (gear icon)
   - Go to "API" section
   - Copy "Project URL" → SUPABASE_URL
   - Copy "anon/public" key → SUPABASE_ANON_KEY

2. **GOOGLE_API_KEY:**
   - Go to https://ai.google.dev/
   - Click "Get API Key"
   - Create a new API key or use existing one
   - Copy the key

3. **JWT_SECRET:**
   - Generate a secure random string (min 32 chars)
   - You can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### 4.2 Frontend (Web) Environment

Create `.env.local` file in `apps/web/`:

```bash
cd apps/web
cp .env.example .env.local
```

Edit `apps/web/.env.local`:

```env
# API URL
# Development
NEXT_PUBLIC_API_URL=http://localhost:3001

# Production (update when deploying)
# NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### 5. Verify Configuration

```bash
# Test API configuration
cd apps/api
npm run dev

# You should see:
# 🔑 Gemini API Key loaded: YES ✅
# 🚀 Server running on port 3001
# Supabase connected successfully
```

If you see "NO ❌" for Gemini API Key, check your `.env` file.

---

## 🏃 Running the Application

### Development Mode

#### Option 1: Run Both Servers Simultaneously (Recommended)

```bash
# From project root
npm run dev

# This starts:
# - API server on http://localhost:3001
# - Web server on http://localhost:3002 (or 3000)
```

#### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd apps/api
npm run dev

# API runs on: http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev

# Web app runs on: http://localhost:3002
# Note: If port 3000 is in use, Next.js will ask to use 3002
```

### Production Mode

```bash
# Build all apps
npm run build

# Start production servers
npm start
```

---

## ✅ Verification Checklist

Test that everything is working:

### 1. API Health Check

```bash
# Test API is running
curl http://localhost:3001/api/test

# Expected response:
# {"message":"MindPal API is running!"}

# Test database connection
curl http://localhost:3001/api/health

# Expected response:
# {"status":"OK","timestamp":"2025-01-15T...","database":"Connected"}
```

### 2. Web Application

1. Open browser: http://localhost:3002
2. You should see the MindPal landing page
3. Click "Get Started" or "Sign Up"

### 3. User Registration

1. Sign up with a test account:
   - Email: test@example.com
   - Password: TestPassword123
   - Name: Test User
2. Should redirect to dashboard
3. Token should be stored in browser localStorage

### 4. Document Creation (Streaming)

1. Click "+ New Document"
2. Enter:
   - Title: "Test Document"
   - Content: "This is a test document to verify AI generation works correctly."
3. Watch for:
   - ✅ Creating modal appears
   - ✅ "Generating AI Summary..." shows
   - ✅ Summary text appears character-by-character
   - ✅ "Generating Flashcards..." shows
   - ✅ Flashcards appear (3-5 cards)
   - ✅ Modal closes, document appears in grid

### 5. Flashcard Study Mode

1. Click "🎴 Study X Flashcards" on any document
2. Verify:
   - ✅ Full-screen modal opens
   - ✅ First question shows
   - ✅ Click reveals answer
   - ✅ Navigation buttons work (Previous/Next)
   - ✅ Progress bar updates
   - ✅ Completion message on last card

### 6. Edit Document

1. Click on any document
2. Click "Edit" button
3. Change title or content
4. Click "Save"
5. Verify:
   - ✅ AI regenerates summary
   - ✅ New flashcards generated
   - ✅ Changes saved

### 7. Delete Document

1. Click on any document
2. Click "Delete" button
3. Confirm deletion
4. Verify:
   - ✅ Document removed from dashboard
   - ✅ Flashcards also deleted

---

## 🐛 Troubleshooting

### Issue: "AI is not working" / No summary generated

**Solution:**
1. Check `apps/api/.env` has correct `GOOGLE_API_KEY`
2. Verify API key is valid: https://ai.google.dev/
3. Check console logs in API terminal for errors
4. Ensure you're using model "gemini-2.5-flash" (not 1.5-flash)

### Issue: "Database connection failed"

**Solution:**
1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `apps/api/.env`
2. Check Supabase project is active (not paused)
3. Run SQL setup script in Supabase dashboard
4. Check Supabase dashboard → Database → Tables exist

### Issue: "Port 3000 already in use"

**Solution:**
1. Next.js will automatically ask to use port 3002
2. Update `NEXT_PUBLIC_API_URL` if needed
3. Or kill process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -i :3000
   kill -9 <PID>
   ```

### Issue: "401 Unauthorized" errors

**Solution:**
1. Check JWT token is being sent in requests
2. Verify `JWT_SECRET` in `apps/api/.env`
3. Clear browser localStorage and re-login
4. Check Authorization header: `Bearer <token>`

### Issue: Streaming doesn't work / No real-time typing

**Solution:**
1. Verify `Content-Type: text/event-stream` header is set
2. Check browser console for errors
3. Ensure `/api/documents-stream/stream` endpoint exists
4. Test with curl:
   ```bash
   curl -N -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","content":"Test content"}' \
     http://localhost:3001/api/documents-stream/stream
   ```

### Issue: CORS errors in browser

**Solution:**
1. Check `apps/api/src/index.ts` CORS configuration
2. Ensure frontend URL is in `allowedOrigins` array
3. Clear browser cache
4. Restart API server

---

## 📦 Project Structure

```
mindpal-learning-app/
├── apps/
│   ├── api/                  # Express.js backend
│   │   ├── src/
│   │   │   ├── index.ts     # Server entry point
│   │   │   ├── routes/      # API routes
│   │   │   ├── lib/         # Utilities (AI, auth, DB)
│   │   │   └── middleware/  # Express middleware
│   │   ├── .env             # Backend environment variables
│   │   └── package.json
│   │
│   ├── web/                  # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/         # Next.js 13+ app directory
│   │   │   └── components/  # React components
│   │   ├── .env.local       # Frontend environment variables
│   │   └── package.json
│   │
│   └── mobile/               # React Native (optional)
│       └── ...
│
├── docs/                     # Documentation
│   ├── API.md               # API reference
│   ├── ARCHITECTURE.md      # System architecture
│   └── SETUP.md             # This file
│
├── package.json              # Root package.json (workspace)
└── README.md                 # Main readme
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use strong JWT secrets** (min 32 characters)
3. **Rotate API keys regularly** in production
4. **Enable HTTPS** in production
5. **Use environment-specific configs** (dev/prod)
6. **Keep dependencies updated** (`npm audit fix`)
7. **Implement rate limiting** for production

---

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for:
- Vercel (Frontend)
- Railway/Render (Backend)
- Environment variable configuration
- Custom domains
- CI/CD setup

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 💬 Support

If you encounter issues not covered here:

1. Check the [Issues](https://github.com/souravdas090300/mindpal-learning-app/issues) page
2. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version)
   - Screenshots (if applicable)

---

## ✅ Setup Complete!

Once you've completed all steps and verification passes, you're ready to start development!

**Next Steps:**
- Explore the codebase
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Check [API.md](./API.md) for API reference
- Start building features!

---

**Last Updated:** January 2025  
**Maintained By:** Sourav Das
