import {
  nepseClient,
  normalizeStock,
  normalizeIndex,
  NormalizedStock,
  NormalizedIndex,
  NormalizedOHLC,
} from '../clients/nepse-client';
import { getCached, setCache, CACHE_KEYS } from '../cache/redis-cache';
import { broadcast } from '../ws/websocket-server';

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
        // Try last-known-good data before returning empty
        const lastKnown = await getCached<NormalizedStock[]>('market:last-known');
        if (lastKnown && lastKnown.length > 0) {
          console.log(`[MarketDataService] Using last-known data (${lastKnown.length} stocks)`);
          return lastKnown;
        }
        console.warn('[MarketDataService] No live market data received');
        return [];
      }

      const normalized = raw.map(normalizeStock).filter((s) => s.symbol);

      // Cache for 30 seconds + persist last-known-good (5 min TTL)
      await setCache(CACHE_KEYS.LIVE_MARKET, normalized, LIVE_TTL);
      await setCache('market:last-known', normalized, 300);
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
    // NPT = UTC+5:45 — compute properly by adding offset in minutes
    const now = new Date();
    const utcMs = now.getTime();
    const nptMs = utcMs + (5 * 60 + 45) * 60 * 1000;
    const nptDate = new Date(nptMs);
    const nptDay = nptDate.getUTCDay(); // 0=Sun
    const nptHour = nptDate.getUTCHours();
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

        // Always broadcast market status
        broadcast({
          type: 'status_update',
          timestamp: new Date().toISOString(),
          data: { isOpen: open },
        });

        if (open) {
          console.log('[Poller] Market open — fetching live data');
          const stocks = await this.getLiveMarket();
          const indices = await this.getIndices();

          // Push live data to all connected WebSocket clients
          if (stocks.length > 0) {
            broadcast({
              type: 'market_update',
              timestamp: new Date().toISOString(),
              data: {
                marketOpen: true,
                count: stocks.length,
                lastUpdated: new Date().toISOString(),
                data: stocks,
              },
            });
          }
          if (indices.length > 0) {
            broadcast({
              type: 'index_update',
              timestamp: new Date().toISOString(),
              data: indices,
            });
          }
        } else {
          console.log('[Poller] Market closed — skipping live fetch');
        }
      } catch (err) {
        console.error('[Poller] Error:', err);
      }
    };

    // Primary: every 10 seconds during market hours
    this.pollInterval = setInterval(poll, 10_000);

    // Fallback: every 60 seconds regardless — only broadcasts if data is non-empty
    this.fallbackInterval = setInterval(async () => {
      try {
        const stocks = await this.getLiveMarket();
        if (stocks.length > 0) {
          // Persist last-known-good data (5 min TTL for market-closed gaps)
          await setCache('market:last-known', stocks, 300);
          broadcast({
            type: 'market_update',
            timestamp: new Date().toISOString(),
            data: {
              marketOpen: false,
              count: stocks.length,
              lastUpdated: new Date().toISOString(),
              data: stocks,
            },
          });
        }
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
