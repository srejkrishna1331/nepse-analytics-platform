type SignalType = 'BUY' | 'SELL' | 'HOLD';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

interface IndicatorSignal {
  name: string;
  value: number;
  signal: SignalType;
  weight: number;
  reason: string;
}

export interface SignalOutput {
  signal: SignalType;
  confidence: number;
  score: number;
  riskLevel: RiskLevel;
  reasoning: string[];
  indicators: IndicatorSignal[];
}

export function calculateSignalScore(indicators: IndicatorSignal[]): SignalOutput {
  let buyScore = 0;
  let sellScore = 0;
  let totalWeight = 0;
  const reasoning: string[] = [];

  for (const indicator of indicators) {
    totalWeight += indicator.weight;

    switch (indicator.signal) {
      case 'BUY':
        buyScore += indicator.weight;
        break;
      case 'SELL':
        sellScore += indicator.weight;
        break;
    }

    if (indicator.signal !== 'HOLD') {
      reasoning.push(`[${indicator.signal}] ${indicator.reason}`);
    }
  }

  // Normalize scores to 0-100
  const normalizedBuy = (buyScore / totalWeight) * 100;
  const normalizedSell = (sellScore / totalWeight) * 100;
  const netScore = normalizedBuy - normalizedSell;

  // Determine signal
  let signal: SignalType;
  if (netScore > 20) {
    signal = 'BUY';
  } else if (netScore < -20) {
    signal = 'SELL';
  } else {
    signal = 'HOLD';
  }

  // Calculate confidence
  const confidence = Math.min(100, Math.abs(netScore) + 20);

  // Determine risk level
  const riskLevel = calculateRiskLevel(indicators, confidence);

  // Final score (0-100 where 50 is neutral)
  const score = Math.max(0, Math.min(100, 50 + netScore / 2));

  if (reasoning.length === 0) {
    reasoning.push('All indicators neutral - no clear directional bias');
  }

  return {
    signal,
    confidence: Math.round(confidence * 10) / 10,
    score: Math.round(score * 10) / 10,
    riskLevel,
    reasoning,
    indicators,
  };
}

function calculateRiskLevel(indicators: IndicatorSignal[], confidence: number): RiskLevel {
  // Count conflicting signals
  const signals = indicators.map((i) => i.signal);
  const buyCount = signals.filter((s) => s === 'BUY').length;
  const sellCount = signals.filter((s) => s === 'SELL').length;
  const conflictRatio = Math.min(buyCount, sellCount) / Math.max(buyCount, sellCount, 1);

  if (conflictRatio > 0.6) return 'VERY_HIGH';
  if (conflictRatio > 0.4 || confidence < 40) return 'HIGH';
  if (conflictRatio > 0.2 || confidence < 60) return 'MEDIUM';
  return 'LOW';
}

export function generateBacktestSignals(
  closes: number[],
  signalHistory: SignalOutput[]
): {
  totalTrades: number;
  winRate: number;
  profitPercent: number;
  maxDrawdown: number;
} {
  let inPosition = false;
  let entryPrice = 0;
  let totalTrades = 0;
  let wins = 0;
  let totalProfit = 0;
  let maxDrawdown = 0;
  let peak = 0;
  let portfolioValue = 100;

  for (let i = 0; i < signalHistory.length && i < closes.length; i++) {
    const signal = signalHistory[i];
    const price = closes[i];

    if (!inPosition && signal.signal === 'BUY' && signal.confidence > 50) {
      inPosition = true;
      entryPrice = price;
    } else if (inPosition && (signal.signal === 'SELL' || signal.confidence < 30)) {
      const profit = ((price - entryPrice) / entryPrice) * 100;
      totalProfit += profit;
      totalTrades++;
      if (profit > 0) wins++;

      portfolioValue *= 1 + profit / 100;
      peak = Math.max(peak, portfolioValue);
      const drawdown = ((peak - portfolioValue) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);

      inPosition = false;
    }
  }

  return {
    totalTrades,
    winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
    profitPercent: totalProfit,
    maxDrawdown,
  };
}
