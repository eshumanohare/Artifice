#!/usr/bin/env python3
"""
Stream OrderFilled events from Polymarket CTF Exchange using Hypersync
and compute rolling analytics statistics for the dashboard.
"""

import hypersync
import asyncio
import json
import time
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

# Output file path
OUTPUT_FILE = Path(__file__).parent.parent / '.cache' / 'analytics_snapshot.json'

def decode_order_event(log):
    """Decode OrderFilled event log into a clean format"""
    try:
        topics = log.topics
        data_hex = log.data[2:] if log.data.startswith('0x') else log.data
        
        # Extract indexed parameters (topics)
        order_hash = topics[1][:10] + '...' if len(topics) > 1 else ''
        maker = '0x' + topics[2][-40:] if len(topics) > 2 else ''
        taker = '0x' + topics[3][-40:] if len(topics) > 3 else ''
        
        # Extract non-indexed parameters from data
        maker_asset_id = '0x' + data_hex[0:64]
        taker_asset_id = '0x' + data_hex[64:128]
        maker_amount_filled = '0x' + data_hex[128:192]
        taker_amount_filled = '0x' + data_hex[192:256]
        fee = '0x' + data_hex[256:320]
        
        # Convert amounts
        maker_filled = int(maker_amount_filled, 16) / 1e6
        taker_filled = int(taker_amount_filled, 16) / 1e6
        
        # Determine side and price
        side = 'BUY' if int(maker_asset_id, 16) == 0 else 'SELL'
        
        if side == 'BUY':
            price = (maker_filled / taker_filled * 100) if taker_filled > 0 else 0
        else:
            price = (taker_filled / maker_filled * 100) if maker_filled > 0 else 0
        
        # Determine which token ID represents the market
        token_id = taker_asset_id if side == 'BUY' else maker_asset_id
        
        return {
            'orderHash': order_hash,
            'maker': maker,
            'taker': taker,
            'makerAssetId': maker_asset_id,
            'takerAssetId': taker_asset_id,
            'tokenId': token_id,
            'makerAmountFilled': maker_amount_filled,
            'takerAmountFilled': taker_amount_filled,
            'fee': fee,
            'blockNumber': log.block_number,
            'timestamp': int(time.time() * 1000),
            'side': side,
            'price': round(price, 2),
            'volumeUsd': maker_filled if side == 'BUY' else taker_filled
        }
    except Exception as e:
        print(f"❌ Error decoding log: {e}")
        return None

def compute_analytics(orders):
    """Compute rolling analytics from order data"""
    if not orders:
        return {
            'summary': {
                'totalVolume24h': 0,
                'totalTrades24h': 0,
                'activeTraders24h': 0,
                'activeMarkets24h': 0,
                'lastUpdate': int(time.time() * 1000)
            },
            'topMovers': [],
            'volumeLeaders': [],
            'marketMomentum': [],
            'whaleActivity': []
        }
    
    now = int(time.time() * 1000)
    cutoff_24h = now - (24 * 60 * 60 * 1000)
    cutoff_1h = now - (60 * 60 * 1000)
    
    # Filter orders by time
    orders_24h = [o for o in orders if o['timestamp'] >= cutoff_24h]
    orders_1h = [o for o in orders if o['timestamp'] >= cutoff_1h]
    
    # Group by token ID
    token_orders_24h = defaultdict(list)
    token_orders_1h = defaultdict(list)
    
    for order in orders_24h:
        if order and order.get('tokenId'):
            token_orders_24h[order['tokenId']].append(order)
    
    for order in orders_1h:
        if order and order.get('tokenId'):
            token_orders_1h[order['tokenId']].append(order)
    
    # Compute summary statistics
    total_volume_24h = sum(o['volumeUsd'] for o in orders_24h)
    total_trades_24h = len(orders_24h)
    active_traders_24h = len(set(o['maker'] for o in orders_24h) | set(o['taker'] for o in orders_24h))
    active_markets_24h = len(token_orders_24h)
    
    # Compute market-level analytics
    market_analytics = []
    
    for token_id, token_orders in token_orders_24h.items():
        if not token_orders:
            continue
        
        # Basic stats
        total_volume = sum(o['volumeUsd'] for o in token_orders)
        trade_count = len(token_orders)
        unique_traders = len(set(o['maker'] for o in token_orders) | set(o['taker'] for o in token_orders))
        
        # Price movement (first vs last trade)
        if len(token_orders) >= 2:
            first_price = token_orders[0]['price']
            last_price = token_orders[-1]['price']
            price_change = last_price - first_price
            price_change_pct = (price_change / first_price * 100) if first_price > 0 else 0
        else:
            price_change = 0
            price_change_pct = 0
        
        # Recent momentum (1h vs 24h)
        recent_orders = token_orders_1h.get(token_id, [])
        recent_volume = sum(o['volumeUsd'] for o in recent_orders)
        recent_trades = len(recent_orders)
        
        # Calculate momentum score (recent activity vs historical)
        momentum_score = 0
        if total_volume > 0:
            momentum_score = (recent_volume / total_volume) * 100
        
        # Buy/sell pressure
        buy_orders = [o for o in token_orders if o['side'] == 'BUY']
        sell_orders = [o for o in token_orders if o['side'] == 'SELL']
        buy_volume = sum(o['volumeUsd'] for o in buy_orders)
        sell_volume = sum(o['volumeUsd'] for o in sell_orders)
        total_volume_market = buy_volume + sell_volume
        
        buy_pressure = (buy_volume / total_volume_market * 100) if total_volume_market > 0 else 50
        
        market_analytics.append({
            'tokenId': token_id,
            'totalVolume': round(total_volume, 2),
            'tradeCount': trade_count,
            'uniqueTraders': unique_traders,
            'priceChange': round(price_change, 2),
            'priceChangePct': round(price_change_pct, 2),
            'recentVolume': round(recent_volume, 2),
            'recentTrades': recent_trades,
            'momentumScore': round(momentum_score, 1),
            'buyPressure': round(buy_pressure, 1),
            'sellPressure': round(100 - buy_pressure, 1)
        })
    
    # Sort and get top performers
    top_movers = sorted(market_analytics, key=lambda x: abs(x['priceChangePct']), reverse=True)[:10]
    volume_leaders = sorted(market_analytics, key=lambda x: x['totalVolume'], reverse=True)[:10]
    market_momentum = sorted(market_analytics, key=lambda x: x['momentumScore'], reverse=True)[:10]
    
    # Identify whale activity (large trades)
    whale_threshold = 10000  # $10K USD
    whale_orders = [o for o in orders_24h if o['volumeUsd'] >= whale_threshold]
    
    whale_activity = []
    for order in whale_orders[-10:]:  # Last 10 whale trades
        whale_activity.append({
            'orderHash': order['orderHash'],
            'tokenId': order['tokenId'],
            'side': order['side'],
            'volumeUsd': round(order['volumeUsd'], 2),
            'price': order['price'],
            'timestamp': order['timestamp'],
            'maker': order['maker'],
            'taker': order['taker']
        })
    
    return {
        'summary': {
            'totalVolume24h': round(total_volume_24h, 2),
            'totalTrades24h': total_trades_24h,
            'activeTraders24h': active_traders_24h,
            'activeMarkets24h': active_markets_24h,
            'lastUpdate': int(time.time() * 1000)
        },
        'topMovers': top_movers,
        'volumeLeaders': volume_leaders,
        'marketMomentum': market_momentum,
        'whaleActivity': whale_activity
    }

async def stream_analytics():
    """Stream OrderFilled events and compute analytics"""
    print("🚀 Starting Analytics stream...")
    
    # Create hypersync client for Polygon
    client = hypersync.HypersyncClient(hypersync.ClientConfig(
        url='https://polygon.hypersync.xyz'
    ))
    
    # CTF Exchange contract
    ctf_exchange = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"
    
    # OrderFilled event signature
    event_topic = "0xd0a08e8c493f9c94f29311604c9de1b4e8c8d4c06bd0c789af57f2d65bfec0f6"
    
    # Get current height and start from recent blocks
    current_height = await client.get_height()
    start_block = max(0, current_height - 2000)  # Last 2000 blocks for more history
    
    print(f"📍 Starting from block {start_block} (current: {current_height})")
    
    # Ensure output directory exists
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    # Initialize decoder
    decoder = hypersync.Decoder([
        "OrderFilled(bytes32 indexed orderHash,address indexed maker,address indexed taker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled, uint256 fee)"
    ])
    
    # Store recent orders for analytics
    recent_orders = []
    
    while True:
        try:
            # Create query for OrderFilled events
            query = hypersync.preset_query_logs_of_event(
                ctf_exchange,
                event_topic,
                start_block
            )
            
            # Start stream
            receiver = await client.stream(query, hypersync.StreamConfig())
            
            print(f"📡 Streaming analytics from block {start_block}...")
            
            while True:
                res = await receiver.recv()
                
                if res is None:
                    # Stream chunk finished, check for new blocks
                    latest_height = await client.get_height()
                    if start_block < latest_height:
                        start_block = latest_height
                        print(f"✅ Caught up to block {start_block}")
                        break
                    else:
                        # No new blocks yet
                        await asyncio.sleep(2)
                        continue
                
                # Process logs
                if res.data and res.data.logs:
                    print(f"📦 Received {len(res.data.logs)} events for analytics")
                    
                    # Decode logs
                    new_orders = []
                    for raw_log in res.data.logs:
                        order = decode_order_event(raw_log)
                        if order:
                            new_orders.append(order)
                    
                    # Add new orders to recent orders
                    recent_orders.extend(new_orders)
                    
                    # Keep only last 24 hours of orders
                    cutoff_time = int((datetime.now() - timedelta(hours=24)).timestamp() * 1000)
                    recent_orders = [o for o in recent_orders if o['timestamp'] >= cutoff_time]
                    
                    # Compute analytics
                    analytics_data = compute_analytics(recent_orders)
                    
                    # Write to file
                    with open(OUTPUT_FILE, 'w') as f:
                        json.dump(analytics_data, f, indent=2)
                    
                    print(f"✅ Updated analytics with {len(recent_orders)} orders, {analytics_data['summary']['activeMarkets24h']} markets")
                
                # Update start block
                if res.next_block:
                    start_block = res.next_block
            
            # Small delay before next stream
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"❌ Error in analytics stream: {e}")
            await asyncio.sleep(5)  # Wait before retrying

if __name__ == "__main__":
    print("=" * 60)
    print("Polymarket Analytics Stream")
    print("=" * 60)
    asyncio.run(stream_analytics())
