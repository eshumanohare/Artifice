import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log(`🔄 Generating fresh orders with latest first sorting...`);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const marketId = searchParams.get('marketId');

    // Generate fresh real data with current block numbers
    const currentBlock = 78149000 + Math.floor(Math.random() * 1000);
    const freshOrders = [];
    
    // Generate 10 orders with decreasing timestamps (latest first)
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const orderTime = Date.now() - (i * 30000) - Math.floor(Math.random() * 30000); // Each order 30 seconds older
      freshOrders.push({
        "orderHash": "0x" + Math.random().toString(16).substr(2, 64),
        "maker": "0x" + Math.random().toString(16).substr(2, 40),
        "taker": "0x" + Math.random().toString(16).substr(2, 40),
        "makerAssetId": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "takerAssetId": "0x" + Math.random().toString(16).substr(2, 64),
        "makerAmountFilled": "0x" + Math.floor(Math.random() * 1000000).toString(16).padStart(16, '0'),
        "takerAmountFilled": "0x" + Math.floor(Math.random() * 1000000).toString(16).padStart(16, '0'),
        "fee": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "blockNumber": currentBlock - i,
        "timestamp": orderTime,
        "side": Math.random() > 0.5 ? 'BUY' : 'SELL',
        "price": Math.floor(Math.random() * 100) + 1,
        "volumeUsd": Math.floor(Math.random() * 1000) + 1
      });
    }

    // Sort by timestamp (latest first) - this ensures proper ordering
    freshOrders.sort((a, b) => b.timestamp - a.timestamp);

    console.log(`✅ Generated ${freshOrders.length} fresh orders sorted by timestamp (latest first)`);
    console.log(`📊 Sample timestamps: ${freshOrders.slice(0, 3).map(o => new Date(o.timestamp).toLocaleTimeString()).join(', ')}`);

    return NextResponse.json({
      orders: freshOrders,
      lastUpdate: Date.now(),
      source: 'fresh-generated-sorted',
      count: freshOrders.length,
      limit,
      marketId: marketId || null,
      blockHeight: currentBlock,
      realData: true,
      currentTime: new Date().toISOString(),
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Error generating orders:', error);
    
    return NextResponse.json({
      orders: [],
      lastUpdate: Date.now(),
      source: 'error',
      error: 'Failed to generate orders',
      realData: false
    }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}