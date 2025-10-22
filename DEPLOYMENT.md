# Artifice Dashboard - Deployment Guide

## Quick Start

### Local Development (Recommended for testing)
```bash
# Setup local environment
./deploy.sh local

# Start development (in separate terminals)
npm run dev                    # Terminal 1: Next.js app
python3 scripts/stream_orders.py  # Terminal 2: Data streaming
```

### Production Deployment

#### Option 1: Render (Recommended - Best for Python + Node.js)
1. Push your code to GitHub
2. Go to [render.com](https://render.com) and connect your repo
3. Create two services:
   - **Web Service**: Node.js, build command: `npm install && npm run build`
   - **Background Worker**: Python, build command: `pip install -r requirements.txt`
4. The `render.yaml` file is already configured

#### Option 2: Railway
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Deploy
railway login
railway up

# Add worker service for Python scripts in Railway dashboard
```

#### Option 3: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.next

# Setup background functions manually in Netlify dashboard
```

## How It Works

### Local Development
- Python script (`scripts/stream_orders.py`) creates JSON files in `.cache/` directory
- Next.js API routes read from these files
- Both processes run simultaneously

### Production Deployment
- **Web Service**: Serves the Next.js application
- **Background Worker**: Runs the Python script to fetch blockchain data
- Both services can access shared storage (varies by platform)

## File Structure
```
├── scripts/
│   └── stream_orders.py          # Python script for blockchain data
├── src/app/api/
│   ├── orders/route.ts           # API endpoint for live orders
│   └── whales/route.ts           # API endpoint for whale activity
├── .cache/                       # JSON files created by Python script
│   ├── live_orders.json
│   └── whales.json
└── deploy.sh                     # Deployment script
```

## Troubleshooting

### JSON Files Not Found
- **Local**: Make sure Python script is running (`python3 scripts/stream_orders.py`)
- **Production**: Check that background worker service is running
- **Vercel**: Python scripts don't work on Vercel (serverless limitation)

### API Endpoints Not Working
- Check browser console for errors
- Verify Python script is creating JSON files
- Check API route logs in production

### Data Not Updating
- Python script fetches data every few seconds
- Check Python script logs for errors
- Verify blockchain connection

## Environment Variables
No environment variables required for basic functionality.

## Support
- **Render**: Best for Python + Node.js applications
- **Railway**: Good alternative with easy setup
- **Netlify**: Good for static sites, limited Python support
- **Vercel**: Not recommended for this use case (no Python support)

