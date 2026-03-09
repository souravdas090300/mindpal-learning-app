# 🏗️ Production Architecture Overview

## Free Hosting Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        USERS                                │
│                    (Worldwide Access)                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────┐
             │                                                 │
             ▼                                                 ▼
    ┌────────────────┐                              ┌──────────────────┐
    │  VERCEL CDN    │                              │   MOBILE APP     │
    │   (Frontend)   │                              │   (Expo/RN)      │
    │                │                              │                  │
    │  Next.js 15    │                              │  Future Deploy   │
    │  React 19      │                              │  (Expo EAS)      │
    │                │                              │                  │
    │  FREE          │                              │  Coming Soon     │
    └────────┬───────┘                              └────────┬─────────┘
             │                                               │
             │ HTTPS                                         │ HTTPS
             │                                               │
             └───────────────────┬───────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   BACKEND API        │
                    │   (Render/Koyeb)     │
                    │                        │
                    │   Express + Socket.IO  │
                    │   Node.js 20           │
                    │   Prisma ORM           │
                    │                        │
                    │   FREE Tier          │
                    │   (750 hrs/month)    │
                    └───────────┬────────────┘
                                │
                    ┌───────────┼────────────┐
                    │           │            │
                    ▼           ▼            ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │ SUPABASE │  │   AI     │  │ PINECONE │
            │   (DB)   │  │ PROVIDERS│  │ (Vector) │
            │          │  │          │  │          │
            │PostgreSQL│  │ Gemini   │  │ Optional │
            │  500MB   │  │ OpenAI   │  │   FREE   │
            │   FREE   │  │ Claude   │  │          │
            └──────────┘  └──────────┘  └──────────┘
```

---

## Component Details

### 🌐 Frontend - Vercel (FREE)

**Technology:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS

**Features:**
- Global CDN
- Automatic HTTPS
- Instant deployments
- Preview deployments
- Serverless functions

**Free Tier:**
- ✅ Unlimited sites
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ✅ DDoS protection

**URL Structure:**
- Production: `https://mindpal-web.vercel.app`
- Preview: `https://mindpal-web-git-branch.vercel.app`

---

### � Backend API - Render (FREE)

**Technology:**
- Node.js 20 + Express
- TypeScript
- Prisma ORM
- Socket.IO (WebSockets)
- JWT Authentication

**Features:**
- Always-on service (with credit)
- Auto-deploy from GitHub
- Health checks
- Instant rollbacks
- Environment variables

**Free Tier:**
- ✅ $5 credit monthly
- ✅ ~500 hours runtime
- ✅ 512MB RAM
- ✅ 1GB storage
- ✅ Shared CPU

**Endpoints:**
```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/google
GET    /api/documents
POST   /api/documents
GET    /api/flashcards/due
POST   /api/flashcards/:id/review
GET    /api/reviews/stats
POST   /api/ai/summarize
POST   /api/ai/flashcards
WS     /socket.io (Study rooms)
```

---

### 🗄️ Database - Supabase (FREE)

**Technology:**
- PostgreSQL 15
- pgBouncer (connection pooling)
- Real-time subscriptions
- Built-in auth (not used, we use custom JWT)

**Free Tier:**
- ✅ 500MB database
- ✅ 2GB bandwidth/month
- ✅ 50,000 monthly active users
- ✅ 7-day backup retention
- ✅ Auto-scaling connections

**Tables:**
```
users
documents
flashcards
reviews
studyRooms
studyRoomMessages
studyRoomParticipants
shares
```

**Connection:**
- Uses pgBouncer pooler (port 6543)
- Connection pooling for scalability
- SSL/TLS encryption

---

### 🤖 AI Providers

**Primary: Google Gemini (FREE)**
- ✅ 15 requests/minute free
- ✅ 1 million tokens/day
- Models: gemini-1.5-flash, gemini-1.5-pro

**Optional: OpenAI (Paid)**
- GPT-4, GPT-3.5-turbo
- $0.002/1K tokens (GPT-3.5)
- $0.03/1K tokens (GPT-4)

**Optional: Anthropic Claude (Paid)**
- Claude 3 Opus, Sonnet, Haiku
- $0.015/1K tokens (Haiku)
- $0.18/1K tokens (Opus)

**Optional: DeepSeek (Paid - Cheap)**
- deepseek-chat, deepseek-coder
- $0.001/1K tokens (very affordable)

---

### 🔍 Vector Search - Pinecone (Optional, FREE)

**Technology:**
- Vector database
- Semantic search
- OpenAI embeddings

**Free Tier:**
- ✅ 1 index
- ✅ 100K vectors
- ✅ Single pod

**Use Case:**
- Semantic document search
- Find similar content
- Enhanced search features

---

## Data Flow

### 1. User Creates Document

```
User (Browser)
    │
    ├─→ POST /api/documents {title, content}
    │   │
    │   └─→ Backend API
    │       │
    │       ├─→ Supabase (Save document)
    │       │
    │       ├─→ Google Gemini (Generate summary)
    │       │
    │       ├─→ Google Gemini (Generate flashcards)
    │       │
    │       └─→ Pinecone (Store vector - optional)
    │
    └─← Response {document, summary, flashcards}
```

### 2. Spaced Repetition Review

```
User (Browser)
    │
    ├─→ GET /api/flashcards/due
    │   │
    │   └─→ Backend API
    │       │
    │       └─→ Supabase (Query due flashcards)
    │           │ WHERE nextReview <= NOW()
    │           │ ORDER BY priority DESC
    │
    └─← Response {due flashcards}

User reviews flashcard (quality 0-5)
    │
    ├─→ POST /api/flashcards/:id/review {quality}
    │   │
    │   └─→ Backend API
    │       │
    │       ├─→ Calculate new interval (SM-2 algorithm)
    │       │
    │       └─→ Supabase (Update flashcard)
    │           │ SET nextReview = NOW() + interval
    │           │ UPDATE easeFactor, repetitions
    │
    └─← Response {updated flashcard}
```

### 3. Real-Time Study Room

```
User A (Browser)                      User B (Browser)
    │                                      │
    ├─→ WS Connect                        ├─→ WS Connect
    │   wss://api.onrender.com             │   wss://api.onrender.com
    │                                      │
    └─→ Join Room                         └─→ Join Room
        │                                      │
        ├─→ Backend Socket.IO ←────────────────────├
        │   │
        │   ├─→ Emit: user_joined
        │   │   │
        │   │   ├─→ User A receives        ←───┤
        │   │   │   
        │   │   └─→ User B receives        ←───┘
        │
        ├─→ Send Message
        │   │
        │   ├─→ Supabase (Save message)
        │   │
        │   └─→ Broadcast to all users in room
        │       │
        │       ├─→ User A receives        ←───┤
        │       │
        │       └─→ User B receives        ←───┘
```

---

## Security Architecture

### Authentication Flow

```
1. Signup/Login
   ├─→ POST /api/auth/signup {email, password, name}
   │   │
   │   ├─→ Hash password (bcrypt, 10 rounds)
   │   │
   │   ├─→ Store user in Supabase
   │   │
   │   └─→ Generate JWT token
   │       │ Header: {alg: HS256, typ: JWT}
   │       │ Payload: {userId, email, exp}
   │       │ Signature: HMAC-SHA256(secret)
   │
   └─← Response {token, user}

2. Protected Routes
   ├─→ Request with Authorization: Bearer <token>
   │   │
   │   ├─→ Middleware: Verify JWT
   │   │   │ Decode token
   │   │   │ Verify signature
   │   │   │ Check expiration
   │   │
   │   ├─→ If valid: Attach user to request
   │   │
   │   └─→ If invalid: Return 401 Unauthorized
```

### Google OAuth

```
1. User clicks "Sign in with Google"
   │
   ├─→ GET /api/auth/google
   │   │
   │   └─→ Redirect to Google OAuth
   │       │ https://accounts.google.com/o/oauth2/v2/auth
   │       │ ?client_id=...
   │       │ &redirect_uri=.../callback
   │       │ &scope=email+profile
   │
2. User authorizes on Google
   │
   ├─→ Callback: GET /api/auth/google/callback?code=...
   │   │
   │   ├─→ Exchange code for tokens
   │   │   │ POST https://oauth2.googleapis.com/token
   │   │
   │   ├─→ Get user profile
   │   │   │ GET https://www.googleapis.com/oauth2/v1/userinfo
   │   │
   │   ├─→ Find or create user in Supabase
   │   │
   │   └─→ Generate JWT token
   │
   └─→ Redirect to frontend with token
       │ https://app.vercel.app/?token=...
```

---

## Deployment Workflow

### CI/CD Pipeline

```
Developer                GitHub              Backend API        Vercel
    │                        │                   (Render)            │
    ├─→ git push           │                   │                │
    │                       │                   │                │
    │                    ┌──┴──┐                │                │
    │                    │Build│                │                │
    │                    │Check│                │                │
    │                    └──┬──┘                │                │
    │                       │                   │                │
    │                       ├─→ Webhook ───────→│                │
    │                       │                   │                │
    │                       │                ┌──┴──┐             │
    │                       │                │Build│             │
    │                       │                │ API │             │
    │                       │                └──┬──┘             │
    │                       │                   │                │
    │                       │                ┌──┴──┐             │
    │                       │                │Test │             │
    │                       │                └──┬──┘             │
    │                       │                   │                │
    │                       │                ┌──┴──┐             │
    │                       │                │Deploy            │
    │                       │                └──┬──┘             │
    │                       │                   │                │
    │                       │                [LIVE]              │
    │                       │                   │                │
    │                       ├─→ Webhook ────────────────────────→│
    │                       │                   │                │
    │                       │                   │             ┌──┴──┐
    │                       │                   │             │Build│
    │                       │                   │             │ Web │
    │                       │                   │             └──┬──┘
    │                       │                   │                │
    │                       │                   │             ┌──┴──┐
    │                       │                   │             │Deploy
    │                       │                   │             └──┬──┘
    │                       │                   │                │
    │                       │                   │             [LIVE]
    │                       │                   │                │
    └─← Notification ───────┴───────────────────┴────────────────┘
        "Deployments successful"
```

---

## Monitoring & Logs

### Backend API Logs
```bash
# Access via Dashboard → Logs
# Shows:
- Build logs
- Runtime logs
- Error traces
- Request logs
```

### Vercel Logs
```bash
# Access via Dashboard → Deployments → Logs
# Shows:
- Build logs
- Function logs
- Edge logs
- Real-time streaming
```

### Supabase Monitoring
```bash
# Access via Dashboard → Database → Logs
# Shows:
- Query performance
- Connection stats
- Storage usage
- API usage
```

---

## Scaling Strategy

### Current Capacity (Free Tier)

| Metric | Limit | Notes |
|--------|-------|-------|
| **Users** | 50,000/month | Supabase limit |
| **Requests** | Unlimited | Backend API/Vercel |
| **Database** | 500MB | Supabase storage |
| **Bandwidth** | 2GB/month | Supabase egress |
| **API Runtime** | 750 hrs/month | Render free tier |

### When to Upgrade

**Upgrade Render ($7/month)** when:
- Need always-on service (>750 hrs)
- Want faster response times
- Need more RAM/CPU

**Upgrade Supabase ($25/month)** when:
- Database >500MB
- Bandwidth >2GB/month
- Need longer backups (28 days)

**Upgrade Vercel ($20/month)** when:
- Commercial use required
- Need team collaboration
- Want advanced analytics

---

## Cost Projections

### Small Scale (0-1,000 users)
- **Render:** FREE (750 hrs)
- **Vercel:** FREE
- **Supabase:** FREE
- **Google Gemini:** FREE
- **Total:** $0/month

### Medium Scale (1,000-10,000 users)
- **Render:** $7/month (always-on)
- **Vercel:** FREE
- **Supabase:** $25/month (pro)
- **Google Gemini:** $0-10/month
- **Total:** $32-42/month

### Large Scale (10,000+ users)
- **Render:** $25/month (pro)
- **Vercel:** $20/month (pro)
- **Supabase:** $599/month (team)
- **Mixed AI:** $100-500/month
- **Total:** $744-1,144/month

---

## Disaster Recovery

### Backups

**Supabase (Automatic):**
- Daily backups (7-day retention on free tier)
- Point-in-time recovery on paid tiers
- Export database: `pg_dump`

**Backend API (Not automatic):**
- Use GitHub as backup (code)
- Database backups via Supabase

**Vercel (Automatic):**
- All deployments saved
- Instant rollback to any deployment

### Rollback Strategy

```bash
# Backend API: Redeploy previous version
# → Dashboard → Deployments → [Previous] → Redeploy

# Vercel: Instant rollback
# → Dashboard → Deployments → [Previous] → Promote

# Database: Restore from backup
# → Supabase Dashboard → Database → Backups → Restore
```

---

## Performance Optimization

### Current Setup
- ✅ CDN edge caching (Vercel)
- ✅ Connection pooling (Supabase pgBouncer)
- ✅ Gzip compression (automatic)
- ✅ HTTP/2 and HTTP/3 support
- ✅ Image optimization (Next.js)

### Future Improvements
- Add Redis caching (Upstash free tier)
- Implement database query caching
- Add service worker for offline support
- Optimize bundle size with code splitting

---

## Support Channels

- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/discord
- **Supabase:** https://supabase.com/discord
- **Next.js:** https://nextjs.org/discord

---

**Architecture designed for scalability, reliability, and cost-effectiveness! 🚀**
