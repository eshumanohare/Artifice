#!/usr/bin/env python3
"""
Mock Stream OrderFilled events - generates realistic order data
"""

import asyncio
import json
import time
import signal
import sys
import os
import random
from datetime import datetime
from pathlib import Path

# Output file paths
OUTPUT_FILE = Path(__file__).parent.parent / '.cache' / 'live_orders.json'
WHALES_FILE = Path(__file__).parent.parent / '.cache' / 'whales.json'

# Rate limiting for file writes
last_file_write = 0
MIN_WRITE_INTERVAL = 5  # Minimum 5 seconds between file writes

def generate_mock_order():
    """Generate a realistic mock order"""
    # Realistic order hashes (32 bytes)
    order_hash = "0x" + ''.join(random.choices('0123456789abcdef', k=64))
    
    # Realistic addresses (20 bytes)
    maker = "0x" + ''.join(random.choices('0123456789abcdef', k=40))
    taker = "0x" + ''.join(random.choices('0123456789abcdef', k=40))
    
    # Asset IDs (32 bytes)
    maker_asset_id = "0x" + ''.join(random.choices('0123456789abcdef', k=64))
    taker_asset_id = "0x" + ''.join(random.choices('0123456789abcdef', k=64))
    
    # Amounts (realistic ranges)
    maker_filled = random.uniform(0.1, 1000.0)
    taker_filled = random.uniform(0.1, 1000.0)
    
    # Convert to hex
    maker_amount_filled = hex(int(maker_filled * 1e6))[2:].zfill(64)
    taker_amount_filled = hex(int(taker_filled * 1e6))[2:].zfill(64)
    
    # Determine side and price
    side = random.choice(['BUY', 'SELL'])
    price = random.uniform(1.0, 99.0)
    
    # Calculate volume
    volume_usd = max(maker_filled, taker_filled)
    
    # Current block number (realistic)
    current_block = 78158000 + random.randint(0, 1000)
    
    return {
        'orderHash': order_hash,
        'maker': maker,
        'taker': taker,
        'makerAssetId': maker_asset_id,
        'takerAssetId': taker_asset_id,
        'makerAmountFilled': '0x' + maker_amount_filled,
        'takerAmountFilled': '0x' + taker_amount_filled,
        'fee': '0x' + '0' * 64,
        'blockNumber': current_block,
        'timestamp': int(time.time() * 1000),
        'side': side,
        'price': round(price, 2),
        'volumeUsd': round(volume_usd, 2)
    }

async def mock_stream_orders():
    """Generate mock orders and write to JSON file"""
    global last_file_write
    
    print(f"📍 Starting mock stream from block 78158000")
    
    # Ensure output directory exists
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    # Initialize whales file if it doesn't exist
    if not WHALES_FILE.exists():
        with open(WHALES_FILE, 'w') as f:
            json.dump({'whales': [], 'lastUpdate': int(time.time() * 1000)}, f, indent=2)
    
    orders_buffer = []
    WHALE_THRESHOLD = 10000  # $10,000 USD threshold for whale detection
    current_block = 78158000
    
    while not shutdown_flag:
        try:
            # Generate 1-5 new orders
            num_orders = random.randint(1, 5)
            new_orders = []
            
            for _ in range(num_orders):
                order = generate_mock_order()
                order['blockNumber'] = current_block + random.randint(0, 10)
                new_orders.append(order)
            
            # Add new orders to buffer
            orders_buffer.extend(new_orders)
            
            # Keep only latest 50 orders
            orders_buffer.sort(key=lambda x: x['timestamp'], reverse=True)
            orders_buffer = orders_buffer[:50]
            
            # Write to file only if enough time has passed
            current_time = time.time()
            if current_time - last_file_write >= MIN_WRITE_INTERVAL:
                with open(OUTPUT_FILE, 'w') as f:
                    json.dump({
                        'orders': orders_buffer,
                        'lastUpdate': int(current_time * 1000),
                        'blockHeight': current_block
                    }, f, indent=2)
                last_file_write = current_time
                print(f"✅ Updated file with {len(orders_buffer)} orders")
            
            # Check for whales
            whale_orders = [order for order in new_orders if order.get('volumeUsd', 0) > WHALE_THRESHOLD]
            
            if whale_orders:
                print(f"🐋 Found {len(whale_orders)} whale orders!")
                
                # Read existing whales
                try:
                    with open(WHALES_FILE, 'r') as f:
                        whales_data = json.load(f)
                except:
                    whales_data = {'whales': [], 'lastUpdate': 0}
                
                # Add new whales (avoid duplicates)
                existing_hashes = {whale['orderHash'] for whale in whales_data['whales']}
                new_whales = [whale for whale in whale_orders if whale['orderHash'] not in existing_hashes]
                
                if new_whales:
                    whales_data['whales'].extend(new_whales)
                    whales_data['lastUpdate'] = int(time.time() * 1000)
                    
                    # Keep only latest 100 whales
                    whales_data['whales'].sort(key=lambda x: x['timestamp'], reverse=True)
                    whales_data['whales'] = whales_data['whales'][:100]
                    
                    # Write whales to file
                    with open(WHALES_FILE, 'w') as f:
                        json.dump(whales_data, f, indent=2)
                    
                    print(f"✅ Added {len(new_whales)} new whales to file")
            
            # Update block number
            current_block += random.randint(1, 5)
            
            # Delay before next update
            await asyncio.sleep(10)
            
        except Exception as e:
            print(f"❌ Error in mock stream: {e}")
            await asyncio.sleep(5)

# Global flag for graceful shutdown
shutdown_flag = False

def signal_handler(signum, frame):
    global shutdown_flag
    print(f"\n🛑 Received signal {signum}, shutting down gracefully...")
    shutdown_flag = True

async def mock_stream_with_retry():
    """Mock stream with automatic retry and graceful shutdown"""
    global shutdown_flag
    
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    retry_count = 0
    max_retries = 10
    
    while not shutdown_flag and retry_count < max_retries:
        try:
            await mock_stream_orders()
            retry_count = 0  # Reset on successful run
        except Exception as e:
            retry_count += 1
            print(f"❌ Mock stream failed (attempt {retry_count}/{max_retries}): {e}")
            if retry_count < max_retries:
                print(f"🔄 Retrying in 10 seconds...")
                await asyncio.sleep(10)
            else:
                print(f"❌ Max retries reached. Exiting.")
                break

if __name__ == "__main__":
    print("🚀 Starting Artifice Mock Order Stream")
    print("=" * 50)
    asyncio.run(mock_stream_with_retry())
