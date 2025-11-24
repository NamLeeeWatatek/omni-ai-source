# Quick Setup Script for WataOmi

Write-Host "WataOmi - Quick Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists in frontend
$frontendEnv = "apps\web\.env.local"
if (-Not (Test-Path $frontendEnv)) {
    Write-Host "Creating frontend .env.local..." -ForegroundColor Yellow
    Copy-Item "apps\web\.env.example" $frontendEnv
    Write-Host "Created $frontendEnv" -ForegroundColor Green
} else {
    Write-Host "Frontend .env.local already exists" -ForegroundColor Green
}

# Check if .env exists in backend
$backendEnv = "apps\backend\.env"
if (-Not (Test-Path $backendEnv)) {
    Write-Host "Creating backend .env..." -ForegroundColor Yellow
    Copy-Item "apps\backend\.env.example" $backendEnv
    Write-Host "Created $backendEnv" -ForegroundColor Green
} else {
    Write-Host "Backend .env already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "IMPORTANT: Configure Casdoor" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Use Casdoor Demo (Quick Test)" -ForegroundColor Cyan
Write-Host "  - Already configured in .env files" -ForegroundColor Gray
Write-Host "  - Just restart your servers!" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Run Casdoor Locally (Recommended)" -ForegroundColor Cyan
Write-Host "  1. Run: docker run -d --name casdoor -p 8000:8000 casbin/casdoor:latest" -ForegroundColor Gray
Write-Host "  2. Open: http://localhost:8000" -ForegroundColor Gray
Write-Host "  3. Login: admin / 123" -ForegroundColor Gray
Write-Host "  4. Create an application and update .env files" -ForegroundColor Gray
Write-Host ""
Write-Host "See CASDOOR_SETUP.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Stop your current servers (Ctrl+C)" -ForegroundColor Gray
Write-Host "  2. Restart backend: cd apps\backend && python run.py" -ForegroundColor Gray
Write-Host "  3. Restart frontend: cd apps\web && npm run dev" -ForegroundColor Gray
Write-Host "  4. Visit: http://localhost:3003/login" -ForegroundColor Gray
Write-Host ""
