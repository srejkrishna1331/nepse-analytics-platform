import { calculateSMA } from './moving-averages';

/**
 * Stochastic Oscillator implementation
 */

export interface StochasticOutput {
  k: number[];
  d: number[];
}

export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod = 14,
  dPeriod = 3
): StochasticOutput {
  const kValues: number[] = [];

  for (let i = kPeriod - 1; i < closes.length; i++) {
    const highSlice = highs.slice(i - kPeriod + 1, i + 1);
    const lowSlice = lows.slice(i - kPeriod + 1, i + 1);

    const highestHigh = Math.max(...highSlice);
    const lowestLow = Math.min(...lowSlice);

    const range = highestHigh - lowestLow;
    const k = range !== 0 ? ((closes[i] - lowestLow) / range) * 100 : 50;
    kValues.push(k);
  }

  const d = calculateSMA(kValues, dPeriod);

  return {
    k: kValues.slice(dPeriod - 1),
    d,
  };
}
