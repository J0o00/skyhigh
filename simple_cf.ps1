$path = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$log = "cloudflare.log"
Write-Host "Starting tunnel..."
Start-Process -FilePath $path -ArgumentList "tunnel --url http://localhost:5173" -RedirectStandardError $log -NoNewWindow
Start-Sleep -Seconds 5
$content = Get-Content $log
$url = $content | Select-String -Pattern "https://.*\.trycloudflare\.com"
if ($url) {
    Write-Host "URL: $url"
}
else {
    Write-Host "URL not found yet, check $log"
}
