/**
 * Moving Average implementations: SMA, EMA, WMA
 */

export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  if (data.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result.push(sum / period);

  for (let i = period; i < data.length; i++) {
    sum = sum - data[i - period] + data[i];
    result.push(sum / period);
  }

  return result;
}

export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  if (data.length < period) return result;

  const multiplier = 2 / (period + 1);

  // First EMA is the SMA of the first 'period' values
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let ema = sum / period;
  result.push(ema);

  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }

  return result;
}

export function calculateWMA(data: number[], period: number): number[] {
  const result: number[] = [];
  if (data.length < period) return result;

  const weightSum = (period * (period + 1)) / 2;

  for (let i = period - 1; i < data.length; i++) {
    let wma = 0;
    for (let j = 0; j < period; j++) {
      wma += data[i - period + 1 + j] * (j + 1);
    }
    result.push(wma / weightSum);
  }

  return result;
}
