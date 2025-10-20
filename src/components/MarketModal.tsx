'use client';

import { useEffect, useMemo, useState } from 'react';
import { Holder, Market } from '@/types/market';

interface MarketModalProps {
  market: Market;
  onClose: () => void;
}

interface HoldersResponse {
  yes: Holder[];
  no: Holder[];
}

export default function MarketModal({ market, onClose }: MarketModalProps) {
  const [holders, setHolders] = useState<HoldersResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const yesPrice = useMemo(() => {
    return (parseFloat(String(market.outcomePrices?.[0] ?? '0')) || 0) * 100;
  }, [market.outcomePrices]);

  const noPrice = useMemo(() => {
    return (parseFloat(String(market.outcomePrices?.[1] ?? '0')) || 0) * 100;
  }, [market.outcomePrices]);

  const total = Math.max(yesPrice + noPrice, 1);
  const yesPct = Math.round((yesPrice / total) * 100);
  const noPct = 100 - yesPct;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: any;
    const fetchHolders = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/holders?conditionId=${encodeURIComponent(market.conditionId)}&limit=10`);
        if (!res.ok) throw new Error('Failed to fetch holders');
        const data: HoldersResponse = await res.json();
        if (isMounted) setHolders(data);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHolders();
    intervalId = setInterval(fetchHolders, 60000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, [market.conditionId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const shorten = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getDaysLeft = () => {
    if (!market.endDate) return null;
    const now = new Date();
    const end = new Date(market.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatEndDate = () => {
    if (!market.endDate) return null;
    const end = new Date(market.endDate);
    return end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const daysLeft = getDaysLeft();
  const endDateFormatted = formatEndDate();

  return (
    <div
      className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-7xl border border-blue-200/40 max-h-[85vh] overflow-y-auto hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top: Market info rectangle */}
        <div className="p-6 border-b border-blue-100/40" style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Event Image */}
              {market.eventImage && (
                <img 
                  src={market.eventImage} 
                  alt={market.question} 
                  className="w-24 h-24 rounded-lg object-cover shrink-0 border border-blue-200/60"
                />
              )}
              
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-blue-800 leading-tight">
                  {market.question}
                </h2>
                
                {/* End Date and Days Left */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {endDateFormatted && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700 font-medium">Ends: {endDateFormatted}</span>
                    </div>
                  )}
                  {daysLeft !== null && (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      daysLeft <= 1 ? 'bg-red-100 text-red-700 border border-red-200' : 
                      daysLeft <= 7 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                      'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {daysLeft <= 0 ? 'Ended' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                    </div>
                  )}
                </div>
                
                {market.description && (
                  <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                    {market.description}
                  </p>
                )}
              </div>
            </div>
            
            <button
              aria-label="Close"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 hover:bg-blue-100 transition"
            >
              <svg className="h-6 w-6 text-blue-800" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Middle: Merged YES/NO price bar, then metrics grid, then holders */}
        <div className="p-6" style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
          {/* Merged YES/NO price block */}
          <div className="glass-card border border-blue-100/60 overflow-hidden mb-8">
            <div className="flex items-stretch">
              <div className="flex-1 bg-green-500/30 p-5 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-green-800">YES</div>
                  <div className="text-2xl font-semibold text-green-900">{(yesPrice).toFixed(1)}¢</div>
                </div>
              </div>
              <div className="w-px bg-white/60" />
              <div className="flex-1 bg-red-500/30 p-5 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-red-800">NO</div>
                  <div className="text-2xl font-semibold text-red-900">{(noPrice).toFixed(1)}¢</div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4 text-center">
              <div className="text-xs text-gray-600">24h Volume</div>
              <div className="text-lg font-semibold text-blue-700">{formatCurrency(market.volume24hr)}</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-xs text-gray-600">Liquidity</div>
              <div className="text-lg font-semibold text-green-700">{formatCurrency(market.liquidity)}</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-xs text-gray-600">Last Trade</div>
              <div className="text-lg font-semibold text-gray-900">{market.lastTradePrice ? `${(market.lastTradePrice * 100).toFixed(1)}¢` : '—'}</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-xs text-gray-600">1w Volume</div>
              <div className="text-lg font-semibold text-blue-700">{market.volume1wk ? formatCurrency(market.volume1wk) : '—'}</div>
            </div>
          </div>

          {/* Holders: two spacious columns */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* YES holders */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-green-700 mb-5">TOP YES Holders</h3>
              {loading && <div className="text-sm text-gray-700">Loading holders...</div>}
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded">{error}</div>}
              {!loading && !error && holders && (
                <div className="space-y-4">
                  {holders.yes.map((h, idx) => {
                    const usd = (h.shares || 0) * (yesPrice / 100);
                    const name = h.displayName && h.displayName.trim().length > 0 ? h.displayName : (h.addressShort || shorten(h.address));
                    const profileHandle = (h.displayName && h.displayName.trim().length > 0) ? h.displayName.trim() : '';
                    const profileUrl = profileHandle ? `https://polymarket.com/@${profileHandle}` : undefined;
                    return (
                      <div key={`yes-${idx}`} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4 min-w-0">
                          {h.profileImage ? (
                            <img src={h.profileImage} alt={name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm">Y</div>
                          )}
                          <div className="min-w-0 max-w-[200px]">
                            {profileUrl ? (
                              <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-blue-700 hover:underline truncate block" title={name}>{name}</a>
                            ) : (
                              <div className="text-base font-medium text-gray-900 truncate" title={name}>{name}</div>
                            )}
                            <div className="text-sm text-gray-600 font-mono truncate">{h.addressShort || shorten(h.address)}</div>
                            <div className="mt-1 flex gap-2 flex-wrap">
                              {typeof h.winStreakLatest === 'number' && h.winStreakLatest > 0 && (
                                <div className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">🔥 {h.winStreakLatest}W Streak</div>
                              )}
                              {typeof h.loseStreakLatest === 'number' && h.loseStreakLatest > 0 && (
                                <div className="inline-block text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">❄️ {h.loseStreakLatest}L Streak</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-semibold text-gray-900">{h.shares.toLocaleString()} shares</div>
                          <div className="text-sm text-gray-600">{formatCurrency(usd)}</div>
                          {typeof h.avgPriceCents === 'number' && (
                            <div className="text-sm text-gray-600">Avg: {h.avgPriceCents.toFixed(1)}¢</div>
                          )}
                          {typeof h.percentPnl === 'number' || typeof h.percentRealizedPnl === 'number' ? (
                            <div className={`text-sm ${(h.percentPnl ?? h.percentRealizedPnl ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              PnL: {(h.percentPnl ?? h.percentRealizedPnl ?? 0).toFixed(1)}%
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* NO holders */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-red-700 mb-5">TOP NO Holders</h3>
              {loading && <div className="text-sm text-gray-700">Loading holders...</div>}
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded">{error}</div>}
              {!loading && !error && holders && (
                <div className="space-y-4">
                  {holders.no.map((h, idx) => {
                    const usd = (h.shares || 0) * (noPrice / 100);
                    const name = h.displayName && h.displayName.trim().length > 0 ? h.displayName : (h.addressShort || shorten(h.address));
                    const profileHandle = (h.displayName && h.displayName.trim().length > 0) ? h.displayName.trim() : '';
                    const profileUrl = profileHandle ? `https://polymarket.com/@${profileHandle}` : undefined;
                    return (
                      <div key={`no-${idx}`} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4 min-w-0">
                          {h.profileImage ? (
                            <img src={h.profileImage} alt={name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-sm">N</div>
                          )}
                          <div className="min-w-0 max-w-[200px]">
                            {profileUrl ? (
                              <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-blue-700 hover:underline truncate block" title={name}>{name}</a>
                            ) : (
                              <div className="text-base font-medium text-gray-900 truncate" title={name}>{name}</div>
                            )}
                            <div className="text-sm text-gray-600 font-mono truncate">{h.addressShort || shorten(h.address)}</div>
                            <div className="mt-1 flex gap-2 flex-wrap">
                              {typeof h.winStreakLatest === 'number' && h.winStreakLatest > 0 && (
                                <div className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">🔥 {h.winStreakLatest}W Streak</div>
                              )}
                              {typeof h.loseStreakLatest === 'number' && h.loseStreakLatest > 0 && (
                                <div className="inline-block text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">❄️ {h.loseStreakLatest}L Streak</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-semibold text-gray-900">{h.shares.toLocaleString()} shares</div>
                          <div className="text-sm text-gray-600">{formatCurrency(usd)}</div>
                          {typeof h.avgPriceCents === 'number' && (
                            <div className="text-sm text-gray-600">Avg: {h.avgPriceCents.toFixed(1)}¢</div>
                          )}
                          {typeof h.percentPnl === 'number' || typeof h.percentRealizedPnl === 'number' ? (
                            <div className={`text-sm ${(h.percentPnl ?? h.percentRealizedPnl ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              PnL: {(h.percentPnl ?? h.percentRealizedPnl ?? 0).toFixed(1)}%
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


