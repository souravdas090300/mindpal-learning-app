# 🏗️ Architecture Documentation

Complete system architecture and technical design documentation for MindPal Learning App.

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [Authentication Flow](#authentication-flow)
7. [AI Integration](#ai-integration)
8. [Real-Time Streaming](#real-time-streaming)
9. [Security](#security)
10. [Deployment](#deployment)

---

## System Overview

MindPal is a full-stack learning application that leverages AI to enhance document comprehension through automated summarization and flashcard generation.

### Key Components

1. **Web Frontend** - Next.js 15 application
2. **API Backend** - Express.js REST API
3. **Database** - PostgreSQL via Supabase
4. **AI Service** - Google Gemini API
5. **Mobile App** - React Native (future)

### Core Features

- ✅ User authentication and authorization
- ✅ Document CRUD operations
- ✅ Real-time AI content streaming
- ✅ Automated document summarization
- ✅ AI-generated flashcard creation
- ✅ Interactive flashcard study mode

---

## Technology Stack

### Frontend (apps/web)

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15.5.4 | React framework with SSR |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling framework |
| date-fns | Latest | Date formatting |

### Backend (apps/api)

| Technology | Version | Purpose |
|-----------|---------|---------|
| Express.js | 5.1.0 | Web server framework |
| Node.js | 18+ | JavaScript runtime |
| TypeScript | 5.x | Type safety |
| Supabase JS | Latest | Database client |
| bcrypt | Latest | Password hashing |
| jsonwebtoken | Latest | JWT authentication |
| Google AI | 0.24.1 | Gemini API client |

### Database

| Technology | Purpose |
|-----------|---------|
| Supabase | Backend-as-a-Service |
| PostgreSQL | Relational database |
| Row Level Security | Data protection |

### AI/ML

| Service | Model | Purpose |
|---------|-------|---------|
| Google Gemini | gemini-2.5-flash | Text summarization, flashcard generation |

### DevOps

| Tool | Purpose |
|------|---------|
| Vercel | Frontend hosting |
| Railway/Render | API hosting |
| Git | Version control |
| npm | Package management |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Web Browser    │         │  Mobile Device   │          │
│  │   (Next.js)      │         │  (React Native)  │          │
│  │  Port: 3002      │         │  Expo: 19000     │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        │                                     │
│                        │ HTTPS/WSS                           │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
                         │
┌────────────────────────┼─────────────────────────────────────┐
│                        │       API LAYER                      │
├────────────────────────┼─────────────────────────────────────┤
│                        │                                      │
│                        ▼                                      │
│            ┌──────────────────────┐                          │
│            │   Express Server     │                          │
│            │   Port: 3001         │                          │
│            │                      │                          │
│            │  ┌────────────────┐  │                          │
│            │  │  Auth Routes   │  │                          │
│            │  │  /api/auth     │  │                          │
│            │  └────────────────┘  │                          │
│            │                      │                          │
│            │  ┌────────────────┐  │                          │
│            │  │ Document Routes│  │                          │
│            │  │  /api/documents│  │                          │
│            │  └────────────────┘  │                          │
│            │                      │                          │
│            │  ┌────────────────┐  │                          │
│            │  │ Stream Routes  │  │                          │
│            │  │  /api/..stream │  │                          │
│            │  └────────────────┘  │                          │
│            │                      │                          │
│            │  ┌────────────────┐  │                          │
│            │  │ Flashcard API  │  │                          │
│            │  │ /api/flashcards│  │                          │
│            │  └────────────────┘  │                          │
│            └──────────┬───────────┘                          │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌──────────────┐
│  DATABASE   │  │  AI SERVICE │  │    CACHE     │
│  (Supabase) │  │  (Gemini)   │  │  (Future)    │
│             │  │             │  │              │
│ PostgreSQL  │  │  gemini-    │  │    Redis     │
│    Tables:  │  │  2.5-flash  │  │  (Optional)  │
│  - users    │  │             │  │              │
│  - documents│  │  Streaming  │  │              │
│  - flashcards  │  Support    │  │              │
└─────────────┘  └─────────────┘  └──────────────┘
```

---

## Data Flow

### 1. User Registration Flow

```
User Input (Email, Password)
    ↓
Next.js Frontend (Validation)
    ↓
POST /api/auth/signup
    ↓
Express Server
    ↓
Check if User Exists (Supabase Query)
    ↓
Hash Password (bcrypt)
    ↓
Create User Record (Supabase Insert)
    ↓
Generate JWT Token
    ↓
Return User + Token
    ↓
Store Token in localStorage
    ↓
Redirect to Dashboard
```

### 2. Document Creation with AI Streaming

```
User Creates Document (Title + Content)
    ↓
Next.js Frontend
    ↓
POST /api/documents-stream/stream (SSE)
    ↓
Express Server (Authenticated)
    ↓
1. Create Document Record (Supabase)
    ↓
2. Emit: document-created Event
    ↓
3. Generate Summary (Gemini AI - Streaming)
    ├── Emit: summary-start
    ├── Emit: summary-chunk (multiple)
    ├── Update Database with Summary
    └── Emit: summary-complete
    ↓
4. Generate Flashcards (Gemini AI)
    ├── Emit: flashcards-start
    ├── Parse JSON Response
    ├── Insert Flashcards (Supabase)
    └── Emit: flashcards-complete
    ↓
5. Emit: complete Event
    ↓
Frontend Displays Real-Time Updates
    ↓
Close SSE Connection
```

### 3. Flashcard Study Flow

```
User Clicks "Study Flashcards"
    ↓
Fetch Document with Flashcards
    ↓
Display First Flashcard (Question)
    ↓
User Clicks to Reveal
    ↓
Show Answer
    ↓
User Navigates (Previous/Next)
    ↓
Track Progress (X of Y cards)
    ↓
Complete All Cards
    ↓
Show Completion Message
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- CUID
  email TEXT UNIQUE NOT NULL,       -- User email
  password TEXT NOT NULL,           -- Bcrypt hash
  name TEXT,                        -- Optional display name
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### Documents Table

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,              -- CUID
  "userId" TEXT NOT NULL,           -- Foreign key to users
  title TEXT NOT NULL,              -- Document title
  content TEXT NOT NULL,            -- Full document text
  summary TEXT,                     -- AI-generated summary
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
```

### Flashcards Table

```sql
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,              -- CUID
  "documentId" TEXT NOT NULL,       -- Foreign key to documents
  question TEXT NOT NULL,           -- Flashcard question
  answer TEXT NOT NULL,             -- Flashcard answer
  "createdAt" TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY ("documentId") REFERENCES documents(id) ON DELETE CASCADE
);
```

### Indexes

```sql
-- Performance optimization
CREATE INDEX idx_documents_userId ON documents("userId");
CREATE INDEX idx_flashcards_documentId ON flashcards("documentId");
CREATE INDEX idx_users_email ON users(email);
```

### Row Level Security (RLS)

```sql
-- Users can only access their own documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_user_policy ON documents
  FOR ALL
  USING ("userId" = auth.uid());
```

---

## Authentication Flow

### JWT Token Structure

```javascript
{
  payload: {
    userId: "ckxyz123abc",
    email: "user@example.com"
  },
  signature: "HMAC-SHA256(header.payload, secret)"
}
```

### Auth Middleware Flow

```
1. Extract token from Authorization header
   ↓
2. Verify token signature with JWT_SECRET
   ↓
3. Check token expiration
   ↓
4. Decode user information
   ↓
5. Attach user to request object
   ↓
6. Continue to route handler
```

### Token Storage

- **Web:** `localStorage.setItem('token', jwt)`
- **Mobile:** AsyncStorage (React Native)
- **Expiry:** 30 days (configurable)

---

## AI Integration

### Google Gemini API

**Model:** `gemini-2.5-flash`

**Capabilities:**
- Text summarization
- Content generation
- JSON output parsing
- Streaming responses

### Summary Generation

```typescript
Prompt Template:
"Please provide a concise summary of the following text. 
Focus on the key points and main ideas in 2-3 sentences:

{content}

SUMMARY:"
```

### Flashcard Generation

```typescript
Prompt Template:
"Based on the following text, generate 3-5 educational flashcards 
with clear questions and concise answers. 
Format your response as a valid JSON array like this:
[{"question": "Q1", "answer": "A1"}]

TEXT: {content}

FLASHCARDS (JSON only, no extra text):"
```

### Error Handling

- Fallback to generic flashcards if AI fails
- Timeout protection (30s)
- Retry logic (not implemented yet)
- Error logging for debugging

---

## Real-Time Streaming

### Server-Sent Events (SSE)

**Why SSE instead of WebSocket?**
- Simpler protocol (unidirectional)
- Built-in browser support
- Automatic reconnection
- Works through HTTP/HTTPS

### SSE Implementation

```typescript
// Server (Express)
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

res.write(`event: summary-chunk\n`);
res.write(`data: {"text":"Hello"}\n\n`);
```

```typescript
// Client (Next.js)
const response = await fetch('/api/documents-stream/stream');
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Parse SSE format
}
```

---

## Security

### Implemented Security Measures

1. **Password Hashing** - bcrypt with salt rounds
2. **JWT Authentication** - Secure token-based auth
3. **CORS Protection** - Whitelist of allowed origins
4. **Helmet.js** - Security headers
5. **Input Validation** - Required fields checked
6. **SQL Injection Protection** - Parameterized queries via Supabase
7. **XSS Protection** - React auto-escapes output

### Recommended Additions

- Rate limiting (express-rate-limit)
- Request size limits (already set to 10MB)
- HTTPS enforcement in production
- Environment variable encryption
- API key rotation
- CSRF protection for web forms

---

## Deployment

### Development Environment

```bash
# API Server
cd apps/api
npm run dev
# Runs on http://localhost:3001

# Web Frontend
cd apps/web
npm run dev
# Runs on http://localhost:3002
```

### Production Deployment

#### Frontend (Vercel)

```bash
# Vercel configuration
Build Command: npm run build
Output Directory: apps/web/.next
Environment Variables:
  - NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

#### Backend (Railway/Render)

```bash
# Railway configuration
Build Command: npm run build
Start Command: npm start
Environment Variables:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - GOOGLE_API_KEY
  - JWT_SECRET
  - PORT=3001
```

### Environment Variables

**Required for API:**
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
GOOGLE_API_KEY=AIzaSy...
JWT_SECRET=your-secret-key-min-32-chars
PORT=3001
```

**Required for Web:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Performance Considerations

### Optimization Strategies

1. **Database**
   - Indexes on foreign keys
   - Query optimization
   - Connection pooling

2. **API**
   - Response compression (gzip)
   - Caching headers
   - Pagination for list endpoints

3. **Frontend**
   - Code splitting (Next.js automatic)
   - Image optimization
   - Lazy loading components

4. **AI**
   - Streaming reduces perceived latency
   - Parallel requests (summary + flashcards)
   - Fallback responses

---

## Monitoring & Logging

### Current Logging

- Console logs for requests
- Error logging with stack traces
- AI API status logging

### Recommended Tools

- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **DataDog** - APM and monitoring
- **Supabase Dashboard** - Database metrics

---

## Future Enhancements

1. ✅ Spaced Repetition Algorithm (SM-2)
2. ⏳ Progress Tracking & Analytics
3. ⏳ Document Sharing & Collaboration
4. ⏳ Multiple AI Models Support
5. ⏳ Voice Input (Speech-to-Text)
6. ⏳ Export to PDF/Markdown
7. ⏳ Offline Mode (PWA)
8. ⏳ Mobile App (React Native)

---

## Contributing

See project conventions in the codebase:
- TypeScript strict mode
- ESLint for code quality
- Prettier for formatting
- Conventional commits

---

**Architecture Version:** 1.0.0  
**Last Updated:** January 2025  
**Maintained By:** Sourav Das
