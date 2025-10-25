import { NextRequest, NextResponse } from 'next/server';
import { getWhales } from '@/lib/dataStore';

export async function GET(request: NextRequest) {
  try {
    console.log(`🐋 Reading whale data from data store...`);
    
    // Get whales from data store
    const whales = getWhales();

    console.log(`✅ Loaded ${whales.length} whales from data store`);

    return NextResponse.json({
      whales,
      lastUpdate: Date.now(),
      source: 'data-store',
      totalWhales: whales.length
    });

  } catch (error) {
    console.error('❌ Error reading whales from data store:', error);
    
    return NextResponse.json({
      whales: [],
      lastUpdate: Date.now(),
      source: 'error',
      error: 'Failed to read whales from data store'
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
