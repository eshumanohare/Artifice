'use client';

import { useEffect, useState } from 'react';
import { Order } from '@/types/market';

export default function LiveOrdersFeed() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        
        if (isMounted && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    // Refresh every 5 seconds for live updates
    intervalId = setInterval(fetchOrders, 5000);

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

  return (
    <div className="glass-card p-6 border border-blue-200/40" style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Live Orders</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time order activity across all markets</p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
          </div>
          <span className="text-sm font-semibold text-green-700">LIVE</span>
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
        <div className="space-y-2 max-h-[600px] overflow-y-auto hide-scrollbar">
          {orders.map((order, idx) => {
            const isBuy = order.side === 'BUY';
            
            return (
              <div
                key={`${order.orderHash}-${order.timestamp}-${idx}`}
                className={`
                  p-3 rounded-lg border transition-all duration-200 hover:shadow-md
                  ${isBuy 
                    ? 'bg-green-50/50 border-green-200 hover:bg-green-50' 
                    : 'bg-red-50/50 border-red-200 hover:bg-red-50'
                  }
                `}
                style={{
                  animation: `slideIn 0.3s ease-out`,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Side Badge */}
                  <div className={`
                    shrink-0 px-3 py-1 rounded-md text-xs font-bold
                    ${isBuy ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                  `}>
                    {order.side}
                  </div>

                  {/* Price */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-lg font-bold ${isBuy ? 'text-green-700' : 'text-red-700'}`}>
                      {order.price.toFixed(1)}¢
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatAmount(order.makerAmountFilled)} tokens
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="hidden sm:flex flex-col gap-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">From:</span>
                      <span className="font-mono">{order.maker}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">To:</span>
                      <span className="font-mono">{order.taker}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-gray-500">{formatTime(order.timestamp)}</div>
                    <div className="text-xs text-gray-400">Block {order.blockNumber.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

