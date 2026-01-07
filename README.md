# 🧠 MindPal — AI-Powered Learning Platform

> Transform documents into interactive learning with real-time AI summaries, auto-generated flashcards, and collaborative study rooms.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-78%2F78_Passing-success?style=for-the-badge)](./TEST_RESULTS.md)
[![Production Ready](https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=for-the-badge)](./PRODUCTION_DEPLOYMENT_GUIDE.md)
[![Deploy Ready](https://img.shields.io/badge/Deploy_Ready-79%25-yellow?style=for-the-badge)](./DEPLOYMENT_STATUS_REPORT.md)

---

## 📖 Overview

**MindPal** is a comprehensive learning platform that combines AI-powered content generation, spaced repetition algorithms, and real-time collaborative features to help users maximize comprehension and retention.

### 🎯 Core Features

- ✅ **AI-Powered Summaries** — Multi-provider AI (Gemini, OpenAI, Claude) for intelligent content analysis
- ✅ **Smart Flashcards** — Auto-generated Q&A pairs with SM-2 spaced repetition
- ✅ **Study Rooms** — Real-time collaborative learning with WebSocket-powered chat
- ✅ **Advanced Analytics** — Track progress, streaks, and mastery levels
- ✅ **PWA Support** — Offline-capable progressive web app
- ✅ **Full Authentication** — JWT-based security with Google OAuth

Perfect for students, educators, professionals, and teams who want collaborative, AI-enhanced learning experiences.

---

## 🚀 Quick Start (Production Deployment)

### Prerequisites
- Node.js 18+ 
- Supabase account
- Render account (backend hosting)
- Vercel account (frontend hosting)
- AI provider API keys (Gemini/OpenAI/Claude)

### Step 1: Database Setup
```bash
# Run the migration in Supabase SQL Editor
# File: database/SIMPLE_MIGRATION.sql
```

### Step 2: Deploy Backend (Render)
1. Go to **[render.com](https://render.com)** → Sign up with GitHub
2. New → **Web Service**
3. Connect repository: `mindpal-learning-app`
4. Configure:
   - **Name**: mindpal-api
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add **Environment Variables** (see below)
6. Click **Create Web Service**

### Step 3: Deploy Frontend (Vercel)
1. Go to **[vercel.com](https://vercel.com)** → Sign up with GitHub
2. **Import Project** → Select `mindpal-learning-app`
3. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `apps/web`
4. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL
5. Click **Deploy**

### 📚 Complete Guide
**Render Backend Environment Variables:**
```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-strong-random-secret
GOOGLE_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-key (optional)
ANTHROPIC_API_KEY=your-claude-key (optional)
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
NODE_ENV=production
PORT=3001
```

**Vercel Frontend Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-app.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For detailed deployment instructions, see your local files (not yet committed).

### 📊 Deployment Readiness: 79% (15/19 Ready)

**✅ Ready Now:**
- Database migration SQL prepared
- All environment variables configured  
- User registration, login, password reset
- Document CRUD operations
- Flashcard generation & study mode
- Study rooms with real-time chat
- Google OAuth integration
- 78/78 tests passing (100%)

**⚠️ Configure After Deploy:**
- Email credentials (for password reset emails)
- Custom domain DNS (optional)
- Monitoring & backups (platform dashboards available)

**Deploy Time:** ~35 minutes | **Status:** 🟢 Production Ready

---

## ✨ Features

### 🤖 AI-Powered Content Generation
- **Smart Summarization** — Multiple AI providers: Gemini, ChatGPT, Claude, DeepSeek
- **Live Typing Effect** — Real-time streaming shows AI generating content
- **Automatic Flashcards** — 3-5 educational Q&A pairs generated per document
- **Intelligent Regeneration** — Edit content and AI updates everything
- **Voice Input** — Speech-to-text for hands-free content creation

### 📝 Document Management
- **Create, Read, Update, Delete** — Full CRUD operations
- **Rich Text Support** — Store any type of educational content
- **Real-Time Timestamps** — See when documents were created/updated
- **Organized Dashboard** — Grid view with dark theme UI
- **Export Options** — PDF and Markdown export

### 🎴 Interactive Study Mode
- **Full-Screen Viewer** — Immersive flashcard study experience
- **Click-to-Reveal** — Active recall before seeing answers
- **Progress Tracking** — Visual progress bar and percentage
- **Navigation Controls** — Previous/Next buttons for easy review
- **Completion Celebration** — Motivational message when done

### 📊 Analytics & Progress
- **Study Time Tracking** — Monitor your learning sessions
- **Mastery Progress** — Track card difficulty levels
- **Streak System** — Daily study streaks with SM-2 algorithm
- **Performance Metrics** — Accuracy, quality, and review stats

### 🔒 Security & Authentication
- **JWT-Based Auth** — Secure token authentication
- **Password Management** — Change password with validation
- **User Isolation** — Each user only sees their own documents
- **Session Persistence** — Stay logged in across browser sessions

### 📱 Progressive Web App (PWA)
- **Offline Support** — Service worker caching
- **Online/Offline Indicators** — Visual connection status
- **Mobile Responsive** — Works on all devices

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15.5](https://nextjs.org/)** — React framework with App Router
- **[React 19](https://react.dev/)** — UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** — Type-safe JavaScript
- **[Tailwind CSS 3](https://tailwindcss.com/)** — Utility-first styling
- **[Socket.IO Client](https://socket.io/)** — WebSocket client for real-time features
- **[date-fns](https://date-fns.org/)** — Date formatting

### Backend
- **[Express.js 5](https://expressjs.com/)** — Web server framework
- **[Node.js 18+](https://nodejs.org/)** — JavaScript runtime
- **[TypeScript 5](https://www.typescriptlang.org/)** — Type safety
- **[Socket.IO](https://socket.io/)** — WebSocket server for study rooms
- **[JWT](https://jwt.io/)** — Authentication tokens
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** — Password hashing
- **[Prisma ORM](https://www.prisma.io/)** — Database toolkit

### Database & AI Services
- **[Supabase](https://supabase.com/)** — PostgreSQL database (BaaS)
- **[Google Gemini AI](https://ai.google.dev/)** — Default AI provider (gemini-2.5-flash)
- **[OpenAI](https://openai.com/)** — GPT-4, GPT-4o, GPT-3.5-turbo
- **[Anthropic Claude](https://anthropic.com/)** — Claude 3.5 Sonnet
- **[DeepSeek AI](https://platform.deepseek.com/)** — Cost-effective AI provider
- **Server-Sent Events (SSE)** — Real-time streaming

### Testing & Quality
- **[Jest](https://jestjs.io/)** — Testing framework (78/78 tests passing)
- **[ts-jest](https://kulshekhar.github.io/ts-jest/)** — TypeScript support for Jest
- **[ESLint](https://eslint.org/)** — Code linting
- **[Prettier](https://prettier.io/)** — Code formatting

---

## 📂 Project Structure

```
mindpal-learning-app/
├── apps/
│   ├── api/                      # Express.js Backend
│   │   ├── src/
│   │   │   ├── index.ts         # Server entry point
│   │   │   ├── routes/          # API endpoints
│   │   │   │   ├── auth.ts      # Authentication routes
│   │   │   │   ├── documents.ts # Document CRUD
│   │   │   │   ├── documents-stream.ts # Real-time streaming
│   │   │   │   ├── reviews.ts   # Spaced repetition
│   │   │   │   ├── study-rooms.ts # Study room CRUD
│   │   │   │   └── analytics.ts # Study analytics
│   │   │   ├── lib/             # Core utilities
│   │   │   │   ├── ai-providers.ts # AI integrations
│   │   │   │   ├── auth.ts      # JWT & bcrypt
│   │   │   │   ├── socket.ts    # WebSocket server
│   │   │   │   └── supabase.ts  # Database client
│   │   │   └── middleware/      # Express middleware
│   │   ├── .env                 # Environment variables (create this)
│   │   └── package.json
│   │
│   └── web/                      # Next.js Frontend
│       ├── src/
│       │   ├── app/             # Next.js App Router
│       │   │   ├── page.tsx     # Landing page
│       │   │   ├── login/       # Login page
│       │   │   ├── dashboard/   # Main dashboard
│       │   │   ├── analytics/   # Analytics page
│       │   │   ├── review/      # Review page
│       │   │   ├── study-rooms/ # Real-time collaboration
│       │   │   ├── shared/      # Shared documents
│       │   │   └── profile/     # User profile
│       │   └── components/      # React components
│       ├── .env.local           # Frontend env vars (create this)
│       └── package.json
│
├── database/                     # SQL migrations
│   ├── SIMPLE_MIGRATION.sql     # Production migration (8 tables)
│   ├── update-schema-to-snake-case.sql
│   └── README.md
│
├── docs/                         # Documentation
│   ├── API.md                   # API reference
│   ├── ARCHITECTURE.md          # System architecture
│   └── SETUP.md                 # Setup guide
│
├── scripts/                      # Automation scripts
│   ├── deploy-prep.ps1          # Deployment preparation
│   └── verify-deployment.ps1    # Post-deployment checks
│
├── PRODUCTION_DEPLOYMENT_GUIDE.md # Complete deployment guide
├── DEPLOYMENT_CHECKLIST.md      # Deployment steps
├── TEST_RESULTS.md              # Test suite results (78/78)
├── package.json                  # Monorepo root
└── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **Supabase account** (free tier)
- **AI Provider API Keys** (at least one):
  - Google Gemini API key (free)
  - OpenAI API key (optional)
  - Anthropic API key (optional)
  - DeepSeek API key (optional)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/souravdas090300/mindpal-learning-app.git
cd mindpal-learning-app

# 2. Install dependencies
npm install
```

### Environment Setup

Create `apps/api/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Provider Keys (at least one required)
GOOGLE_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key

# Authentication
JWT_SECRET=your-random-secret-key

# Server Configuration
PORT=3001
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Database Migration (⚠️ REQUIRED)

**Before running the app**, execute the database migration:

1. Open your **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `database/SIMPLE_MIGRATION.sql`
3. Paste and **Run** the migration

This migration creates 8 essential tables:
- `study_rooms` — Real-time collaboration rooms
- `room_participants` — Room membership tracking
- `room_messages` — Chat messages
- `room_flashcards` — Shared flashcards
- `reviews` — SM-2 spaced repetition data
- `study_sessions` — Analytics tracking
- `document_shares` — Sharing system
- `share_links` — Public share links

**Without this migration, study rooms and reviews will return 500 errors.**

---

## 🧪 Testing

All features are verified with comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
cd apps/api && npm test    # 41 API tests
cd apps/web && npm test    # 37 Web tests
```

**Test Results:** 78/78 passing (100%)
- ✅ Authentication & JWT
- ✅ Document CRUD operations
- ✅ AI provider integrations
- ✅ Flashcard generation
- ✅ Spaced repetition (SM-2)
- ✅ Study rooms & real-time chat
- ✅ Analytics & progress tracking

See **[TEST_RESULTS.md](./TEST_RESULTS.md)** for full report.

---

## 🚢 Local Development

### Start the Application

```bash
# Start both API and Web in development mode
npm run dev
```

**URLs:**
- 🌐 **Web App**: http://localhost:3002 (Next.js auto-selects free port)
- 🔌 **API Server**: http://localhost:3001

### First Steps

1. **Sign Up** — Create your account at http://localhost:3002
2. **Create Document** — Click "+ New Document" and add content
3. **Select AI Model** — Choose from Gemini, ChatGPT, Claude, or DeepSeek
4. **Watch AI Work** — See real-time summary and flashcard generation
5. **Join Study Room** — Collaborate with real-time chat and flashcard sharing
6. **Track Progress** — View analytics and study streaks

---

## 🤖 AI Providers

MindPal supports multiple AI providers. Select your preferred model in the dashboard:

### Google Gemini (Default - Free)
- `gemini-2.5-flash` — Fast, free, excellent for educational content
- `gemini-pro` — More capable model

### OpenAI (ChatGPT)
- `gpt-4o` — Latest GPT-4 optimized
- `gpt-4o-mini` — Fast and cost-effective
- `gpt-4-turbo` — High performance
- `gpt-3.5-turbo` — Budget-friendly

### Anthropic Claude
- `claude-3-5-sonnet-20241022` — Nuanced, thoughtful responses
- `claude-3-opus-20240229` — Most capable
- `claude-3-sonnet-20240229` — Balanced

### DeepSeek (Cost-Effective)
- `deepseek-chat` — General purpose
- `deepseek-coder` — Optimized for technical content

**All providers support:**
- Real-time streaming summaries
- Educational flashcard generation
- Content analysis and extraction

---

## 🎙️ Voice Input

Use the microphone button to dictate content:
- Works on **Chrome**, **Edge**, and **Safari**
- Appends transcript to the content field
- Shows recording indicators and errors
- Supports multiple languages

**Browser Requirements:**
- Web Speech API support required
- Microphone permissions needed

---

## 🔐 Change Password

**UI Location:** Profile page → Password & Security section

**API Endpoint:** `POST /api/auth/change-password`

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

**Requirements:**
- Current password must be correct
- New password minimum 6 characters
- Bearer token required in Authorization header

---

## 🐛 Troubleshooting

### Database 500 Errors

**Problem:** `/api/reviews/due` returns 500 Internal Server Error

**Solution:** Run the database migration `database/update-schema-to-snake-case.sql` in Supabase SQL Editor

### AI Not Working

```bash
# Check API key is loaded
cd apps/api
npm run dev

# Look for: "✅ Gemini Provider initialized"
# If error, verify your .env file has GOOGLE_API_KEY
```

### Hydration Mismatch

**Problem:** React hydration errors in development

**Solution:** Pages use client-only mounted checks. Ensure `localStorage` access only happens after component mounts.

### PWA Errors

**Problem:** `setIsOnline is not defined`

**Solution:** Ensure `PWAManager.tsx` has:
```typescript
const [isOnline, setIsOnline] = useState(true);
```

### Port Already in Use

**Problem:** Port 3001 or 3002 already in use

**Solution:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3001
kill -9 <PID>
```

Or Next.js will automatically select the next available port (usually 3002).

---

## 📸 Screenshots

- **Landing Page** — Welcome screen with hero section
- **Dashboard** — Document grid with AI summaries
- **Live AI Creation** — Real-time streaming
- **Study Mode** — Interactive flashcards
- **Analytics** — Progress tracking

> Add screenshots to `screenshots/` folder and they'll display here

---

## 📚 Additional Documentation

- **[PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)** — Complete production setup (Railway/Vercel)
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** — Step-by-step deployment verification
- **[TEST_RESULTS.md](./TEST_RESULTS.md)** — Full test suite report (78/78 passing)
- **[SETUP.md](./docs/SETUP.md)** — Complete installation guide
- **[API.md](./docs/API.md)** — Full API reference
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — System design details

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Use TypeScript strict mode
- Follow existing code style
- Add comments for complex logic
- Update documentation when needed
- Test changes locally before PR

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## 👨‍💻 Author

**Sourav Das**

- GitHub: [@souravdas090300](https://github.com/souravdas090300)
- Email: souravdas090300@gmail.com

---

## 🗺️ Roadmap

- [x] AI-powered document summarization
- [x] Automatic flashcard generation
- [x] Real-time content streaming
- [x] Interactive study mode
- [x] Spaced repetition algorithm (SM-2)
- [x] Progress tracking & analytics
- [x] Document sharing & collaboration
- [x] Real-time collaborative study rooms
- [x] WebSocket-powered chat
- [x] Flashcard sharing in rooms
- [x] Voice input (Speech-to-Text)
- [x] Export to PDF/Markdown
- [x] Multiple AI models support
- [x] Password management
- [x] Offline mode (PWA)
- [x] Production deployment ready
- [x] Comprehensive test coverage (78/78)
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Video/audio content support
- [ ] Team workspaces

---

<div align="center">

**Built with ❤️ by Sourav Das**

[⭐ Star on GitHub](https://github.com/souravdas090300/mindpal-learning-app) • [📖 Documentation](./docs) • [🐛 Report Bug](https://github.com/souravdas090300/mindpal-learning-app/issues)

</div>

