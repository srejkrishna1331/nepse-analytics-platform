/**
 * Chart Pattern Recognition
 * Head & Shoulders, Double Top/Bottom, Triangle, Flag & Pennant
 */

export interface PatternResult {
  pattern: string;
  type: 'bullish' | 'bearish' | 'neutral';
  startIndex: number;
  endIndex: number;
  confidence: number;
  description: string;
  priceTarget?: number;
}

export function detectPatterns(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[]
): PatternResult[] {
  const patterns: PatternResult[] = [];

  const headAndShoulders = detectHeadAndShoulders(highs, lows, closes);
  if (headAndShoulders) patterns.push(headAndShoulders);

  const inverseHS = detectInverseHeadAndShoulders(highs, lows, closes);
  if (inverseHS) patterns.push(inverseHS);

  const doubleTop = detectDoubleTop(highs, closes);
  if (doubleTop) patterns.push(doubleTop);

  const doubleBottom = detectDoubleBottom(lows, closes);
  if (doubleBottom) patterns.push(doubleBottom);

  const triangle = detectTriangle(highs, lows, closes);
  if (triangle) patterns.push(triangle);

  const flag = detectFlagPennant(highs, lows, closes, volumes);
  if (flag) patterns.push(flag);

  const volumeBreakout = detectVolumeBreakout(closes, volumes);
  if (volumeBreakout) patterns.push(volumeBreakout);

  return patterns;
}

function findPivots(data: number[], lookback: number, findHighs: boolean): number[] {
  const pivots: number[] = [];
  for (let i = lookback; i < data.length - lookback; i++) {
    let isPivot = true;
    for (let j = 1; j <= lookback; j++) {
      if (findHighs) {
        if (data[i] <= data[i - j] || data[i] <= data[i + j]) { isPivot = false; break; }
      } else {
        if (data[i] >= data[i - j] || data[i] >= data[i + j]) { isPivot = false; break; }
      }
    }
    if (isPivot) pivots.push(i);
  }
  return pivots;
}

function detectHeadAndShoulders(highs: number[], lows: number[], closes: number[]): PatternResult | null {
  const pivotHighs = findPivots(highs, 3, true);
  const pivotLows = findPivots(lows, 3, false);

  if (pivotHighs.length < 3 || pivotLows.length < 2) return null;

  for (let i = 0; i <= pivotHighs.length - 3; i++) {
    const [ls, head, rs] = [pivotHighs[i], pivotHighs[i + 1], pivotHighs[i + 2]];
    const leftShoulder = highs[ls];
    const headPrice = highs[head];
    const rightShoulder = highs[rs];

    // Head must be higher than both shoulders
    if (headPrice <= leftShoulder || headPrice <= rightShoulder) continue;

    // Shoulders should be roughly equal (within 5%)
    const shoulderDiff = Math.abs(leftShoulder - rightShoulder) / leftShoulder;
    if (shoulderDiff > 0.05) continue;

    // Find neckline
    const troughs = pivotLows.filter(idx => idx > ls && idx < rs);
    if (troughs.length < 1) continue;

    const neckline = Math.min(...troughs.map(idx => lows[idx]));
    const patternHeight = headPrice - neckline;
    const currentPrice = closes[closes.length - 1];

    if (currentPrice < neckline * 1.02) {
      return {
        pattern: 'Head and Shoulders',
        type: 'bearish',
        startIndex: ls,
        endIndex: rs,
        confidence: 75 - shoulderDiff * 500,
        description: `Head & Shoulders pattern detected. Neckline at ${neckline.toFixed(2)}.`,
        priceTarget: neckline - patternHeight,
      };
    }
  }

  return null;
}

function detectInverseHeadAndShoulders(highs: number[], lows: number[], closes: number[]): PatternResult | null {
  const pivotLows = findPivots(lows, 3, false);
  const pivotHighs = findPivots(highs, 3, true);

  if (pivotLows.length < 3 || pivotHighs.length < 2) return null;

  for (let i = 0; i <= pivotLows.length - 3; i++) {
    const [ls, head, rs] = [pivotLows[i], pivotLows[i + 1], pivotLows[i + 2]];
    const leftShoulder = lows[ls];
    const headPrice = lows[head];
    const rightShoulder = lows[rs];

    if (headPrice >= leftShoulder || headPrice >= rightShoulder) continue;

    const shoulderDiff = Math.abs(leftShoulder - rightShoulder) / leftShoulder;
    if (shoulderDiff > 0.05) continue;

    const peaks = pivotHighs.filter(idx => idx > ls && idx < rs);
    if (peaks.length < 1) continue;

    const neckline = Math.max(...peaks.map(idx => highs[idx]));
    const patternHeight = neckline - headPrice;
    const currentPrice = closes[closes.length - 1];

    if (currentPrice > neckline * 0.98) {
      return {
        pattern: 'Inverse Head and Shoulders',
        type: 'bullish',
        startIndex: ls,
        endIndex: rs,
        confidence: 75 - shoulderDiff * 500,
        description: `Inverse H&S pattern. Neckline at ${neckline.toFixed(2)}.`,
        priceTarget: neckline + patternHeight,
      };
    }
  }

  return null;
}

function detectDoubleTop(highs: number[], closes: number[]): PatternResult | null {
  const pivotHighs = findPivots(highs, 3, true);
  if (pivotHighs.length < 2) return null;

  const lastTwo = pivotHighs.slice(-2);
  const [first, second] = [highs[lastTwo[0]], highs[lastTwo[1]]];
  const diff = Math.abs(first - second) / first;

  if (diff > 0.03) return null; // Peaks should be within 3%
  if (lastTwo[1] - lastTwo[0] < 5) return null; // Minimum distance

  const currentPrice = closes[closes.length - 1];
  const troughPrice = Math.min(...closes.slice(lastTwo[0], lastTwo[1] + 1));

  if (currentPrice < troughPrice * 1.02) {
    return {
      pattern: 'Double Top',
      type: 'bearish',
      startIndex: lastTwo[0],
      endIndex: lastTwo[1],
      confidence: 70 - diff * 1000,
      description: `Double top at ~${first.toFixed(2)}.`,
      priceTarget: troughPrice - (first - troughPrice),
    };
  }

  return null;
}

function detectDoubleBottom(lows: number[], closes: number[]): PatternResult | null {
  const pivotLows = findPivots(lows, 3, false);
  if (pivotLows.length < 2) return null;

  const lastTwo = pivotLows.slice(-2);
  const [first, second] = [lows[lastTwo[0]], lows[lastTwo[1]]];
  const diff = Math.abs(first - second) / first;

  if (diff > 0.03) return null;
  if (lastTwo[1] - lastTwo[0] < 5) return null;

  const currentPrice = closes[closes.length - 1];
  const peakPrice = Math.max(...closes.slice(lastTwo[0], lastTwo[1] + 1));

  if (currentPrice > peakPrice * 0.98) {
    return {
      pattern: 'Double Bottom',
      type: 'bullish',
      startIndex: lastTwo[0],
      endIndex: lastTwo[1],
      confidence: 70 - diff * 1000,
      description: `Double bottom at ~${first.toFixed(2)}.`,
      priceTarget: peakPrice + (peakPrice - first),
    };
  }

  return null;
}

function detectTriangle(highs: number[], lows: number[], closes: number[]): PatternResult | null {
  const len = Math.min(20, closes.length);
  if (len < 10) return null;

  const recentHighs = highs.slice(-len);
  const recentLows = lows.slice(-len);

  // Check if highs are converging (descending) and lows are converging (ascending)
  const highSlope = linearRegression(recentHighs);
  const lowSlope = linearRegression(recentLows);

  const startIndex = closes.length - len;
  const endIndex = closes.length - 1;

  if (highSlope < -0.1 && lowSlope > 0.1) {
    return {
      pattern: 'Symmetrical Triangle',
      type: 'neutral',
      startIndex,
      endIndex,
      confidence: 60,
      description: 'Symmetrical triangle pattern forming. Breakout direction uncertain.',
    };
  }

  if (Math.abs(highSlope) < 0.1 && lowSlope > 0.1) {
    return {
      pattern: 'Ascending Triangle',
      type: 'bullish',
      startIndex,
      endIndex,
      confidence: 65,
      description: 'Ascending triangle with flat resistance and rising support.',
    };
  }

  if (highSlope < -0.1 && Math.abs(lowSlope) < 0.1) {
    return {
      pattern: 'Descending Triangle',
      type: 'bearish',
      startIndex,
      endIndex,
      confidence: 65,
      description: 'Descending triangle with declining highs and flat support.',
    };
  }

  return null;
}

function detectFlagPennant(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[]
): PatternResult | null {
  if (closes.length < 15) return null;

  // Look for a sharp move (pole) followed by consolidation (flag)
  const poleLen = 5;
  const flagLen = 10;
  const poleStart = closes.length - poleLen - flagLen;

  if (poleStart < 0) return null;

  const poleMove = (closes[poleStart + poleLen] - closes[poleStart]) / closes[poleStart];
  if (Math.abs(poleMove) < 0.05) return null; // Need at least 5% move

  // Check if volume was higher during pole
  const poleVolume = volumes.slice(poleStart, poleStart + poleLen).reduce((s, v) => s + v, 0) / poleLen;
  const flagVolume = volumes.slice(poleStart + poleLen).reduce((s, v) => s + v, 0) / flagLen;

  if (flagVolume > poleVolume * 0.8) return null; // Volume should decrease in flag

  // Check consolidation in flag
  const flagHighs = highs.slice(poleStart + poleLen);
  const flagLows = lows.slice(poleStart + poleLen);
  const flagRange = (Math.max(...flagHighs) - Math.min(...flagLows)) / closes[poleStart + poleLen];

  if (flagRange > 0.05) return null; // Flag should be tight consolidation

  const isBullish = poleMove > 0;

  return {
    pattern: isBullish ? 'Bull Flag' : 'Bear Flag',
    type: isBullish ? 'bullish' : 'bearish',
    startIndex: poleStart,
    endIndex: closes.length - 1,
    confidence: 60,
    description: `${isBullish ? 'Bull' : 'Bear'} flag with ${(Math.abs(poleMove) * 100).toFixed(1)}% pole and consolidation.`,
  };
}

function detectVolumeBreakout(closes: number[], volumes: number[]): PatternResult | null {
  if (closes.length < 20) return null;

  const avgVolume = volumes.slice(-20, -1).reduce((s, v) => s + v, 0) / 19;
  const lastVolume = volumes[volumes.length - 1];
  const lastClose = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];

  if (lastVolume > avgVolume * 2 && lastClose > prevClose) {
    return {
      pattern: 'Volume Breakout',
      type: 'bullish',
      startIndex: closes.length - 2,
      endIndex: closes.length - 1,
      confidence: 70,
      description: `Volume breakout: ${(lastVolume / avgVolume).toFixed(1)}x average volume with price increase.`,
    };
  }

  if (lastVolume > avgVolume * 2 && lastClose < prevClose) {
    return {
      pattern: 'Volume Breakdown',
      type: 'bearish',
      startIndex: closes.length - 2,
      endIndex: closes.length - 1,
      confidence: 70,
      description: `Volume breakdown: ${(lastVolume / avgVolume).toFixed(1)}x average volume with price decrease.`,
    };
  }

  return null;
}

function linearRegression(data: number[]): number {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }

  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}
