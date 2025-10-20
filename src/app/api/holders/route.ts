import { NextRequest, NextResponse } from 'next/server';

type Holder = {
  address: string;
  addressShort: string;
  shares: number;
  usdValue: number; // computed client-side
  side: 'YES' | 'NO';
  displayName?: string;
  profileImage?: string;
  tokenId?: string;
  avgPriceCents?: number;
  cashPnlUsd?: number;
  percentPnl?: number;
};

const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conditionId = searchParams.get('conditionId');
    const limitStr = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitStr || '5', 10) || 5, 1), 20);

    if (!conditionId) {
      return NextResponse.json({ error: 'Missing conditionId' }, { status: 400 });
    }

    // Use the data-api as in the notebook: /holders?market={conditionId}&limit=5
    const holdersUrl = `https://data-api.polymarket.com/holders?market=${encodeURIComponent(conditionId)}&limit=${limit}`;
    const res = await fetch(holdersUrl, { next: { revalidate: 60 } });

    if (!res.ok) {
      throw new Error(`Failed to fetch holders: ${res.status}`);
    }

    const raw = await res.json();
    // raw is expected to be an array of { token, holders: [ ... ] }
    const list = Array.isArray(raw) ? raw : [];

    const yes: Holder[] = [];
    const no: Holder[] = [];

    for (const tokenGroup of list) {
      const tokenHolders = Array.isArray(tokenGroup?.holders) ? tokenGroup.holders : [];
      for (const h of tokenHolders) {
        const side = h.outcomeIndex === 0 ? 'YES' : 'NO';
        const mapped: Holder = {
          address: h.proxyWallet || '',
          addressShort: shorten(h.proxyWallet || ''),
          shares: Number(h.amount || 0),
          usdValue: 0, // will be computed in client using outcomePrices
          side,
          displayName: h.name || h.pseudonym || '',
          profileImage: h.profileImageOptimized || h.profileImage || '',
          tokenId: tokenGroup?.token,
        };
        if (side === 'YES') yes.push(mapped);
        else no.push(mapped);
      }
    }

    // Enrich each holder with PnL metrics from positions API (best effort)
    async function enrichWithPositions(holder: Holder): Promise<Holder> {
      try {
        if (!holder.address) return holder;
        const posRes = await fetch(`https://data-api.polymarket.com/positions?user=${holder.address}`, { next: { revalidate: 60 } });
        if (!posRes.ok) return holder;
        const positions = await posRes.json();
        if (!Array.isArray(positions)) return holder;
        // Find position matching this market's conditionId and side via outcomeIndex
        const match = positions.find((p: any) => p.conditionId && p.proxyWallet && p.proxyWallet.toLowerCase() === holder.address.toLowerCase());
        if (match) {
          const avgPriceCents = typeof match.avgPrice === 'number' ? match.avgPrice * 100 : undefined;
          const cashPnlUsd = typeof match.cashPnl === 'number' ? match.cashPnl : undefined;
          const percentPnl = typeof match.percentPnl === 'number' ? match.percentPnl : undefined;
          return { ...holder, avgPriceCents, cashPnlUsd, percentPnl };
        }
        return holder;
      } catch {
        return holder;
      }
    }

    const [yesEnriched, noEnriched] = await Promise.all([
      Promise.all(yes.slice(0, limit).map(enrichWithPositions)),
      Promise.all(no.slice(0, limit).map(enrichWithPositions)),
    ]);

    return NextResponse.json({ yes: yesEnriched, no: noEnriched });
  } catch (error) {
    console.error('Error fetching holders:', error);
    return NextResponse.json({ yes: [], no: [] }, { status: 200 });
  }
}


