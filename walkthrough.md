# ConversaIQ Walkthrough & Status

## Project Overview
ConversaIQ is a Context-Aware Customer Intelligence & Agent Assist Platform. It provides real-time assistance to agents during calls, emails, and chats by analyzing customer context and intent.

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS (with Neon Mint/Northern Lights theme)
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB
- **Testing**: Ngrok for local tunneling (WebRTC/Mobile)

## Core Features
1.  **Unified Customer Profile**: 
    - Viewing customer details, interaction history, and potential scores.
    - Implemented in `CustomerDetail.jsx`.
2.  **Agent Assist**:
    - Real-time suggestions, keyword spotting, and call scripts.
    - Implemented in `AgentDashboard.jsx` and `AgentWebRTCCall.jsx`.
3.  **Real-time Communication**:
    - WebRTC for calls (`CallPage`, `WebRTCCall`).
    - Socket.IO for live events.
4.  **Intelligence**:
    - Keyword analysis and scoring algorithms (backend `services`).

## Current Task: Cyber-Corporate Theme
We are currently applying a "Cyber-Corporate Emerald" theme.
- [x] Global CSS (`index.css`) updated with "Neon Mint" variables and glass utilities.
- [ ] Background Component to use "Northern Lights" CSS effect.
- [x] Auth Widgets updated with glassmorphism.

## Configuration
- **Tunneling**: See `TUNNEL_GUIDE.md` for setting up ngrok for mobile testing.
- **Environment**: `.env` files in client and server manage API URLs and secrets.
