# 🚀 Production Deployment Guide
**MindPal Learning App - Complete Deployment Checklist**

---

## 📋 Pre-Deployment Checklist

### ✅ Step 1: Verify Everything is Working Locally

- [x] All tests passing (78/78) ✅
- [x] No TypeScript errors ✅
- [x] No ESLint errors ✅
- [ ] Database migration completed
- [ ] Environment variables configured
- [ ] API server running locally
- [ ] Web app running locally

---

## 🗄️ Database Setup (Critical First Step)

### 1. **Complete Supabase Setup**

#### A. Run Database Migration
```sql
-- Go to: https://supabase.com/dashboard
-- Select your project
-- Click "SQL Editor" → "New Query"
-- Copy and paste from: database/SIMPLE_MIGRATION.sql
-- Click RUN
```

#### B. Verify Tables Created
```sql
-- Run this query to verify:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- You should see these tables:
-- ✅ users
-- ✅ documents
-- ✅ flashcards
-- ✅ study_rooms (NEW)
-- ✅ room_participants (NEW)
-- ✅ room_messages (NEW)
-- ✅ room_flashcards (NEW)
-- ✅ reviews (NEW)
-- ✅ study_sessions (NEW)
-- ✅ document_shares (NEW)
-- ✅ share_links (NEW)
```

#### C. Get Connection Details
```
Supabase Dashboard → Settings → Database
- Connection String (URI)
- API URL
- Anon/Public Key
- Service Role Key (keep secret!)
```

---

## ⚙️ Environment Configuration

### 1. **API Environment Variables** (`apps/api/.env`)

Create production `.env` file:

```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# JWT Secret (generate new for production!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Supabase
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_KEY="your-supabase-service-role-key"

# AI Providers
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"
CLAUDE_API_KEY="your-claude-api-key"

# Email (for password reset)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"
EMAIL_FROM="noreply@mindpal.com"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://your-domain.com/api/auth/google/callback"

# App URLs
FRONTEND_URL="https://your-domain.com"
API_URL="https://api.your-domain.com"

# Node Environment
NODE_ENV=production
PORT=3001
```

### 2. **Web Environment Variables** (`apps/web/.env.local`)

```env
# API Endpoint
NEXT_PUBLIC_API_URL="https://api.your-domain.com"

# Supabase (Frontend)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"

# App Info
NEXT_PUBLIC_APP_NAME="MindPal"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

---

## 🎯 Deployment Options

### **Option A: Vercel (Web) + Railway (API)** - Recommended ⭐

#### **Deploy API to Railway**

1. **Create Railway Account**
   - Go to: https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   cd apps/api
   railway init
   ```

3. **Configure Railway**
   - Add all environment variables from `.env`
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Enable automatic deployments from GitHub

4. **Deploy**
   ```bash
   railway up
   ```

5. **Get API URL**
   - Railway will provide: `https://your-app.up.railway.app`
   - Update `NEXT_PUBLIC_API_URL` in web app

#### **Deploy Web to Vercel**

1. **Create Vercel Account**
   - Go to: https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Framework: Next.js
   - Root Directory: `apps/web`

3. **Configure Build Settings**
   ```
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Add Environment Variables**
   - Add all variables from `.env.local`
   - Set `NEXT_PUBLIC_API_URL` to your Railway API URL

5. **Deploy**
   - Click "Deploy"
   - Vercel will auto-deploy on every push to main

---

### **Option B: All-in-One VPS (DigitalOcean/AWS/Azure)**

#### **1. Setup Ubuntu Server**

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install SSL certificates
apt install -y certbot python3-certbot-nginx
```

#### **2. Clone Repository**

```bash
# Clone your repo
git clone https://github.com/souravdas090300/mindpal-learning-app.git
cd mindpal-learning-app

# Install dependencies
npm install
```

#### **3. Configure Environment**

```bash
# Create API .env
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
# Add all production variables

# Create Web .env
cp apps/web/.env.local.example apps/web/.env.local
nano apps/web/.env.local
# Add all production variables
```

#### **4. Build Applications**

```bash
# Build API
cd apps/api
npm install
npm run build

# Build Web
cd ../web
npm install
npm run build
```

#### **5. Setup PM2**

```bash
# Start API
cd apps/api
pm2 start npm --name "mindpal-api" -- start

# Start Web
cd ../web
pm2 start npm --name "mindpal-web" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### **6. Configure Nginx**

```nginx
# /etc/nginx/sites-available/mindpal

# API Server
server {
    listen 80;
    server_name api.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Web App
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/mindpal /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Setup SSL
certbot --nginx -d your-domain.com -d www.your-domain.com
certbot --nginx -d api.your-domain.com
```

---

### **Option C: Docker Deployment**

#### **1. Create Dockerfiles**

**API Dockerfile** (`apps/api/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

**Web Dockerfile** (`apps/web/Dockerfile`):
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
```

#### **2. Docker Compose** (`docker-compose.yml`):

```yaml
version: '3.8'

services:
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    env_file:
      - ./apps/api/.env
    restart: unless-stopped

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - ./apps/web/.env.local
    depends_on:
      - api
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
      - web
    restart: unless-stopped
```

#### **3. Deploy with Docker**

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🔒 Security Checklist

### Before Going Live

- [ ] Change all default passwords
- [ ] Generate new JWT_SECRET (at least 32 characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Set secure CORS origins
- [ ] Enable rate limiting on API
- [ ] Set proper Supabase RLS policies
- [ ] Enable Supabase Auth (if using)
- [ ] Review and restrict API keys
- [ ] Enable database backups
- [ ] Set up monitoring/logging
- [ ] Configure firewall rules
- [ ] Remove debug/console logs
- [ ] Enable security headers
- [ ] Test authentication flow
- [ ] Test password reset
- [ ] Verify email sending

---

## 📊 Post-Deployment

### 1. **Verify Deployment**

```bash
# Test API health
curl https://api.your-domain.com/api/health

# Test Web app
curl https://your-domain.com

# Test authentication
curl -X POST https://api.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 2. **Setup Monitoring**

**Recommended Tools:**
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Uptime Robot** - Uptime monitoring
- **Google Analytics** - User analytics
- **PostHog** - Product analytics

### 3. **Setup CI/CD**

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          # Your deployment commands
          # e.g., railway up, vercel deploy --prod
```

---

## 🎯 Performance Optimization

### API Optimizations
```bash
# Enable production mode
NODE_ENV=production

# Use clustering for better CPU utilization
pm2 start app.js -i max

# Enable caching
# Add Redis for session/cache management
```

### Web Optimizations
- ✅ Next.js automatic code splitting
- ✅ Image optimization (Next.js Image component)
- ✅ Enable CDN (Vercel/Cloudflare)
- ✅ Enable compression (gzip/brotli)
- ✅ Lazy load components
- ✅ Prefetch critical resources

---

## 📈 Scaling Strategies

### When to Scale

**Indicators:**
- API response time > 500ms
- Database connections maxing out
- CPU/Memory usage > 80%
- 500+ concurrent users

### Scaling Options

1. **Vertical Scaling**
   - Upgrade server resources
   - Increase database capacity

2. **Horizontal Scaling**
   - Multiple API instances with load balancer
   - Database read replicas
   - CDN for static assets

3. **Caching**
   - Redis for sessions
   - CloudFlare for CDN
   - Database query caching

---

## 🆘 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check connection string
# Verify Supabase is active
# Check firewall rules
# Test with: node apps/api/test-db-direct.js
```

**2. Build Fails**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

**3. Environment Variables Not Loading**
```bash
# Verify .env files exist
# Check variable names (NEXT_PUBLIC_ prefix for web)
# Restart servers after changes
```

**4. CORS Errors**
```bash
# Add frontend URL to API CORS whitelist
# Check FRONTEND_URL in API .env
```

---

## ✅ Final Checklist

Before announcing launch:

- [ ] Database migration completed
- [ ] All environment variables set
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] API accessible via HTTPS
- [ ] Web app accessible via HTTPS
- [ ] User registration works
- [ ] Login works
- [ ] Password reset works
- [ ] Document creation works
- [ ] Flashcard generation works
- [ ] Study rooms work
- [ ] Email sending works
- [ ] Google OAuth works (if enabled)
- [ ] Mobile responsive
- [ ] All tests passing
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Error tracking enabled

---

## 🎉 You're Ready!

**Recommended Deployment Path:**
1. ✅ Complete database migration
2. ✅ Deploy API to Railway
3. ✅ Deploy Web to Vercel
4. ✅ Configure domains
5. ✅ Setup monitoring
6. ✅ Announce launch!

**Estimated Time:** 2-4 hours

---

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [PM2 Docs](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

**Need Help?** Check the documentation or open an issue on GitHub.

**Good luck with your deployment! 🚀**
