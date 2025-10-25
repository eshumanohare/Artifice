# 🧹 Clean Project Structure - Artifice

## 📁 **Main Project Structure**

### **Core Application**
- `src/` - Next.js main web application
- `public/` - Static assets (logos, images)
- `package.json` - Main app dependencies
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration

### **Scripts Directory** (`scripts/`)
- `mock_stream_orders.py` - **Main data stream** (generates realistic order data)
- `api_server.py` - **Local API server** (serves JSON data via HTTP)
- `start_all_streams.sh` - **Start script** (starts mock stream)
- `start_local_api.sh` - **API startup script** (starts API server)
- `stop_all_streams.sh` - **Stop script** (stops all processes)
- `api_requirements.txt` - Python dependencies for API server
- `monitor_cache.py` - Cache monitoring utility

### **Deployment**
- `artifice-scripts/` - Separate Vercel deployment for scripts
- `vercel.json` - Vercel configuration
- `stop_api.sh` - Stop API script

### **Environment**
- `env/` - Python virtual environment
- `requirements.txt` - Python dependencies

### **Documentation**
- `README.md` - Main project documentation
- `LIVE_ORDERS_README.md` - Live orders setup guide
- `LOCAL_API_SETUP.md` - Local API setup guide
- `START_LIVE_ORDERS.md` - Quick start guide
- `STREAM_SPEED_FIX.md` - Stream speed configuration

## 🚀 **How to Use**

### **Start Everything**
```bash
cd scripts
./start_all_streams.sh
```

### **Start API Server Only**
```bash
cd scripts
./start_local_api.sh
```

### **Stop Everything**
```bash
cd scripts
./stop_all_streams.sh
```

## ✅ **What Was Cleaned Up**

### **Removed Files:**
- ❌ `stream_orders.py` - Broken due to Hypersync issues
- ❌ `stream_orders_fixed.py` - Redundant
- ❌ `local_api_server.py` - Duplicate of `scripts/api_server.py`
- ❌ `start_local_api.sh` - Duplicate of `scripts/start_local_api.sh`
- ❌ `test_hypersync.py` - No longer needed
- ❌ `nohup.out` - Log files
- ❌ `api.log` - Log files
- ❌ 15+ redundant documentation files
- ❌ 6+ test scripts

### **Current Working Files:**
- ✅ `mock_stream_orders.py` - Working data generator
- ✅ `api_server.py` - Working API server
- ✅ `start_all_streams.sh` - Working startup script
- ✅ All essential documentation

## 🎯 **Current Status**

- **Data Stream**: ✅ Working (mock data)
- **API Server**: ✅ Working (serves JSON)
- **Web App**: ✅ Working (fetches from local API)
- **Deployment**: ✅ Ready (both apps deployed)

The project is now clean and organized with only the essential files needed for operation!
