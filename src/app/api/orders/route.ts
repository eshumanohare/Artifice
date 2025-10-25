import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    console.log(`🔍 Fetching live orders from cache...`);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const marketId = searchParams.get('marketId');

    // Read from the cache file
    const cachePath = path.join(process.cwd(), '.cache', 'live_orders.json');
    
    if (!fs.existsSync(cachePath)) {
      console.log('📁 Cache file not found, returning empty data');
      return NextResponse.json({
        orders: [],
        lastUpdate: Date.now(),
        blockHeight: 0,
        source: 'cache-missing',
        count: 0
      });
    }

    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    let orders = cacheData.orders || [];

    // Filter by market if specified
    if (marketId) {
      orders = orders.filter((order: any) => order.marketId === marketId);
    }

    // Apply limit
    orders = orders.slice(0, limit);

    console.log(`✅ Loaded ${orders.length} orders from cache`);

    return NextResponse.json({
      orders,
      lastUpdate: cacheData.lastUpdate || Date.now(),
      blockHeight: cacheData.blockHeight || 0,
      source: 'cache',
      count: orders.length
    });

  } catch (error) {
    console.error('❌ Error reading orders from cache:', error);
    
    return NextResponse.json({
      orders: [],
      lastUpdate: Date.now(),
      blockHeight: 0,
      source: 'error',
      error: 'Failed to read orders cache'
    });
  }
}

