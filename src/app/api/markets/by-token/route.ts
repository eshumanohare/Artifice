import { NextRequest, NextResponse } from 'next/server';
import { getCachedMarkets } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json({ error: 'tokenId parameter required' }, { status: 400 });
    }

    // Get cached markets
    const markets = getCachedMarkets();
    if (!markets || !Array.isArray(markets)) {
      return NextResponse.json({ question: null });
    }

    // Normalize the incoming token ID
    const normalizedTokenId = '0x' + tokenId.replace('0x', '').padStart(64, '0').toLowerCase();

    // Find market where clobTokenIds contains this token
    const market = markets.find((m: any) => {
      if (!m.clobTokenIds) return false;
      
      const tokenIds = Array.isArray(m.clobTokenIds) ? m.clobTokenIds : [m.clobTokenIds];
      
      return tokenIds.some((tid: string) => {
        const normalized = '0x' + tid.replace('0x', '').padStart(64, '0').toLowerCase();
        return normalized === normalizedTokenId;
      });
    });

    return NextResponse.json({ 
      question: market?.question || null,
      marketId: market?.id || null 
    });
  } catch (error) {
    console.error('Error finding market by token ID:', error);
    return NextResponse.json({ question: null }, { status: 500 });
  }
}

