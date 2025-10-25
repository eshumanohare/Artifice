// Envio API Client for fetching indexed order data
// This replaces the local Python streaming with Envio's indexed data

interface EnvioOrder {
  id: string;
  orderHash: string;
  maker: string;
  taker: string;
  side: 'BUY' | 'SELL';
  price: string;
  volumeUsd: string;
  marketQuestion?: string;
  timestamp: string;
  blockNumber: string;
}

interface EnvioResponse<T> {
  data: {
    [key: string]: T[];
  };
}

class EnvioClient {
  private baseUrl: string;
  private apiToken: string;

  constructor(baseUrl: string, apiToken: string) {
    this.baseUrl = baseUrl;
    this.apiToken = apiToken;
  }

  private async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  async getRecentOrders(limit: number = 10): Promise<EnvioOrder[]> {
    const query = `
      query GetRecentOrders($limit: Int!) {
        orders(
          first: $limit
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          orderHash
          maker
          taker
          side
          price
          volumeUsd
          marketQuestion
          timestamp
          blockNumber
        }
      }
    `;

    const result = await this.query<{ orders: EnvioOrder[] }>(query, { limit });
    return result.orders || [];
  }

  async getOrdersByMarket(tokenId: string, limit: number = 10): Promise<EnvioOrder[]> {
    const query = `
      query GetOrdersByMarket($tokenId: String!, $limit: Int!) {
        orders(
          first: $limit
          orderBy: timestamp
          orderDirection: desc
          where: {
            or: [
              { makerAssetId: $tokenId }
              { takerAssetId: $tokenId }
            ]
          }
        ) {
          id
          orderHash
          maker
          taker
          side
          price
          volumeUsd
          marketQuestion
          timestamp
          blockNumber
        }
      }
    `;

    const result = await this.query<{ orders: EnvioOrder[] }>(query, { tokenId, limit });
    return result.orders || [];
  }

  async getDailyStats(date: string) {
    const query = `
      query GetDailyStats($date: String!) {
        dailyStats(id: $date) {
          id
          totalVolume
          totalOrders
          uniqueTraders
          avgOrderSize
        }
      }
    `;

    const result = await this.query<{ dailyStats: any }>(query, { date });
    return result.dailyStats;
  }

  async getMarketStats(tokenId: string) {
    const query = `
      query GetMarketStats($tokenId: String!) {
        market(id: $tokenId) {
          id
          question
          totalVolume
          totalOrders
          status
          lastOrderAt
        }
      }
    `;

    const result = await this.query<{ market: any }>(query, { tokenId });
    return result.market;
  }
}

// Create a singleton instance
// You'll need to replace these with your actual Envio endpoint and API token
const ENVIO_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_ENDPOINT || 'https://your-envio-endpoint.com/graphql';
const ENVIO_API_TOKEN = process.env.NEXT_PUBLIC_ENVIO_API_TOKEN || '6f20c5c4-0f67-4713-9bd4-4d56760b8122';

export const envioClient = new EnvioClient(ENVIO_ENDPOINT, ENVIO_API_TOKEN);

// Helper function to convert Envio order to your existing Order type
export function convertEnvioOrderToOrder(envioOrder: EnvioOrder) {
  return {
    orderHash: envioOrder.orderHash,
    maker: envioOrder.maker,
    taker: envioOrder.taker,
    makerAssetId: '0x' + BigInt(envioOrder.side === 'BUY' ? '0' : '1').toString(16).padStart(64, '0'),
    takerAssetId: '0x' + BigInt(envioOrder.side === 'BUY' ? '1' : '0').toString(16).padStart(64, '0'),
    makerAmountFilled: '0x' + BigInt(Math.floor(parseFloat(envioOrder.volumeUsd) * 1000000)).toString(16),
    takerAmountFilled: '0x' + BigInt(Math.floor(parseFloat(envioOrder.volumeUsd) * 1000000)).toString(16),
    fee: '0x0',
    blockNumber: parseInt(envioOrder.blockNumber),
    timestamp: parseInt(envioOrder.timestamp),
    side: envioOrder.side,
    price: parseFloat(envioOrder.price),
    volumeUsd: parseFloat(envioOrder.volumeUsd),
    marketQuestion: envioOrder.marketQuestion,
  };
}
