# 🚀 Artifice Dashboard - Free Deployment Guide

This guide will help you deploy the Artifice Dashboard for free using Railway, which supports both Node.js and Python applications.

## 🎯 Deployment Options

### Option 1: Railway (Recommended - Free Tier Available)
- **Free Tier**: $5 credit monthly, enough for small applications
- **Supports**: Node.js + Python in same deployment
- **Features**: Automatic deployments, custom domains, persistent storage

### Option 2: Render (Alternative)
- **Free Tier**: Limited hours per month
- **Supports**: Node.js + Python (separate services)
- **Features**: Automatic deployments, custom domains

## 🚀 Railway Deployment (Recommended)

### Prerequisites
1. GitHub account
2. Railway account (free at [railway.app](https://railway.app))

### Step 1: Prepare Repository
1. Push your code to GitHub
2. Ensure all files are committed:
   ```bash
   git add .
   git commit -m "Deploy to Railway"
   git push origin main
   ```

### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your Artifice repository
5. Railway will automatically detect the Dockerfile and deploy

### Step 3: Configure Environment
Railway will automatically:
- Build the Docker image
- Install Python and Node.js dependencies
- Start both the Python streams and Next.js server
- Expose the application on a public URL

### Step 4: Access Your Application
- Railway will provide a public URL (e.g., `https://artifice-production.up.railway.app`)
- The application will be accessible worldwide
- Both the dashboard and API endpoints will work

## 🔧 Local Testing Before Deployment

### Test Docker Build Locally
```bash
# Build the Docker image
docker build -t artifice-dashboard .

# Run locally
docker run -p 3000:3000 artifice-dashboard
```

### Test with Docker Compose
```bash
# Start the full stack
docker-compose up --build

# Access at http://localhost:3000
```

## 📊 Monitoring Your Deployment

### Railway Dashboard
- View logs in real-time
- Monitor resource usage
- Check deployment status
- View environment variables

### Health Checks
The application includes health checks:
- **Endpoint**: `/api/orders`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds

## 🛠 Troubleshooting

### Common Issues

1. **Stream Process Fails**
   - Check Railway logs for Python errors
   - Verify HyperSync connection
   - Ensure cache directory permissions

2. **Next.js Build Fails**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check TypeScript compilation errors

3. **Port Issues**
   - Railway automatically assigns ports
   - Application uses `process.env.PORT` or defaults to 3000

### Debug Commands
```bash
# Check if processes are running
ps aux | grep -E "(python|node)"

# Check cache files
ls -la .cache/

# View recent logs
tail -f .cache/live_orders.json
```

## 🔄 Automatic Deployments

### GitHub Integration
- Push to main branch triggers automatic deployment
- Railway builds and deploys automatically
- Zero-downtime deployments

### Manual Deployments
- Use Railway CLI: `railway up`
- Or trigger from Railway dashboard

## 💰 Cost Optimization

### Railway Free Tier
- $5 credit monthly
- Sufficient for small applications
- Automatic scaling

### Resource Usage
- **Memory**: ~512MB (Python + Node.js)
- **CPU**: Minimal usage
- **Storage**: Cache files only

## 🌐 Custom Domain (Optional)

1. Go to Railway project settings
2. Add custom domain
3. Configure DNS records
4. SSL certificate auto-generated

## 📈 Scaling

### Upgrade Options
- **Hobby Plan**: $5/month for more resources
- **Pro Plan**: $20/month for production use
- **Team Plan**: For multiple developers

## 🔐 Security

### Environment Variables
- No sensitive data required
- Uses public HyperSync endpoints
- No API keys needed

### Network Security
- HTTPS enabled by default
- CORS configured for public access
- No authentication required (public dashboard)

## 📱 Mobile Access

The dashboard is fully responsive and works on:
- Desktop browsers
- Mobile devices
- Tablets
- Progressive Web App (PWA) compatible

## 🎯 Production Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Deployment successful
- [ ] Health checks passing
- [ ] Streams running
- [ ] Dashboard accessible
- [ ] API endpoints working
- [ ] Custom domain configured (optional)

## 🆘 Support

### Railway Support
- Documentation: [docs.railway.app](https://docs.railway.app)
- Community: Railway Discord
- Status: [status.railway.app](https://status.railway.app)

### Application Support
- Check logs in Railway dashboard
- Verify all services are running
- Test API endpoints manually

---

**🎉 Your Artifice Dashboard is now live and accessible worldwide!**

The deployment includes:
- ✅ Real-time HyperSync data streaming
- ✅ Next.js dashboard with live updates
- ✅ Automatic process management
- ✅ Health monitoring
- ✅ Zero-downtime deployments
