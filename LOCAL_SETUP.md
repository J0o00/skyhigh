# How to Run ConversaIQ on Local Network (LAN)

You can access the application from any device (phone, laptop, tablet) connected to the same WiFi network.

## Prerequisite
Your computer (Host) and other devices (Client) must be on the **same WiFi network**.

## 1. Start the Servers
On your host computer (this machine):

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

## 2. Access from Other Devices
On your phone or other laptop, open a browser and go to:

**http://192.168.220.35:5173**

## Troubleshooting
If it doesn't load:
1. **Firewall**: Windows Firewall might block the connection.
   - Allow "Node.js" and "Vite" through the firewall if prompted.
   - Or temporarily turn off firewall for "Private networks" to test.
2. **Same Network**: Double check both devices are on the exact same WiFi.
3. **Mobile Data**: Make sure your phone is using WiFi, not mobile data.

## Features Supported
- ✅ Login/Signup
- ✅ Dashboard
- ✅ Real-time Chat
- ✅ WebRTC Calls (Microphone access might require HTTPS on some mobile browsers, but usually works on local IP for dev)
