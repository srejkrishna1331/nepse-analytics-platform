export interface OHLCData {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

export interface IndexData {
  name: string;
  date: string;
  value: number;
  change: number;
  changePercent: number;
  turnover: number;
  volume: number;
}

export interface SectorData {
  name: string;
  index: number;
  change: number;
  changePercent: number;
  turnover: number;
  volume: number;
}

export interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
  listedShares: number;
  marketCap: number;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  turnover: number;
  high52Week: number;
  low52Week: number;
}

export interface CorporateAction {
  symbol: string;
  type: 'bonus' | 'dividend' | 'right' | 'split' | 'merger';
  ratio?: number;
  amount?: number;
  bookCloseDate: string;
  announcementDate: string;
}

export interface MarketSummary {
  date: string;
  nepseIndex: number;
  change: number;
  changePercent: number;
  totalTurnover: number;
  totalVolume: number;
  totalTransactions: number;
  advances: number;
  declines: number;
  unchanged: number;
}

export interface IntradayTick {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
}
