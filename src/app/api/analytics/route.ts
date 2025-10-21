import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), '.cache', 'analytics_snapshot.json');

interface AnalyticsData {
  summary: {
    totalVolume24h: number;
    totalTrades24h: number;
    activeTraders24h: number;
    activeMarkets24h: number;
    lastUpdate: number;
  };
  topMovers: Array<{
    tokenId: string;
    totalVolume: number;
    tradeCount: number;
    uniqueTraders: number;
    priceChange: number;
    priceChangePct: number;
    recentVolume: number;
    recentTrades: number;
    momentumScore: number;
    buyPressure: number;
    sellPressure: number;
  }>;
  volumeLeaders: Array<{
    tokenId: string;
    totalVolume: number;
    tradeCount: number;
    uniqueTraders: number;
    priceChange: number;
    priceChangePct: number;
    recentVolume: number;
    recentTrades: number;
    momentumScore: number;
    buyPressure: number;
    sellPressure: number;
  }>;
  marketMomentum: Array<{
    tokenId: string;
    totalVolume: number;
    tradeCount: number;
    uniqueTraders: number;
    priceChange: number;
    priceChangePct: number;
    recentVolume: number;
    recentTrades: number;
    momentumScore: number;
    buyPressure: number;
    sellPressure: number;
  }>;
  whaleActivity: Array<{
    orderHash: string;
    tokenId: string;
    side: string;
    volumeUsd: number;
    price: number;
    timestamp: number;
    maker: string;
    taker: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'all';
    
    if (!fs.existsSync(CACHE_FILE)) {
      return NextResponse.json({ 
        error: 'Analytics data not available',
        summary: {
          totalVolume24h: 0,
          totalTrades24h: 0,
          activeTraders24h: 0,
          activeMarkets24h: 0,
          lastUpdate: Date.now()
        },
        topMovers: [],
        volumeLeaders: [],
        marketMomentum: [],
        whaleActivity: []
      });
    }
    
    const content = fs.readFileSync(CACHE_FILE, 'utf-8');
    const analyticsData: AnalyticsData = JSON.parse(content);
    
    // Return specific section or all data
    if (section === 'summary') {
      return NextResponse.json(analyticsData.summary);
    } else if (section === 'topMovers') {
      return NextResponse.json(analyticsData.topMovers);
    } else if (section === 'volumeLeaders') {
      return NextResponse.json(analyticsData.volumeLeaders);
    } else if (section === 'marketMomentum') {
      return NextResponse.json(analyticsData.marketMomentum);
    } else if (section === 'whaleActivity') {
      return NextResponse.json(analyticsData.whaleActivity);
    }
    
    return NextResponse.json(analyticsData);
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        summary: {
          totalVolume24h: 0,
          totalTrades24h: 0,
          activeTraders24h: 0,
          activeMarkets24h: 0,
          lastUpdate: Date.now()
        },
        topMovers: [],
        volumeLeaders: [],
        marketMomentum: [],
        whaleActivity: []
      },
      { status: 500 }
    );
  }
}
