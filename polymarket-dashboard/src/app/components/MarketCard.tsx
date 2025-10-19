'use client';

import { MarketData } from '@/app/api/markets/route';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import Image from 'next/image';

interface MarketCardProps {
  market: MarketData;
  rank: number;
}

export default function MarketCard({ market, rank }: MarketCardProps) {
  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    } else {
      return `$${volume.toFixed(0)}`;
    }
  };

  const formatPrice = (price: number): string => {
    return (price * 100).toFixed(1) + '%';
  };

  const formatLiquidity = (liquidity: number): string => {
    if (liquidity >= 1000000) {
      return `$${(liquidity / 1000000).toFixed(1)}M`;
    } else if (liquidity >= 1000) {
      return `$${(liquidity / 1000).toFixed(1)}K`;
    } else {
      return `$${liquidity.toFixed(0)}`;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'No end date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Mock prices for Yes/No outcomes (in real implementation, these would come from the API)
  const yesPrice = 0.45; // 45%
  const noPrice = 0.55; // 55%

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 hover:-translate-y-1">
      {/* Rank Badge */}
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
        {rank}
      </div>

      {/* Market Image */}
      {market.image && (
        <div className="relative w-full h-32 mb-4 rounded-xl overflow-hidden">
          <Image
            src={market.image}
            alt={market.question}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Market Question */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4 line-clamp-2 leading-tight">
        {market.question}
      </h3>

      {/* Volume and Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 24hr Volume */}
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">24h Volume</p>
            <p className="text-sm font-semibold text-gray-800">{formatVolume(market.volume24hr)}</p>
          </div>
        </div>

        {/* Active Traders */}
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Traders</p>
            <p className="text-sm font-semibold text-gray-800">{market.activeTraderCount}</p>
          </div>
        </div>
      </div>

      {/* Liquidity */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <DollarSign className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Liquidity</p>
          <p className="text-sm font-semibold text-gray-800">{formatLiquidity(market.liquidity)}</p>
        </div>
      </div>

      {/* Outcome Prices */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Yes</p>
          <p className="text-lg font-bold text-green-700">{formatPrice(yesPrice)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">No</p>
          <p className="text-lg font-bold text-red-700">{formatPrice(noPrice)}</p>
        </div>
      </div>

      {/* End Date */}
      <div className="flex items-center space-x-2 text-gray-500">
        <Calendar className="w-4 h-4" />
        <p className="text-sm">Ends {formatDate(market.endDate)}</p>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}
