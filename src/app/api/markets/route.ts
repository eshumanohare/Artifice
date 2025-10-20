import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Gamma API endpoint
    const url = 'https://gamma-api.polymarket.com/markets';
    
    // Base parameters
    const params = new URLSearchParams({
      closed: 'false',
      order: 'volume24hr',
      ascending: 'false',
      limit: '10'
    });

    // Add search parameter if provided
    if (search) {
      params.append('search', search);
    }

    const response = await fetch(`${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const markets = await response.json();

    // Format the response to include only necessary fields
    const formattedMarkets = markets.map((market: any) => ({
      id: market.id,
      question: market.question,
      description: market.description,
      image: market.image,
      volume24hr: market.volume24hr,
      liquidity: market.liquidity,
      outcomePrices: typeof market.outcomePrices === 'string' 
        ? JSON.parse(market.outcomePrices) 
        : market.outcomePrices,
      endDate: market.endDate,
      clobTokenIds: market.clobTokenIds,
      conditionId: market.conditionId,
      slug: market.slug
    }));

    return NextResponse.json(formattedMarkets);
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}
