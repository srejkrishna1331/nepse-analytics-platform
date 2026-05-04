export type SignalType = 'BUY' | 'SELL' | 'HOLD';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface Signal {
  symbol: string;
  signal: SignalType;
  confidence: number;
  score: number;
  riskLevel: RiskLevel;
  reasoning: string[];
  indicators: IndicatorSignal[];
  timestamp: string;
}

export interface IndicatorSignal {
  name: string;
  value: number;
  signal: SignalType;
  weight: number;
  reason: string;
}

export interface ScannerResult {
  symbol: string;
  scannerType: string;
  signal: SignalType;
  score: number;
  details: Record<string, number | string>;
  timestamp: string;
}

export interface BacktestResult {
  strategy: string;
  symbol: string;
  startDate: string;
  endDate: string;
  totalTrades: number;
  winRate: number;
  profitPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  type: 'BUY' | 'SELL';
  profitPercent: number;
  holdingDays: number;
}
