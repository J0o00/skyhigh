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

---

## 📚 Appendix: How to get MongoDB Atlas (Free)
Since your Render backend is in the cloud, it cannot connect to the MongoDB on your laptop. You need a free cloud database.

1.  **Sign Up**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and register (Free).
2.  **Create Cluster**: Select **M0 Free** (Shared) -> Create.
3.  **Create User**:
    *   Go to **Database Access** (sidebar).
    *   Add New Database User -> Password Authentication.
    *   Username: `admin`, Password: `(create a strong password)`.
    *   **Save this password!**
4.  **Allow Network Access** (Critical):
    *   Go to **Network Access** (sidebar).
    *   Add IP Address -> **Allow Access From Anywhere** (`0.0.0.0/0`).
    *   Confirm.
5.  **Get Configuration String**:
    *   Go to **Database** (sidebar) -> Click **Connect**.
    *   Select **Drivers** (Node.js).
    *   Copy the string: `mongodb+srv://admin:<password>@cluster0...`
    *   Replace `<password>` with your actual password.
    *   **Use this string for the `MONGO_URI` in Render.**
