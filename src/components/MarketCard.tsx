'use client';

import { Market } from '@/types/market';

interface MarketCardProps {
  market: Market;
  onOpen?: () => void;
}

export default function MarketCard({ market, onOpen }: MarketCardProps) {
  // Mock sentiment data - in a real app, this would come from analytics API
  const getSentimentIndicators = () => {
    // Simulate sentiment based on volume and price movement
    const volume = market.volume24hr;
    const liquidity = market.liquidity;
    const volumeLiquidityRatio = volume / liquidity;
    
    const indicators = [];
    
    // High volume indicator
    if (volume > 100000) {
      indicators.push({ emoji: '🔥', label: 'Hot', color: 'bg-orange-100 text-orange-700 border-orange-200' });
    }
    
    // High liquidity indicator
    if (liquidity > 500000) {
      indicators.push({ emoji: '💎', label: 'Liquid', color: 'bg-blue-100 text-blue-700 border-blue-200' });
    }
    
    // High volume/liquidity ratio (unusual activity)
    if (volumeLiquidityRatio > 0.5) {
      indicators.push({ emoji: '⚡', label: 'Active', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' });
    }
    
    // Price movement indicator (simplified)
    const yesPrice = parseFloat(String(market.outcomePrices[0] || '0')) * 100;
    if (yesPrice > 60) {
      indicators.push({ emoji: '📈', label: 'Bullish', color: 'bg-green-100 text-green-700 border-green-200' });
    } else if (yesPrice < 40) {
      indicators.push({ emoji: '📉', label: 'Bearish', color: 'bg-red-100 text-red-700 border-red-200' });
    }
    
    return indicators;
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format cents (for outcome prices)
  const formatCents = (cents: number) => {
    return `${cents.toFixed(1)}¢`;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Format date and calculate time remaining
  const formatDateAndTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const timeDiff = end.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return { formattedDate: 'Ended', timeRemaining: 'Expired' };
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    const formattedDate = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    let timeRemaining = '';
    if (days > 0) {
      timeRemaining = `${days} day${days !== 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      timeRemaining = `${hours} hour${hours !== 1 ? 's' : ''} left`;
    } else {
      timeRemaining = 'Less than 1 hour left';
    }

    return { formattedDate, timeRemaining };
  };

  const { formattedDate, timeRemaining } = formatDateAndTimeRemaining(market.endDate);
  const sentimentIndicators = getSentimentIndicators();
  
  // Parse outcome prices and convert from dollars to cents
  const yesPrice = parseFloat(String(market.outcomePrices[0] || '0')) * 100;
  const noPrice = parseFloat(String(market.outcomePrices[1] || '0')) * 100;

  return (
    <div onClick={onOpen} className="glass-card group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden" style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
      {/* Event Image Banner */}
      {market.eventImage && (
        <div className="w-full h-40 overflow-hidden">
          <img 
            src={market.eventImage} 
            alt={market.question} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      )}
      
      <div className="p-6 space-y-4">
        {/* Market Question */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight line-clamp-2">
            {market.question}
          </h3>
          
          {/* Sentiment Indicators */}
          {sentimentIndicators.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sentimentIndicators.map((indicator, index) => (
                <div
                  key={index}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${indicator.color}`}
                >
                  <span>{indicator.emoji}</span>
                  <span>{indicator.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Volume and Liquidity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">24h Volume</p>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(market.volume24hr)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Liquidity</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(market.liquidity)}
            </p>
          </div>
        </div>

        {/* Yes/No Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-1">YES</p>
            <p className="text-xl font-bold text-green-600">
              {formatCents(yesPrice)}
            </p>
            <p className="text-sm text-green-500">
              {formatPercentage(yesPrice / 100)}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700 mb-1">NO</p>
            <p className="text-xl font-bold text-red-600">
              {formatCents(noPrice)}
            </p>
            <p className="text-sm text-red-500">
              {formatPercentage(noPrice / 100)}
            </p>
          </div>
        </div>

        {/* End Date */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Ends:</span>
            <span className="font-medium text-gray-900">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-gray-500">Time left:</span>
            <span className={`font-medium ${timeRemaining === 'Expired' ? 'text-red-600' : 'text-blue-600'}`}>
              {timeRemaining}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
