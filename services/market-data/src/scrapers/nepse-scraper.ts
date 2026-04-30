import axios from 'axios';
import {
  nepseClient,
  normalizeStock,
  normalizeIndex,
  NormalizedStock,
  NormalizedIndex,
} from '../clients/nepse-client';

// ---------------------------------------------------------------------------
// Legacy base URL (used as secondary fallback if new client fails)
// ---------------------------------------------------------------------------

const NEPSE_API_BASE = 'https://nepalstock.com/api/nots';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface NepseAPIResponse<T> {
  body: T;
  status: string;
}

async function fetchWithRetry<T>(url: string, retries = MAX_RETRIES): Promise<T | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get<NepseAPIResponse<T>>(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
        timeout: 15000,
      });
      return response.data.body;
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed for ${url}:`, error instanceof Error ? error.message : error);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Re-export types used by cron-jobs (kept for backward compatibility)
// ---------------------------------------------------------------------------

export interface NepseStockData {
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
}

export interface NepseIndexData {
  index: string;
  currentValue: number;
  change: number;
  changePercent: number;
  turnover: number;
}

// ---------------------------------------------------------------------------
// Public functions – try new NepseClient first, then legacy fallback
// ---------------------------------------------------------------------------

export async function fetchMarketSummary(): Promise<Record<string, unknown> | null> {
  const result = await nepseClient.fetchMarketSummary();
  if (result) return result;
  return fetchWithRetry(`${NEPSE_API_BASE}/market-summary`);
}

export async function fetchTopGainers(): Promise<NepseStockData[] | null> {
  const raw = await nepseClient.fetchTopGainers();
  if (raw && raw.length > 0) {
    return raw.map((r) => {
      const n = normalizeStock(r);
      return { ...n, previousClose: n.previousClose } as NepseStockData;
    });
  }
  return fetchWithRetry(`${NEPSE_API_BASE}/top-gainers`);
}

export async function fetchTopLosers(): Promise<NepseStockData[] | null> {
  const raw = await nepseClient.fetchTopLosers();
  if (raw && raw.length > 0) {
    return raw.map((r) => {
      const n = normalizeStock(r);
      return { ...n, previousClose: n.previousClose } as NepseStockData;
    });
  }
  return fetchWithRetry(`${NEPSE_API_BASE}/top-losers`);
}

export async function fetchTopTurnover(): Promise<NepseStockData[] | null> {
  return fetchWithRetry(`${NEPSE_API_BASE}/top-turnover`);
}

export async function fetchTopVolume(): Promise<NepseStockData[] | null> {
  return fetchWithRetry(`${NEPSE_API_BASE}/top-volume`);
}

export async function fetchStockPrice(symbol: string): Promise<NepseStockData | null> {
  const raw = await nepseClient.fetchSecurityDetail(symbol);
  if (raw) {
    const n = normalizeStock(raw);
    return { ...n, previousClose: n.previousClose } as NepseStockData;
  }
  return fetchWithRetry(`${NEPSE_API_BASE}/security/${symbol}`);
}

export async function fetchIndices(): Promise<NepseIndexData[] | null> {
  const raw = await nepseClient.fetchIndices();
  if (raw && raw.length > 0) {
    return raw.map((r) => {
      const n = normalizeIndex(r);
      return n as NepseIndexData;
    });
  }
  return fetchWithRetry(`${NEPSE_API_BASE}/indices`);
}

export async function fetchSectorSummary(): Promise<Record<string, unknown>[] | null> {
  return fetchWithRetry(`${NEPSE_API_BASE}/sector-summary`);
}

export async function fetchAllStocks(): Promise<NepseStockData[] | null> {
  const raw = await nepseClient.fetchSecurityList();
  if (raw && raw.length > 0) {
    return raw.map((r) => {
      const n = normalizeStock(r);
      return { ...n, previousClose: n.previousClose } as NepseStockData;
    });
  }
  return fetchWithRetry(`${NEPSE_API_BASE}/security/list`);
}

export async function fetchFloorsheet(page = 1): Promise<Record<string, unknown>[] | null> {
  return fetchWithRetry(`${NEPSE_API_BASE}/floorsheet?page=${page}`);
}

export async function fetchCorporateActions(): Promise<Record<string, unknown>[] | null> {
  return fetchWithRetry(`${NEPSE_API_BASE}/corporate-actions`);
}
