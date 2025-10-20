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
  percentRealizedPnl?: number;
  winStreakLatest?: number;
  loseStreakLatest?: number;
};

const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

// In-memory cache for closed positions (since they don't change)
const closedPositionsCache = new Map<string, any[]>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const cacheTimestamps = new Map<string, number>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conditionId = searchParams.get('conditionId');
    const limitStr = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitStr || '10', 10) || 10, 1), 50);

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
        // Find positions for the same conditionId and outcomeIndex
        const relevant = positions.filter((p: any) => p && p.conditionId === conditionId && typeof p.outcomeIndex === 'number');
        // Prefer same side if outcomeIndex is available
        const sideIndex = holder.side === 'YES' ? 0 : 1;
        const match = relevant.find((p: any) => p.outcomeIndex === sideIndex) || relevant[0];
        
        let avgPriceCents: number | undefined;
        let cashPnlUsd: number | undefined;
        let percentPnl: number | undefined;
        let percentRealizedPnl: number | undefined;
        
        if (match) {
          avgPriceCents = typeof match.avgPrice === 'number' ? match.avgPrice * 100 : undefined;
          cashPnlUsd = typeof match.cashPnl === 'number' ? match.cashPnl : undefined;
          percentPnl = typeof match.percentPnl === 'number' ? match.percentPnl : undefined;
          percentRealizedPnl = typeof match.percentRealizedPnl === 'number' ? match.percentRealizedPnl : undefined;
        }
        
        // Fetch closed positions to compute win/lose streaks (with caching)
        let closedPositions: any[] = [];
        const cacheKey = holder.address.toLowerCase();
        const now = Date.now();
        const cachedTime = cacheTimestamps.get(cacheKey);
        
        // Check cache first
        if (closedPositionsCache.has(cacheKey) && cachedTime && (now - cachedTime < CACHE_TTL)) {
          closedPositions = closedPositionsCache.get(cacheKey) || [];
        } else {
          // Fetch all closed positions (no limit, since they don't change)
          const closedRes = await fetch(`https://data-api.polymarket.com/closed-positions?user=${holder.address}`, { next: { revalidate: 86400 } });
          if (closedRes.ok) {
            closedPositions = await closedRes.json();
            if (Array.isArray(closedPositions)) {
              closedPositionsCache.set(cacheKey, closedPositions);
              cacheTimestamps.set(cacheKey, now);
            }
          }
        }
        
        let winStreakLatest = 0;
        let loseStreakLatest = 0;
        
        if (Array.isArray(closedPositions) && closedPositions.length > 0) {
          // Compute latest win streak: consecutive realizedPnl > 0 from start (breaks on first non-win)
          for (const cp of closedPositions) {
            if (typeof cp.realizedPnl === 'number' && cp.realizedPnl > 0) winStreakLatest += 1;
            else break;
          }
          // Compute latest lose streak: consecutive realizedPnl < 0 from start (breaks on first non-loss)
          for (const cp of closedPositions) {
            if (typeof cp.realizedPnl === 'number' && cp.realizedPnl < 0) loseStreakLatest += 1;
            else break;
          }
        }
        
        return { ...holder, avgPriceCents, cashPnlUsd, percentPnl, percentRealizedPnl, winStreakLatest, loseStreakLatest };
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


