# Deployment Instructions for ConversaIQ

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas** (Recommended): Set up a free MongoDB cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)

---

## Backend Deployment (Render)

### Option 1: Using Render Blueprint (Automated)

1. **Push Code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy from Render Dashboard**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the `conversaiq` repository
   - Render will auto-detect `render.yaml` and configure everything

3. **Set Environment Variables** (in Render dashboard)
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `CLIENT_URL`: Will be set after frontend deployment
   - `ALLOWED_ORIGINS`: Same as CLIENT_URL
   - `IMAP_USER`: conversaliq@gmail.com
   - `IMAP_PASSWORD`: fijxvzvzxzkrqgjz

### Option 2: Manual Setup

1. **Create New Web Service**
   - Dashboard → "New +" → "Web Service"
   - Connect GitHub repository
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

2. **Add Environment Variables** (same as above)

3. **Deploy** - Render will build and deploy automatically

---

## Frontend Deployment (Vercel - Recommended)

### Why Vercel?
- Better for static React apps
- Automatic HTTPS
- Global CDN
- Free tier is generous

### Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Client Directory**
   ```bash
   cd client
   vercel --prod
   ```

4. **Configure Project**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: Leave as `client`

5. **Set Environment Variables** (in Vercel dashboard)
   After deployment, add:
   ```
   VITE_API_URL=https://conversaiq-backend.onrender.com
   ```

6. **Update Backend CORS**
   Go back to Render dashboard and update:
   - `CLIENT_URL`: Your Vercel URL (e.g., https://conversaiq.vercel.app)
   - `ALLOWED_ORIGINS`: Same as above

---

## Alternative: Deploy Frontend to Render (Static Site)

1. **Create Static Site**
   - Dashboard → "New +" → "Static Site"
   - Connect repository
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

2. **Add Rewrite Rules in `render.yaml`**
   ```yaml
   services:
     - type: web
       name: conversaiq-frontend
       runtime: static
       buildCommand: npm install && npm run build
       staticPublishPath: ./dist
       routes:
         - type: rewrite
           source: /*
           destination: /index.html
   ```

---

## Post-Deployment Steps

1. **Test the Deployed Backend**
   - Visit `https://your-backend-url.onrender.com/api`
   - Should see API documentation

2. **Test the Frontend**
   - Visit your frontend URL
   - Try logging in
   - Check browser console for CORS errors

3. **Seed the Database** (if using MongoDB Atlas)
   ```bash
   # Temporarily set MONGODB_URI to Atlas in local .env
   cd server
   npm run seed
   ```

4. **Monitor Logs**
   - Render Dashboard → Service → Logs
   - Look for "MongoDB Connected" and no errors

---

## Troubleshooting

### CORS Errors
- Ensure `CLIENT_URL` and `ALLOWED_ORIGINS` match your frontend URL exactly
- No trailing slashes

### MongoDB Connection Failed
- Check MongoDB Atlas IP Whitelist (add `0.0.0.0/0` to allow all)
- Verify connection string is correct
- Check database user permissions

### Build Failures
- Check Node version (should be >= 18)
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

### Frontend Build Errors
- Check for any TypeScript/ESLint errors
- Try building locally first: `npm run build`

---

## Expected Deployment URLs

- **Backend**: `https://conversaiq-backend.onrender.com`
- **Frontend**: `https://conversaiq.vercel.app` (or similar)

Save these URLs for future reference!
