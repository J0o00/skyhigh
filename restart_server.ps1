#!/usr/bin/env pwsh

# Quick Server Restart Script
# This will restart your server to enable the Gemini API

Write-Host "🔄 Restarting ConversaIQ Server with AI enabled..." -ForegroundColor Cyan
Write-Host ""

# Change to server directory
Set-Location -Path "c:\Users\jovia\OneDrive\Desktop\ConversaIQ\server"

Write-Host "📍 Current location: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  Please STOP your current server (Ctrl+C in the server terminal)" -ForegroundColor Red
Write-Host ""
Write-Host "Then run:" -ForegroundColor Green
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "✅ Look for these messages:" -ForegroundColor Green
Write-Host "  ✨ Gemini AI initialized" -ForegroundColor White
Write-Host "  🎯 BART-MNLI classifier ready (after you add HF token)" -ForegroundColor White
Write-Host ""

Write-Host "📖 See COMPLETE_SETUP.md for Hugging Face token instructions" -ForegroundColor Cyan
