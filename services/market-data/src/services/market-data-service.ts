import {
  nepseClient,
  normalizeStock,
  normalizeIndex,
  NormalizedStock,
  NormalizedIndex,
  NormalizedOHLC,
} from '../clients/nepse-client';
import { getCached, setCache, CACHE_KEYS } from '../cache/redis-cache';

// ---------------------------------------------------------------------------
// TTLs
// ---------------------------------------------------------------------------

const LIVE_TTL = 30; // 30 seconds for live market data
const STOCK_TTL = 30; // 30 seconds for individual stock
const OHLC_TTL = 60; // 60 seconds for OHLC data

// ---------------------------------------------------------------------------
// Request deduplication
// ---------------------------------------------------------------------------

const inflightRequests = new Map<string, Promise<unknown>>();

async function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn().finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Market Data Service
// ---------------------------------------------------------------------------

export class MarketDataService {
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private fallbackInterval: ReturnType<typeof setInterval> | null = null;
  private isPolling = false;

  // -----------------------------------------------------------------------
  // GET /api/market/live — all securities with live prices
  // -----------------------------------------------------------------------

  async getLiveMarket(): Promise<NormalizedStock[]> {
    return dedup('live-market', async () => {
      // Check cache first
      const cached = await getCached<NormalizedStock[]>(CACHE_KEYS.LIVE_MARKET);
      if (cached) return cached;

      // Fetch from NEPSE
      const raw = await nepseClient.fetchSecurityList();
      if (!raw || raw.length === 0) {
        console.warn('[MarketDataService] No live market data received');
        return [];
      }

      const normalized = raw.map(normalizeStock).filter((s) => s.symbol);

      // Cache for 30 seconds
      await setCache(CACHE_KEYS.LIVE_MARKET, normalized, LIVE_TTL);
      console.log(
        `[MarketDataService] Cached ${normalized.length} live stocks`,
      );
      return normalized;
    });
  }

  // -----------------------------------------------------------------------
  // GET /api/stock/:symbol — single stock detail
  // -----------------------------------------------------------------------

  async getStock(symbol: string): Promise<NormalizedStock | null> {
    const upper = symbol.toUpperCase().trim();
    return dedup(`stock-${upper}`, async () => {
      const cacheKey = CACHE_KEYS.STOCK_LIVE(upper);
      const cached = await getCached<NormalizedStock>(cacheKey);
      if (cached) return cached;

      // Try fetching from live market cache first (avoids extra API call)
      const liveMarket = await getCached<NormalizedStock[]>(CACHE_KEYS.LIVE_MARKET);
      if (liveMarket) {
        const found = liveMarket.find((s) => s.symbol === upper);
        if (found) {
          await setCache(cacheKey, found, STOCK_TTL);
          return found;
        }
      }

      // Fetch individual security from NEPSE
      const raw = await nepseClient.fetchSecurityDetail(upper);
      if (!raw) {
        // Last resort: fetch full list and find the stock
        const allStocks = await this.getLiveMarket();
        return allStocks.find((s) => s.symbol === upper) ?? null;
      }

      const normalized = normalizeStock(raw);
      await setCache(cacheKey, normalized, STOCK_TTL);
      return normalized;
    });
  }

  // -----------------------------------------------------------------------
  // GET /api/ohlc/:symbol — OHLC history for a symbol
  // -----------------------------------------------------------------------

  async getOHLC(
    symbol: string,
    days = 365,
  ): Promise<NormalizedOHLC[]> {
    const upper = symbol.toUpperCase().trim();
    return dedup(`ohlc-${upper}-${days}`, async () => {
      const cacheKey = CACHE_KEYS.OHLC_LIVE(upper, days);
      const cached = await getCached<NormalizedOHLC[]>(cacheKey);
      if (cached) return cached;

      // Compute date range
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split('T')[0];

      // Try NEPSE price history API
      // Note: this requires a numeric securityId which we may not always have.
      // For now, we'll return what we can from the live data and indicate
      // that full historical OHLC requires the database to be seeded.

      // Build minimal OHLC from live market data if available
      const stock = await this.getStock(upper);
      if (stock) {
        const todayOHLC: NormalizedOHLC = {
          date: new Date().toISOString().split('T')[0],
          open: stock.open,
          high: stock.high,
          low: stock.low,
          close: stock.close,
          volume: stock.volume,
          turnover: stock.turnover,
        };

        const result = [todayOHLC];
        await setCache(cacheKey, result, OHLC_TTL);
        return result;
      }

      return [];
    });
  }

  // -----------------------------------------------------------------------
  // Market indices
  // -----------------------------------------------------------------------

  async getIndices(): Promise<NormalizedIndex[]> {
    return dedup('indices', async () => {
      const cached = await getCached<NormalizedIndex[]>(CACHE_KEYS.INDICES_LIVE);
      if (cached) return cached;

      const raw = await nepseClient.fetchIndices();
      if (!raw || raw.length === 0) return [];

      const normalized = raw.map(normalizeIndex);
      await setCache(CACHE_KEYS.INDICES_LIVE, normalized, LIVE_TTL);
      return normalized;
    });
  }

  // -----------------------------------------------------------------------
  // Market status
  // -----------------------------------------------------------------------

  async isMarketOpen(): Promise<boolean> {
    const status = await nepseClient.fetchMarketStatus();
    if (status) {
      return status.isOpen === 'OPEN';
    }
    // Fallback: check if within NEPSE trading hours (Sun–Thu, 11:00–15:00 NPT)
    const now = new Date();
    // NPT = UTC+5:45
    const nptHour =
      (now.getUTCHours() + 5 + (now.getUTCMinutes() + 45 >= 60 ? 1 : 0)) % 24;
    const nptDay = now.getUTCDay(); // 0=Sun
    const isTradingDay = nptDay >= 0 && nptDay <= 4; // Sun-Thu
    const isTradingHour = nptHour >= 11 && nptHour < 15;
    return isTradingDay && isTradingHour;
  }

  // -----------------------------------------------------------------------
  // Polling scheduler
  // -----------------------------------------------------------------------

  startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;

    const poll = async (): Promise<void> => {
      try {
        const open = await this.isMarketOpen();
        if (open) {
          console.log('[Poller] Market open — fetching live data');
          await this.getLiveMarket();
          await this.getIndices();
        } else {
          console.log('[Poller] Market closed — skipping live fetch');
        }
      } catch (err) {
        console.error('[Poller] Error:', err);
      }
    };

    // Primary: every 10 seconds during market hours
    this.pollInterval = setInterval(poll, 10_000);

    // Fallback: every 60 seconds regardless (catches anything the primary misses)
    this.fallbackInterval = setInterval(async () => {
      try {
        await this.getLiveMarket();
      } catch {
        // silently ignore fallback errors
      }
    }, 60_000);

    // Initial fetch on startup
    void poll();
    console.log(
      '[Poller] Started — 10s intraday, 60s fallback',
    );
  }

  stopPolling(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.fallbackInterval) clearInterval(this.fallbackInterval);
    this.isPolling = false;
    console.log('[Poller] Stopped');
  }
}

// Singleton
export const marketDataService = new MarketDataService();
