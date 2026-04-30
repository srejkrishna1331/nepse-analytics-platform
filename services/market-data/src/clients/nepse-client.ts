import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RawNepseSecurity {
  securityId: number;
  securityName: string;
  symbol: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  totalTradedQuantity: number;
  totalTradedValue: number;
  previousDayClosePrice: number;
  lastUpdatedDateTime: string;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  sectorName?: string;
}

/** Shape returned by the nepse-data-api Python bridge /stocks endpoint */
interface BridgeStock {
  securityId: string;
  securityName: string;
  symbol: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  lastTradedPrice: number;
  totalTradeQuantity: number;
  totalTradeValue: number;
  percentageChange: number;
  previousClose: number;
  lastUpdatedDateTime: string;
  averageTradedPrice: number;
}

export interface RawNepseIndex {
  index: string;
  currentValue: number;
  change: number;
  perChange: number;
  turnover: number;
}

export interface RawNepseMarketStatus {
  isOpen: string;
  asOf: string;
}

export interface NormalizedStock {
  symbol: string;
  name: string;
  sector: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
  previousClose: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export interface NormalizedIndex {
  index: string;
  currentValue: number;
  change: number;
  changePercent: number;
  turnover: number;
}

export interface NormalizedOHLC {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

const BRIDGE_BASE = process.env.NEPSE_BRIDGE_URL || 'http://localhost:4000';
const NEPSE_OFFICIAL_BASE = 'https://nepalstock.com/api/nots';
const NEPSE_NEWWEB_BASE = 'https://newweb.nepalstock.com.np/api/nots';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 15000;

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  Accept: 'application/json',
  Referer: 'https://www.nepalstock.com',
};

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(
  client: AxiosInstance,
  url: string,
  retries = MAX_RETRIES,
): Promise<T | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.get(url);
      const data = response.data;
      if (data && typeof data === 'object' && 'body' in data) {
        return data.body as T;
      }
      return data as T;
    } catch (error) {
      const msg =
        error instanceof AxiosError
          ? `${error.code} ${error.message}`
          : String(error);
      console.warn(
        `[NepseClient] Attempt ${attempt}/${retries} failed for ${url}: ${msg}`,
      );
      if (attempt < retries) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Bridge stock → RawNepseSecurity mapper
// ---------------------------------------------------------------------------

function bridgeStockToRaw(b: BridgeStock): RawNepseSecurity {
  const close = b.lastTradedPrice ?? b.highPrice ?? 0;
  const prevClose = b.previousClose ?? close;
  return {
    securityId: Number(b.securityId) || 0,
    securityName: b.securityName ?? b.symbol,
    symbol: b.symbol,
    openPrice: b.openPrice ?? 0,
    highPrice: b.highPrice ?? 0,
    lowPrice: b.lowPrice ?? 0,
    closePrice: close,
    totalTradedQuantity: b.totalTradeQuantity ?? 0,
    totalTradedValue: b.totalTradeValue ?? 0,
    previousDayClosePrice: prevClose,
    lastUpdatedDateTime: b.lastUpdatedDateTime ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// NepseClient – Python bridge (primary) → official API (fallback)
// ---------------------------------------------------------------------------

export class NepseClient {
  private bridge: AxiosInstance;
  private primary: AxiosInstance;
  private fallback: AxiosInstance;
  private activeBase: 'primary' | 'fallback' = 'primary';
  private consecutiveFailures = 0;
  private readonly FAILURE_THRESHOLD = 3;

  constructor() {
    this.bridge = axios.create({
      baseURL: BRIDGE_BASE,
      timeout: 10000,
    });

    this.primary = axios.create({
      baseURL: NEPSE_OFFICIAL_BASE,
      timeout: REQUEST_TIMEOUT_MS,
      headers: COMMON_HEADERS,
      httpsAgent,
    });

    this.fallback = axios.create({
      baseURL: NEPSE_NEWWEB_BASE,
      timeout: REQUEST_TIMEOUT_MS,
      headers: COMMON_HEADERS,
      httpsAgent,
    });
  }

  private getClient(): AxiosInstance {
    return this.activeBase === 'primary' ? this.primary : this.fallback;
  }

  private switchSource(): void {
    this.activeBase =
      this.activeBase === 'primary' ? 'fallback' : 'primary';
    this.consecutiveFailures = 0;
    console.log(
      `[NepseClient] Switched to ${this.activeBase} source`,
    );
  }

  /** Try official NEPSE API endpoints (primary + fallback mirror). */
  private async fetchWithFallback<T>(path: string): Promise<T | null> {
    const result = await fetchWithRetry<T>(this.getClient(), path, 2);
    if (result !== null) {
      this.consecutiveFailures = 0;
      return result;
    }

    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
      this.switchSource();
    }

    const other =
      this.activeBase === 'primary' ? this.fallback : this.primary;
    const fallbackResult = await fetchWithRetry<T>(other, path, 2);
    if (fallbackResult !== null) {
      this.switchSource();
    }
    return fallbackResult;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  async fetchMarketStatus(): Promise<RawNepseMarketStatus | null> {
    // Try bridge first
    try {
      const resp = await this.bridge.get('/market-status');
      if (resp.data) return resp.data as RawNepseMarketStatus;
    } catch {
      // bridge unavailable — fall through
    }
    return this.fetchWithFallback('/nepse-data/market-open');
  }

  async fetchSecurityDailyTradeStat(): Promise<RawNepseSecurity[] | null> {
    return this.fetchWithFallback('/securityDailyTradeStat/58');
  }

  async fetchTodayPrice(): Promise<RawNepseSecurity[] | null> {
    return this.fetchWithFallback('/nepse-data/today-price');
  }

  async fetchSecurityList(): Promise<RawNepseSecurity[] | null> {
    // 1. Try Python bridge (handles WASM auth automatically)
    try {
      const resp = await this.bridge.get('/stocks');
      const stocks = resp.data as BridgeStock[];
      if (Array.isArray(stocks) && stocks.length > 0) {
        console.log(`[NepseClient] Bridge returned ${stocks.length} stocks`);
        return stocks.map(bridgeStockToRaw);
      }
    } catch (err) {
      const msg = err instanceof AxiosError ? err.message : String(err);
      console.warn(`[NepseClient] Bridge unavailable: ${msg}`);
    }

    // 2. Try direct NEPSE API
    const result = await this.fetchSecurityDailyTradeStat();
    if (result && result.length > 0) return result;
    return this.fetchTodayPrice();
  }

  async fetchIndices(): Promise<RawNepseIndex[] | null> {
    // Try bridge first
    try {
      const resp = await this.bridge.get('/indices');
      const indices = resp.data;
      if (Array.isArray(indices) && indices.length > 0) {
        console.log(`[NepseClient] Bridge returned ${indices.length} indices`);
        return indices as RawNepseIndex[];
      }
    } catch {
      // bridge unavailable — fall through
    }
    return this.fetchWithFallback('/nepse-data/sub-indices');
  }

  async fetchNepseIndex(): Promise<RawNepseIndex | null> {
    return this.fetchWithFallback('/nepse-data/nepse-index');
  }

  async fetchMarketSummary(): Promise<Record<string, unknown> | null> {
    return this.fetchWithFallback('/market-summary');
  }

  async fetchSecurityDetail(symbol: string): Promise<RawNepseSecurity | null> {
    return this.fetchWithFallback(`/security/${symbol}`);
  }

  async fetchPriceHistory(
    securityId: number,
    startDate: string,
    endDate: string,
  ): Promise<Record<string, unknown>[] | null> {
    return this.fetchWithFallback(
      `/market/graph/history/${securityId}?startDate=${startDate}&endDate=${endDate}`,
    );
  }

  async fetchTopGainers(): Promise<RawNepseSecurity[] | null> {
    return this.fetchWithFallback('/top-gainers');
  }

  async fetchTopLosers(): Promise<RawNepseSecurity[] | null> {
    return this.fetchWithFallback('/top-losers');
  }

  async fetchFloorsheet(page = 0, size = 500): Promise<Record<string, unknown> | null> {
    return this.fetchWithFallback(
      `/nepse-data/floorsheet?page=${page}&size=${size}&sort=contractId,desc`,
    );
  }
}

// ---------------------------------------------------------------------------
// Data normalisation helpers
// ---------------------------------------------------------------------------

export function normalizeStock(raw: RawNepseSecurity): NormalizedStock {
  const close = raw.closePrice ?? raw.highPrice ?? 0;
  const previousClose = raw.previousDayClosePrice ?? close;
  const change = close - previousClose;
  const changePercent =
    previousClose > 0 ? (change / previousClose) * 100 : 0;

  return {
    symbol: raw.symbol?.trim() ?? '',
    name: raw.securityName?.trim() ?? raw.symbol ?? '',
    sector: raw.sectorName?.trim() ?? 'Unknown',
    open: raw.openPrice ?? 0,
    high: raw.highPrice ?? 0,
    low: raw.lowPrice ?? 0,
    close,
    volume: raw.totalTradedQuantity ?? 0,
    turnover: raw.totalTradedValue ?? 0,
    previousClose,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    lastUpdated:
      raw.lastUpdatedDateTime ?? new Date().toISOString(),
  };
}

export function normalizeIndex(raw: RawNepseIndex): NormalizedIndex {
  return {
    index: raw.index ?? '',
    currentValue: raw.currentValue ?? 0,
    change: raw.change ?? 0,
    changePercent: raw.perChange ?? 0,
    turnover: raw.turnover ?? 0,
  };
}

// Singleton export
export const nepseClient = new NepseClient();
