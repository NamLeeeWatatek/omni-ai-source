# Fix Duplicate /login in Casdoor Endpoint

Write-Host "Fixing duplicate /login in Casdoor endpoint..." -ForegroundColor Cyan
Write-Host ""

$envFile = "apps\web\.env.local"

if (-Not (Test-Path $envFile)) {
    Write-Host "Error: .env.local not found!" -ForegroundColor Red
    Write-Host "Please create .env.local first" -ForegroundColor Yellow
    exit 1
}

# Backup
Write-Host "Creating backup..." -ForegroundColor Yellow
Copy-Item $envFile "$envFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "Backup created" -ForegroundColor Green

# Read current content
$content = Get-Content $envFile -Raw

# Show current endpoint
if ($content -match 'NEXT_PUBLIC_CASDOOR_ENDPOINT=([^\r\n]+)') {
    $currentEndpoint = $matches[1]
    Write-Host ""
    Write-Host "Current endpoint: $currentEndpoint" -ForegroundColor Yellow
    
    # Check if it has /login at the end
    if ($currentEndpoint -match '/login\s*$') {
        Write-Host "Found /login at the end - fixing..." -ForegroundColor Yellow
        
        # Remove /login from the end
        $newEndpoint = $currentEndpoint -replace '/login\s*$', ''
        
        # Replace in content
        $content = $content -replace 'NEXT_PUBLIC_CASDOOR_ENDPOINT=[^\r\n]+', "NEXT_PUBLIC_CASDOOR_ENDPOINT=$newEndpoint"
        
        # Save
        $content | Set-Content $envFile -NoNewline
        
        Write-Host ""
        Write-Host "Fixed!" -ForegroundColor Green
        Write-Host "New endpoint: $newEndpoint" -ForegroundColor Green
        Write-Host ""
        Write-Host "Please restart your frontend server:" -ForegroundColor Cyan
        Write-Host "  cd apps\web" -ForegroundColor Gray
        Write-Host "  npm run dev" -ForegroundColor Gray
    } else {
        Write-Host "Endpoint looks correct (no /login at end)" -ForegroundColor Green
        Write-Host "No changes needed" -ForegroundColor Green
    }
} else {
    Write-Host "Could not find NEXT_PUBLIC_CASDOOR_ENDPOINT in .env.local" -ForegroundColor Red
}

Write-Host ""
