# ConversaIQ Cloud Deployment Guide

Follow this guide to deploy your application to the professional cloud.

## Prerequisites
1.  **GitHub Repository**: Your code must be pushed to GitHub.
2.  **MongoDB Atlas**: You need a production database connection string (`MONGO_URI`).

---

## Part 1: Backend (Render)

1.  **Log in to [Render.com](https://dashboard.render.com).**
2.  Click **New +** and select **Blueprint**.
3.  Connect your GitHub repository (`ConversaIQ`).
4.  Render will find the `render.yaml` file. Click **Apply**.
5.  **Configure Environment Variables**:
    *   `MONGO_URI`: `mongodb+srv://...` (Your production DB string)
    *   `CLIENT_URL`: `https://conversaiq.vercel.app` (We will update this later once Vercel gives us a real URL).
6.  Click **Apply Changes**.
    *   Render will deploy the server.
    *   Wait for it to show "Live" or "Available".
    *   **Copy the Service URL** (e.g., `https://conversaiq-server.onrender.com`).

---

## Part 2: Frontend (Vercel)

1.  **Log in to [Vercel.com](https://vercel.com).**
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Configure Project**:
    *   **Framework Preset**: Vite (should be auto-detected).
    *   **Root Directory**: Click Edit and select `client`. (Important!)
5.  **Environment Variables**:
    *   Name: `VITE_API_URL`
    *   Value: `https://conversaiq-server.onrender.com/api` (Paste your Render URL + `/api`).
6.  Click **Deploy**.
    *   Wait for the confetti! 🎉
    *   **Copy the Deployment URL** (e.g., `https://conversaiq-beta.vercel.app`).

---

## Part 3: Final Connection

1.  Go back to **Render Dashboard** -> Your Web Service -> **Environment**.
2.  Edit `CLIENT_URL` and paste your actual **Vercel URL**.
3.  Click **Save Changes**. Render will redeploy automatically.

## ✅ Done!
Your app is now live. Open the Vercel URL to test it.
