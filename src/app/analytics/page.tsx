'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

interface AnalyticsSummary {
  totalVolume24h: number;
  totalTrades24h: number;
  activeTraders24h: number;
  activeMarkets24h: number;
  lastUpdate: number;
}

interface MarketAnalytics {
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
}

interface WhaleActivity {
  orderHash: string;
  tokenId: string;
  side: string;
  volumeUsd: number;
  price: number;
  timestamp: number;
  maker: string;
  taker: string;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topMovers, setTopMovers] = useState<MarketAnalytics[]>([]);
  const [volumeLeaders, setVolumeLeaders] = useState<MarketAnalytics[]>([]);
  const [marketMomentum, setMarketMomentum] = useState<MarketAnalytics[]>([]);
  const [whaleActivity, setWhaleActivity] = useState<WhaleActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      
      const [summaryRes, topMoversRes, volumeLeadersRes, momentumRes, whaleRes] = await Promise.all([
        fetch('/api/analytics?section=summary'),
        fetch('/api/analytics?section=topMovers'),
        fetch('/api/analytics?section=volumeLeaders'),
        fetch('/api/analytics?section=marketMomentum'),
        fetch('/api/analytics?section=whaleActivity')
      ]);

      if (!summaryRes.ok) throw new Error('Failed to fetch analytics');

      const [summaryData, topMoversData, volumeLeadersData, momentumData, whaleData] = await Promise.all([
        summaryRes.json(),
        topMoversRes.json(),
        volumeLeadersRes.json(),
        momentumRes.json(),
        whaleRes.json()
      ]);

      setSummary(summaryData);
      setTopMovers(topMoversData);
      setVolumeLeaders(volumeLeadersData);
      setMarketMomentum(momentumData);
      setWhaleActivity(whaleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  };

  const shorten = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="glass-card px-8 py-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-lg font-medium text-gray-700">Loading analytics...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="glass-card px-8 py-4 bg-red-50 border-red-200">
              <p className="text-lg font-medium text-red-700">Error: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 relative z-10" style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl sm:text-8xl font-bold mb-4 tracking-tight glass-heading">
            Analytics
          </h1>
          <p className="text-lg text-blue-600 font-medium">
            Real-time Polymarket Analytics powered by HyperSync
          </p>
          {summary && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {format(new Date(summary.lastUpdate), 'MMM dd, HH:mm:ss')}
            </p>
          )}
        </div>

        {/* Back to Home */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 glass-card px-4 py-2 hover:scale-105 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Markets
          </Link>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatCurrency(summary.totalVolume24h)}
              </div>
              <div className="text-sm text-gray-600">24h Volume</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {summary.totalTrades24h.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">24h Trades</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {summary.activeTraders24h.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Active Traders</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {summary.activeMarkets24h}
              </div>
              <div className="text-sm text-gray-600">Active Markets</div>
            </div>
          </div>
        )}

        {/* Top Movers */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Top Movers (24h)</h2>
          <div className="glass-card p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-100/40">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Market</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Price Change</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Volume</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Trades</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Momentum</th>
                  </tr>
                </thead>
                <tbody>
                  {topMovers.map((market, idx) => (
                    <tr key={market.tokenId} className="border-b border-blue-50/40 hover:bg-blue-50/20">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {market.tokenId.slice(0, 8)}...
                            </div>
                            <div className="text-sm text-gray-500">
                              {market.uniqueTraders} traders
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className={`font-semibold ${market.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {market.priceChange >= 0 ? '+' : ''}{market.priceChange.toFixed(1)}¢
                        </div>
                        <div className={`text-sm ${market.priceChangePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {market.priceChangePct >= 0 ? '+' : ''}{market.priceChangePct.toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-medium text-gray-900">{formatCurrency(market.totalVolume)}</div>
                        <div className="text-sm text-gray-500">Recent: {formatCurrency(market.recentVolume)}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-medium text-gray-900">{market.tradeCount}</div>
                        <div className="text-sm text-gray-500">Recent: {market.recentTrades}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className={`w-3 h-3 rounded-full ${market.momentumScore > 50 ? 'bg-green-500' : market.momentumScore > 25 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                          <span className="text-sm font-medium">{market.momentumScore.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Volume Leaders */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Volume Leaders (24h)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {volumeLeaders.slice(0, 6).map((market, idx) => (
              <div key={market.tokenId} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {market.tokenId.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-500">
                        {market.uniqueTraders} traders
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(market.totalVolume)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {market.tradeCount} trades
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Buy Pressure:</span>
                    <span className="font-medium">{market.buyPressure.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price Change:</span>
                    <span className={`font-medium ${market.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {market.priceChange >= 0 ? '+' : ''}{market.priceChange.toFixed(1)}¢
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Whale Activity */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Recent Whale Activity</h2>
          <div className="glass-card p-6">
            <div className="space-y-4">
              {whaleActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🐋</div>
                  <p>No recent whale activity</p>
                </div>
              ) : (
                whaleActivity.map((whale, idx) => (
                  <div key={whale.orderHash} className="flex items-center justify-between p-4 bg-blue-50/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">🐋</div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {whale.side} Order - {formatCurrency(whale.volumeUsd)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {whale.price.toFixed(1)}¢ • {formatTime(whale.timestamp)}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {shorten(whale.maker)} → {shorten(whale.taker)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {whale.tokenId.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        {whale.orderHash.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* HyperSync Branding */}
        <div className="text-center py-8">
          <div className="glass-card p-6 inline-block">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Powered by HyperSync</div>
                <div className="text-sm text-gray-600">Ultra-fast blockchain data layer by Envio</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
