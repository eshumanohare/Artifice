# 🚀 Vercel Automated Deployment Setup

This guide will help you set up automated live orders streaming on Vercel without any manual intervention.

## 🎯 What We're Setting Up

- **Automated Cron Jobs**: Runs every 2 minutes automatically
- **Python Serverless Function**: Fetches and updates order data
- **Zero Manual Intervention**: Completely hands-off operation
- **Real-time Updates**: Your frontend gets fresh data automatically

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install with `npm install -g vercel`
3. **Git Repository**: Your code should be in a Git repo

## 🚀 Step-by-Step Setup

### Step 1: Set Environment Variable

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Add Environment Variable**:
   - Go to **Settings** → **Environment Variables**
   - Add new variable:
     - **Name**: `CRON_SECRET`
     - **Value**: `your-secret-key-here` (use a strong random string)
     - **Environment**: Production, Preview, Development

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Deploy your project
vercel --prod
```

### Step 3: Verify Deployment

1. **Check Cron Jobs**:
   - Go to Vercel Dashboard → Your Project → **Functions** tab
   - You should see `api/fetch_orders.py` listed
   - Check the **Cron Jobs** section

2. **Test the Function**:
   ```bash
   # Test manually (replace with your domain)
   curl -H "Authorization: Bearer your-secret-key-here" \
        https://your-project.vercel.app/api/fetch_orders
   ```

3. **Check Logs**:
   - Go to **Functions** → `api/fetch_orders.py` → **Logs**
   - You should see logs every 2 minutes

## 🔧 Configuration Details

### Cron Schedule
- **Current**: Every 2 minutes (`*/2 * * * *`)
- **Change**: Edit `vercel.json` to modify schedule
- **Examples**:
  - Every minute: `* * * * *`
  - Every 5 minutes: `*/5 * * * *`
  - Every hour: `0 * * * *`

### Function Settings
- **Max Duration**: 30 seconds
- **Memory**: Auto-allocated
- **Region**: Auto-selected

## 📊 Monitoring & Verification

### Check if It's Working

1. **Vercel Dashboard**:
   - Go to **Functions** → **Cron Jobs**
   - Look for successful executions

2. **Function Logs**:
   - Check logs for "✅ Orders updated successfully"
   - Should see logs every 2 minutes

3. **Test Endpoint**:
   ```bash
   # Check if orders are being generated
   curl https://your-project.vercel.app/api/orders
   ```

### Expected Log Output
```
🔄 Starting order stream update...
✅ Orders updated successfully - 5 orders
```

## 🛠️ Troubleshooting

### Cron Job Not Running

1. **Check Environment Variable**:
   - Ensure `CRON_SECRET` is set correctly
   - Redeploy after adding environment variables

2. **Check Vercel Configuration**:
   - Verify `vercel.json` is correct
   - Check function path matches file location

3. **Check Function Logs**:
   - Look for error messages
   - Check authorization errors

### No Orders in Frontend

1. **Check API Endpoint**:
   ```bash
   curl https://your-project.vercel.app/api/orders
   ```

2. **Check File Generation**:
   - The function writes to `/tmp/.cache/live_orders.json`
   - This is temporary storage in Vercel functions

3. **Check Frontend Code**:
   - Ensure it's reading from the correct API endpoint
   - Check browser network tab for API calls

### Function Timeout

1. **Check Duration**:
   - Current max duration is 30 seconds
   - Increase in `vercel.json` if needed

2. **Optimize Code**:
   - Reduce data processing
   - Use more efficient algorithms

## 🔄 Updating the Function

### To Modify the Function

1. **Edit the Code**:
   - Modify `api/fetch_orders.py`
   - Test locally if possible

2. **Redeploy**:
   ```bash
   vercel --prod
   ```

3. **Verify Changes**:
   - Check logs for new behavior
   - Test the endpoint

### To Change Schedule

1. **Edit `vercel.json`**:
   ```json
   {
     "crons": [
       {
         "path": "/api/fetch_orders",
         "schedule": "*/5 * * * *"  // Every 5 minutes
       }
     ]
   }
   ```

2. **Redeploy**:
   ```bash
   vercel --prod
   ```

## 🎉 Success Indicators

You'll know it's working when:

- ✅ **Cron Jobs**: Show successful executions in Vercel dashboard
- ✅ **Logs**: Show "Orders updated successfully" every 2 minutes
- ✅ **API**: Returns fresh order data
- ✅ **Frontend**: Displays live orders without manual intervention
- ✅ **No Manual Steps**: Everything runs automatically

## 📈 Next Steps

### For Production

1. **Real Data Integration**:
   - Replace mock data with real Polymarket API calls
   - Add proper error handling and retries

2. **Monitoring**:
   - Set up alerts for function failures
   - Monitor API response times

3. **Scaling**:
   - Adjust cron frequency based on needs
   - Consider caching strategies

### For Development

1. **Local Testing**:
   ```bash
   # Test the function locally
   python3 api/fetch_orders.py
   ```

2. **Debug Mode**:
   - Add more detailed logging
   - Test with different parameters

## 🆘 Support

If you encounter issues:

1. **Check Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
2. **Check Function Logs**: Most issues show up in logs
3. **Test Manually**: Use curl to test the function directly
4. **Redeploy**: Sometimes a fresh deployment fixes issues

---

**🎉 Congratulations!** Your live orders are now updating automatically every 2 minutes without any manual intervention!
