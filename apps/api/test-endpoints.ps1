# MindPal API Test Script
# PowerShell script to test all API endpoints

$API_URL = "http://localhost:3001/api"
$TOKEN = ""
$USER_ID = ""
$DOC_ID = ""

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                                                           " -ForegroundColor Cyan
Write-Host "           MINDPAL API - ENDPOINT TEST SUITE               " -ForegroundColor Cyan
Write-Host "                                                           " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "`n📍 Testing: $Name" -ForegroundColor Yellow
    Write-Host "   → $Method $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        
        Write-Host "   ✅ PASS - Status: 200 OK" -ForegroundColor Green
        $script:testsPassed++
        return $response
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus -and $ExpectedStatus -ne 200) {
            Write-Host "   ✅ PASS - Expected error status: $statusCode" -ForegroundColor Green
            $script:testsPassed++
        }
        else {
            Write-Host "   ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
            $script:testsFailed++
        }
        return $null
    }
}

# Test 1: Health Check
Write-Host "`n🏥 PHASE 1: Health & Status Checks" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

$health = Test-Endpoint -Name "Health Check" -Method "GET" -Url "$API_URL/health"
if ($health) {
    Write-Host "   📊 Status: $($health.status)" -ForegroundColor White
    Write-Host "   📅 Time: $($health.timestamp)" -ForegroundColor White
}

$test = Test-Endpoint -Name "Test Endpoint" -Method "GET" -Url "$API_URL/test"
if ($test) {
    Write-Host "   💬 Message: $($test.message)" -ForegroundColor White
}

# Test 2: User Registration
Write-Host "`n👤 PHASE 2: Authentication" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$registerBody = @{
    name = "Test User $timestamp"
    email = "test$timestamp@mindpal.com"
    password = "Test123!@#"
} | ConvertTo-Json

$register = Test-Endpoint -Name "User Registration" -Method "POST" -Url "$API_URL/auth/register" -Body $registerBody
if ($register) {
    $TOKEN = $register.token
    $USER_ID = $register.user.id
    Write-Host "   👤 User ID: $USER_ID" -ForegroundColor White
    Write-Host "   📧 Email: $($register.user.email)" -ForegroundColor White
    Write-Host "   🔑 Token: $($TOKEN.Substring(0, 20))..." -ForegroundColor White
}

# Test 3: User Login
$loginBody = @{
    email = "test$timestamp@mindpal.com"
    password = "Test123!@#"
} | ConvertTo-Json

$login = Test-Endpoint -Name "User Login" -Method "POST" -Url "$API_URL/auth/login" -Body $loginBody
if ($login) {
    Write-Host "   ✅ Login successful" -ForegroundColor Green
}

# Test 4: Document Operations
Write-Host "`n📄 PHASE 3: Document Operations" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

$authHeaders = @{
    "Authorization" = "Bearer $TOKEN"
}

$docBody = @{
    title = "Machine Learning Basics"
    content = "Machine learning is a subset of artificial intelligence. It uses algorithms to learn patterns from data. There are three main types: supervised learning (labeled data), unsupervised learning (unlabeled data), and reinforcement learning (reward-based). Neural networks are a popular approach that mimics the human brain structure."
} | ConvertTo-Json

Write-Host "`n   ⏳ Creating document with AI processing..." -ForegroundColor Yellow
Write-Host "   (This may take 10-30 seconds for AI summary & flashcards)" -ForegroundColor Gray

$doc = Test-Endpoint -Name "Create Document (with AI)" -Method "POST" -Url "$API_URL/documents" -Body $docBody -Headers $authHeaders
if ($doc) {
    $DOC_ID = $doc.id
    Write-Host "   📝 Document ID: $DOC_ID" -ForegroundColor White
    Write-Host "   📚 Title: $($doc.title)" -ForegroundColor White
    if ($doc.summary) {
        Write-Host "   🤖 AI Summary: $($doc.summary.Substring(0, [Math]::Min(100, $doc.summary.Length)))..." -ForegroundColor White
    }
    if ($doc.flashcards) {
        Write-Host "   🎴 Flashcards Created: $($doc.flashcards.Count)" -ForegroundColor White
    }
}

$docs = Test-Endpoint -Name "Get All Documents" -Method "GET" -Url "$API_URL/documents" -Headers $authHeaders
if ($docs) {
    Write-Host "   📚 Total Documents: $($docs.Count)" -ForegroundColor White
}

if ($DOC_ID) {
    $docDetail = Test-Endpoint -Name "Get Document by ID" -Method "GET" -Url "$API_URL/documents/$DOC_ID" -Headers $authHeaders
}

# Test 5: Flashcard Operations
Write-Host "`n🎴 PHASE 4: Flashcard Operations" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

if ($DOC_ID) {
    $flashcards = Test-Endpoint -Name "Get Document Flashcards" -Method "GET" -Url "$API_URL/flashcards/document/$DOC_ID" -Headers $authHeaders
    
    if ($flashcards -and $flashcards.Count -gt 0) {
        $FLASHCARD_ID = $flashcards[0].id
        Write-Host "   🎴 Total Flashcards: $($flashcards.Count)" -ForegroundColor White
        Write-Host "   ❓ First Question: $($flashcards[0].question)" -ForegroundColor White
        Write-Host "   ✅ First Answer: $($flashcards[0].answer)" -ForegroundColor White
        
        # Test 6: Review Flashcard
        Write-Host "`n🎯 PHASE 5: Spaced Repetition (SM-2 Algorithm)" -ForegroundColor Cyan
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
        
        $reviewBody = @{
            quality = 4  # 4 = "Good" in SM-2 algorithm
        } | ConvertTo-Json
        
        $review = Test-Endpoint -Name "Review Flashcard (Quality: 4 - Good)" -Method "POST" -Url "$API_URL/flashcards/$FLASHCARD_ID/review" -Body $reviewBody -Headers $authHeaders
        
        if ($review) {
            Write-Host "   ⏰ Next Review: $($review.nextReview)" -ForegroundColor White
            Write-Host "   📅 Interval: $($review.interval) days" -ForegroundColor White
            Write-Host "   📈 Ease Factor: $($review.easeFactor)" -ForegroundColor White
            Write-Host "   🔢 Review Count: $($review.reviewCount)" -ForegroundColor White
        }
        
        # Get due flashcards
        $due = Test-Endpoint -Name "Get Due Flashcards" -Method "GET" -Url "$API_URL/flashcards/due" -Headers $authHeaders
        if ($due) {
            Write-Host "   📋 Due Flashcards: $($due.Count)" -ForegroundColor White
        }
    }
}

# Test 7: Delete Document
if ($DOC_ID) {
    Write-Host "`n🗑️  PHASE 6: Cleanup" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
    
    $delete = Test-Endpoint -Name "Delete Document" -Method "DELETE" -Url "$API_URL/documents/$DOC_ID" -Headers $authHeaders
}

# Test 8: Logout
$logout = Test-Endpoint -Name "User Logout" -Method "POST" -Url "$API_URL/auth/logout" -Headers $authHeaders

# Final Summary
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                                                           " -ForegroundColor Cyan
Write-Host "           📊 TEST RESULTS SUMMARY                         " -ForegroundColor Cyan
Write-Host "                                                           " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "   ✅ Tests Passed:  $testsPassed" -ForegroundColor Green
Write-Host "   ❌ Tests Failed:  $testsFailed" -ForegroundColor Red
Write-Host "   📝 Total Tests:   $($testsPassed + $testsFailed)" -ForegroundColor White
Write-Host ""

$percentage = [math]::Round(($testsPassed / ($testsPassed + $testsFailed)) * 100, 1)
Write-Host "   🎯 Success Rate:  $percentage%" -ForegroundColor $(if ($percentage -ge 90) { "Green" } elseif ($percentage -ge 75) { "Yellow" } else { "Red" })
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($percentage -eq 100) {
    Write-Host ""
    Write-Host "   🎉 PERFECT SCORE! ALL TESTS PASSED! 🎉" -ForegroundColor Green
    Write-Host ""
} elseif ($percentage -ge 90) {
    Write-Host ""
    Write-Host "   ⭐ EXCELLENT! Backend is production ready!" -ForegroundColor Green
    Write-Host ""
} elseif ($percentage -ge 75) {
    Write-Host ""
    Write-Host "   ⚠️  GOOD, but needs some fixes." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "   ⚠️  NEEDS ATTENTION - Multiple failures detected." -ForegroundColor Red
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
