# 📊 Live Orders Feed

## Overview

A real-time feed of ALL OrderFilled events from the Polymarket CTF Exchange on Polygon, displayed on the homepage.

## Architecture

**Python Stream** → **JSON File** → **Next.js API** → **React Component**

This approach uses:
- Python `hypersync` library (from your notebook) to stream events
- File-based communication between Python and Node.js
- Simple, reliable, and easy to deploy

## Features

✅ **Shows ALL orders** - No filtering by market or event  
✅ **Newest first** - Latest orders appear at the top  
✅ **Auto-refresh** - Updates every 5 seconds  
✅ **Color-coded** - Green for BUY, Red for SELL orders  
✅ **Real-time streaming** - Uses Hypersync Python client  
✅ **Clean UI** - Glassmorphism design matching the app  

## How It Works

1. **Python script streams events** → Uses hypersync library (like your notebook)
2. **Writes to JSON file** → `.cache/live_orders.json`
3. **Next.js API reads file** → `/api/orders` endpoint
4. **Homepage displays orders** → LiveOrdersFeed component
5. **Auto-refreshes** → Every 5 seconds

## Layout

```
Homepage:
┌─────────────────────────────────────────────────────┐
│                    Artifice                          │
│              Top Polymarket Markets                  │
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│      Markets Grid            │   Live Orders Feed   │
│   (2/3 width on desktop)     │   (1/3 width)        │
│                              │                      │
│  ┌────────┐  ┌────────┐     │   🟢 BUY 48.5¢      │
│  │Market 1│  │Market 2│     │   🔴 SELL 51.2¢     │
│  └────────┘  └────────┘     │   🟢 BUY 49.0¢      │
│                              │   ...                │
│  ┌────────┐  ┌────────┐     │                      │
│  │Market 3│  │Market 4│     │                      │
│  └────────┘  └────────┘     │                      │
│                              │                      │
└──────────────────────────────┴──────────────────────┘
```

## Quick Start

See `START_LIVE_ORDERS.md` for detailed setup instructions.

**TL;DR:**
```bash
# 1. Install Python dependencies
pip3 install -r requirements.txt

# 2. Start Python stream (Terminal 1)
python3 scripts/stream_orders.py

# 3. Start Next.js dev server (Terminal 2)
npm run dev

# 4. Open http://localhost:3000
```

## Order Side Logic

- **BUY**: `makerAssetId = 0` (USDC) → Maker is buying outcome tokens with USDC
- **SELL**: `makerAssetId ≠ 0` (outcome token) → Maker is selling outcome tokens for USDC

## Components

### `LiveOrdersFeed.tsx`
- Main component displayed on homepage
- Fetches and renders live orders
- Auto-refreshes every 5 seconds
- Shows loading and empty states

### API: `src/app/api/orders/route.ts`
- Queries Hypersync for OrderFilled events
- Decodes events from blockchain data
- Sorts by timestamp (newest first)
- Returns top 20 orders

## Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open homepage:**
   ```
   http://localhost:3000
   ```

3. **Watch server logs:**
   ```
   🔍 Fetching ALL live orders from Hypersync...
   📦 Hypersync response: { hasData: true, dataLength: X }
   📊 Processed X logs, decoded Y orders
   ✅ Returning Y most recent orders
   ```

4. **Check the feed:**
   - Should see orders on the right side of the homepage
   - Green cards = BUY orders
   - Red cards = SELL orders
   - Auto-updates every 5 seconds

## Data Flow

```
Homepage
   ↓
LiveOrdersFeed Component
   ↓
fetch('/api/orders')
   ↓
Orders API Route
   ↓
Hypersync REST API
   ↓
Decode Events
   ↓
Sort (newest first)
   ↓
Return top 20
   ↓
Display in Feed
```

## Notes

- **No caching needed** - We fetch all orders regardless of market
- **No filtering** - Shows all OrderFilled events from the exchange
- **Block range**: Last 1000 blocks (~30 minutes on Polygon)
- **Refresh rate**: Every 5 seconds
- **Display limit**: Top 20 most recent orders
- **Order sorting**: Newest at top, oldest at bottom

## Troubleshooting

**No orders showing?**
- Check server logs for Hypersync responses
- Verify the CTF Exchange contract address: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
- There may not be recent orders in the last 1000 blocks (this is normal during low activity)

**Orders not updating?**
- Check browser console for fetch errors
- Verify the component is mounted
- Check the 5-second interval is running

## Contract Info

- **CTF Exchange**: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
- **Chain**: Polygon
- **Event**: `OrderFilled(bytes32 indexed orderHash, address indexed maker, address indexed taker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled, uint256 fee)`
- **Topic0**: `0xd0a08e8c493f9c94f29311604c9de1b4e8c8d4c06bd0c789af57f2d65bfec0f6`

