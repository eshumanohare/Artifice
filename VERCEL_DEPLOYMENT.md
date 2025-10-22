# 🚀 Vercel Deployment Guide

## Quick Deploy to Vercel

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/eshumanohare/Artifice)

### Option 2: Manual Deploy

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy from your project directory**:
   ```bash
   vercel
   ```

3. **Follow the prompts**:
   - Link to existing project or create new
   - Choose your Git repository
   - Vercel will automatically detect Next.js

### Option 3: GitHub Integration

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your Artifice repository
5. Vercel will auto-detect Next.js and deploy

## 🐍 Python Script Setup

Since Vercel doesn't support long-running Python processes, you'll need to run the Python script separately:

### Option A: Run Locally
```bash
# In one terminal
npm run dev

# In another terminal  
python3 scripts/stream_orders.py
```

### Option B: Deploy Python to Railway/Render
1. Create a separate repository for the Python script
2. Deploy to Railway or Render as a background service
3. Update the API endpoints to point to the external service

### Option C: Use Vercel Functions
Convert the Python script to Vercel serverless functions that run on demand.

## 📊 What Works on Vercel

✅ **Next.js Frontend** - Full dashboard UI  
✅ **API Routes** - All `/api/*` endpoints  
✅ **Static Assets** - Images, CSS, etc.  
❌ **Long-running Python** - Not supported on Vercel  

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Python stream (in separate terminal)
python3 scripts/stream_orders.py
```

## 🌐 Access Your App

After deployment, Vercel will provide a URL like:
`https://artifice-xyz.vercel.app`

The dashboard will be live and accessible worldwide!
