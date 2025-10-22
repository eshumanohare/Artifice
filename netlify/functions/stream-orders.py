#!/usr/bin/env python3
"""
Netlify Function: Stream OrderFilled events from Polymarket CTF Exchange
This runs as a background function on Netlify
"""

import hypersync
import asyncio
import json
import time
import os
from datetime import datetime
from pathlib import Path

# For Netlify, we'll store data in /tmp (temporary storage)
# In production, consider using a database or external storage
CACHE_DIR = Path("/tmp/.cache")
OUTPUT_FILE = CACHE_DIR / "live_orders.json"
WHALES_FILE = CACHE_DIR / "whales.json"

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
            maker = '0x' + maker[-40:]
        if taker.startswith('0x000000000000000000000000'):
            taker = '0x' + taker[-40:]
        
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
        
        # Calculate volume in USD
        volume_usd = maker_filled if side == 'BUY' else taker_filled
        
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
            'timestamp': int(time.time() * 1000),
            'side': side,
            'price': round(price, 2),
            'volumeUsd': volume_usd
        }
    except Exception as e:
        print(f"❌ Error decoding log: {e}")
        return None

async def fetch_latest_orders():
    """Fetch latest orders from the blockchain"""
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
        
        # Fetch data
        res = await client.send_req(query)
        
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

def handler(event, context):
    """Netlify function handler"""
    print("🚀 Starting OrderFilled event fetch...")
    
    # Ensure cache directory exists
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    try:
        # Fetch latest orders
        orders = asyncio.run(fetch_latest_orders())
        
        # Sort by timestamp (most recent first) and keep top 10
        orders.sort(key=lambda x: x['timestamp'], reverse=True)
        orders = orders[:10]
        
        # Write to file
        with open(OUTPUT_FILE, 'w') as f:
            json.dump({
                'orders': orders,
                'lastUpdate': int(time.time() * 1000),
                'blockHeight': 'latest'
            }, f, indent=2)
        
        # Check for whales and update whales file
        WHALE_THRESHOLD = 10000  # $10,000 USD threshold
        whale_orders = [order for order in orders if order.get('volumeUsd', 0) > WHALE_THRESHOLD]
        
        # Read existing whales
        try:
            with open(WHALES_FILE, 'r') as f:
                whales_data = json.load(f)
        except:
            whales_data = {'whales': [], 'lastUpdate': int(time.time() * 1000)}
        
        # Add new whales (avoid duplicates)
        if whale_orders:
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
        
        print(f"✅ Updated with {len(orders)} orders, {len(whale_orders)} whales")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully updated {len(orders)} orders',
                'whales': len(whale_orders)
            })
        }
        
    except Exception as e:
        print(f"❌ Error in handler: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }

if __name__ == "__main__":
    # For local testing
    result = handler({}, {})
    print(json.dumps(result))

