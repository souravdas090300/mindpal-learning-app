# MindPal Deployment Verification Script
# Run this script to verify all production URLs are working

param(
    [string]$ApiUrl = "",
    [string]$WebUrl = ""
)

Write-Host "🚀 MindPal Production Deployment Verification" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get URLs from user if not provided
if (-not $ApiUrl) {
    $ApiUrl = Read-Host "Enter your Railway API URL (e.g., https://your-app.up.railway.app)"
}

if (-not $WebUrl) {
    $WebUrl = Read-Host "Enter your Vercel Web URL (e.g., https://your-app.vercel.app)"
}

Write-Host ""
Write-Host "Testing API: $ApiUrl" -ForegroundColor Yellow
Write-Host "Testing Web: $WebUrl" -ForegroundColor Yellow
Write-Host ""

# Test API Health
Write-Host "1. Testing API Health Endpoint..." -ForegroundColor Green
try {
    $healthResponse = Invoke-RestMethod -Uri "$ApiUrl/api/health" -Method Get -ErrorAction Stop
    if ($healthResponse.status -eq "OK") {
        Write-Host "   ✅ API is healthy!" -ForegroundColor Green
        Write-Host "   Environment: $($healthResponse.environment)" -ForegroundColor Gray
        Write-Host "   Timestamp: $($healthResponse.timestamp)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  API returned unexpected status" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ API health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test API Signup
Write-Host "2. Testing API Signup Endpoint..." -ForegroundColor Green
$testEmail = "test-$(Get-Random)@mindpal.com"
$signupData = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Test User"
} | ConvertTo-Json

try {
    $signupResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/signup" -Method Post -Body $signupData -ContentType "application/json" -ErrorAction Stop
    if ($signupResponse.token) {
        Write-Host "   ✅ Signup works! Token received." -ForegroundColor Green
        $token = $signupResponse.token
    } else {
        Write-Host "   ⚠️  Signup succeeded but no token received" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Signup failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test Web Homepage
Write-Host "3. Testing Web Homepage..." -ForegroundColor Green
try {
    $webResponse = Invoke-WebRequest -Uri $WebUrl -Method Get -ErrorAction Stop
    if ($webResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Web homepage loads!" -ForegroundColor Green
        Write-Host "   Status: $($webResponse.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Web homepage failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test Document Creation (if we have a token)
if ($token) {
    Write-Host "4. Testing Document Creation..." -ForegroundColor Green
    $documentData = @{
        title = "Test Document"
        content = "This is a test document to verify AI processing works in production."
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    try {
        $docResponse = Invoke-RestMethod -Uri "$ApiUrl/api/documents" -Method Post -Body $documentData -Headers $headers -ErrorAction Stop
        if ($docResponse.document) {
            Write-Host "   ✅ Document creation works!" -ForegroundColor Green
            if ($docResponse.document.summary) {
                Write-Host "   ✅ AI summary generated!" -ForegroundColor Green
                Write-Host "   Summary: $($docResponse.document.summary)" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "   ❌ Document creation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 Verification Summary" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Production URLs:" -ForegroundColor Yellow
Write-Host "  API: $ApiUrl" -ForegroundColor White
Write-Host "  Web: $WebUrl" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Visit $WebUrl and test manually" -ForegroundColor White
Write-Host "  2. Create an account and test all features" -ForegroundColor White
Write-Host "  3. Monitor Railway and Vercel dashboards" -ForegroundColor White
Write-Host "  4. Check database in Supabase dashboard" -ForegroundColor White
Write-Host ""
Write-Host "✨ Deployment verification complete!" -ForegroundColor Green
