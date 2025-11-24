# Fix Authentication Issues

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Fixing Authentication Issues" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Issue 1: Fix .env.local API URL
Write-Host "1. Checking frontend .env.local..." -ForegroundColor Yellow

$frontendEnv = "apps\web\.env.local"

if (Test-Path $frontendEnv) {
    $content = Get-Content $frontendEnv -Raw
    
    # Check current API_URL
    if ($content -match 'NEXT_PUBLIC_API_URL=([^\r\n]+)') {
        $currentUrl = $matches[1].Trim()
        Write-Host "   Current API_URL: $currentUrl" -ForegroundColor Gray
        
        # Should be http://localhost:8002/api/v1
        if ($currentUrl -ne "http://localhost:8002/api/v1") {
            Write-Host "   Fixing API_URL..." -ForegroundColor Yellow
            $content = $content -replace 'NEXT_PUBLIC_API_URL=[^\r\n]+', 'NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1'
            $content | Set-Content $frontendEnv -NoNewline
            Write-Host "   Fixed! API_URL now points to backend (port 8002)" -ForegroundColor Green
        } else {
            Write-Host "   API_URL is correct" -ForegroundColor Green
        }
    } else {
        Write-Host "   Adding NEXT_PUBLIC_API_URL..." -ForegroundColor Yellow
        $content += "`r`nNEXT_PUBLIC_API_URL=http://localhost:8002/api/v1"
        $content | Set-Content $frontendEnv -NoNewline
        Write-Host "   Added!" -ForegroundColor Green
    }
    
    # Check Casdoor endpoint
    if ($content -match 'NEXT_PUBLIC_CASDOOR_ENDPOINT=([^\r\n]+)') {
        $endpoint = $matches[1].Trim()
        Write-Host "   Casdoor Endpoint: $endpoint" -ForegroundColor Gray
        
        # Remove /login if exists
        if ($endpoint -match '/login\s*$') {
            Write-Host "   Removing /login from endpoint..." -ForegroundColor Yellow
            $newEndpoint = $endpoint -replace '/login\s*$', ''
            $content = Get-Content $frontendEnv -Raw
            $content = $content -replace 'NEXT_PUBLIC_CASDOOR_ENDPOINT=[^\r\n]+', "NEXT_PUBLIC_CASDOOR_ENDPOINT=$newEndpoint"
            $content | Set-Content $frontendEnv -NoNewline
            Write-Host "   Fixed! Endpoint: $newEndpoint" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   Creating .env.local from .env.example..." -ForegroundColor Yellow
    if (Test-Path "apps\web\.env.example") {
        Copy-Item "apps\web\.env.example" $frontendEnv
        
        # Update with correct values
        $content = Get-Content $frontendEnv -Raw
        $content = $content -replace 'NEXT_PUBLIC_API_URL=.*', 'NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1'
        $content | Set-Content $frontendEnv -NoNewline
        
        Write-Host "   Created! Please update Casdoor credentials" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: .env.example not found!" -ForegroundColor Red
    }
}

Write-Host ""

# Issue 2: Fix backend .env
Write-Host "2. Checking backend .env..." -ForegroundColor Yellow

$backendEnv = "apps\backend\.env"

if (Test-Path $backendEnv) {
    # Check for syntax errors
    $lines = Get-Content $backendEnv
    $hasError = $false
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $lineNum = $i + 1
        
        # Check for common syntax errors
        if ($line -match '^[^#\s]' -and $line -notmatch '^[A-Z_]+=') {
            Write-Host "   Potential syntax error at line $lineNum : $line" -ForegroundColor Red
            $hasError = $true
        }
    }
    
    if ($hasError) {
        Write-Host "   Please fix syntax errors in backend .env" -ForegroundColor Yellow
        Write-Host "   Common issues:" -ForegroundColor Gray
        Write-Host "   - Multi-line values (certificates) should be on one line or escaped" -ForegroundColor Gray
        Write-Host "   - No spaces around = sign" -ForegroundColor Gray
        Write-Host "   - Quote values with special characters" -ForegroundColor Gray
    } else {
        Write-Host "   No obvious syntax errors found" -ForegroundColor Green
    }
} else {
    Write-Host "   Creating .env from .env.example..." -ForegroundColor Yellow
    if (Test-Path "apps\backend\.env.example") {
        Copy-Item "apps\backend\.env.example" $backendEnv
        Write-Host "   Created! Please update configuration" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend API URL should be:" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1" -ForegroundColor White
Write-Host ""
Write-Host "Backend should run on:" -ForegroundColor Yellow
Write-Host "  http://0.0.0.0:8002" -ForegroundColor White
Write-Host ""
Write-Host "Casdoor endpoint should be:" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030" -ForegroundColor White
Write-Host "  (NO /login at the end)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Fix any backend .env syntax errors (especially line 51)" -ForegroundColor White
Write-Host "  2. Restart backend: cd apps\backend && python run.py" -ForegroundColor White
Write-Host "  3. Restart frontend: cd apps\web && npm run dev" -ForegroundColor White
Write-Host "  4. Test login at http://localhost:3003/login" -ForegroundColor White
Write-Host ""
