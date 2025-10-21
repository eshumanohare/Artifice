import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), '.cache', 'market_history.json');

interface HistoryData {
  [interval: string]: {
    [tokenId: string]: {
      intervals: Array<{
        timestamp: number;
        yesPrice: number;
        noPrice: number;
        volume: number;
        tradeCount: number;
        uniqueTraders: number;
        buyPressure: number;
        sellPressure: number;
      }>;
      lastUpdate: number;
    };
  };
  lastUpdate: number;
  totalOrders: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || '5min';
    const hours = parseInt(searchParams.get('hours') || '24');
    
    const marketId = params.id;
    
    if (!fs.existsSync(CACHE_FILE)) {
      return NextResponse.json({ 
        error: 'Market history not available',
        intervals: [],
        marketId 
      });
    }
    
    const content = fs.readFileSync(CACHE_FILE, 'utf-8');
    const historyData: HistoryData = JSON.parse(content);
    
    // Get the requested interval data
    const intervalData = historyData[interval] || {};
    
    // Find the market by token ID (we'll need to map conditionId to tokenId)
    // For now, we'll search through all token IDs to find matching data
    let marketHistory = null;
    let tokenId = null;
    
    for (const [tid, data] of Object.entries(intervalData)) {
      // This is a simplified approach - in production you'd want a proper mapping
      // For now, we'll return the first available market data
      if (data.intervals && data.intervals.length > 0) {
        marketHistory = data;
        tokenId = tid;
        break;
      }
    }
    
    if (!marketHistory) {
      return NextResponse.json({ 
        error: 'No history data found for this market',
        intervals: [],
        marketId 
      });
    }
    
    // Filter by time range
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const filteredIntervals = marketHistory.intervals.filter(
      interval => interval.timestamp >= cutoffTime
    );
    
    return NextResponse.json({
      marketId,
      tokenId,
      interval,
      hours,
      intervals: filteredIntervals,
      lastUpdate: marketHistory.lastUpdate,
      totalDataPoints: filteredIntervals.length
    });
    
  } catch (error) {
    console.error('Error fetching market history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch market history',
        intervals: [],
        marketId: params.id 
      },
      { status: 500 }
    );
  }
}
