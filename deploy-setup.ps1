# 🚀 MindPal Production Deployment Setup (PowerShell)

Write-Host "🚀 MindPal Production Deployment Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Check prerequisites
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Blue

$hasGit = Get-Command git -ErrorAction SilentlyContinue
$hasNode = Get-Command node -ErrorAction SilentlyContinue

if (-not $hasGit) {
    Write-Host "❌ Git is not installed" -ForegroundColor Red
    exit 1
}

if (-not $hasNode) {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites met`n" -ForegroundColor Green

# Step 2: Install CLI tools
Write-Host "Step 2: Install deployment CLIs (optional)" -ForegroundColor Blue

$installVercel = Read-Host "Install Vercel CLI? (y/n)"
if ($installVercel -eq "y") {
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed`n" -ForegroundColor Green
}

# Step 3: Environment Variables
Write-Host "`nStep 3: Configure Environment Variables" -ForegroundColor Blue
Write-Host "Please provide the following details:`n"

$databaseUrl = Read-Host "Supabase DATABASE_URL"
$jwtSecret = Read-Host "JWT Secret (min 32 chars)"
$googleApiKey = Read-Host "Google API Key (Gemini)"

# Create .env file for API
$envContent = @"
# Production Environment Variables
DATABASE_URL="$databaseUrl"
JWT_SECRET="$jwtSecret"
NODE_ENV=production
PORT=3001

# AI Providers
GOOGLE_API_KEY="$googleApiKey"

# Optional - Add these later
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# DEEPSEEK_API_KEY=
# PINECONE_API_KEY=
"@

$envContent | Out-File -FilePath "apps\api\.env" -Encoding utf8
Write-Host "✅ .env file created at apps\api\.env`n" -ForegroundColor Green

# Step 4: Database Setup
Write-Host "Step 4: Initialize Database" -ForegroundColor Blue
$pushDb = Read-Host "Push schema to Supabase now? (y/n)"
if ($pushDb -eq "y") {
    Push-Location apps\api
    npm install
    npm run db:push
    Write-Host "✅ Database schema pushed`n" -ForegroundColor Green
    Pop-Location
}

# Step 5: Build Test
Write-Host "Step 5: Test Build" -ForegroundColor Blue
$testApi = Read-Host "Test API build? (y/n)"
if ($testApi -eq "y") {
    Push-Location apps\api
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ API build successful" -ForegroundColor Green
    } else {
        Write-Host "❌ API build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}

$testWeb = Read-Host "Test Web build? (y/n)"
if ($testWeb -eq "y") {
    Push-Location apps\web
    npm install
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Web build successful`n" -ForegroundColor Green
    } else {
        Write-Host "❌ Web build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}

# Step 6: Git Setup
Write-Host "`nStep 6: Git Repository Setup" -ForegroundColor Blue
$pushGit = Read-Host "Push to GitHub? (y/n)"
if ($pushGit -eq "y") {
    git add .
    git commit -m "Prepare for production deployment"
    $gitUrl = Read-Host "GitHub repository URL"
    git remote add origin $gitUrl 2>$null
    if ($LASTEXITCODE -ne 0) {
        git remote set-url origin $gitUrl
    }
    git push -u origin main
    Write-Host "✅ Code pushed to GitHub`n" -ForegroundColor Green
}

# Step 7: Deployment URLs
Write-Host "`nStep 7: Deployment Links" -ForegroundColor Blue
Write-Host "📝 Next Steps:`n"
Write-Host "1. Deploy Backend to your hosting provider:"
Write-Host "   → Render.com, Fly.io, or Koyeb"
Write-Host "   → Add environment variables from apps\api\.env"
Write-Host "   → Set root directory: apps/api`n"
Write-Host "2. Deploy Frontend to Vercel:"
Write-Host "   → https://vercel.com/new"
Write-Host "   → Set root directory: apps/web"
Write-Host "   → Add NEXT_PUBLIC_API_URL=https://your-api-url`n"
Write-Host "3. Update OAuth redirect URIs in Google Console"
Write-Host "   → https://console.cloud.google.com`n"
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "`nSee DEPLOYMENT_GUIDE.md for detailed instructions"
