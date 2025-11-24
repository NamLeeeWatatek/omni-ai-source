# Frontend Environment Variables - Create .env.local Script

Write-Host "Creating frontend .env.local..." -ForegroundColor Cyan

$envContent = @"
# Casdoor Configuration
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030
NEXT_PUBLIC_CASDOOR_CLIENT_ID=ba6f6620011953635
NEXT_PUBLIC_CASDOOR_ORG_NAME=built-in
NEXT_PUBLIC_CASDOOR_APP_NAME=app-built-in

# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1

# Cloudinary (from backend .env)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=db5dqxgzt
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=n8n-img2video
"@

$envPath = "apps\web\.env.local"

$envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "Created: $envPath" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Casdoor Endpoint: http://localhost:8030" -ForegroundColor White
Write-Host "  Casdoor Client ID: ba6f6620011953635" -ForegroundColor White
Write-Host "  Backend API: http://localhost:8002/api/v1" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Backend is already running (with fallback certificate mode)" -ForegroundColor White
Write-Host "  2. Restart frontend: cd apps\web && npm run dev" -ForegroundColor White
Write-Host "  3. Test login at http://localhost:3003/login" -ForegroundColor White
Write-Host ""
