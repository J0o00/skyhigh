$env:Path = "C:\Program Files (x86)\cloudflared;" + $env:Path
$exePath = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$logFile = "cloudflare.log"

Write-Host "Starting Cloudflare Tunnel..."
Start-Process -FilePath $exePath -ArgumentList "tunnel --url http://localhost:5173" -RedirectStandardError $logFile -NoNewWindow -PassThru

Write-Host "Waiting for URL..."

# Loop to find the URL in the log file
$url = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    if (Test-Path $logFile) {
        $content = Get-Content $logFile
        $match = $content | Select-String "https://.*\.trycloudflare\.com"
        if ($match) {
            # Extract just the URL part if there's surrounding text
            $line = $match.Matches.Value
            if ($line -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
                $url = $matches[0]
                break
            }
        }
    }
}

if ($url) {
    Write-Host ""
    Write-Host "✅ Cloudflare Tunnel Active!"
    Write-Host "🔗 URL: $url"
    Write-Host ""
    Write-Host "1. Open this URL on your phone."
    Write-Host "2. No more browser warnings!"
    Write-Host "3. Microphone will work perfectly."
    Write-Host "4. KEEP THIS WINDOW OPEN."
}
else {
    Write-Host "❌ Could not find Cloudflare URL. Check $logFile"
    Get-Content $logFile -Tail 10
}
