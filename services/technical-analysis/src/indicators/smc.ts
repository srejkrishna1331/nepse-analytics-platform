interface OrderBlock {
  type: 'bullish' | 'bearish';
  startIndex: number;
  endIndex: number;
  high: number;
  low: number;
  volume: number;
  strength: number;
}

interface LiquidityZone {
  type: 'buy_side' | 'sell_side';
  price: number;
  strength: number;
  touches: number;
}

interface FairValueGap {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  index: number;
}

interface MarketStructurePoint {
  type: 'HH' | 'HL' | 'LH' | 'LL';
  price: number;
  index: number;
}

interface StructureBreak {
  type: 'BOS' | 'CHOCH';
  direction: 'bullish' | 'bearish';
  price: number;
  index: number;
}

export function detectOrderBlocks(
  opens: number[],
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
  lookback: number = 20
): OrderBlock[] {
  const blocks: OrderBlock[] = [];
  const avgVolume = volumes.reduce((s, v) => s + v, 0) / volumes.length;

  for (let i = lookback; i < closes.length - 2; i++) {
    const body = Math.abs(closes[i + 1] - opens[i + 1]);
    const range = highs[i + 1] - lows[i + 1];
    const isImpulsive = body > range * 0.6 && volumes[i + 1] > avgVolume * 1.3;

    if (!isImpulsive) continue;

    // Bullish OB: last bearish candle before a strong bullish move
    if (closes[i + 1] > opens[i + 1] && closes[i] < opens[i]) {
      const strength = Math.min(100, Math.round((volumes[i + 1] / avgVolume) * 40 + (body / range) * 60));
      blocks.push({
        type: 'bullish',
        startIndex: i,
        endIndex: i,
        high: highs[i],
        low: lows[i],
        volume: volumes[i],
        strength,
      });
    }

    // Bearish OB: last bullish candle before a strong bearish move
    if (closes[i + 1] < opens[i + 1] && closes[i] > opens[i]) {
      const strength = Math.min(100, Math.round((volumes[i + 1] / avgVolume) * 40 + (body / range) * 60));
      blocks.push({
        type: 'bearish',
        startIndex: i,
        endIndex: i,
        high: highs[i],
        low: lows[i],
        volume: volumes[i],
        strength,
      });
    }
  }

  return blocks.slice(-10);
}

export function detectLiquidityZones(
  highs: number[],
  lows: number[],
  tolerance: number = 0.005
): LiquidityZone[] {
  const zones: LiquidityZone[] = [];

  // Find clusters of equal highs (buy-side liquidity)
  for (let i = 0; i < highs.length; i++) {
    let touches = 0;
    for (let j = i + 1; j < highs.length; j++) {
      if (Math.abs(highs[j] - highs[i]) / highs[i] < tolerance) {
        touches++;
      }
    }
    if (touches >= 2) {
      const existing = zones.find(z => z.type === 'buy_side' && Math.abs(z.price - highs[i]) / highs[i] < tolerance);
      if (!existing) {
        zones.push({
          type: 'buy_side',
          price: highs[i],
          strength: Math.min(100, touches * 25),
          touches: touches + 1,
        });
      }
    }
  }

  // Find clusters of equal lows (sell-side liquidity)
  for (let i = 0; i < lows.length; i++) {
    let touches = 0;
    for (let j = i + 1; j < lows.length; j++) {
      if (Math.abs(lows[j] - lows[i]) / lows[i] < tolerance) {
        touches++;
      }
    }
    if (touches >= 2) {
      const existing = zones.find(z => z.type === 'sell_side' && Math.abs(z.price - lows[i]) / lows[i] < tolerance);
      if (!existing) {
        zones.push({
          type: 'sell_side',
          price: lows[i],
          strength: Math.min(100, touches * 25),
          touches: touches + 1,
        });
      }
    }
  }

  return zones.slice(0, 10);
}

export function detectFairValueGaps(
  highs: number[],
  lows: number[],
  closes: number[]
): FairValueGap[] {
  const gaps: FairValueGap[] = [];

  for (let i = 2; i < closes.length; i++) {
    // Bullish FVG: gap between candle [i-2] high and candle [i] low
    if (lows[i] > highs[i - 2]) {
      gaps.push({
        type: 'bullish',
        high: lows[i],
        low: highs[i - 2],
        index: i - 1,
      });
    }
    // Bearish FVG: gap between candle [i] high and candle [i-2] low
    if (highs[i] < lows[i - 2]) {
      gaps.push({
        type: 'bearish',
        high: lows[i - 2],
        low: highs[i],
        index: i - 1,
      });
    }
  }

  return gaps.slice(-10);
}

export function detectMarketStructure(
  highs: number[],
  lows: number[],
  swingLength: number = 5
): { points: MarketStructurePoint[]; breaks: StructureBreak[] } {
  const swingHighs: { price: number; index: number }[] = [];
  const swingLows: { price: number; index: number }[] = [];

  // Detect swing highs and lows
  for (let i = swingLength; i < highs.length - swingLength; i++) {
    let isSwingHigh = true;
    let isSwingLow = true;

    for (let j = 1; j <= swingLength; j++) {
      if (highs[i] <= highs[i - j] || highs[i] <= highs[i + j]) isSwingHigh = false;
      if (lows[i] >= lows[i - j] || lows[i] >= lows[i + j]) isSwingLow = false;
    }

    if (isSwingHigh) swingHighs.push({ price: highs[i], index: i });
    if (isSwingLow) swingLows.push({ price: lows[i], index: i });
  }

  // Label swing points as HH/HL/LH/LL
  const points: MarketStructurePoint[] = [];

  for (let i = 1; i < swingHighs.length; i++) {
    points.push({
      type: swingHighs[i].price > swingHighs[i - 1].price ? 'HH' : 'LH',
      price: swingHighs[i].price,
      index: swingHighs[i].index,
    });
  }

  for (let i = 1; i < swingLows.length; i++) {
    points.push({
      type: swingLows[i].price > swingLows[i - 1].price ? 'HL' : 'LL',
      price: swingLows[i].price,
      index: swingLows[i].index,
    });
  }

  points.sort((a, b) => a.index - b.index);

  // Detect BOS and CHOCH
  const breaks: StructureBreak[] = [];
  let lastTrend: 'bullish' | 'bearish' | null = null;

  for (let i = 1; i < points.length; i++) {
    const pt = points[i];

    if (pt.type === 'HH') {
      if (lastTrend === 'bearish') {
        breaks.push({ type: 'CHOCH', direction: 'bullish', price: pt.price, index: pt.index });
      } else if (lastTrend === 'bullish') {
        breaks.push({ type: 'BOS', direction: 'bullish', price: pt.price, index: pt.index });
      }
      lastTrend = 'bullish';
    } else if (pt.type === 'LL') {
      if (lastTrend === 'bullish') {
        breaks.push({ type: 'CHOCH', direction: 'bearish', price: pt.price, index: pt.index });
      } else if (lastTrend === 'bearish') {
        breaks.push({ type: 'BOS', direction: 'bearish', price: pt.price, index: pt.index });
      }
      lastTrend = 'bearish';
    }
  }

  return { points: points.slice(-20), breaks: breaks.slice(-10) };
}
