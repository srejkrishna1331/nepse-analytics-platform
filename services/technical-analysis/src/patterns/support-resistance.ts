/**
 * Auto Support/Resistance Detection
 * Uses pivot point analysis and price clustering
 */

export interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number; // 1-5
  touches: number;
}

export function detectSupportResistance(
  highs: number[],
  lows: number[],
  closes: number[],
  lookback = 5
): SupportResistanceLevel[] {
  const levels: SupportResistanceLevel[] = [];
  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];

  // Find pivot points
  for (let i = lookback; i < highs.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (highs[i] <= highs[i - j] || highs[i] <= highs[i + j]) isHigh = false;
      if (lows[i] >= lows[i - j] || lows[i] >= lows[i + j]) isLow = false;
    }

    if (isHigh) pivotHighs.push(highs[i]);
    if (isLow) pivotLows.push(lows[i]);
  }

  // Cluster pivot highs into resistance levels
  const resistanceClusters = clusterPrices(pivotHighs, 0.02);
  for (const cluster of resistanceClusters) {
    levels.push({
      price: cluster.average,
      type: 'resistance',
      strength: Math.min(5, cluster.count),
      touches: cluster.count,
    });
  }

  // Cluster pivot lows into support levels
  const supportClusters = clusterPrices(pivotLows, 0.02);
  for (const cluster of supportClusters) {
    levels.push({
      price: cluster.average,
      type: 'support',
      strength: Math.min(5, cluster.count),
      touches: cluster.count,
    });
  }

  // Sort by strength descending
  levels.sort((a, b) => b.strength - a.strength);

  // Classify based on current price
  const currentPrice = closes[closes.length - 1];
  for (const level of levels) {
    if (level.price > currentPrice) {
      level.type = 'resistance';
    } else {
      level.type = 'support';
    }
  }

  return levels.slice(0, 10); // Return top 10 levels
}

interface PriceCluster {
  average: number;
  count: number;
}

function clusterPrices(prices: number[], tolerance: number): PriceCluster[] {
  if (prices.length === 0) return [];

  const sorted = [...prices].sort((a, b) => a - b);
  const clusters: PriceCluster[] = [];
  let currentCluster = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i] - sorted[i - 1]) / sorted[i - 1];
    if (diff <= tolerance) {
      currentCluster.push(sorted[i]);
    } else {
      clusters.push({
        average: currentCluster.reduce((s, v) => s + v, 0) / currentCluster.length,
        count: currentCluster.length,
      });
      currentCluster = [sorted[i]];
    }
  }

  clusters.push({
    average: currentCluster.reduce((s, v) => s + v, 0) / currentCluster.length,
    count: currentCluster.length,
  });

  return clusters.filter((c) => c.count >= 2);
}

/**
 * Trendline Detection using linear regression on pivot points
 */
export interface TrendLine {
  startIndex: number;
  endIndex: number;
  startPrice: number;
  endPrice: number;
  slope: number;
  type: 'support' | 'resistance';
}

export function detectTrendlines(
  highs: number[],
  lows: number[],
  lookback = 5
): TrendLine[] {
  const trendlines: TrendLine[] = [];
  const pivotHighIndices: number[] = [];
  const pivotLowIndices: number[] = [];

  for (let i = lookback; i < highs.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (highs[i] <= highs[i - j] || highs[i] <= highs[i + j]) isHigh = false;
      if (lows[i] >= lows[i - j] || lows[i] >= lows[i + j]) isLow = false;
    }

    if (isHigh) pivotHighIndices.push(i);
    if (isLow) pivotLowIndices.push(i);
  }

  // Build resistance trendlines from pivot highs
  for (let i = 0; i < pivotHighIndices.length - 1; i++) {
    const idx1 = pivotHighIndices[i];
    const idx2 = pivotHighIndices[i + 1];
    const slope = (highs[idx2] - highs[idx1]) / (idx2 - idx1);

    trendlines.push({
      startIndex: idx1,
      endIndex: idx2,
      startPrice: highs[idx1],
      endPrice: highs[idx2],
      slope,
      type: 'resistance',
    });
  }

  // Build support trendlines from pivot lows
  for (let i = 0; i < pivotLowIndices.length - 1; i++) {
    const idx1 = pivotLowIndices[i];
    const idx2 = pivotLowIndices[i + 1];
    const slope = (lows[idx2] - lows[idx1]) / (idx2 - idx1);

    trendlines.push({
      startIndex: idx1,
      endIndex: idx2,
      startPrice: lows[idx1],
      endPrice: lows[idx2],
      slope,
      type: 'support',
    });
  }

  return trendlines;
}
