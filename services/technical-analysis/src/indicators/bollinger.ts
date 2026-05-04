import { calculateSMA } from './moving-averages';

/**
 * Bollinger Bands implementation
 */

export interface BollingerBandsOutput {
  upper: number[];
  middle: number[];
  lower: number[];
  bandwidth: number[];
  percentB: number[];
}

export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): BollingerBandsOutput {
  const middle = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];
  const bandwidth: number[] = [];
  const percentB: number[] = [];

  for (let i = 0; i < middle.length; i++) {
    const dataIndex = i + period - 1;
    const slice = closes.slice(dataIndex - period + 1, dataIndex + 1);

    const mean = middle[i];
    const squaredDiffs = slice.map((v) => (v - mean) ** 2);
    const stdDev = Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / period);

    const upperBand = mean + stdDevMultiplier * stdDev;
    const lowerBand = mean - stdDevMultiplier * stdDev;

    upper.push(upperBand);
    lower.push(lowerBand);
    bandwidth.push(((upperBand - lowerBand) / mean) * 100);
    percentB.push(upperBand !== lowerBand ? (closes[dataIndex] - lowerBand) / (upperBand - lowerBand) : 0.5);
  }

  return { upper, middle, lower, bandwidth, percentB };
}
