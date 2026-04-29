export interface SMAResult {
  period: number;
  values: number[];
}

export interface EMAResult {
  period: number;
  values: number[];
}

export interface WMAResult {
  period: number;
  values: number[];
}

export interface RSIResult {
  period: number;
  values: number[];
}

export interface MACDResult {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
}

export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
  bandwidth: number[];
}

export interface StochasticResult {
  k: number[];
  d: number[];
}

export interface ADXResult {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
}

export interface VWAPResult {
  values: number[];
}

export interface FibonacciLevel {
  level: number;
  price: number;
  label: string;
}

export interface SupportResistance {
  supports: number[];
  resistances: number[];
}

export interface TrendLine {
  startDate: string;
  startPrice: number;
  endDate: string;
  endPrice: number;
  slope: number;
  type: 'support' | 'resistance';
}

export interface PatternDetection {
  pattern: string;
  type: 'bullish' | 'bearish' | 'neutral';
  startIndex: number;
  endIndex: number;
  confidence: number;
  description: string;
}

export interface IndicatorBundle {
  sma: Record<number, number[]>;
  ema: Record<number, number[]>;
  rsi: number[];
  macd: MACDResult;
  bollingerBands: BollingerBandsResult;
  stochastic: StochasticResult;
  adx: ADXResult;
  vwap: number[];
}
