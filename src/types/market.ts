export interface Market {
  id: string;
  question: string;
  description?: string;
  image?: string;
  volume24hr: number;
  liquidity: number;
  outcomePrices: number[];
  endDate: string;
  clobTokenIds: string[];
  conditionId: string;
  slug: string;
  volume?: number;
  volume1wk?: number;
  volume1mo?: number;
  lastTradePrice?: number;
  bestAsk?: number[] | number;
  spread?: number;
}

export interface MarketResponse {
  markets: Market[];
  error?: string;
}

export type HolderSide = 'YES' | 'NO';

export interface Holder {
  address: string;
  addressShort: string;
  shares: number;
  usdValue: number;
  side: HolderSide;
  displayName?: string;
  profileImage?: string;
  tokenId?: string;
  avgPriceCents?: number; // average entry price in cents if available
  cashPnlUsd?: number;
  percentPnl?: number; // -100..+inf
  percentRealizedPnl?: number;
  winStreakLatest?: number; // consecutive wins (realizedPnl > 0) from latest closed positions
  loseStreakLatest?: number; // consecutive losses (realizedPnl < 0) from latest closed positions
}
