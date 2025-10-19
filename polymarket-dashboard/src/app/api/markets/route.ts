import { NextResponse } from 'next/server';

export interface MarketData {
  question: string;
  volume24hr: number;
  clobTokenIds: string[];
  conditionId: string;
  outcomes: string[];
  image: string;
  liquidity: number;
  activeTraderCount: number;
  endDate: string;
  slug: string;
}

export async function GET() {
  try {
    const url = 'https://gamma-api.polymarket.com/markets';
    const params = new URLSearchParams({
      closed: 'false',
      order: 'volume24hr',
      ascending: 'false',
      limit: '10'
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Polymarket-Dashboard/1.0'
      },
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`HTTP error!  status: ${response.status}`);
    }

    const markets = await response.json();

    // Transform the data to include all required fields
    const transformedMarkets: MarketData[] = markets.map((market: any) => ({
      question: market.question || 'Unknown Market',
      volume24hr: market.volume24hr || 0,
      clobTokenIds: market.clobTokenIds || [],
      conditionId: market.conditionId || '',
      outcomes: market.outcomes || ['Yes', 'No'],
      image: market.image || '',
      liquidity: market.liquidity || 0,
      activeTraderCount: market.activeTraderCount || 0,
      endDate: market.endDate || '',
      slug: market.slug || ''
    }));

    return NextResponse.json(transformedMarkets);
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}
