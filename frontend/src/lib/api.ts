const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface LiveStock {
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

export interface LiveMarketResponse {
  marketOpen: boolean;
  count: number;
  lastUpdated: string;
  data: LiveStock[];
}

export interface LiveIndex {
  index: string;
  currentValue: number;
  change: number;
  changePercent: number;
  turnover: number;
}

export interface OHLCEntry {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

export interface OHLCResponse {
  symbol: string;
  days: number;
  count: number;
  data: OHLCEntry[];
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchLiveMarket(): Promise<LiveMarketResponse> {
  return fetchJSON<LiveMarketResponse>('/api/market/live');
}

export async function fetchStock(symbol: string): Promise<LiveStock> {
  return fetchJSON<LiveStock>(`/api/market/stock/${encodeURIComponent(symbol)}`);
}

export async function fetchOHLC(symbol: string, days = 365): Promise<OHLCResponse> {
  return fetchJSON<OHLCResponse>(`/api/market/ohlc/${encodeURIComponent(symbol)}?days=${days}`);
}

export async function fetchIndices(): Promise<LiveIndex[]> {
  return fetchJSON<LiveIndex[]>('/api/market/live/indices');
}

export async function fetchMarketStatus(): Promise<{ isOpen: boolean; timestamp: string }> {
  return fetchJSON('/api/market/live/status');
}
