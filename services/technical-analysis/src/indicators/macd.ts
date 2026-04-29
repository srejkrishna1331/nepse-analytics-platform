import { calculateEMA } from './moving-averages';

/**
 * MACD (Moving Average Convergence Divergence) implementation
 */

export interface MACDOutput {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
}

export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDOutput {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  // Align fast EMA to slow EMA length
  const offset = fastEMA.length - slowEMA.length;
  const macdLine: number[] = [];

  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i]);
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Align MACD line to signal line length
  const signalOffset = macdLine.length - signalLine.length;
  const histogram: number[] = [];

  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + signalOffset] - signalLine[i]);
  }

  return {
    macdLine: macdLine.slice(signalOffset),
    signalLine,
    histogram,
  };
}
