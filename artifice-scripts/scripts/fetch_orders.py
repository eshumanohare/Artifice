#!/usr/bin/env python3
"""
Fetch OrderFilled events from Polymarket CTF Exchange using Hypersync
and output them as JSON to stdout for the Next.js API to consume.
"""

import hypersync
import asyncio
import json
import time
import sys
import argparse
from datetime import datetime

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
        print(f"❌ Error decoding log: {e}", file=sys.stderr)
        return None

async def fetch_orders(start_block: int, end_block: int = None):
    """Fetch OrderFilled events from specified block range"""
    print(f"🚀 Fetching orders from block {start_block} to {end_block or 'latest'}...", file=sys.stderr)
    
    # Create hypersync client for Polygon
    client = hypersync.HypersyncClient(hypersync.ClientConfig(
        url='https://polygon.hypersync.xyz'
    ))
    
    # CTF Exchange contract
    ctf_exchange = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"
    
    # OrderFilled event signature
    event_topic = "0xd0a08e8c493f9c94f29311604c9de1b4e8c8d4c06bd0c789af57f2d65bfec0f6"
    
    # Get current height if end_block not specified
    if end_block is None:
        end_block = await client.get_height()
    
    print(f"📍 Fetching from block {start_block} to {end_block}", file=sys.stderr)
    
    # Create query for OrderFilled events
    query = hypersync.preset_query_logs_of_event(
        ctf_exchange,
        event_topic,
        start_block,
        end_block
    )
    
    # Execute query using stream method (single fetch)
    receiver = await client.stream(query, hypersync.StreamConfig())
    
    # Get the first result (single fetch)
    result = await receiver.recv()
    
    orders = []
    if result.data and result.data.logs:
        print(f"📦 Found {len(result.data.logs)} events", file=sys.stderr)
        
        # Decode logs
        for raw_log in result.data.logs:
            order = decode_order_event(raw_log)
            if order:
                orders.append(order)
    
    # Sort by timestamp (newest first)
    orders.sort(key=lambda x: x['timestamp'], reverse=True)
    
    print(f"✅ Decoded {len(orders)} orders", file=sys.stderr)
    
    # Output as JSON to stdout
    output = {
        'orders': orders,
        'lastUpdate': int(time.time() * 1000),
        'blockHeight': end_block,
        'startBlock': start_block,
        'endBlock': end_block,
        'count': len(orders)
    }
    
    print(json.dumps(output, indent=2))

async def main():
    parser = argparse.ArgumentParser(description='Fetch OrderFilled events from Polymarket')
    parser.add_argument('--start-block', type=int, required=True, help='Starting block number')
    parser.add_argument('--end-block', type=int, help='Ending block number (default: latest)')
    parser.add_argument('--blocks-back', type=int, default=100, help='Number of blocks to go back from latest (if start-block not provided)')
    
    args = parser.parse_args()
    
    try:
        if args.start_block:
            await fetch_orders(args.start_block, args.end_block)
        else:
            # If no start block provided, go back N blocks from latest
            client = hypersync.HypersyncClient(hypersync.ClientConfig(
                url='https://polygon.hypersync.xyz'
            ))
            latest_block = await client.get_height()
            start_block = max(0, latest_block - args.blocks_back)
            await fetch_orders(start_block, latest_block)
            
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
