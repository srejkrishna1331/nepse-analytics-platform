export const NEPSE_SECTORS = [
  'Commercial Banks',
  'Development Banks',
  'Finance',
  'Hotels',
  'Hydro Power',
  'Investment',
  'Life Insurance',
  'Manufacturing',
  'Microfinance',
  'Mutual Fund',
  'Non Life Insurance',
  'Others',
  'Trading',
] as const;

export const NEPSE_INDICES = [
  'NEPSE',
  'SENSITIVE',
  'FLOAT',
  'SENSITIVE FLOAT',
  'BANKING',
  'DEVELOPMENT BANK',
  'FINANCE',
  'HOTELS',
  'HYDROPOWER',
  'INVESTMENT',
  'LIFE INSURANCE',
  'MANUFACTURING',
  'MICROFINANCE',
  'MUTUAL FUND',
  'NON LIFE INSURANCE',
  'OTHERS',
  'TRADING',
] as const;

export const INDICATOR_DEFAULTS = {
  SMA_PERIODS: [5, 10, 20, 50, 100, 200],
  EMA_PERIODS: [9, 12, 21, 26, 50, 200],
  RSI_PERIOD: 14,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
  BB_PERIOD: 20,
  BB_STD_DEV: 2,
  STOCHASTIC_K: 14,
  STOCHASTIC_D: 3,
  ADX_PERIOD: 14,
  FIBONACCI_LEVELS: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1],
} as const;

export const SIGNAL_WEIGHTS = {
  RSI: 15,
  MACD: 20,
  BOLLINGER: 10,
  SMA_CROSSOVER: 15,
  VOLUME: 10,
  SUPPORT_RESISTANCE: 15,
  PATTERN: 10,
  ADX: 5,
} as const;

export const RISK_DISCLAIMER =
  'This platform provides analytical tools and signals for educational purposes only. ' +
  'All trading decisions are made at your own risk. Past performance does not guarantee future results. ' +
  'Always conduct your own research before making investment decisions.';
