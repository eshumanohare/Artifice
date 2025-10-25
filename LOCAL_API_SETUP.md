# 🏠 Local API Server Setup for Artifice Dashboard

## 🎯 **Your Solution: Local API Server**

Perfect idea! You can run the Python script locally and create a simple API server to serve the JSON data to your deployed webapp.

## 🚀 **Setup Steps**

### Step 1: Start the Local API Server

```bash
cd /Users/eshumanohare/Documents/eth-online-2025/Artifice
./start_local_api.sh
```

This will:
- ✅ Activate your virtual environment
- ✅ Install Flask if needed
- ✅ Create cache directory if needed
- ✅ Start API server on http://localhost:5000

### Step 2: Start the Python Stream (in another terminal)

```bash
cd /Users/eshumanohare/Documents/eth-online-2025/Artifice
./scripts/start_all_streams.sh start
```

This will:
- ✅ Start the Python script that streams blockchain events
- ✅ Update `.cache/live_orders.json` and `.cache/whales.json`
- ✅ Run continuously

### Step 3: Deploy the Main Webapp

```bash
cd /Users/eshumanohare/Documents/eth-online-2025/Artifice
vercel --prod --yes
```

## 🔗 **API Endpoints**

Your local API server provides:

- **GET /api/orders** - Live orders data
- **GET /api/whales** - Whale activity data  
- **GET /api/health** - Health check
- **GET /api/status** - Detailed status

## 🧪 **Test the Setup**

### Test Local API:
```bash
# Health check
curl http://localhost:3001/api/health

# Get orders
curl http://localhost:3001/api/orders

# Get whales
curl http://localhost:3001/api/whales
```

### Test Main Webapp:
- Visit your deployed webapp URL
- Should show live data from your local API

## 🔧 **Configuration**

The main webapp is configured to use:
- **Local API URL**: `http://localhost:3001` (default)
- **Environment Variable**: `NEXT_PUBLIC_LOCAL_API_URL`

## 📁 **File Structure**

```
Artifice/
├── local_api_server.py          # Flask API server
├── start_local_api.sh           # Startup script
├── scripts/
│   ├── start_all_streams.sh     # Python stream starter
│   └── stream_orders.py         # Blockchain streamer
├── .cache/
│   ├── live_orders.json         # Real-time order data
│   └── whales.json              # Real-time whale data
└── src/components/
    ├── LiveOrdersFeed.tsx       # Fetches from local API
    └── WhaleActivityFeed.tsx    # Fetches from local API
```

## ✅ **Benefits**

- ✅ **Real blockchain data** from your Python script
- ✅ **Local control** over the data stream
- ✅ **Simple setup** with Flask API
- ✅ **CORS enabled** for webapp access
- ✅ **No Vercel limitations** for long-running processes

## 🎯 **Next Steps**

1. **Start local API**: `./start_local_api.sh`
2. **Start Python stream**: `./scripts/start_all_streams.sh start`
3. **Deploy webapp**: `vercel --prod --yes`
4. **Test**: Visit your webapp URL

**Your local API server will serve real-time blockchain data to your deployed webapp!** 🎉