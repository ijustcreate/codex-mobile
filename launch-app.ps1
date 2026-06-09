$Host.UI.RawUI.WindowTitle = "Codex Mobile"

Write-Host ""
Write-Host "  CODEX MOBILE" -ForegroundColor Cyan
Write-Host "  Starting your app..." -ForegroundColor White
Write-Host ""

$server = Start-Process node -ArgumentList "server.js" -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 1
Start-Process "http://localhost:3000"

Write-Host "  Local link:  http://localhost:3000" -ForegroundColor Green
Write-Host "  Phone link:  creating a temporary public address..." -ForegroundColor Yellow
Write-Host "  Share the trycloudflare.com link shown below. No tunnel password is needed." -ForegroundColor Cyan
Write-Host "  Keep this window open while using the app." -ForegroundColor DarkGray
Write-Host ""

try {
  Set-Location $PSScriptRoot
  npm run share
}
finally {
  Stop-Process -Id $server.Id -ErrorAction SilentlyContinue
}
