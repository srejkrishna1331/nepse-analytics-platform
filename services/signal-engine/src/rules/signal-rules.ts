type SignalType = 'BUY' | 'SELL' | 'HOLD';

export interface IndicatorSignal {
  name: string;
  value: number;
  signal: SignalType;
  weight: number;
  reason: string;
}

const WEIGHTS = {
  RSI: 15,
  MACD: 20,
  BOLLINGER: 10,
  SMA_CROSSOVER: 15,
  VOLUME: 10,
  SUPPORT_RESISTANCE: 15,
  PATTERN: 10,
  ADX: 5,
};

export function evaluateRSI(rsiValue: number): IndicatorSignal {
  let signal: SignalType = 'HOLD';
  let reason = '';

  if (rsiValue < 30) {
    signal = 'BUY';
    reason = `RSI at ${rsiValue.toFixed(1)} indicates oversold condition`;
  } else if (rsiValue < 40) {
    signal = 'BUY';
    reason = `RSI at ${rsiValue.toFixed(1)} approaching oversold`;
  } else if (rsiValue > 70) {
    signal = 'SELL';
    reason = `RSI at ${rsiValue.toFixed(1)} indicates overbought condition`;
  } else if (rsiValue > 60) {
    signal = 'SELL';
    reason = `RSI at ${rsiValue.toFixed(1)} approaching overbought`;
  } else {
    reason = `RSI at ${rsiValue.toFixed(1)} is neutral`;
  }

  return { name: 'RSI', value: rsiValue, signal, weight: WEIGHTS.RSI, reason };
}

export function evaluateMACD(
  macdLine: number,
  signalLine: number,
  histogram: number,
  prevHistogram: number
): IndicatorSignal {
  let signal: SignalType = 'HOLD';
  let reason = '';

  if (histogram > 0 && prevHistogram <= 0) {
    signal = 'BUY';
    reason = 'MACD bullish crossover - MACD crossed above signal line';
  } else if (histogram < 0 && prevHistogram >= 0) {
    signal = 'SELL';
    reason = 'MACD bearish crossover - MACD crossed below signal line';
  } else if (histogram > 0 && histogram > prevHistogram) {
    signal = 'BUY';
    reason = 'MACD histogram expanding positive - bullish momentum';
  } else if (histogram < 0 && histogram < prevHistogram) {
    signal = 'SELL';
    reason = 'MACD histogram expanding negative - bearish momentum';
  } else {
    reason = `MACD is neutral (line: ${macdLine.toFixed(2)}, signal: ${signalLine.toFixed(2)})`;
  }

  return { name: 'MACD', value: histogram, signal, weight: WEIGHTS.MACD, reason };
}

export function evaluateBollinger(
  close: number,
  upper: number,
  lower: number,
  middle: number
): IndicatorSignal {
  let signal: SignalType = 'HOLD';
  let reason = '';

  const percentB = (close - lower) / (upper - lower);

  if (close <= lower) {
    signal = 'BUY';
    reason = `Price at lower Bollinger Band (${lower.toFixed(2)}) - potential bounce`;
  } else if (close >= upper) {
    signal = 'SELL';
    reason = `Price at upper Bollinger Band (${upper.toFixed(2)}) - potential pullback`;
  } else if (percentB < 0.2) {
    signal = 'BUY';
    reason = `Price near lower band (%B: ${(percentB * 100).toFixed(1)}%)`;
  } else if (percentB > 0.8) {
    signal = 'SELL';
    reason = `Price near upper band (%B: ${(percentB * 100).toFixed(1)}%)`;
  } else {
    reason = `Price within bands, near middle (${middle.toFixed(2)})`;
  }

  return { name: 'Bollinger Bands', value: percentB, signal, weight: WEIGHTS.BOLLINGER, reason };
}

export function evaluateSMACrossover(
  shortSMA: number,
  longSMA: number,
  prevShortSMA: number,
  prevLongSMA: number
): IndicatorSignal {
  let signal: SignalType = 'HOLD';
  let reason = '';

  if (shortSMA > longSMA && prevShortSMA <= prevLongSMA) {
    signal = 'BUY';
    reason = 'Golden Cross - Short-term SMA crossed above long-term SMA';
  } else if (shortSMA < longSMA && prevShortSMA >= prevLongSMA) {
    signal = 'SELL';
    reason = 'Death Cross - Short-term SMA crossed below long-term SMA';
  } else if (shortSMA > longSMA) {
    signal = 'BUY';
    reason = 'Short-term SMA above long-term SMA - bullish trend';
  } else if (shortSMA < longSMA) {
    signal = 'SELL';
    reason = 'Short-term SMA below long-term SMA - bearish trend';
  }

  return { name: 'SMA Crossover', value: shortSMA - longSMA, signal, weight: WEIGHTS.SMA_CROSSOVER, reason };
}

export function evaluateVolume(
  currentVolume: number,
  avgVolume: number,
  priceChange: number
): IndicatorSignal {
  let signal: SignalType = 'HOLD';
  let reason = '';
  const volumeRatio = currentVolume / avgVolume;

  if (volumeRatio > 2 && priceChange > 0) {
    signal = 'BUY';
    reason = `Volume surge (${volumeRatio.toFixed(1)}x avg) with price increase - strong buying`;
  } else if (volumeRatio > 2 && priceChange < 0) {
    signal = 'SELL';
    reason = `Volume surge (${volumeRatio.toFixed(1)}x avg) with price decrease - strong selling`;
  } else if (volumeRatio > 1.5 && priceChange > 0) {
    signal = 'BUY';
    reason = `Above-average volume (${volumeRatio.toFixed(1)}x) supports upward move`;
  } else {
    reason = `Volume at ${volumeRatio.toFixed(1)}x average - normal activity`;
  }

  return { name: 'Volume', value: volumeRatio, signal, weight: WEIGHTS.VOLUME, reason };
}

export function evaluateSupportResistance(
  price: number,
  supports: number[],
  resistances: number[]
): IndicatorSignal {
  let signal: SignalType = 'HOLD';
  let reason = '';

  const nearestSupport = supports.reduce((nearest, s) =>
    Math.abs(s - price) < Math.abs(nearest - price) ? s : nearest, supports[0] || 0);
  const nearestResistance = resistances.reduce((nearest, r) =>
    Math.abs(r - price) < Math.abs(nearest - price) ? r : nearest, resistances[0] || Infinity);

  const supportProximity = nearestSupport > 0 ? Math.abs(price - nearestSupport) / price : 1;
  const resistanceProximity = nearestResistance < Infinity ? Math.abs(price - nearestResistance) / price : 1;

  if (supportProximity < 0.02) {
    signal = 'BUY';
    reason = `Price near support at ${nearestSupport.toFixed(2)} - potential bounce`;
  } else if (resistanceProximity < 0.02) {
    signal = 'SELL';
    reason = `Price near resistance at ${nearestResistance.toFixed(2)} - potential rejection`;
  } else {
    reason = `S: ${nearestSupport.toFixed(2)}, R: ${nearestResistance.toFixed(2)}`;
  }

  return { name: 'Support/Resistance', value: supportProximity, signal, weight: WEIGHTS.SUPPORT_RESISTANCE, reason };
}

export function evaluateADX(adx: number, plusDI: number, minusDI: number): IndicatorSignal {
  let signal: SignalType = 'HOLD';
  let reason = '';

  if (adx > 25) {
    if (plusDI > minusDI) {
      signal = 'BUY';
      reason = `Strong uptrend (ADX: ${adx.toFixed(1)}, +DI > -DI)`;
    } else {
      signal = 'SELL';
      reason = `Strong downtrend (ADX: ${adx.toFixed(1)}, -DI > +DI)`;
    }
  } else {
    reason = `Weak trend (ADX: ${adx.toFixed(1)}) - trendless market`;
  }

  return { name: 'ADX', value: adx, signal, weight: WEIGHTS.ADX, reason };
}
