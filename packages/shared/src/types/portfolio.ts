export interface PortfolioHolding {
  id: string;
  userId: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  sector: string;
}

export interface Portfolio {
  userId: string;
  holdings: PortfolioHolding[];
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  sectorAllocation: SectorAllocation[];
  riskExposure: RiskExposure;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  holdings: number;
}

export interface RiskExposure {
  concentration: number;
  sectorDiversification: number;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  warnings: string[];
}

export interface TMSTransaction {
  date: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  commission: number;
  dpCharge: number;
  sebon: number;
}
