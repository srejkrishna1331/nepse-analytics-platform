/**
 * Volume Weighted Average Price (VWAP) implementation
 */

export function calculateVWAP(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[]
): number[] {
  const result: number[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < closes.length; i++) {
    const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
    cumulativeTPV += typicalPrice * volumes[i];
    cumulativeVolume += volumes[i];

    result.push(cumulativeVolume !== 0 ? cumulativeTPV / cumulativeVolume : typicalPrice);
  }

  return result;
}
