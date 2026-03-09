# Quick Verification Script
# Run this to verify all new features are properly set up

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "MindPal Feature Verification Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Check 1: Backend dependencies
Write-Host "[1/8] Checking backend dependencies..." -ForegroundColor Yellow
if (Test-Path "apps\api\node_modules\socket.io" -and Test-Path "apps\api\node_modules\nodemailer") {
    Write-Host "  ✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Backend dependencies missing. Run: cd apps\api && npm install" -ForegroundColor Red
    $allPassed = $false
}

# Check 2: Frontend dependencies
Write-Host "[2/8] Checking frontend dependencies..." -ForegroundColor Yellow
if (Test-Path "apps\web\node_modules\socket.io-client") {
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Frontend dependencies missing. Run: cd apps\web && npm install" -ForegroundColor Red
    $allPassed = $false
}

# Check 3: Backend files
Write-Host "[3/8] Checking backend files..." -ForegroundColor Yellow
$backendFiles = @(
    "apps\api\src\lib\socket.ts",
    "apps\api\src\lib\email.ts",
    "apps\api\src\routes\study-rooms.ts",
    "apps\api\prisma\add-missing-features.sql"
)
$missingBackend = @()
foreach ($file in $backendFiles) {
    if (-not (Test-Path $file)) {
        $missingBackend += $file
    }
}
if ($missingBackend.Count -eq 0) {
    Write-Host "  ✓ All backend files present" -ForegroundColor Green
} else {
    Write-Host "  ✗ Missing backend files:" -ForegroundColor Red
    foreach ($file in $missingBackend) {
        Write-Host "    - $file" -ForegroundColor Red
    }
    $allPassed = $false
}

# Check 4: Frontend files
Write-Host "[4/8] Checking frontend files..." -ForegroundColor Yellow
$frontendFiles = @(
    "apps\web\src\lib\socket.ts",
    "apps\web\src\app\study-rooms\page.tsx",
    "apps\web\src\app\study-rooms\[id]\page.tsx",
    "apps\web\src\app\forgot-password\page.tsx",
    "apps\web\src\app\reset-password\page.tsx"
)
$missingFrontend = @()
foreach ($file in $frontendFiles) {
    if (-not (Test-Path $file)) {
        $missingFrontend += $file
    }
}
if ($missingFrontend.Count -eq 0) {
    Write-Host "  ✓ All frontend files present" -ForegroundColor Green
} else {
    Write-Host "  ✗ Missing frontend files:" -ForegroundColor Red
    foreach ($file in $missingFrontend) {
        Write-Host "    - $file" -ForegroundColor Red
    }
    $allPassed = $false
}

# Check 5: Test files
Write-Host "[5/8] Checking test files..." -ForegroundColor Yellow
$testFiles = @(
    "apps\api\src\__tests__\study-rooms.test.ts",
    "apps\api\src\__tests__\password-reset.test.ts"
)
$missingTests = @()
foreach ($file in $testFiles) {
    if (-not (Test-Path $file)) {
        $missingTests += $file
    }
}
if ($missingTests.Count -eq 0) {
    Write-Host "  ✓ All test files present" -ForegroundColor Green
} else {
    Write-Host "  ✗ Missing test files:" -ForegroundColor Red
    foreach ($file in $missingTests) {
        Write-Host "    - $file" -ForegroundColor Red
    }
    $allPassed = $false
}

# Check 6: Environment variables (Backend)
Write-Host "[6/8] Checking environment variables..." -ForegroundColor Yellow
if (Test-Path "apps\api\.env") {
    $envContent = Get-Content "apps\api\.env" -Raw
    $missingVars = @()
    
    if ($envContent -notmatch "DEEPSEEK_API_KEY") { $missingVars += "DEEPSEEK_API_KEY" }
    if ($envContent -notmatch "EMAIL_SERVICE") { $missingVars += "EMAIL_SERVICE" }
    if ($envContent -notmatch "EMAIL_USER") { $missingVars += "EMAIL_USER" }
    
    if ($missingVars.Count -eq 0) {
        Write-Host "  ✓ All required environment variables present" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Missing environment variables in apps\api\.env:" -ForegroundColor Yellow
        foreach ($var in $missingVars) {
            Write-Host "    - $var" -ForegroundColor Yellow
        }
        Write-Host "  Note: These are needed for the features to work properly" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ No .env file found in apps\api\" -ForegroundColor Red
    Write-Host "    Copy .env.example to .env and configure it" -ForegroundColor Red
    $allPassed = $false
}

# Check 7: Documentation
Write-Host "[7/8] Checking documentation..." -ForegroundColor Yellow
if ((Test-Path "SETUP_GUIDE.md") -and (Test-Path "IMPLEMENTATION_SUMMARY.md")) {
    Write-Host "  ✓ Documentation files present" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Some documentation files missing" -ForegroundColor Yellow
}

# Check 8: Database migration
Write-Host "[8/8] Checking database migration status..." -ForegroundColor Yellow
Write-Host "  ⚠ Cannot automatically check database. Please verify manually:" -ForegroundColor Yellow
Write-Host "    1. Run: psql -d your_database < apps\api\prisma\add-missing-features.sql" -ForegroundColor Yellow
Write-Host "    2. Or use Supabase SQL Editor to execute the migration" -ForegroundColor Yellow

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "✓ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Ensure database migration has been run" -ForegroundColor White
    Write-Host "2. Configure environment variables (EMAIL_SERVICE, DEEPSEEK_API_KEY)" -ForegroundColor White
    Write-Host "3. Start backend: cd apps\api && npm run dev" -ForegroundColor White
    Write-Host "4. Start frontend: cd apps\web && npm run dev" -ForegroundColor White
    Write-Host "5. Run tests: cd apps\api && npm test" -ForegroundColor White
} else {
    Write-Host "✗ SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the issues above before proceeding." -ForegroundColor Yellow
}

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed setup instructions, see:" -ForegroundColor Cyan
Write-Host "  - SETUP_GUIDE.md (step-by-step setup)" -ForegroundColor White
Write-Host "  - IMPLEMENTATION_SUMMARY.md (what was built)" -ForegroundColor White
Write-Host ""
