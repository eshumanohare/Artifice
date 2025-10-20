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
}

export interface MarketResponse {
  markets: Market[];
  error?: string;
}
