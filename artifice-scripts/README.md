# Artifice Scripts API

This is a separate Next.js application that runs the Python streaming logic and exposes API endpoints for live order data.

## Features

- **Cron-based data fetching**: Fetches order data every minute using Vercel Cron
- **In-memory storage**: Stores orders and whale data in memory (resets on cold starts)
- **CORS-protected APIs**: Secure endpoints for the main webapp
- **Python integration**: Runs Python scripts to fetch blockchain data

## API Endpoints

### GET /api/orders
Returns live order data
- Query params: `limit` (default: 10), `marketId` (optional)

### GET /api/whales
Returns whale activity data (>$10K trades)

### POST /api/cron/fetch-orders
Internal endpoint triggered by Vercel Cron
- Protected by CRON_SECRET environment variable

## Environment Variables

Create `.env.local` with:

```bash
# CORS Origins (comma-separated list of allowed origins)
ALLOWED_ORIGINS=https://your-main-app.vercel.app,http://localhost:3000

# Vercel Cron Secret (set this in Vercel dashboard)
CRON_SECRET=your-secret-key-here
```

## Local Development

1. Install dependencies:
```bash
npm install
pip3 install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

3. Run development server:
```bash
npm run dev
```

## Deployment

1. Deploy to Vercel:
```bash
vercel --prod
```

2. Set environment variables in Vercel dashboard:
   - `ALLOWED_ORIGINS`: Your main app URL
   - `CRON_SECRET`: A random secret string

3. Enable Vercel Cron in the Vercel dashboard

## Architecture

- **Data Flow**: Python script → API route → In-memory store → API endpoints
- **Cron Schedule**: Every minute (`* * * * *`)
- **Data Retention**: Last 100 orders, 100 whales
- **Cold Starts**: Data resets on cold starts (acceptable for this use case)
