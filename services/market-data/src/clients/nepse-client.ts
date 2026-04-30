import axios, { AxiosInstance, AxiosError } from 'axios';

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

const NEPSE_OFFICIAL_BASE = 'https://nepalstock.com/api/nots';
const NEPSE_NEWWEB_BASE = 'https://newweb.nepalstock.com.np/api/nots';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 15000;

const COMMON_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

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
      // NEPSE API may wrap data in a `body` field
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
// NepseClient – talks to official NEPSE API with fallback to newweb mirror
// ---------------------------------------------------------------------------

export class NepseClient {
  private primary: AxiosInstance;
  private fallback: AxiosInstance;
  private activeBase: 'primary' | 'fallback' = 'primary';
  private consecutiveFailures = 0;
  private readonly FAILURE_THRESHOLD = 3;

  constructor() {
    this.primary = axios.create({
      baseURL: NEPSE_OFFICIAL_BASE,
      timeout: REQUEST_TIMEOUT_MS,
      headers: COMMON_HEADERS,
    });

    this.fallback = axios.create({
      baseURL: NEPSE_NEWWEB_BASE,
      timeout: REQUEST_TIMEOUT_MS,
      headers: COMMON_HEADERS,
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

  private async fetchWithFallback<T>(path: string): Promise<T | null> {
    // Try active source first
    const result = await fetchWithRetry<T>(this.getClient(), path, 2);
    if (result !== null) {
      this.consecutiveFailures = 0;
      return result;
    }

    // Primary failed – try the other source
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
      this.switchSource();
    }

    const other =
      this.activeBase === 'primary' ? this.fallback : this.primary;
    const fallbackResult = await fetchWithRetry<T>(other, path, 2);
    if (fallbackResult !== null) {
      // Other source works – switch to it
      this.switchSource();
    }
    return fallbackResult;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  async fetchMarketStatus(): Promise<RawNepseMarketStatus | null> {
    return this.fetchWithFallback('/nepse-data/market-open');
  }

  async fetchSecurityDailyTradeStat(): Promise<RawNepseSecurity[] | null> {
    return this.fetchWithFallback('/securityDailyTradeStat/58');
  }

  async fetchTodayPrice(): Promise<RawNepseSecurity[] | null> {
    return this.fetchWithFallback('/nepse-data/today-price');
  }

  async fetchSecurityList(): Promise<RawNepseSecurity[] | null> {
    // Try the daily trade stat first (more detailed), fall back to today-price
    const result = await this.fetchSecurityDailyTradeStat();
    if (result && result.length > 0) return result;
    return this.fetchTodayPrice();
  }

  async fetchIndices(): Promise<RawNepseIndex[] | null> {
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
