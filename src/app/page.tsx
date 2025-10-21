'use client';

import { useState, useEffect } from 'react';
import MarketCard from '@/components/MarketCard';
import MarketModal from '@/components/MarketModal';
import LiveOrdersFeed from '@/components/LiveOrdersFeed';
import { Market } from '@/types/market';

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch markets function
  const fetchMarkets = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = search 
        ? `/api/markets?search=${encodeURIComponent(search)}`
        : '/api/markets';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch markets');
      }
      
      const data = await response.json();
      setMarkets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  // Load top markets on mount
  useEffect(() => {
    fetchMarkets();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchMarkets(searchQuery);
      } else {
        fetchMarkets(); // Load top markets when search is cleared
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl sm:text-8xl font-bold mb-4 tracking-tight glass-heading" style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
            Artifice
          </h1>
          <p className="text-lg text-blue-600 font-medium" style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
            Top Polymarket Markets by 24h Volume
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="glass-search w-full px-6 py-4 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="glass-card px-8 py-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-lg font-medium text-gray-700">
                  Loading markets...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex justify-center items-center py-12">
            <div className="glass-card px-8 py-4 bg-red-50 border-red-200">
              <p className="text-lg font-medium text-red-700">
                Error: {error}
              </p>
            </div>
          </div>
        )}

        {/* Markets Grid and Live Orders - Side by Side */}
        {!loading && !error && markets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Markets Grid - Takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {markets.map((market) => (
                  <MarketCard key={market.id} market={market} onOpen={() => setSelectedMarket(market)} />
                ))}
              </div>
            </div>

            {/* Live Orders Feed - Takes 1 column */}
            <div className="lg:col-span-1">
              <LiveOrdersFeed />
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && markets.length === 0 && searchQuery && (
          <div className="flex justify-center items-center py-12">
            <div className="glass-card px-8 py-4">
              <p className="text-lg font-medium text-gray-700">
                No markets found for "{searchQuery}"
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && markets.length === 0 && !searchQuery && (
          <div className="flex justify-center items-center py-12">
            <div className="glass-card px-8 py-4">
              <p className="text-lg font-medium text-gray-700">
                No markets available at the moment
              </p>
            </div>
          </div>
        )}
      </div>
      {selectedMarket && (
        <MarketModal market={selectedMarket} onClose={() => setSelectedMarket(null)} />
      )}
    </div>
  );
}
