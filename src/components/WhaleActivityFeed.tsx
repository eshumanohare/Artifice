'use client';

import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';

interface WhaleActivity {
  orderHash: string;
  makerAssetId: string;
  takerAssetId: string;
  side: string;
  volumeUsd: number;
  price: number;
  timestamp: number;
  maker: string;
  taker: string;
}

const MAX_WHALES = 5;

export default function WhaleActivityFeed() {
  const [whaleActivity, setWhaleActivity] = useState<WhaleActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [removingWhaleId, setRemovingWhaleId] = useState<string | null>(null);
  const seenWhaleIdsRef = useRef<Set<string>>(new Set());
  const newWhaleQueueRef = useRef<WhaleActivity[]>([]);
  const processingRef = useRef<boolean>(false);

  // Process queue to add whales one by one
  const processQueue = async () => {
    if (processingRef.current || newWhaleQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    const newWhale = newWhaleQueueRef.current.shift()!;

    setWhaleActivity(prevWhales => {
      // Add new whale at the bottom (oldest first)
      const updatedWhales = [...prevWhales, newWhale];

      // If we exceed max, mark the first one for removal (oldest)
      if (updatedWhales.length > MAX_WHALES) {
        const whaleToRemove = updatedWhales[0];
        const removeId = `${whaleToRemove.orderHash}-${whaleToRemove.timestamp}`;
        
        setRemovingWhaleId(removeId);
        
        // Remove it after animation
        setTimeout(() => {
          setWhaleActivity(current => current.slice(1));
          setRemovingWhaleId(null);
          processingRef.current = false;
          processQueue(); // Process next in queue
        }, 800);
        
        return updatedWhales;
      } else {
        processingRef.current = false;
        // Process next whale after a short delay
        setTimeout(() => processQueue(), 500);
        return updatedWhales;
      }
    });
  };

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchWhaleActivity = async () => {
      try {
        const localApiUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL || 'http://localhost:3001';
        const res = await fetch(`${localApiUrl}/api/whales`);
        if (!res.ok) throw new Error('Failed to fetch whale activity');
        const data = await res.json();
        
        if (isMounted && Array.isArray(data.whales)) {
          // Find truly new whales (not seen before)
          const newWhales = data.whales.filter((whale: WhaleActivity) => {
            const whaleId = `${whale.orderHash}-${whale.timestamp}`;
            if (seenWhaleIdsRef.current.has(whaleId)) {
              return false;
            }
            seenWhaleIdsRef.current.add(whaleId);
            return true;
          });

          // Add new whales to queue
          if (newWhales.length > 0) {
            newWhaleQueueRef.current.push(...newWhales);
            processQueue();
          }
        }
      } catch (err) {
        console.error('Error fetching whale activity:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWhaleActivity();
    // Check for new whale activity every 10 seconds
    intervalId = setInterval(fetchWhaleActivity, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return format(new Date(timestamp), 'HH:mm');
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const shorten = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getPolygonScanUrl = (address: string) => {
    return `https://polygonscan.com/address/${address}`;
  };

  const getTraderAddress = (whale: WhaleActivity) => {
    // For BUY orders: maker is the buyer
    // For SELL orders: taker is the seller
    return whale.side === 'BUY' ? whale.maker : whale.taker;
  };

  return (
    <div style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
      {/* Header */}
      <div className="mb-6">
        <div>
          <h2 className="text-3xl font-bold text-blue-900 mb-2">🐋 Whale Activity</h2>
          <p className="text-sm text-gray-600">Large trades &gt; $10K USD</p>
        </div>
      </div>

      {/* Whale Activity List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : whaleActivity.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-3">🐋</div>
          <p className="text-sm">No recent whale activity</p>
        </div>
      ) : (
        <div className="relative">
          <div className="space-y-3 pb-24">
            {whaleActivity.map((whale, idx) => {
              const isBuy = whale.side === 'BUY';
              const whaleId = `${whale.orderHash}-${whale.timestamp}`;
              const isRemoving = removingWhaleId === whaleId;
              const isTopMost = idx === 0 && whaleActivity.length === MAX_WHALES;
              
              return (
                <div
                  key={whaleId}
                  className={`
                    p-4 rounded-lg border hover:shadow-md
                    ${isBuy 
                      ? 'bg-green-50/50 border-green-200 hover:bg-green-50' 
                      : 'bg-red-50/50 border-red-200 hover:bg-red-50'
                    }
                    ${isRemoving ? 'animate-fade-blur-down' : 'animate-slide-from-top'}
                  `}
                  style={{
                    opacity: isRemoving ? 0 : 1,
                    transition: isRemoving ? 'all 0.8s ease-out' : 'all 0.7s ease-out',
                    transform: isRemoving ? 'translateY(40px) scale(0.95)' : 'translateY(0)',
                  }}
                >
                  <div className="space-y-3">
                    {/* Top Row: Whale Icon, Side, Volume, Time */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Whale Icon & Side */}
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🐋</div>
                        <div className={`
                          shrink-0 px-3 py-1 rounded-md text-xs font-bold
                          ${isBuy ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                        `}>
                          {whale.side}
                        </div>
                      </div>

                      {/* Volume */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-900">
                          {formatCurrency(whale.volumeUsd)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {whale.price.toFixed(1)}¢
                        </div>
                      </div>

                      {/* Time */}
                      <div className="shrink-0 text-right">
                        <div className="text-xs text-gray-500">{formatTime(whale.timestamp)}</div>
                      </div>
                    </div>

                    {/* Market Info */}
                    <div className="text-sm text-gray-700">
                      <div className="font-mono text-xs text-gray-500 mb-1">
                        Market: {whale.takerAssetId.slice(0, 12)}...
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">
                            {shorten(whale.maker)} → {shorten(whale.taker)}
                          </span>
                          <span className="text-blue-600 font-medium">
                            ({whale.side === 'BUY' ? 'Buyer' : 'Seller'})
                          </span>
                        </div>
                        <a 
                          href={getPolygonScanUrl(getTraderAddress(whale))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {shorten(getTraderAddress(whale))}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Gradient fade at bottom */}
          {whaleActivity.length > 0 && (
            <div className="fixed bottom-0 right-0 w-full sm:w-[450px] h-32 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
          )}
        </div>
      )}
    </div>
  );
}
