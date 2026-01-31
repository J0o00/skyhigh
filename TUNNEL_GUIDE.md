# HTTPS Tunneling Guide (Ngrok)

To test audio/video calls on your phone, you need **HTTPS**. The easiest way is using Ngrok.

## 1. Install Ngrok
1.  Download [Ngrok](https://ngrok.com/download) for Windows.
2.  Unzip it and verify it works by opening a terminal there and running `ngrok version`.

## 2. Start Tunnels (You need 2 terminals)

Since you have a Frontend (React) and a Backend (Node), you need **two** tunnels.

### Terminal A (Backend Tunnel)
Run this command to expose your Backend:
```powershell
ngrok http 5000
```
*   Copy the URL (e.g., `https://api-123.ngrok-free.app`).
*   **Keep this running!**

### Terminal B (Frontend Tunnel)
Run this command to expose your Frontend:
```powershell
ngrok http 5173
```
*   Copy the URL (e.g., `https://front-456.ngrok-free.app`).
*   **Keep this running!**

## 3. Update Configuration (Critical)
Because the URLs changed, you must tell the app where to find itself.

### Update Backend (.env)
1.  Open `server/.env`.
2.  Add your **Frontend Tunnel URL** to `CLIENT_URL`.
    ```env
    CLIENT_URL=http://localhost:5173,https://front-456.ngrok-free.app
    ```
3.  **Restart Backend Server** (`npm run dev`).

### Update Frontend (.env)
1.  In `client` folder, create/edit `.env`.
2.  Set the API URL to your **Backend Tunnel URL**:
    ```env
    VITE_API_URL=https://api-123.ngrok-free.app/api
    ```
    *(Note: Add `/api` at the end)*
3.  **Restart Frontend Server**.

## 4. Test It
Open the **Frontend Tunnel URL** (`https://front-456...`) on your phone.
*   Login.
*   Microphone should now ask for permission!
