# Simple API Test - Windows PowerShell
$API = "http://localhost:3001/api"

Write-Host "`n=== MINDPAL API TESTS ===`n" -ForegroundColor Cyan

# Test 1
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API/health"
    Write-Host "SUCCESS: $($response.status)" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 2
Write-Host "Test 2: Test Endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API/test"
    Write-Host "SUCCESS" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 3: Register
Write-Host "Test 3: Register User" -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$regBody = @{
    name = "Test User"
    email = "test$timestamp@mindpal.com"
    password = "Test123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API/auth/register" -Method POST -Body $regBody -ContentType "application/json"
    Write-Host "SUCCESS: User registered" -ForegroundColor Green
    $token = $response.token
    $userId = $response.user.id
    Write-Host "User ID: $userId"
    Write-Host "Token: $($token.Substring(0,20))..."
    $response | ConvertTo-Json
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 4: Create Document
if ($token) {
    Write-Host "Test 4: Create Document with AI" -ForegroundColor Yellow
    Write-Host "(This may take 10-30 seconds...)" -ForegroundColor Gray
    
    $docBody = @{
        title = "Machine Learning"
        content = "Machine learning is AI. It learns from data. Types: supervised, unsupervised, reinforcement."
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$API/documents" -Method POST -Body $docBody -ContentType "application/json" -Headers $headers
        Write-Host "SUCCESS: Document created" -ForegroundColor Green
        $docId = $response.id
        Write-Host "Document ID: $docId"
        if ($response.summary) {
            Write-Host "AI Summary: $($response.summary.Substring(0, [Math]::Min(80, $response.summary.Length)))..."
        }
        if ($response.flashcards) {
            Write-Host "Flashcards: $($response.flashcards.Count) created"
        }
        $response | ConvertTo-Json -Depth 3
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n---`n"
    
    # Test 5: Get Documents
    Write-Host "Test 5: Get All Documents" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$API/documents" -Headers $headers
        Write-Host "SUCCESS: Found $($response.Count) documents" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 2
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n---`n"
    
    # Test 6: Get Flashcards
    if ($docId) {
        Write-Host "Test 6: Get Flashcards" -ForegroundColor Yellow
        try {
            $response = Invoke-RestMethod -Uri "$API/flashcards/document/$docId" -Headers $headers
            Write-Host "SUCCESS: Found $($response.Count) flashcards" -ForegroundColor Green
            if ($response.Count -gt 0) {
                $flashcardId = $response[0].id
                Write-Host "First flashcard ID: $flashcardId"
                Write-Host "Question: $($response[0].question)"
                Write-Host "Answer: $($response[0].answer)"
                
                # Test 7: Review
                Write-Host "`n---`n"
                Write-Host "Test 7: Review Flashcard" -ForegroundColor Yellow
                $reviewBody = @{ quality = 4 } | ConvertTo-Json
                try {
                    $response = Invoke-RestMethod -Uri "$API/flashcards/$flashcardId/review" -Method POST -Body $reviewBody -ContentType "application/json" -Headers $headers
                    Write-Host "SUCCESS: Flashcard reviewed" -ForegroundColor Green
                    Write-Host "Next review: $($response.nextReview)"
                    Write-Host "Interval: $($response.interval) days"
                    $response | ConvertTo-Json
                } catch {
                    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== TESTS COMPLETE ===`n" -ForegroundColor Cyan
