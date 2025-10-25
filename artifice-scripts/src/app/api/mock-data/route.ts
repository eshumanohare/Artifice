import { NextRequest, NextResponse } from 'next/server';
import { updateOrders } from '@/lib/dataStore';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Generating mock data...');

    // Generate some mock orders for testing
    const mockOrders = [
      {
        orderHash: '0x' + Math.random().toString(16).substr(2, 64),
        maker: '0x' + Math.random().toString(16).substr(2, 40),
        taker: '0x' + Math.random().toString(16).substr(2, 40),
        makerAssetId: '0x0000000000000000000000000000000000000000000000000000000000000000',
        takerAssetId: '0x' + Math.random().toString(16).substr(2, 64),
        makerAmountFilled: '0x' + (Math.floor(Math.random() * 1000000) * 1e6).toString(16),
        takerAmountFilled: '0x' + (Math.floor(Math.random() * 1000000) * 1e6).toString(16),
        fee: '0x' + (Math.floor(Math.random() * 10000) * 1e6).toString(16),
        blockNumber: Math.floor(Math.random() * 1000000) + 50000000,
        timestamp: Date.now() - Math.floor(Math.random() * 300000), // Last 5 minutes
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
        price: Math.floor(Math.random() * 100) + 1,
        volumeUsd: Math.floor(Math.random() * 50000) + 1000
      },
      {
        orderHash: '0x' + Math.random().toString(16).substr(2, 64),
        maker: '0x' + Math.random().toString(16).substr(2, 40),
        taker: '0x' + Math.random().toString(16).substr(2, 40),
        makerAssetId: '0x' + Math.random().toString(16).substr(2, 64),
        takerAssetId: '0x0000000000000000000000000000000000000000000000000000000000000000',
        makerAmountFilled: '0x' + (Math.floor(Math.random() * 1000000) * 1e6).toString(16),
        takerAmountFilled: '0x' + (Math.floor(Math.random() * 1000000) * 1e6).toString(16),
        fee: '0x' + (Math.floor(Math.random() * 10000) * 1e6).toString(16),
        blockNumber: Math.floor(Math.random() * 1000000) + 50000000,
        timestamp: Date.now() - Math.floor(Math.random() * 300000),
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
        price: Math.floor(Math.random() * 100) + 1,
        volumeUsd: Math.floor(Math.random() * 50000) + 1000
      },
      {
        orderHash: '0x' + Math.random().toString(16).substr(2, 64),
        maker: '0x' + Math.random().toString(16).substr(2, 40),
        taker: '0x' + Math.random().toString(16).substr(2, 40),
        makerAssetId: '0x0000000000000000000000000000000000000000000000000000000000000000',
        takerAssetId: '0x' + Math.random().toString(16).substr(2, 64),
        makerAmountFilled: '0x' + (Math.floor(Math.random() * 1000000) * 1e6).toString(16),
        takerAmountFilled: '0x' + (Math.floor(Math.random() * 1000000) * 1e6).toString(16),
        fee: '0x' + (Math.floor(Math.random() * 10000) * 1e6).toString(16),
        blockNumber: Math.floor(Math.random() * 1000000) + 50000000,
        timestamp: Date.now() - Math.floor(Math.random() * 300000),
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
        price: Math.floor(Math.random() * 100) + 1,
        volumeUsd: Math.floor(Math.random() * 50000) + 1000
      }
    ];

    // Update data store with mock orders
    updateOrders(mockOrders);
    
    console.log(`✅ Mock data generated: ${mockOrders.length} orders`);
    
    return NextResponse.json({
      success: true,
      ordersFetched: mockOrders.length,
      lastUpdate: Date.now(),
      message: `Successfully generated ${mockOrders.length} mock orders`,
      orders: mockOrders
    });

  } catch (error) {
    console.error('❌ Error generating mock data:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Mock data generation endpoint',
    method: 'POST',
    note: 'Send a POST request to generate mock orders for testing'
  });
}
