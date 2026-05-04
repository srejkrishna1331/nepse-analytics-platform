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

// Signal engine
export interface SignalResponse {
  symbol: string;
  price: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  score: number;
  riskLevel: string;
  reasoning: string[];
  indicators: Array<{ name: string; value: number; signal: string; weight: number; reason: string }>;
}

export async function fetchSignal(symbol: string): Promise<SignalResponse> {
  return fetchJSON<SignalResponse>(`/api/market/signal/${encodeURIComponent(symbol)}`);
}

// Analysis
export interface AnalysisResponse {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  turnover: number;
  changePercent: number;
  indicators: {
    sma: Record<string, number>;
    ema: Record<string, number>;
    rsi: number;
    macd: { line: number; signal: number; histogram: number };
    bollingerBands: { upper: number; middle: number; lower: number; percentB: number };
    stochastic: { k: number; d: number };
    adx: { adx: number; plusDI: number; minusDI: number };
    vwap: number;
  };
  supportResistance: Array<{ type: string; price: number; strength: number }>;
}

export async function fetchAnalysis(symbol: string): Promise<AnalysisResponse> {
  return fetchJSON<AnalysisResponse>(`/api/market/analysis/${encodeURIComponent(symbol)}`);
}

// Scanner
export interface ScanResult {
  symbol: string;
  name: string;
  sector: string;
  signal: string;
  score: number;
  confidence: number;
  price: number;
  changePercent: number;
  details: { volume: number; rsi: number; trend: string };
}

export interface ScanResponse {
  type: string;
  count: number;
  results: ScanResult[];
}

export async function fetchScan(type: string): Promise<ScanResponse> {
  return fetchJSON<ScanResponse>(`/api/market/scan/${encodeURIComponent(type)}`);
}
