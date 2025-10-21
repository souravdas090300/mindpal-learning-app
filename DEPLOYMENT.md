# 🚀 MindPal Deployment Guide

Complete step-by-step guide to deploy your MindPal app to production.

## 📋 Deployment Overview

- **API Backend**: Railway (https://railway.app)
- **Web Frontend**: Vercel (https://vercel.com)
- **Mobile App**: Expo (https://expo.dev)
- **Database**: Supabase (Already configured)

---

## 🎯 Pre-Deployment Checklist

### ✅ What's Already Done:
- [x] Railway configuration files (`railway.json`, `railway.toml`)
- [x] Vercel configuration files (`vercel.json`)
- [x] Database setup (Supabase)
- [x] Environment variables configured locally
- [x] Health check endpoint (`/api/health`)
- [x] Build scripts configured
- [x] Google OAuth credentials obtained
- [x] AI API keys (OpenAI, Gemini, Claude)

### 📝 What You Need:
- [ ] Railway account (free tier available)
- [ ] Vercel account (free tier available)
- [ ] GitHub repository pushed
- [ ] Production domain URLs (will get after deployment)

---

## 🔧 Step 1: Deploy API to Railway

### 1.1 Create Railway Account

1. Go to https://railway.app
2. Click "Sign up" or "Login with GitHub"
3. Authorize Railway to access your GitHub

### 1.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `souravdas090300/mindpal-learning-app`
4. Railway will detect it's a monorepo

### 1.3 Configure the API Service

1. Railway will ask which folder to deploy
2. Select: **`apps/api`**
3. Railway will auto-detect:
   - Builder: Nixpacks
   - Framework: Node.js/Express
   - Build command: `npm run build`
   - Start command: `npm start`

### 1.4 Add Environment Variables

Click on your service → **Variables** tab → Add all these:

**⚠️ IMPORTANT**: Replace the placeholder values with your actual values from `apps/api/.env`

```env
# Database (Copy from your .env file)
DATABASE_URL=your-supabase-database-url-here

# Supabase (Copy from your .env file)
SUPABASE_URL=your-supabase-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Server
NODE_ENV=production
PORT=3001

# JWT Secret (Copy from your .env file - KEEP IT SECRET!)
JWT_SECRET=your-jwt-secret-here

# AI Providers (Copy from your .env file)
OPENAI_API_KEY=your-openai-key-here
GOOGLE_API_KEY=your-gemini-key-here
ANTHROPIC_API_KEY=your-claude-key-here

# Google OAuth (Copy from your .env file)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=https://YOUR-RAILWAY-APP.up.railway.app/api/auth/google/callback
WEB_APP_URL=https://YOUR-VERCEL-APP.vercel.app
```

### 1.5 Deploy!

1. Click **"Deploy"** button
2. Wait for build to complete (2-3 minutes)
3. Railway will give you a URL like: `https://mindpal-api-production-xxxx.up.railway.app`
4. **COPY THIS URL** - you'll need it!

### 1.6 Verify API Deployment

Test your API:
```bash
# Health check
curl https://YOUR-RAILWAY-URL.up.railway.app/api/health

# Should return:
# {"status":"OK","timestamp":"...","environment":"production"}
```

---

## 🌐 Step 2: Deploy Web to Vercel

### 2.1 Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign up" or "Continue with GitHub"
3. Authorize Vercel to access your GitHub

### 2.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Find your repository: `souravdas090300/mindpal-learning-app`
3. Click **"Import"**

### 2.3 Configure Build Settings

Vercel will auto-detect Next.js, but configure:

1. **Framework Preset**: Next.js
2. **Root Directory**: `apps/web` ← IMPORTANT!
3. **Build Command**: `npm run build` (auto-filled)
4. **Output Directory**: `.next` (auto-filled)
5. **Install Command**: `npm install` (auto-filled)

### 2.4 Add Environment Variables

Click **"Environment Variables"** → Add:

```env
# API URL (Use your Railway URL from Step 1.5)
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
```

### 2.5 Deploy!

1. Click **"Deploy"** button
2. Wait for build (1-2 minutes)
3. Vercel will give you a URL like: `https://mindpal-web.vercel.app`
4. **COPY THIS URL** - you'll need it!

### 2.6 Verify Web Deployment

1. Visit your Vercel URL
2. You should see the MindPal login page
3. Try signing up/logging in

---

## 🔄 Step 3: Update Google OAuth URLs

Now that you have production URLs, update Google OAuth:

### 3.1 Update Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your **Web Client** OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins**:
   - `https://YOUR-VERCEL-URL.vercel.app`
4. Add to **Authorized redirect URIs**:
   - `https://YOUR-RAILWAY-URL.up.railway.app/api/auth/google/callback`
5. Click **"Save"**

### 3.2 Update Railway Environment Variables

Go back to Railway → Your API service → Variables:

1. Update `GOOGLE_CALLBACK_URL`:
   ```
   https://YOUR-RAILWAY-URL.up.railway.app/api/auth/google/callback
   ```

2. Update `WEB_APP_URL`:
   ```
   https://YOUR-VERCEL-URL.vercel.app
   ```

3. Click **"Redeploy"** to apply changes

---

## 📱 Step 4: Build Mobile App (Optional)

### 4.1 Update Mobile Environment

Edit `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
```

### 4.2 Build with Expo

```bash
cd apps/mobile

# For development build
npx expo build:android
npx expo build:ios

# OR use EAS Build (recommended)
npm install -g eas-cli
eas login
eas build --platform all
```

### 4.3 Test with Expo Go (Quick Test)

```bash
# Update the API URL, then:
npm start

# Scan QR code with Expo Go app
```

---

## 🗄️ Step 5: Run Database Migrations

Your database schema needs to be pushed to production:

### 5.1 From Local Machine

```bash
cd apps/api

# Make sure DATABASE_URL is set to production
# (Your Supabase URL is already production)

npx prisma generate
npx prisma db push

# This will update your Supabase database with the schema
```

**⚠️ Important**: This will update your production database. Make sure you're ready!

---

## ✅ Step 6: Verify Everything Works

### 6.1 Test API Endpoints

```bash
# Health check
curl https://YOUR-RAILWAY-URL.up.railway.app/api/health

# Test endpoint
curl https://YOUR-RAILWAY-URL.up.railway.app/api/test
```

### 6.2 Test Web App

1. Visit your Vercel URL
2. Sign up with email
3. Create a document
4. Test Google OAuth sign-in
5. Generate AI summary
6. Create flashcards

### 6.3 Test Mobile App

1. Update API URL in mobile app
2. Run with Expo Go
3. Test authentication
4. Test document creation

---

## 🔒 Step 7: Security Checklist

### Production Security:

- [ ] Use HTTPS everywhere (Railway and Vercel do this automatically)
- [ ] Keep API keys secret (never commit to Git)
- [ ] Use environment variables for all sensitive data
- [ ] Enable CORS only for your domains
- [ ] Use strong JWT secret (already have one)
- [ ] Rate limiting enabled (consider adding)
- [ ] Database connection pooling (Supabase handles this)

---

## 🎯 Quick Deployment Commands

### Deploy API Update:
```bash
# Railway auto-deploys on push to main
git add .
git commit -m "Update API"
git push origin main
# Railway will auto-deploy
```

### Deploy Web Update:
```bash
# Vercel auto-deploys on push to main
git add .
git commit -m "Update web"
git push origin main
# Vercel will auto-deploy
```

### Manual Redeploy:
```bash
# Railway CLI
cd apps/api
railway up

# Vercel CLI
cd apps/web
vercel --prod
```

---

## 🐛 Troubleshooting

### API Not Starting on Railway

**Check logs**:
1. Railway Dashboard → Your service → "Deployments"
2. Click on latest deployment → "View Logs"

**Common issues**:
- Missing environment variables
- Database connection failed
- Build errors (TypeScript)

**Solution**: Check Railway logs and add missing env vars

### Web App Can't Connect to API

**Issue**: CORS error or network error

**Check**:
1. `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. API is running (check Railway logs)
3. CORS is configured for your Vercel domain

**Fix**: Add Vercel URL to CORS whitelist in `apps/api/src/index.ts`

### Google OAuth Not Working

**Issue**: Redirect URI mismatch

**Check**:
1. Google Console redirect URIs include production URLs
2. `GOOGLE_CALLBACK_URL` in Railway is correct
3. `WEB_APP_URL` in Railway is correct

**Fix**: Update Google Console OAuth settings

### Database Connection Issues

**Issue**: Prisma can't connect

**Check**:
1. `DATABASE_URL` is correct
2. Supabase is running
3. Connection pooler is used (port 6543)

**Fix**: Verify DATABASE_URL in Railway matches Supabase

---

## 📊 Monitoring

### Railway Metrics
- CPU usage
- Memory usage
- Request logs
- Error logs

### Vercel Analytics
- Page views
- Performance metrics
- Error tracking

### Database (Supabase)
- Query performance
- Connection pool status
- Storage usage

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] API health check returns OK
- [ ] Web app loads without errors
- [ ] User signup/login works
- [ ] Google OAuth sign-in works
- [ ] Documents can be created
- [ ] AI summary generation works
- [ ] Flashcards can be created
- [ ] Mobile app connects to API (if deployed)

---

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Expo Docs**: https://docs.expo.dev

---

## 🚀 Your Production URLs

Once deployed, update this section:

```
✅ API (Railway): https://_____________________.up.railway.app
✅ Web (Vercel): https://_____________________.vercel.app
✅ Mobile (Expo): exp://_____________________ (Expo Go)
```

---

## 🎯 Next Steps After Deployment

1. **Custom Domain** (Optional):
   - Railway: Add custom domain in settings
   - Vercel: Add custom domain in settings

2. **Set up CI/CD**:
   - Automatic deploys on push (already enabled!)
   - Preview deployments for PRs

3. **Monitoring**:
   - Set up error tracking (Sentry)
   - Performance monitoring
   - Uptime monitoring

4. **Backups**:
   - Database backups (Supabase handles this)
   - Regular snapshots

5. **Scaling**:
   - Railway: Upgrade plan if needed
   - Vercel: Upgrade plan for more bandwidth
   - Database: Monitor Supabase limits

---

## ✅ Deployment Complete!

Your MindPal app is now live! 🎉

**Share your app**:
- Web: https://your-vercel-url.vercel.app
- API: https://your-railway-url.up.railway.app

**Keep your users updated** and monitor the logs for any issues.

Happy deploying! 🚀
