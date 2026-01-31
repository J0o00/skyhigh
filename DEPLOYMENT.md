# Deployment Instructions for ConversaIQ (Railway)

## Prerequisites

1. **GitHub Repository**: Your code is already pushed to GitHub ✅
2. **Railway Account**: Sign up at [railway.app](https://railway.app) (No credit card required!)
3. **MongoDB Atlas** (Free tier): [mongodb.com/atlas](https://www.mongodb.com/atlas)

---

## Backend Deployment (Railway)

### Step 1: Create MongoDB Database (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a **free M0 cluster**
3. Create a database user (username + password)
4. **Network Access**: Add IP `0.0.0.0/0` (allow from anywhere)
5. Click **Connect** → **Connect your application**
6. Copy the connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/conversaiq`)

### Step 2: Deploy Backend to Railway

1. **Go to Railway Dashboard**: [railway.app/dashboard](https://railway.app/dashboard)

2. **Create New Project**:
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Connect your GitHub account if not connected
   - Select your repository

3. **Configure Service**:
   - Railway will auto-detect Node.js
   - **Root Directory**: Set to `server`
   - **Start Command**: `npm start` (should auto-detect)
   - **Build Command**: `npm install` (should auto-detect)

4. **Add Environment Variables**:
   Click on your service → **Variables** tab → Add these:
   
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   PORT=$PORT
   CLIENT_URL=<will-set-after-frontend-deployment>
   ALLOWED_ORIGINS=<will-set-after-frontend-deployment>
   JWT_SECRET=conversaiq-secure-secret-2026
   IMAP_HOST=imap.gmail.com
   IMAP_PORT=993
   IMAP_USER=conversaliq@gmail.com
   IMAP_PASSWORD=fijxvzvzxzkrqgjz
   IMAP_POLL_INTERVAL=60000
   ```

5. **Deploy**:
   - Railway will automatically deploy
   - Wait for deployment to complete
   - Copy your Railway URL (looks like: `https://conversaiq-backend-production.up.railway.app`)

---

## Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy Frontend

```bash
cd client
vercel login
vercel --prod
```

Follow the prompts:
- **Set up and deploy**: `Y`
- **Which scope**: Select your account
- **Link to existing project**: `N`
- **Project name**: `conversaiq` (or your choice)
- **Directory**: `./` (current directory)
- **Override settings**: `N`

### Step 3: Copy Deployed URL

After deployment completes, Vercel will show your URL (e.g., `https://conversaiq.vercel.app`)

### Step 4: Update Backend CORS

Go back to Railway → Your service → **Variables** → Update:
```
CLIENT_URL=https://conversaiq.vercel.app
ALLOWED_ORIGINS=https://conversaiq.vercel.app
```

Railway will automatically redeploy with new environment variables.

---

## Seed the Database

After backend is deployed and MongoDB is connected:

```bash
# In your local server directory
cd server

# Temporarily update .env to use MongoDB Atlas URI
MONGODB_URI=<your-atlas-uri> npm run seed
```

This will create demo users and sample data.

---

## Post-Deployment Testing

### 1. Test Backend
Visit: `https://your-backend.up.railway.app/api`

Should see API documentation with version info.

### 2. Test Frontend
Visit: `https://conversaiq.vercel.app`

Try logging in with demo accounts:
- **Agent**: `sarah@conversaiq.com`
- **Client**: (after seeding)
- **Admin**: (after seeding)

### 3. Check Logs
- **Railway**: Dashboard → Service → Logs
- **Vercel**: Dashboard → Project → Logs

Look for:
- ✅ MongoDB Connected
- No CORS errors in browser console

---

## Railway Configuration File (Optional)

Create `railway.json` in the root directory for advanced configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Troubleshooting

### CORS Errors
- Ensure `CLIENT_URL` and `ALLOWED_ORIGINS` match your Vercel URL **exactly**
- No trailing slashes
- Redeploy backend after changing variables

### MongoDB Connection Failed
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify connection string has correct password
- Check database user permissions

### Railway Build Failures
- Check Node version (Railway uses latest by default)
- Verify `package.json` has correct scripts
- Check Railway logs for specific errors

### Port Issues
Railway provides `$PORT` environment variable automatically - the server should use `process.env.PORT`.

---

## Cost

- **Railway**: $5 credit free (no card required), then pay-as-you-go
- **Vercel**: Free tier (100GB bandwidth/month, 100 serverless function invocations)
- **MongoDB Atlas**: Free M0 tier (512MB storage)

**Total MVP cost**: $0 with free tiers! 🎉

---

## Expected URLs

Save these for reference:
- **Backend**: `https://conversaiq-backend-production.up.railway.app`
- **Frontend**: `https://conversaiq.vercel.app`
