import { NextRequest, NextResponse } from 'next/server';
import { envioClient, convertEnvioOrderToOrder } from '@/lib/envio-client';

export async function GET(request: NextRequest) {
  try {
    console.log(`🔍 Fetching live orders from Envio indexer...`);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const marketId = searchParams.get('marketId');

    let orders;
    
    if (marketId) {
      // Get orders for specific market
      orders = await envioClient.getOrdersByMarket(marketId, limit);
    } else {
      // Get recent orders
      orders = await envioClient.getRecentOrders(limit);
    }

    // Convert Envio orders to your existing format
    const convertedOrders = orders.map(convertEnvioOrderToOrder);

    console.log(`✅ Loaded ${convertedOrders.length} orders from Envio indexer`);

    return NextResponse.json({
      orders: convertedOrders,
      lastUpdate: Date.now(),
      blockHeight: convertedOrders.length > 0 ? convertedOrders[0].blockNumber : 0,
      source: 'envio-indexer',
      count: convertedOrders.length
    });

  } catch (error) {
    console.error('❌ Error fetching orders from Envio:', error);
    
    // Fallback to empty data if Envio is unavailable
    return NextResponse.json({
      orders: [],
      lastUpdate: Date.now(),
      blockHeight: 0,
      source: 'envio-error',
      error: 'Envio indexer unavailable'
    });
  }
}

