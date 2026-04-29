import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
});

const DEFAULT_TTL = 60; // 1 minute for live data
const EOD_TTL = 86400; // 24 hours for EOD data
const STATIC_TTL = 3600; // 1 hour for static data

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error('Cache set error:', err);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Cache invalidation error:', err);
  }
}

export const CACHE_KEYS = {
  MARKET_SUMMARY: 'market:summary',
  TOP_GAINERS: 'market:gainers',
  TOP_LOSERS: 'market:losers',
  TOP_VOLUME: 'market:volume',
  TOP_TURNOVER: 'market:turnover',
  ALL_STOCKS: 'market:all_stocks',
  STOCK_PRICE: (symbol: string) => `market:stock:${symbol}`,
  OHLC: (symbol: string, days: number) => `market:ohlc:${symbol}:${days}`,
  INDICES: 'market:indices',
  SECTORS: 'market:sectors',
};

export { DEFAULT_TTL, EOD_TTL, STATIC_TTL };
export default redis;
