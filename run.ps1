# Nome Limpo Express — Ecosystem Runner
Write-Host "===========================================================" -ForegroundColor Emerald
Write-Host "Iniciando Ecossistema Completo Nome Limpo Express" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Emerald

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Iniciar API .NET 8 (Porta 5240)
Write-Host "[1/3] Iniciando API .NET 8 na porta 5240..." -ForegroundColor Yellow
Start-Process -FilePath "dotnet" -ArgumentList "run --launch-profile http" -WorkingDirectory "$baseDir\api"

# 2. Iniciar Backoffice Ops (Porta 5242)
Write-Host "[2/3] Iniciando Backoffice Ops na porta 5242..." -ForegroundColor Yellow
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "$baseDir\frontend"

# 3. Iniciar Landing Page (Porta 5230)
Write-Host "[3/3] Iniciando Landing Page na porta 5230..." -ForegroundColor Yellow
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "$baseDir\landing"

Write-Host "===========================================================" -ForegroundColor Emerald
Write-Host "Todos os servicos foram iniciados em background:" -ForegroundColor Green
Write-Host "• API Backoffice:  http://localhost:5240 (Swagger em /swagger)" -ForegroundColor White
Write-Host "• Painel Ops:      http://localhost:5242" -ForegroundColor White
Write-Host "• Landing Page:    http://localhost:5230" -ForegroundColor White
Write-Host "===========================================================" -ForegroundColor Emerald
