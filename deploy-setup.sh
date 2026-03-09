#!/bin/bash
# Quick Deployment Setup Script for Linux/Mac

echo "🚀 MindPal Production Deployment Setup"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Step 2: Install CLI tools
echo -e "${BLUE}Step 2: Install deployment CLIs (optional)${NC}"

read -p "Install Vercel CLI? (y/n): " install_vercel
if [ "$install_vercel" = "y" ]; then
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
fi
echo ""

# Step 3: Environment Variables
echo -e "${BLUE}Step 3: Configure Environment Variables${NC}"
echo "Please provide the following details:"
echo ""

read -p "Supabase DATABASE_URL: " database_url
read -p "JWT Secret (min 32 chars): " jwt_secret
read -p "Google API Key (Gemini): " google_api_key

# Create .env file for API
cat > apps/api/.env << EOF
# Production Environment Variables
DATABASE_URL="${database_url}"
JWT_SECRET="${jwt_secret}"
NODE_ENV=production
PORT=3001

# AI Providers
GOOGLE_API_KEY="${google_api_key}"

# Optional - Add these later
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# DEEPSEEK_API_KEY=
# PINECONE_API_KEY=
EOF

echo -e "${GREEN}✅ .env file created at apps/api/.env${NC}"
echo ""

# Step 4: Database Setup
echo -e "${BLUE}Step 4: Initialize Database${NC}"
read -p "Push schema to Supabase now? (y/n): " push_db
if [ "$push_db" = "y" ]; then
    cd apps/api
    npm install
    npm run db:push
    echo -e "${GREEN}✅ Database schema pushed${NC}"
    cd ../..
fi
echo ""

# Step 5: Build Test
echo -e "${BLUE}Step 5: Test Build${NC}"
read -p "Test API build? (y/n): " test_api
if [ "$test_api" = "y" ]; then
    cd apps/api
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ API build successful${NC}"
    else
        echo -e "${RED}❌ API build failed${NC}"
        exit 1
    fi
    cd ../..
fi

read -p "Test Web build? (y/n): " test_web
if [ "$test_web" = "y" ]; then
    cd apps/web
    npm install
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Web build successful${NC}"
    else
        echo -e "${RED}❌ Web build failed${NC}"
        exit 1
    fi
    cd ../..
fi
echo ""

# Step 6: Git Setup
echo -e "${BLUE}Step 6: Git Repository Setup${NC}"
read -p "Push to GitHub? (y/n): " push_git
if [ "$push_git" = "y" ]; then
    git add .
    git commit -m "Prepare for production deployment"
    read -p "GitHub repository URL: " git_url
    git remote add origin $git_url 2>/dev/null || git remote set-url origin $git_url
    git push -u origin main
    echo -e "${GREEN}✅ Code pushed to GitHub${NC}"
fi
echo ""

# Step 7: Deployment URLs
echo -e "${BLUE}Step 7: Deployment Links${NC}"
echo "📝 Next Steps:"
echo ""
echo "1. Deploy Backend to your hosting provider:"
echo "   → Render.com, Fly.io, or Koyeb"
echo "   → Add environment variables from apps/api/.env"
echo "   → Set root directory: apps/api"
echo ""
echo "2. Deploy Frontend to Vercel:"
echo "   → https://vercel.com/new"
echo "   → Set root directory: apps/web"
echo "   → Add NEXT_PUBLIC_API_URL=https://your-api-url"
echo ""
echo "3. Update OAuth redirect URIs in Google Console"
echo "   → https://console.cloud.google.com"
echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions"
