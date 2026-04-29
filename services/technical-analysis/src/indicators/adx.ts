/**
 * Average Directional Index (ADX) implementation
 */

export interface ADXOutput {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
}

export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): ADXOutput {
  if (highs.length < period + 1) {
    return { adx: [], plusDI: [], minusDI: [] };
  }

  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);

    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  // Smoothed averages
  let smoothedTR = trueRanges.slice(0, period).reduce((s, v) => s + v, 0);
  let smoothedPlusDM = plusDMs.slice(0, period).reduce((s, v) => s + v, 0);
  let smoothedMinusDM = minusDMs.slice(0, period).reduce((s, v) => s + v, 0);

  const plusDI: number[] = [];
  const minusDI: number[] = [];
  const dx: number[] = [];

  for (let i = period; i < trueRanges.length; i++) {
    if (i > period) {
      smoothedTR = smoothedTR - smoothedTR / period + trueRanges[i];
      smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDMs[i];
      smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDMs[i];
    }

    const pdi = smoothedTR !== 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
    const mdi = smoothedTR !== 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;

    plusDI.push(pdi);
    minusDI.push(mdi);

    const diSum = pdi + mdi;
    dx.push(diSum !== 0 ? (Math.abs(pdi - mdi) / diSum) * 100 : 0);
  }

  // Calculate ADX as smoothed DX
  const adx: number[] = [];
  if (dx.length >= period) {
    let adxValue = dx.slice(0, period).reduce((s, v) => s + v, 0) / period;
    adx.push(adxValue);

    for (let i = period; i < dx.length; i++) {
      adxValue = (adxValue * (period - 1) + dx[i]) / period;
      adx.push(adxValue);
    }
  }

  const offset = plusDI.length - adx.length;
  return {
    adx,
    plusDI: plusDI.slice(offset),
    minusDI: minusDI.slice(offset),
  };
}
