#!/usr/bin/env python3
"""
Stream OrderFilled events from Polymarket CTF Exchange using Hypersync
and write them to a JSON file for the Next.js app to read.
"""

import hypersync
import asyncio
import json
import time
from datetime import datetime
from pathlib import Path

# Output file path
OUTPUT_FILE = Path(__file__).parent.parent / '.cache' / 'live_orders.json'

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
        
        # Shorten addresses
        maker_short = maker[:6] + '...' + maker[-4:] if len(maker) > 10 else maker
        taker_short = taker[:6] + '...' + taker[-4:] if len(taker) > 10 else taker
        
        return {
            'orderHash': order_hash,
            'maker': maker_short,
            'taker': taker_short,
            'makerAssetId': maker_asset_id,
            'takerAssetId': taker_asset_id,
            'makerAmountFilled': maker_amount_filled,
            'takerAmountFilled': taker_amount_filled,
            'fee': fee,
            'blockNumber': log.block_number,
            'timestamp': int(time.time() * 1000),  # Just use current time when we receive it
            'side': side,
            'price': round(price, 2)
        }
    except Exception as e:
        print(f"❌ Error decoding log: {e}")
        return None

async def stream_orders():
    """Stream OrderFilled events and update the JSON file"""
    print("🚀 Starting OrderFilled event stream...")
    
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
    start_block = max(0, current_height - 1000)  # Last 1000 blocks
    
    print(f"📍 Starting from block {start_block} (current: {current_height})")
    
    # Ensure output directory exists
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    # Initialize decoder
    decoder = hypersync.Decoder([
        "OrderFilled(bytes32 indexed orderHash,address indexed maker,address indexed taker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled, uint256 fee)"
    ])
    
    orders_buffer = []
    
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
            
            print(f"📡 Streaming from block {start_block}...")
            
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
                    print(f"📦 Received {len(res.data.logs)} events")
                    
                    # Decode logs - we don't need the decoded logs, just raw logs
                    new_orders = []
                    for raw_log in res.data.logs:
                        order = decode_order_event(raw_log)
                        if order:
                            new_orders.append(order)
                    
                    # Add new orders to buffer
                    orders_buffer.extend(new_orders)
                    
                    # Keep only latest 10 orders (by timestamp which is when we received them)
                    orders_buffer.sort(key=lambda x: x['timestamp'], reverse=True)
                    orders_buffer = orders_buffer[:10]
                    
                    # Write to file
                    with open(OUTPUT_FILE, 'w') as f:
                        json.dump({
                            'orders': orders_buffer,
                            'lastUpdate': int(time.time() * 1000),
                            'blockHeight': start_block
                        }, f, indent=2)
                    
                    print(f"✅ Updated file with {len(orders_buffer)} orders")
                
                # Update start block
                if res.next_block:
                    start_block = res.next_block
            
            # Small delay before next stream
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"❌ Error in stream: {e}")
            await asyncio.sleep(5)  # Wait before retrying

if __name__ == "__main__":
    print("=" * 60)
    print("Polymarket Live Orders Stream")
    print("=" * 60)
    asyncio.run(stream_orders())

