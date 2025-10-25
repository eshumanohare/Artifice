import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Fetch recent orders from Polymarket API or similar
async function fetchRecentOrders() {
  try {
    // For now, we'll create realistic mock data
    // In production, you'd integrate with Polymarket's API or a blockchain indexer
    const mockOrders = [];
    const sides = ['BUY', 'SELL'];
    const markets = [
      'Will Trump win 2024 election?',
      'Will Bitcoin reach $100k?',
      'Will AI achieve AGI by 2025?',
      'Will Ethereum reach $10k?',
      'Will there be a recession in 2024?'
    ];

    // Generate 3-8 random orders
    const orderCount = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < orderCount; i++) {
      const side = sides[Math.floor(Math.random() * sides.length)];
      const price = Math.round(Math.random() * 100 * 100) / 100;
      const volumeUsd = Math.round(Math.random() * 50000 * 100) / 100;
      
      mockOrders.push({
        orderHash: '0x' + Math.random().toString(16).substr(2, 64),
        maker: '0x' + Math.random().toString(16).substr(2, 40),
        taker: '0x' + Math.random().toString(16).substr(2, 40),
        side: side,
        price: price,
        volumeUsd: volumeUsd,
        market: markets[Math.floor(Math.random() * markets.length)],
        timestamp: Date.now() - Math.floor(Math.random() * 300000), // Within last 5 minutes
        blockNumber: 50000000 + Math.floor(Math.random() * 1000)
      });
    }

    // Sort by timestamp (newest first)
    mockOrders.sort((a, b) => b.timestamp - a.timestamp);

    return mockOrders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if this is a cron job call
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting order stream update...');

    // Create cache directory if it doesn't exist
    const cacheDir = join(process.cwd(), '.cache');
    await mkdir(cacheDir, { recursive: true });

    // Fetch recent orders
    const orders = await fetchRecentOrders();

    const ordersData = {
      orders: orders,
      lastUpdate: Date.now(),
      blockHeight: 50000000 + Math.floor(Math.random() * 1000),
      source: 'vercel-cron'
    };

    // Write to file
    const filePath = join(cacheDir, 'live_orders.json');
    await writeFile(filePath, JSON.stringify(ordersData, null, 2));

    console.log(`✅ Orders updated successfully - ${orders.length} orders`);

    return NextResponse.json({ 
      success: true, 
      message: 'Orders updated',
      count: orders.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating orders:', error);
    return NextResponse.json(
      { error: 'Failed to update orders', details: error.message }, 
      { status: 500 }
    );
  }
}

// Allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
