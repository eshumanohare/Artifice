# 🚀 Envio HyperIndex Deployment Guide

This guide will help you deploy your Polymarket orders indexer to Envio's hosted service, replacing the manual Python streaming with a robust, automated blockchain indexing solution.

## 🎯 What We're Building

- **Real-time Blockchain Indexing**: Automatically indexes OrderFilled events from Polymarket CTF Exchange
- **GraphQL API**: Provides a powerful query interface for your frontend
- **Scalable Infrastructure**: Handles high-volume trading data without manual intervention
- **Automatic Updates**: No more manual script management - it runs 24/7

## 📋 Prerequisites

1. **GitHub Account**: For repository hosting
2. **Envio Account**: Sign up at [envio.dev](https://envio.dev)
3. **API Token**: `6f20c5c4-0f67-4713-9bd4-4d56760b8122` (already provided)

## 🚀 Step-by-Step Deployment

### Step 1: Push to GitHub

First, let's push the indexer code to GitHub:

```bash
# Initialize git repository
cd envio-indexer
git init
git add .
git commit -m "Initial Envio indexer setup"

# Create GitHub repository and push
# (You'll need to create a new repository on GitHub first)
git remote add origin https://github.com/yourusername/polymarket-orders-indexer.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Envio

1. **Visit Envio Dashboard**: Go to [app.envio.dev](https://app.envio.dev)
2. **Log in with GitHub**: Authenticate using your GitHub account
3. **Select Organization**: Choose your personal account or organization
4. **Install GitHub App**: Grant access to your repository

### Step 3: Configure Your Indexer

1. **Add New Indexer**: Click "Add Indexer" in the dashboard
2. **Connect Repository**: Select `polymarket-orders-indexer`
3. **Configure Settings**:
   - **Config File Path**: `config.yaml`
   - **Root Directory**: `.` (current directory)
   - **Deployment Branch**: `main`
   - **Environment Variables**: Add `ENVIO_API_TOKEN` = `6f20c5c4-0f67-4713-9bd4-4d56760b8122`

### Step 4: Deploy

1. **Push to Deploy**: Any push to the `main` branch will trigger deployment
2. **Monitor Progress**: Watch the deployment in the Envio dashboard
3. **Check Logs**: Verify the indexer is processing events correctly

## 🔧 Configuration Details

### Contract Information
- **Contract**: CTF Exchange
- **Address**: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
- **Network**: Polygon (Chain ID: 137)
- **Event**: OrderFilled

### Indexed Data
- **Orders**: Real-time OrderFilled events
- **Markets**: Market information and statistics
- **Daily Stats**: Aggregated daily trading data

## 📊 Monitoring Your Indexer

### Dashboard Features
- **Real-time Progress**: See indexing status and progress
- **Performance Metrics**: Monitor processing speed and health
- **Error Logs**: Debug any issues that arise
- **Data Statistics**: View indexed data counts and trends

### Alerts (Optional)
Set up notifications for:
- Indexer stopped processing
- High error rates
- Storage limits approaching
- New deployments

## 🔌 Frontend Integration

Your frontend is already configured to use the Envio data! The changes we made:

1. **Updated API Route**: `/api/orders` now fetches from Envio
2. **Added Envio Client**: Handles GraphQL queries to Envio
3. **Data Conversion**: Converts Envio data to your existing format
4. **Fallback Handling**: Gracefully handles Envio unavailability

### Environment Variables

Add these to your Vercel environment variables:

```bash
NEXT_PUBLIC_ENVIO_ENDPOINT=https://your-envio-endpoint.com/graphql
NEXT_PUBLIC_ENVIO_API_TOKEN=6f20c5c4-0f67-4713-9bd4-4d56760b8122
```

## 🎉 Benefits Over Manual Streaming

### ✅ **What You Get**
- **Zero Manual Intervention**: Runs automatically 24/7
- **Reliable Data**: No more missed events or crashes
- **Scalable**: Handles any volume of trading activity
- **Queryable**: Powerful GraphQL API for complex queries
- **Historical Data**: Access to all past orders, not just recent ones
- **Real-time Updates**: Sub-second latency for new orders

### ❌ **What You No Longer Need**
- Manual `./scripts/start_all_streams.sh` execution
- Python process management
- Local file storage
- Cron job maintenance
- Manual error handling and restarts

## 🔍 Querying Your Data

Once deployed, you can query your indexed data:

### Recent Orders
```graphql
query GetRecentOrders {
  orders(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    orderHash
    maker
    taker
    side
    price
    volumeUsd
    marketQuestion
    timestamp
  }
}
```

### Market Statistics
```graphql
query GetMarketStats($tokenId: String!) {
  market(id: $tokenId) {
    id
    question
    totalVolume
    totalOrders
    status
  }
}
```

### Daily Statistics
```graphql
query GetDailyStats($date: String!) {
  dailyStats(id: $date) {
    id
    totalVolume
    totalOrders
    uniqueTraders
    avgOrderSize
  }
}
```

## 🛠️ Development Workflow

### Local Development
```bash
cd envio-indexer
npm install
npm run dev
```

### Making Changes
1. **Edit Code**: Modify event handlers or schema
2. **Test Locally**: Run `npm run dev` to test
3. **Commit & Push**: Push to `main` branch
4. **Auto-Deploy**: Envio automatically deploys your changes

### Monitoring Changes
- Check Envio dashboard for deployment status
- Review logs for any errors
- Test your frontend to ensure data flows correctly

## 🚨 Troubleshooting

### Common Issues

1. **Indexer Not Starting**
   - Check contract address and ABI
   - Verify network configuration
   - Review environment variables

2. **No Data Being Indexed**
   - Check if contract is active
   - Verify event signatures
   - Review start block configuration

3. **Frontend Not Getting Data**
   - Check Envio endpoint URL
   - Verify API token
   - Review GraphQL queries

### Getting Help

- **Envio Documentation**: [docs.envio.dev](https://docs.envio.dev)
- **Community Discord**: Join Envio's Discord
- **GitHub Issues**: Report bugs in your repository

## 🎯 Next Steps

1. **Deploy the Indexer**: Follow the deployment steps above
2. **Test the Frontend**: Verify orders are loading from Envio
3. **Monitor Performance**: Check the Envio dashboard regularly
4. **Set Up Alerts**: Configure notifications for important events
5. **Scale as Needed**: Upgrade your plan if you hit limits

## 🎉 Success!

Once deployed, your live orders will update automatically without any manual intervention. The Envio indexer will:

- ✅ Monitor the blockchain 24/7
- ✅ Index new orders in real-time
- ✅ Provide a reliable GraphQL API
- ✅ Handle any volume of trading activity
- ✅ Scale automatically with your needs

**No more manual script management - your live orders are now fully automated!** 🚀
