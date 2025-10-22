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

# Output file paths
OUTPUT_FILE = Path(__file__).parent.parent / '.cache' / 'live_orders.json'
WHALES_FILE = Path(__file__).parent.parent / '.cache' / 'whales.json'

def decode_order_event(log):
    """Decode OrderFilled event log into a clean format"""
    try:
        topics = log.topics
        data_hex = log.data[2:] if log.data.startswith('0x') else log.data
        
        # Extract indexed parameters (topics)
        order_hash = topics[1] if len(topics) > 1 else ''
        maker = topics[2] if len(topics) > 2 else ''
        taker = topics[3] if len(topics) > 3 else ''
        
        # Clean up addresses - remove zero padding and ensure proper format
        if maker.startswith('0x000000000000000000000000'):
            maker = '0x' + maker[-40:]  # Remove zero padding, keep last 40 chars
        if taker.startswith('0x000000000000000000000000'):
            taker = '0x' + taker[-40:]  # Remove zero padding, keep last 40 chars
        
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
        
        # Calculate volume in USD (assuming USDC as base currency)
        # For BUY orders: volume = maker_filled (USDC paid)
        # For SELL orders: volume = taker_filled (USDC received)
        volume_usd = maker_filled if side == 'BUY' else taker_filled
        
        # Store full addresses for proper linking
        return {
            'orderHash': order_hash,
            'maker': maker,
            'taker': taker,
            'makerAssetId': maker_asset_id,
            'takerAssetId': taker_asset_id,
            'makerAmountFilled': maker_amount_filled,
            'takerAmountFilled': taker_amount_filled,
            'fee': fee,
            'blockNumber': log.block_number,
            'timestamp': int(time.time() * 1000),  # Just use current time when we receive it
            'side': side,
            'price': round(price, 2),
            'volumeUsd': volume_usd
        }
    except Exception as e:
        print(f"❌ Error decoding log: {e}")
        return None

async def fetch_latest_orders():
    """Fetch latest orders from the blockchain (for testing)"""
    try:
        # Create hypersync client for Polygon
        client = hypersync.HypersyncClient(hypersync.ClientConfig(
            url='https://polygon.hypersync.xyz'
        ))
        
        # CTF Exchange contract
        ctf_exchange = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"
        
        # OrderFilled event signature
        event_topic = "0xd0a08e8c493f9c94f29311604c9de1b4e8c8d4c06bd0c789af57f2d65bfec0f6"
        
        # Get current height and fetch recent blocks
        current_height = await client.get_height()
        start_block = max(0, current_height - 100)  # Last 100 blocks
        
        # Create query for OrderFilled events
        query = hypersync.preset_query_logs_of_event(
            ctf_exchange,
            event_topic,
            start_block
        )
        
        # Fetch data using stream method
        receiver = await client.stream(query, hypersync.StreamConfig())
        res = await receiver.recv()
        
        if not res or not res.data or not res.data.logs:
            return []
        
        # Decode logs
        orders = []
        for raw_log in res.data.logs:
            order = decode_order_event(raw_log)
            if order:
                orders.append(order)
        
        return orders
        
    except Exception as e:
        print(f"❌ Error fetching orders: {e}")
        return []

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
    
    # Initialize whales file if it doesn't exist
    if not WHALES_FILE.exists():
        with open(WHALES_FILE, 'w') as f:
            json.dump({'whales': [], 'lastUpdate': int(time.time() * 1000)}, f, indent=2)
    
    # Initialize decoder
    decoder = hypersync.Decoder([
        "OrderFilled(bytes32 indexed orderHash,address indexed maker,address indexed taker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled, uint256 fee)"
    ])
    
    orders_buffer = []
    WHALE_THRESHOLD = 10000  # $10,000 USD threshold for whale detection
    
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
                    
                    # Check for whales and add to whales file
                    whale_orders = [order for order in new_orders if order.get('volumeUsd', 0) > WHALE_THRESHOLD]
                    
                    # Always read and potentially purge whales file (even if no new whales)
                    try:
                        with open(WHALES_FILE, 'r') as f:
                            whales_data = json.load(f)
                    except:
                        whales_data = {'whales': [], 'lastUpdate': int(time.time() * 1000)}
                    
                    # Purge old whales if we have more than 100
                    if len(whales_data['whales']) > 100:
                        whales_data['whales'].sort(key=lambda x: x['timestamp'], reverse=True)
                        whales_data['whales'] = whales_data['whales'][:100]
                        whales_data['lastUpdate'] = int(time.time() * 1000)
                        
                        # Write purged whales to file
                        with open(WHALES_FILE, 'w') as f:
                            json.dump(whales_data, f, indent=2)
                        
                        print(f"🧹 Purged whales file to 100 entries")
                    
                    # Add new whales if any found
                    if whale_orders:
                        print(f"🐋 Found {len(whale_orders)} whale orders!")
                        
                        # Add new whales (avoid duplicates by orderHash)
                        existing_hashes = {whale['orderHash'] for whale in whales_data['whales']}
                        new_whales = [whale for whale in whale_orders if whale['orderHash'] not in existing_hashes]
                        
                        if new_whales:
                            whales_data['whales'].extend(new_whales)
                            whales_data['lastUpdate'] = int(time.time() * 1000)
                            
                            # Keep only latest 100 whales to prevent file from growing too large
                            whales_data['whales'].sort(key=lambda x: x['timestamp'], reverse=True)
                            whales_data['whales'] = whales_data['whales'][:100]
                            
                            # Write whales to file
                            with open(WHALES_FILE, 'w') as f:
                                json.dump(whales_data, f, indent=2)
                            
                            print(f"✅ Added {len(new_whales)} new whales to file")
                    
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

