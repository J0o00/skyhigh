# Tunneling Guide (External Access)

## Option 1: Cloudflare Tunnel (Recommended)
Cloudflare Tunnel is free, stable, and **does not show browser warnings**.

1. **Start Backend & Frontend Locally**:
   - Backend: `npm run dev` (port 5000)
   - Frontend: `npm run dev` (port 5173)

2. **Start the Tunnel**:
   ```powershell
   # Run the included script
   ./simple_cf.ps1
   ```

3. **Access**:
   - The script will show a URL (e.g. `https://random-word.trycloudflare.com`).
   - Open this URL on your phone.
   - Microphone permissions will work automatically.

**Note**: You only need **ONE** tunnel (port 5173). The frontend automatically proxies API requests to the backend (port 5000) thanks to the `vite.config.js` proxy settings.

## Option 2: Ngrok (Legacy)
If you prefer Ngrok:
1. `ngrok http 5173`
2. **Warning**: Free accounts show a "Browser Warning" page which can break APIs. You must set `ngrok-skip-browser-warning` headers in your requests.

## Troubleshooting
- **Microphone**: Both options provide HTTPS, so microphone access works.
- **Connection Refused**: Ensure your local servers (npm run dev) are actually running before starting the tunnel.
