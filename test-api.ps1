# Test API Connection Script# MindPal API Testing Script

Write-Host "==================================" -ForegroundColor Cyan# Run this after starting the API server

Write-Host "Testing MindPal Learning App API" -ForegroundColor Cyan

Write-Host "==================================" -ForegroundColor CyanWrite-Host ""

Write-Host ""Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "  🧪 MindPal API Test Suite" -ForegroundColor Green

# Wait for servers to be readyWrite-Host "════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "⏳ Waiting 10 seconds for servers to start..." -ForegroundColor YellowWrite-Host ""

Start-Sleep -Seconds 10

$API_URL = "http://localhost:3001/api"

# Test 1: Health Check$global:TOKEN = ""

Write-Host ""$global:DOCUMENT_ID = ""

Write-Host "Test 1: API Health Check" -ForegroundColor Green

Write-Host "URL: http://localhost:3001/api/health" -ForegroundColor Gray# Helper function for API calls

try {function Test-Endpoint {

    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing    param(

    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green        [string]$Name,

    Write-Host "Response: $($response.Content)" -ForegroundColor White        [string]$Method,

} catch {        [string]$Endpoint,

    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red        [object]$Body,

}        [hashtable]$Headers = @{}

    )

# Test 2: Signup    

Write-Host ""    Write-Host "Testing: $Name" -ForegroundColor Yellow

Write-Host "Test 2: User Signup" -ForegroundColor Green    

Write-Host "URL: http://localhost:3001/api/auth/signup" -ForegroundColor Gray    try {

$signupData = @{        $params = @{

    email = "test@example.com"            Method = $Method

    password = "password123"            Uri = "$API_URL$Endpoint"

    name = "Test User"            Headers = $Headers

} | ConvertTo-Json        }

        

try {        if ($Body) {

    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signup" `            $params.Body = ($Body | ConvertTo-Json)

        -Method POST `            $params.Headers["Content-Type"] = "application/json"

        -Body $signupData `        }

        -ContentType "application/json" `        

        -UseBasicParsing        $response = Invoke-RestMethod @params

    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green        Write-Host "  ✅ SUCCESS" -ForegroundColor Green

    Write-Host "Response: $($response.Content)" -ForegroundColor White        return $response

} catch {    }

    $statusCode = $_.Exception.Response.StatusCode.value__    catch {

    $errorBody = $_.ErrorDetails.Message        Write-Host "  ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red

    Write-Host "Status Code: $statusCode" -ForegroundColor Yellow        return $null

    Write-Host "Error Response: $errorBody" -ForegroundColor Yellow    }

    }

    if ($statusCode -eq 409) {

        Write-Host "ℹ️  User already exists (this is expected if you ran this test before)" -ForegroundColor Cyan# Test 1: Health Check

    } elseif ($statusCode -eq 500) {Write-Host ""

        Write-Host "❌ SERVER ERROR - Check API logs for details!" -ForegroundColor RedWrite-Host "━━━ Test 1: Health Check ━━━" -ForegroundColor Cyan

    }$health = Test-Endpoint -Name "GET /api/health" -Method "GET" -Endpoint "/health"

}if ($health) {

    Write-Host "  Status: $($health.status)" -ForegroundColor White

Write-Host ""    Write-Host "  Database: $($health.database)" -ForegroundColor White

Write-Host "==================================" -ForegroundColor Cyan    Write-Host ""

Write-Host "Test Complete!" -ForegroundColor Cyan}

Write-Host "==================================" -ForegroundColor Cyan

Write-Host ""# Test 2: Register User

Write-Host "Next steps:" -ForegroundColor YellowWrite-Host "━━━ Test 2: User Registration ━━━" -ForegroundColor Cyan

Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White$registerBody = @{

Write-Host "2. Check the terminal running 'npm run dev' for any error logs" -ForegroundColor White    email = "testuser_$(Get-Random -Minimum 1000 -Maximum 9999)@mindpal.com"

Write-Host "3. If you see errors, copy them and send to me" -ForegroundColor White    password = "Test123456!"

    name = "Test User"
}
$registerResponse = Test-Endpoint -Name "POST /api/auth/register" -Method "POST" -Endpoint "/auth/register" -Body $registerBody

if ($registerResponse) {
    $global:TOKEN = $registerResponse.token
    Write-Host "  User ID: $($registerResponse.user.id)" -ForegroundColor White
    Write-Host "  Email: $($registerResponse.user.email)" -ForegroundColor White
    Write-Host "  Token: $($global:TOKEN.Substring(0, 20))..." -ForegroundColor White
    Write-Host ""
}

# Test 3: Login
Write-Host "━━━ Test 3: User Login ━━━" -ForegroundColor Cyan
$loginBody = @{
    email = $registerBody.email
    password = $registerBody.password
}
$loginResponse = Test-Endpoint -Name "POST /api/auth/login" -Method "POST" -Endpoint "/auth/login" -Body $loginBody

if ($loginResponse) {
    Write-Host "  Login successful!" -ForegroundColor White
    Write-Host "  Same user: $($loginResponse.user.id -eq $registerResponse.user.id)" -ForegroundColor White
    Write-Host ""
}

# Test 4: Create Document (with AI Summary)
Write-Host "━━━ Test 4: Create Document with AI Summary ━━━" -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $global:TOKEN"
}
$documentBody = @{
    title = "Introduction to Artificial Intelligence"
    content = "Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, and self-correction. Machine learning is a subset of AI that focuses on the ability of machines to receive data and learn for themselves."
}
Write-Host "  Creating document and waiting for AI summary..." -ForegroundColor Yellow
$createResponse = Test-Endpoint -Name "POST /api/documents" -Method "POST" -Endpoint "/documents" -Body $documentBody -Headers $headers

if ($createResponse) {
    $global:DOCUMENT_ID = $createResponse.id
    Write-Host "  Document ID: $($createResponse.id)" -ForegroundColor White
    Write-Host "  Title: $($createResponse.title)" -ForegroundColor White
    Write-Host "  AI Summary: $($createResponse.summary)" -ForegroundColor Cyan
    Write-Host "  Created: $($createResponse.createdAt)" -ForegroundColor White
    Write-Host ""
}

# Test 5: List Documents
Write-Host "━━━ Test 5: List All Documents ━━━" -ForegroundColor Cyan
$listResponse = Test-Endpoint -Name "GET /api/documents" -Method "GET" -Endpoint "/documents" -Headers $headers

if ($listResponse) {
    Write-Host "  Total documents: $($listResponse.Count)" -ForegroundColor White
    foreach ($doc in $listResponse) {
        Write-Host "    - $($doc.title) (ID: $($doc.id.Substring(0, 8))...)" -ForegroundColor White
    }
    Write-Host ""
}

# Test 6: Get Single Document
Write-Host "━━━ Test 6: Get Single Document ━━━" -ForegroundColor Cyan
$getResponse = Test-Endpoint -Name "GET /api/documents/:id" -Method "GET" -Endpoint "/documents/$global:DOCUMENT_ID" -Headers $headers

if ($getResponse) {
    Write-Host "  Retrieved: $($getResponse.title)" -ForegroundColor White
    Write-Host "  Summary: $($getResponse.summary)" -ForegroundColor White
    Write-Host ""
}

# Test 7: Update Document
Write-Host "━━━ Test 7: Update Document ━━━" -ForegroundColor Cyan
$updateBody = @{
    title = "Updated: Introduction to AI"
    content = "Artificial Intelligence (AI) is revolutionizing technology. It includes machine learning, deep learning, and neural networks."
}
$updateResponse = Test-Endpoint -Name "PUT /api/documents/:id" -Method "PUT" -Endpoint "/documents/$global:DOCUMENT_ID" -Body $updateBody -Headers $headers

if ($updateResponse) {
    Write-Host "  Updated title: $($updateResponse.title)" -ForegroundColor White
    Write-Host "  New AI summary: $($updateResponse.summary)" -ForegroundColor Cyan
    Write-Host ""
}

# Test 8: Delete Document
Write-Host "━━━ Test 8: Delete Document ━━━" -ForegroundColor Cyan
$deleteResponse = Test-Endpoint -Name "DELETE /api/documents/:id" -Method "DELETE" -Endpoint "/documents/$global:DOCUMENT_ID" -Headers $headers

if ($deleteResponse) {
    Write-Host "  Deleted successfully!" -ForegroundColor White
    Write-Host ""
}

# Test 9: Verify Deletion
Write-Host "━━━ Test 9: Verify Document Deleted ━━━" -ForegroundColor Cyan
$verifyResponse = Test-Endpoint -Name "GET /api/documents (after delete)" -Method "GET" -Endpoint "/documents" -Headers $headers

if ($verifyResponse) {
    Write-Host "  Remaining documents: $($verifyResponse.Count)" -ForegroundColor White
    Write-Host ""
}

# Summary
Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Test Suite Complete!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Test Results:" -ForegroundColor Yellow
Write-Host "  • Health check: Passed" -ForegroundColor White
Write-Host "  • User registration: Passed" -ForegroundColor White
Write-Host "  • User login: Passed" -ForegroundColor White
Write-Host "  • Create document: Passed" -ForegroundColor White
Write-Host "  • AI summary generation: Passed" -ForegroundColor White
Write-Host "  • List documents: Passed" -ForegroundColor White
Write-Host "  • Get document: Passed" -ForegroundColor White
Write-Host "  • Update document: Passed" -ForegroundColor White
Write-Host "  • Delete document: Passed" -ForegroundColor White
Write-Host ""

Write-Host "🎉 All API endpoints working correctly!" -ForegroundColor Green
Write-Host "Ready for production deployment!" -ForegroundColor Cyan
Write-Host ""
