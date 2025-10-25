# 🚀 Automated Deployment Guide

This guide provides multiple solutions to eliminate manual intervention for the live orders streaming.

## 🎯 Quick Solutions

### Option 1: Vercel + Cron Jobs (Recommended for Vercel)

**Best for**: Vercel deployments, serverless architecture

```bash
# Deploy to Vercel with automatic cron jobs
npm run deploy:vercel
```

**How it works**:
- Vercel runs `/api/stream-orders` every 30 seconds via cron
- No manual intervention needed
- Automatic scaling and reliability

**Setup**:
1. Add `CRON_SECRET` environment variable in Vercel dashboard
2. Deploy with `vercel.json` configuration
3. Orders update automatically every 30 seconds

### Option 2: Railway Deployment (Recommended for Python)

**Best for**: Full Python streaming, dedicated service

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy Python service
npm run deploy:railway
```

**How it works**:
- Railway runs your Python script as a background service
- Automatic restarts on failure
- Built-in monitoring and logs

### Option 3: Docker + Any Cloud Provider

**Best for**: Maximum control, any cloud provider

```bash
# Build and run with Docker
npm run docker:build
npm run docker:run

# Or use Docker Compose
npm run docker:compose
```

**How it works**:
- Containerized Python streaming service
- Can deploy to AWS, GCP, Azure, DigitalOcean, etc.
- Health checks and automatic restarts

### Option 4: PM2 Process Manager

**Best for**: VPS or dedicated server

```bash
# Install PM2 globally
npm install -g pm2

# Start streaming service
npm run stream:pm2

# Check status
npm run stream:status

# View logs
npm run stream:logs
```

**How it works**:
- PM2 manages the Python process
- Automatic restarts on failure
- Built-in monitoring and clustering

## 🔧 Detailed Setup Instructions

### Vercel Setup (Serverless)

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add: `CRON_SECRET` = `your-secret-key`

3. **Verify Cron Jobs**:
   - Check Vercel Functions tab for cron job status
   - Orders should update every 30 seconds automatically

### Railway Setup (Python Service)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Monitor Service**:
   ```bash
   railway logs
   railway status
   ```

### Docker Setup (Any Cloud)

1. **Build Image**:
   ```bash
   docker build -t artifice-stream .
   ```

2. **Run Container**:
   ```bash
   docker run -d --name artifice-stream -v $(pwd)/cache:/app/.cache artifice-stream
   ```

3. **Or Use Docker Compose**:
   ```bash
   docker-compose up -d
   ```

### PM2 Setup (VPS/Server)

1. **Install PM2**:
   ```bash
   npm install -g pm2
   ```

2. **Start Service**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

3. **Monitor**:
   ```bash
   pm2 status
   pm2 logs artifice-stream
   ```

## 📊 Monitoring & Maintenance

### Check Service Status

```bash
# Vercel
vercel logs

# Railway
railway logs

# Docker
docker logs artifice-stream

# PM2
pm2 status
pm2 logs artifice-stream
```

### Restart Services

```bash
# Vercel (automatic)
# No action needed - Vercel handles restarts

# Railway
railway restart

# Docker
docker restart artifice-stream

# PM2
pm2 restart artifice-stream
```

### View Live Orders

```bash
# Check if orders file exists and has recent data
cat .cache/live_orders.json | jq '.lastUpdate'

# Check file size and modification time
ls -la .cache/live_orders.json
```

## 🚨 Troubleshooting

### No Orders Appearing

1. **Check Service Status**:
   ```bash
   # For PM2
   pm2 status
   
   # For Docker
   docker ps
   
   # For Railway
   railway status
   ```

2. **Check Logs**:
   ```bash
   # For PM2
   pm2 logs artifice-stream
   
   # For Docker
   docker logs artifice-stream
   
   # For Railway
   railway logs
   ```

3. **Check File Permissions**:
   ```bash
   ls -la .cache/
   chmod 755 .cache/
   ```

### Service Keeps Crashing

1. **Check Python Dependencies**:
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Check Network Connectivity**:
   ```bash
   python3 -c "import hypersync; print('Hypersync OK')"
   ```

3. **Check Disk Space**:
   ```bash
   df -h
   ```

## 🎉 Success Indicators

You'll know it's working when:

- ✅ Service shows "running" status
- ✅ `.cache/live_orders.json` file exists and updates regularly
- ✅ Logs show "📦 Received X events" messages
- ✅ Frontend displays live orders
- ✅ No manual intervention needed

## 💡 Pro Tips

1. **Use Railway for Python**: Best for long-running Python processes
2. **Use Vercel for Frontend**: Best for Next.js applications
3. **Use Docker for Control**: Maximum flexibility and portability
4. **Use PM2 for VPS**: Great for dedicated servers

## 🔄 Migration from Manual

If you're currently running manually:

1. **Stop manual process**: `Ctrl+C` in terminal
2. **Choose your preferred solution** from above
3. **Deploy using the commands** provided
4. **Verify it's working** with monitoring commands
5. **Enjoy automated streaming!** 🎉

---

**Need help?** Check the logs first, then refer to the troubleshooting section above.
