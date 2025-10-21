#!/usr/bin/env python3
"""
Stream OrderFilled events from Polymarket CTF Exchange using Hypersync
and aggregate them into time-series data for price/volume charts.
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
OUTPUT_FILE = Path(__file__).parent.parent / '.cache' / 'market_history.json'

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

def aggregate_to_intervals(orders, interval_minutes=1):
    """Aggregate orders into time intervals for charting"""
    if not orders:
        return {}
    
    # Group orders by token ID
    token_orders = defaultdict(list)
    for order in orders:
        if order and order.get('tokenId'):
            token_orders[order['tokenId']].append(order)
    
    result = {}
    
    for token_id, token_order_list in token_orders.items():
        if not token_order_list:
            continue
            
        # Convert to DataFrame for easier aggregation
        df = pd.DataFrame(token_order_list)
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        
        # Create time intervals
        df['interval'] = df['timestamp'].dt.floor(f'{interval_minutes}min')
        
        # Group by interval and aggregate
        intervals = []
        for interval_time, group in df.groupby('interval'):
            # Calculate average price (weighted by volume)
            total_volume = group['volumeUsd'].sum()
            if total_volume > 0:
                weighted_price = (group['price'] * group['volumeUsd']).sum() / total_volume
            else:
                weighted_price = group['price'].mean() if len(group) > 0 else 0
            
            # Count unique traders
            unique_traders = len(set(group['maker'].tolist() + group['taker'].tolist()))
            
            # Count trades
            trade_count = len(group)
            
            # Calculate buy/sell pressure
            buy_orders = group[group['side'] == 'BUY']
            sell_orders = group[group['side'] == 'SELL']
            buy_volume = buy_orders['volumeUsd'].sum()
            sell_volume = sell_orders['volumeUsd'].sum()
            total_volume_interval = buy_volume + sell_volume
            
            buy_pressure = (buy_volume / total_volume_interval * 100) if total_volume_interval > 0 else 50
            
            intervals.append({
                'timestamp': int(interval_time.timestamp() * 1000),
                'yesPrice': round(weighted_price, 2),
                'noPrice': round(100 - weighted_price, 2),
                'volume': round(total_volume, 2),
                'tradeCount': trade_count,
                'uniqueTraders': unique_traders,
                'buyPressure': round(buy_pressure, 1),
                'sellPressure': round(100 - buy_pressure, 1)
            })
        
        # Sort by timestamp
        intervals.sort(key=lambda x: x['timestamp'])
        
        # Keep only last 24 hours of data (1440 minutes)
        cutoff_time = int((datetime.now() - timedelta(hours=24)).timestamp() * 1000)
        intervals = [i for i in intervals if i['timestamp'] >= cutoff_time]
        
        result[token_id] = {
            'intervals': intervals,
            'lastUpdate': int(time.time() * 1000)
        }
    
    return result

async def stream_market_history():
    """Stream OrderFilled events and aggregate into time-series data"""
    print("🚀 Starting Market History stream...")
    
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
    
    # Store recent orders for aggregation
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
            
            print(f"📡 Streaming market history from block {start_block}...")
            
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
                    print(f"📦 Received {len(res.data.logs)} events for history")
                    
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
                    
                    # Aggregate into intervals (1min, 5min, 15min, 1hr)
                    history_data = {
                        '1min': aggregate_to_intervals(recent_orders, 1),
                        '5min': aggregate_to_intervals(recent_orders, 5),
                        '15min': aggregate_to_intervals(recent_orders, 15),
                        '1hr': aggregate_to_intervals(recent_orders, 60),
                        'lastUpdate': int(time.time() * 1000),
                        'totalOrders': len(recent_orders)
                    }
                    
                    # Write to file
                    with open(OUTPUT_FILE, 'w') as f:
                        json.dump(history_data, f, indent=2)
                    
                    print(f"✅ Updated market history with {len(recent_orders)} orders across {len(history_data['1min'])} markets")
                
                # Update start block
                if res.next_block:
                    start_block = res.next_block
            
            # Small delay before next stream
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"❌ Error in market history stream: {e}")
            await asyncio.sleep(5)  # Wait before retrying

if __name__ == "__main__":
    print("=" * 60)
    print("Polymarket Market History Stream")
    print("=" * 60)
    asyncio.run(stream_market_history())
