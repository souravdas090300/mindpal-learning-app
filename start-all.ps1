# MindPal - Start All Services
# This script starts Backend API, Web App, and Mobile App in separate windows

Write-Host "`n" -NoNewline
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "                                                            " -ForegroundColor Cyan
Write-Host "           STARTING MINDPAL APPLICATION                     " -ForegroundColor Cyan
Write-Host "                                                            " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\dasau\mindpal-learning-app"

# Start Backend API
Write-Host "Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\apps\api'; Write-Host 'BACKEND API' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 2

# Start Web App
Write-Host "Starting Web Application..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\apps\web'; Write-Host 'WEB APPLICATION' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 2

# Start Mobile App
Write-Host "Starting Mobile Application..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\apps\mobile'; Write-Host 'MOBILE APPLICATION' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  All services are starting in separate windows!" -ForegroundColor White
Write-Host ""
Write-Host "  Backend API:      http://localhost:3001" -ForegroundColor Cyan
Write-Host "  Web Application:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Mobile App:       Scan QR code with Expo Go" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Wait 10-15 seconds for all services to start..." -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# Wait and then open browser
Start-Sleep -Seconds 10
Write-Host "Opening web browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host " All services started successfully!" -ForegroundColor Green
Write-Host " Press any key to close this window..." -ForegroundColor Gray
Write-Host ""
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
