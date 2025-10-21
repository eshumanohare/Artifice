import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const MARKETS_CACHE_FILE = path.join(CACHE_DIR, 'markets.json');
const EVENT_TOKENS_CACHE_FILE = path.join(CACHE_DIR, 'event-tokens.json');

interface CachedData<T> {
  data: T;
  timestamp: number;
}

interface EventTokensMap {
  [conditionId: string]: string[]; // conditionId -> array of tokenIds
}

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function cacheMarkets(data: any): void {
  try {
    ensureCacheDir();
    const cached: CachedData<any> = {
      data,
      timestamp: Date.now(),
    };
    fs.writeFileSync(MARKETS_CACHE_FILE, JSON.stringify(cached, null, 2), 'utf-8');
    console.log(`✅ Cached ${Array.isArray(data) ? data.length : 0} markets to ${MARKETS_CACHE_FILE}`);
    
    // Also cache event-to-tokenIds mapping
    cacheEventTokensMapping(data);
  } catch (error) {
    console.error('❌ Error caching markets:', error);
  }
}

function cacheEventTokensMapping(markets: any[]): void {
  try {
    if (!Array.isArray(markets)) {
      console.warn('⚠️ Markets data is not an array, skipping event tokens cache');
      return;
    }
    
    const eventTokensMap: EventTokensMap = {};
    
    for (const market of markets) {
      const conditionId = market.conditionId;
      const tokenIds = market.clobTokenIds;
      
      if (conditionId && Array.isArray(tokenIds) && tokenIds.length > 0) {
        if (!eventTokensMap[conditionId]) {
          eventTokensMap[conditionId] = [];
        }
        // Add all token IDs for this condition
        for (const tokenId of tokenIds) {
          if (!eventTokensMap[conditionId].includes(tokenId)) {
            eventTokensMap[conditionId].push(tokenId);
          }
        }
      }
    }
    
    const cached: CachedData<EventTokensMap> = {
      data: eventTokensMap,
      timestamp: Date.now(),
    };
    
    ensureCacheDir();
    fs.writeFileSync(EVENT_TOKENS_CACHE_FILE, JSON.stringify(cached, null, 2), 'utf-8');
    console.log(`✅ Cached ${Object.keys(eventTokensMap).length} events with token mappings to ${EVENT_TOKENS_CACHE_FILE}`);
  } catch (error) {
    console.error('❌ Error caching event tokens mapping:', error);
  }
}

export function getCachedMarkets(): any | null {
  try {
    if (!fs.existsSync(MARKETS_CACHE_FILE)) {
      return null;
    }
    const content = fs.readFileSync(MARKETS_CACHE_FILE, 'utf-8');
    const cached: CachedData<any> = JSON.parse(content);
    
    // Cache is valid for 5 minutes
    const CACHE_TTL = 5 * 60 * 1000;
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      return null;
    }
    
    return cached.data;
  } catch (error) {
    console.error('Error reading cached markets:', error);
    return null;
  }
}

export function getEventTokenIds(conditionId: string): string[] {
  try {
    if (!fs.existsSync(EVENT_TOKENS_CACHE_FILE)) {
      console.warn(`⚠️ Event tokens cache file not found: ${EVENT_TOKENS_CACHE_FILE}`);
      return [];
    }
    const content = fs.readFileSync(EVENT_TOKENS_CACHE_FILE, 'utf-8');
    const cached: CachedData<EventTokensMap> = JSON.parse(content);
    
    // Cache is valid for 5 minutes
    const CACHE_TTL = 5 * 60 * 1000;
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      console.warn('⚠️ Event tokens cache expired');
      return [];
    }
    
    const tokenIds = cached.data[conditionId] || [];
    console.log(`📦 Retrieved ${tokenIds.length} token IDs for conditionId ${conditionId}`);
    return tokenIds;
  } catch (error) {
    console.error('❌ Error reading event tokens mapping:', error);
    return [];
  }
}

export function findMarketByTokenId(tokenId: string): any | null {
  try {
    const markets = getCachedMarkets();
    if (!markets || !Array.isArray(markets)) {
      return null;
    }
    
    return markets.find((market: any) => 
      market.clobTokenIds && market.clobTokenIds.includes(tokenId)
    ) || null;
  } catch (error) {
    console.error('Error finding market by tokenId:', error);
    return null;
  }
}

export function findMarketByConditionId(conditionId: string): any | null {
  try {
    const markets = getCachedMarkets();
    if (!markets || !Array.isArray(markets)) {
      return null;
    }
    
    return markets.find((market: any) => market.conditionId === conditionId) || null;
  } catch (error) {
    console.error('Error finding market by conditionId:', error);
    return null;
  }
}

