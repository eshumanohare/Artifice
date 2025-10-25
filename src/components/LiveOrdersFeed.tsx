'use client';

import { useEffect, useState, useRef } from 'react';
import { Order, Market } from '@/types/market';

const MAX_ORDERS = 10;

interface OrderWithMarket extends Order {
  marketQuestion?: string;
}

export default function LiveOrdersFeed() {
  const [orders, setOrders] = useState<OrderWithMarket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [removingOrderId, setRemovingOrderId] = useState<string | null>(null);
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const newOrderQueueRef = useRef<OrderWithMarket[]>([]);
  const processingRef = useRef<boolean>(false);
  const marketLookupRef = useRef<Map<string, string>>(new Map());

  // Process queue to add orders one by one
  const processQueue = async () => {
    if (processingRef.current || newOrderQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    const newOrder = newOrderQueueRef.current.shift()!;

    setOrders(prevOrders => {
      // Add new order at the top
      const updatedOrders = [newOrder, ...prevOrders];

      // If we exceed max, mark the last one for removal
      if (updatedOrders.length > MAX_ORDERS) {
        const orderToRemove = updatedOrders[updatedOrders.length - 1];
        const removeId = `${orderToRemove.orderHash}-${orderToRemove.timestamp}`;
        
        setRemovingOrderId(removeId);
        
        // Remove it after animation
        setTimeout(() => {
          setOrders(current => current.slice(0, MAX_ORDERS));
          setRemovingOrderId(null);
          processingRef.current = false;
          processQueue(); // Process next in queue
        }, 800);
        
        return updatedOrders;
      } else {
        processingRef.current = false;
        // Process next order after a short delay
        setTimeout(() => processQueue(), 300);
        return updatedOrders;
      }
    });
  };

  // Fetch market question for a given token ID from cached data
  const fetchMarketQuestion = async (tokenId: string): Promise<string | undefined> => {
    try {
      // Check if already in cache
      if (marketLookupRef.current.has(tokenId)) {
        return marketLookupRef.current.get(tokenId);
      }

      // Fetch from API (which uses cached markets data)
      const res = await fetch(`/api/markets/by-token?tokenId=${encodeURIComponent(tokenId)}`);
      if (!res.ok) return undefined;
      
      const data = await res.json();
      
      // Cache the result
      if (data.question) {
        marketLookupRef.current.set(tokenId, data.question);
      }
      
      return data.question || undefined;
    } catch (err) {
      console.error('Error fetching market question:', err);
      return undefined;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        
        if (isMounted && Array.isArray(data.orders)) {
          // Find truly new orders (not seen before)
          const newOrders = data.orders.filter((order: Order) => {
            const orderId = `${order.orderHash}-${order.timestamp}`;
            if (seenOrderIdsRef.current.has(orderId)) {
              return false;
            }
            seenOrderIdsRef.current.add(orderId);
            return true;
          }).map(async (order: Order) => {
            // Enrich with market question
            // For BUY: maker pays USDC (assetId=0), gets tokens (use takerAssetId - non-zero)
            // For SELL: maker pays tokens (use makerAssetId - non-zero), gets USDC (assetId=0)
            const rawTokenId = order.side === 'BUY' ? order.takerAssetId : order.makerAssetId;
            
            // Skip if it's the zero address (USDC)
            if (rawTokenId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
              return { ...order, marketQuestion: undefined };
            }
            
            const marketQuestion = await fetchMarketQuestion(rawTokenId);
            
            return { ...order, marketQuestion };
          });

          // Resolve all promises
          const resolvedOrders = await Promise.all(newOrders);

          // Add new orders to queue
          if (resolvedOrders.length > 0) {
            newOrderQueueRef.current.push(...resolvedOrders);
            processQueue();
          }
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    // Check for new orders every 2 seconds for more responsive updates
    intervalId = setInterval(fetchOrders, 2000);

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
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: string) => {
    try {
      const num = Number(BigInt(amount)) / 1e6;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toFixed(0);
    } catch {
      return '0';
    }
  };

  const calculateOrderValue = (order: OrderWithMarket): string => {
    try {
      // For BUY orders: maker pays USD (makerAmountFilled), gets tokens (takerAmountFilled)
      // For SELL orders: maker pays tokens (makerAmountFilled), gets USD (takerAmountFilled)
      const usdAmount = order.side === 'BUY' 
        ? Number(BigInt(order.makerAmountFilled)) / 1e6
        : Number(BigInt(order.takerAmountFilled)) / 1e6;
      
      if (usdAmount >= 1000000) return `$${(usdAmount / 1000000).toFixed(2)}M`;
      if (usdAmount >= 1000) return `$${(usdAmount / 1000).toFixed(2)}K`;
      return `$${usdAmount.toFixed(2)}`;
    } catch {
      return '$0';
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
      {/* Header */}
      <div className="mb-6">
        <div>
          <h2 className="text-3xl font-bold text-blue-900 mb-2">Live Orders</h2>
          <p className="text-sm text-gray-600">Real-time order activity across all markets</p>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm">No recent orders</p>
        </div>
      ) : (
        <div className="relative">
          <div className="space-y-3 pb-24">
            {orders.map((order, idx) => {
              const isBuy = order.side === 'BUY';
              const orderId = `${order.orderHash}-${order.timestamp}`;
              const isRemoving = removingOrderId === orderId;
              const isBottomMost = idx === orders.length - 1 && orders.length === MAX_ORDERS;
              
              // Only blur the bottom-most order when at capacity
              const blurAmount = isBottomMost ? 2.5 : 0;
              const opacityAmount = isBottomMost ? 0.4 : 1;
              
              return (
                <div
                  key={orderId}
                  className={`
                    p-3 rounded-lg border hover:shadow-md
                    ${isBuy 
                      ? 'bg-green-50/50 border-green-200 hover:bg-green-50' 
                      : 'bg-red-50/50 border-red-200 hover:bg-red-50'
                    }
                    ${isRemoving ? 'animate-fade-blur-down' : 'animate-slide-from-top'}
                  `}
                  style={{
                    filter: `blur(${blurAmount}px)`,
                    opacity: isRemoving ? 0 : opacityAmount,
                    transition: isRemoving ? 'all 0.8s ease-out' : 'all 0.7s ease-out',
                    transform: isRemoving ? 'translateY(40px) scale(0.95)' : 'translateY(0)',
                  }}
                >
                <div className="space-y-2">
                  {/* Top Row: Side, Price, Value, Time */}
                  <div className="flex items-center justify-between gap-3">
                    {/* Side Badge */}
                    <div className={`
                      shrink-0 px-3 py-1 rounded-md text-xs font-bold
                      ${isBuy ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                    `}>
                      {order.side}
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <div className={`text-lg font-bold ${isBuy ? 'text-green-700' : 'text-red-700'}`}>
                        {order.price.toFixed(1)}¢
                      </div>
                    </div>

                    {/* Dollar Value */}
                    <div className="text-sm font-bold text-blue-900">
                      {calculateOrderValue(order)}
                    </div>

                    {/* Time */}
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-gray-500">{formatTime(order.timestamp)}</div>
                    </div>
                  </div>

                  {/* Market Question */}
                  {order.marketQuestion && (
                    <div className="text-sm text-gray-700 line-clamp-2 leading-tight">
                      {order.marketQuestion}
                    </div>
                  )}

                  {/* Bottom Row: Tokens and Block */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                      {formatAmount(isBuy ? order.takerAmountFilled : order.makerAmountFilled)} tokens
                    </div>
                    <div>
                      Block {order.blockNumber.toLocaleString()}
                    </div>
                  </div>
                </div>
                </div>
              );
            })}
          </div>
          
          {/* Gradient fade at bottom */}
          {orders.length > 0 && (
            <div className="fixed bottom-0 right-0 w-full sm:w-[450px] h-32 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
          )}
        </div>
      )}
    </div>
  );
}

