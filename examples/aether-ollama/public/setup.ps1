# Aether-Ollama Setup Script for Windows
# Sets OLLAMA_ORIGINS=* so your browser can talk to your local Ollama.
# Safe: Ollama only listens on 127.0.0.1 - no external access is granted.
#
# Run this in an Administrator PowerShell for best results:
#   Right-click PowerShell -> "Run as administrator", then paste the irm command.

Write-Host ""
Write-Host "  Aether-Ollama Setup" -ForegroundColor Cyan
Write-Host "  ===================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Set OLLAMA_ORIGINS ────────────────────────────────────────────────────

Write-Host "  Setting OLLAMA_ORIGINS..." -ForegroundColor Yellow

# Always set for the current session
$env:OLLAMA_ORIGINS = "*"

# User-level (no admin needed, survives reboots for user processes)
[System.Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")

# Machine-level via setx (most reliable — new processes always inherit this)
$setxResult = & setx OLLAMA_ORIGINS "*" /M 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Set system-wide via setx (Machine scope)." -ForegroundColor Green
} else {
    Write-Host "  Could not set Machine-level variable: $setxResult" -ForegroundColor Yellow
    Write-Host "  User-level is set; restart your PC if issues persist." -ForegroundColor Yellow
}

# ── 2. Restart Ollama ────────────────────────────────────────────────────────

Write-Host "  Stopping Ollama..." -ForegroundColor Yellow

# Kill every Ollama-related process (covers both 'ollama' and 'ollama app')
Get-Process -Name "ollama*" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  Killing: $($_.Name) (PID $($_.Id))"
    $_ | Stop-Process -Force
}
Start-Sleep -Seconds 2

# ── 3. Relaunch Ollama ───────────────────────────────────────────────────────

Write-Host "  Starting Ollama..." -ForegroundColor Yellow

# Check for the standard tray-app install path first
$trayApp  = "$env:LOCALAPPDATA\Programs\Ollama\ollama app.exe"
$cliApp   = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"

if (Test-Path $trayApp) {
    # Launch the tray app — it internally starts the server with env from session
    Start-Process $trayApp
    Write-Host "  Launched Ollama tray app." -ForegroundColor Green
} elseif (Test-Path $cliApp) {
    Start-Process $cliApp -ArgumentList "serve" -WindowStyle Hidden
    Write-Host "  Launched ollama serve." -ForegroundColor Green
} else {
    # Last resort: rely on PATH
    $found = Get-Command "ollama" -ErrorAction SilentlyContinue
    if ($found) {
        Start-Process $found.Source -ArgumentList "serve" -WindowStyle Hidden
        Write-Host "  Launched ollama from PATH." -ForegroundColor Green
    } else {
        Write-Host "  Could not find Ollama executable." -ForegroundColor Red
        Write-Host "  Install it first: https://ollama.com/download" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "  Done! Wait 3 seconds, then reload ollama-chat.agkavin.dev" -ForegroundColor Green
Write-Host "  and click the refresh (circling arrows) button." -ForegroundColor Green
Write-Host ""
Write-Host "  Tip: If it still fails, log out and log back in," -ForegroundColor DarkGray
Write-Host "  or restart your PC — this flushes env vars for all apps." -ForegroundColor DarkGray
Write-Host ""
