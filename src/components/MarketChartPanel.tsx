'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';
import { format, subHours } from 'date-fns';

interface ChartData {
  timestamp: number;
  yesPrice: number;
  noPrice: number;
  volume: number;
  tradeCount: number;
  uniqueTraders: number;
  buyPressure: number;
  sellPressure: number;
}

interface MarketChartPanelProps {
  marketId: string;
  marketQuestion?: string;
}

const INTERVAL_OPTIONS = [
  { value: '1min', label: '1 Minute' },
  { value: '5min', label: '5 Minutes' },
  { value: '15min', label: '15 Minutes' },
  { value: '1hr', label: '1 Hour' }
];

const HOURS_OPTIONS = [
  { value: 6, label: '6 Hours' },
  { value: 24, label: '24 Hours' },
  { value: 72, label: '3 Days' },
  { value: 168, label: '1 Week' }
];

export default function MarketChartPanel({ marketId, marketQuestion }: MarketChartPanelProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState('5min');
  const [selectedHours, setSelectedHours] = useState(24);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/markets/${marketId}/history?interval=${selectedInterval}&hours=${selectedHours}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setChartData(data.intervals || []);
      setLastUpdate(data.lastUpdate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchChartData, 30000);
    return () => clearInterval(interval);
  }, [marketId, selectedInterval, selectedHours]);

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const formatTooltipTime = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd, HH:mm');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 border border-blue-200/40">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {formatTooltipTime(data.timestamp)}
          </p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-green-600 font-medium">YES:</span> {data.yesPrice}¢
            </p>
            <p className="text-sm">
              <span className="text-red-600 font-medium">NO:</span> {data.noPrice}¢
            </p>
            <p className="text-sm">
              <span className="text-blue-600 font-medium">Volume:</span> ${data.volume.toLocaleString()}
            </p>
            <p className="text-sm">
              <span className="text-gray-600 font-medium">Trades:</span> {data.tradeCount}
            </p>
            <p className="text-sm">
              <span className="text-purple-600 font-medium">Buy Pressure:</span> {data.buyPressure}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="glass-card px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium text-gray-700">Loading chart data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="glass-card px-8 py-4 bg-red-50 border-red-200">
          <p className="text-lg font-medium text-red-700">
            Error: {error}
          </p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="glass-card px-8 py-4">
          <p className="text-lg font-medium text-gray-700">
            No chart data available for this market
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-blue-900">Price & Volume Chart</h3>
          {marketQuestion && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{marketQuestion}</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Interval selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Interval:</label>
            <select
              value={selectedInterval}
              onChange={(e) => setSelectedInterval(e.target.value)}
              className="px-3 py-1 rounded-lg border border-blue-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {INTERVAL_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Time range selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Range:</label>
            <select
              value={selectedHours}
              onChange={(e) => setSelectedHours(parseInt(e.target.value))}
              className="px-3 py-1 rounded-lg border border-blue-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {HOURS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Price Movement</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value}¢`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="yesPrice"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="YES Price"
              />
              <Line
                type="monotone"
                dataKey="noPrice"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="NO Price"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volume Chart */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Trading Volume</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-card p-3 border border-blue-200/40">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {formatTooltipTime(data.timestamp)}
                        </p>
                        <p className="text-sm">
                          <span className="text-blue-600 font-medium">Volume:</span> ${data.volume.toLocaleString()}
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-600 font-medium">Trades:</span> {data.tradeCount}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="volume" 
                fill="#3b82f6"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {chartData.length > 0 ? chartData[chartData.length - 1].yesPrice : 0}¢
          </div>
          <div className="text-sm text-gray-600">Current YES</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {chartData.length > 0 ? chartData[chartData.length - 1].noPrice : 0}¢
          </div>
          <div className="text-sm text-gray-600">Current NO</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            ${chartData.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Volume</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {chartData.reduce((sum, d) => sum + d.tradeCount, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Trades</div>
        </div>
      </div>

      {/* Last update indicator */}
      {lastUpdate && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Last updated: {format(new Date(lastUpdate), 'MMM dd, HH:mm:ss')}
          </p>
        </div>
      )}
    </div>
  );
}
