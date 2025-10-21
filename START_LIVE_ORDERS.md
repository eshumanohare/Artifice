# 🚀 Start Live Orders Feed

## Quick Start

### 1. Install Python Dependencies

```bash
pip3 install -r requirements.txt
```

### 2. Start the Python Stream (in one terminal)

```bash
python3 scripts/stream_orders.py
```

You should see:
```
============================================================
Polymarket Live Orders Stream
============================================================
🚀 Starting OrderFilled event stream...
📍 Starting from block 64123456 (current: 64124456)
📡 Streaming from block 64123456...
📦 Received 25 events
✅ Updated file with 25 orders
```

### 3. Start Next.js Dev Server (in another terminal)

```bash
npm run dev
```

### 4. Open Your Browser

```
http://localhost:3000
```

You should see live orders on the right side of the homepage! 🎉

## How It Works

```
┌─────────────────┐
│  Python Script  │ ──▶ Streams events from Hypersync
│  (runs forever) │ ──▶ Writes to .cache/live_orders.json
└─────────────────┘
         │
         │ JSON File
         ▼
┌─────────────────┐
│  Next.js API    │ ──▶ Reads from .cache/live_orders.json
│  /api/orders    │ ──▶ Returns orders to frontend
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Homepage      │ ──▶ Displays orders
│ LiveOrdersFeed  │ ──▶ Auto-refreshes every 5 seconds
└─────────────────┘
```

## Troubleshooting

### Python script won't start?

**Check Python version:**
```bash
python3 --version  # Should be 3.8+
```

**Install hypersync:**
```bash
pip3 install hypersync
```

### No orders showing?

1. **Check if Python script is running:**
   - You should see logs in the terminal where you ran `python3 scripts/stream_orders.py`
   
2. **Check if file is being created:**
   ```bash
   cat .cache/live_orders.json
   ```
   
3. **Check Next.js logs:**
   - Look for "✅ Loaded X orders from file"
   - If you see "⚠️ Orders file not found", Python script isn't running

### Python script crashes?

The script will auto-retry on errors. Common issues:
- Network connectivity
- Hypersync API temporarily down
- Just restart the script

## Production Deployment

For production, run the Python script as a background service:

**Using PM2:**
```bash
pm2 start scripts/stream_orders.py --name live-orders --interpreter python3
pm2 save
pm2 startup
```

**Using systemd:**
Create `/etc/systemd/system/live-orders.service`:
```ini
[Unit]
Description=Live Orders Stream
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Artifice
ExecStart=/usr/bin/python3 scripts/stream_orders.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable live-orders
sudo systemctl start live-orders
```

## File Structure

```
Artifice/
├── scripts/
│   └── stream_orders.py    ← Python stream (run this!)
├── .cache/
│   └── live_orders.json    ← Orders data (auto-generated)
├── src/
│   ├── app/
│   │   └── api/
│   │       └── orders/
│   │           └── route.ts  ← API reads from JSON
│   └── components/
│       └── LiveOrdersFeed.tsx ← Frontend display
├── requirements.txt         ← Python dependencies
└── START_LIVE_ORDERS.md    ← This file
```

## Commands Cheat Sheet

```bash
# Install Python deps
pip3 install -r requirements.txt

# Start Python stream (Terminal 1)
python3 scripts/stream_orders.py

# Start Next.js dev server (Terminal 2)
npm run dev

# Check if orders file exists
ls -lh .cache/live_orders.json

# View orders file
cat .cache/live_orders.json | jq

# Stop Python stream
# Just Ctrl+C in the terminal where it's running
```

## Notes

- Python script needs to keep running for live updates
- Orders are kept in memory (last 50) and written to JSON file
- Next.js reads from file every time `/api/orders` is called
- Frontend auto-refreshes every 5 seconds
- File is automatically created in `.cache/` directory

