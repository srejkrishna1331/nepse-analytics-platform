interface BehavioralSignal {
  type: 'panic_selling' | 'fomo' | 'capitulation' | 'euphoria';
  intensity: number;
  evidence: string[];
  recommendation: string;
}

export function detectPanicSelling(
  closes: number[],
  volumes: number[],
  avgVolume: number
): BehavioralSignal | null {
  if (closes.length < 5) return null;

  const recentReturn = (closes[closes.length - 1] - closes[closes.length - 5]) / closes[closes.length - 5];
  const recentVolRatio = volumes[volumes.length - 1] / avgVolume;
  const isDecline = recentReturn < -0.03;
  const isHighVolume = recentVolRatio > 2.5;

  if (!isDecline || !isHighVolume) return null;

  const intensity = Math.min(100, Math.round(
    Math.abs(recentReturn) * 500 + (recentVolRatio - 1) * 20
  ));

  return {
    type: 'panic_selling',
    intensity,
    evidence: [
      `Price declined ${(recentReturn * 100).toFixed(1)}% over 5 sessions`,
      `Volume ${recentVolRatio.toFixed(1)}x average`,
      'Accelerating selling pressure detected',
    ],
    recommendation: 'Panic selling detected. Smart money often accumulates during retail panic. Watch for volume exhaustion and reversal candles.',
  };
}

export function detectFOMO(
  closes: number[],
  volumes: number[],
  avgVolume: number
): BehavioralSignal | null {
  if (closes.length < 5) return null;

  const recentReturn = (closes[closes.length - 1] - closes[closes.length - 5]) / closes[closes.length - 5];
  const recentVolRatio = volumes[volumes.length - 1] / avgVolume;
  const isRally = recentReturn > 0.05;
  const isHighVolume = recentVolRatio > 2.0;

  // Check for accelerating price increase (parabolic)
  const dayReturns: number[] = [];
  for (let i = closes.length - 5; i < closes.length; i++) {
    if (i > 0) dayReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const isAccelerating = dayReturns.length >= 3 &&
    dayReturns[dayReturns.length - 1] > dayReturns[dayReturns.length - 2] &&
    dayReturns[dayReturns.length - 2] > dayReturns[dayReturns.length - 3];

  if (!isRally || !isHighVolume) return null;

  const intensity = Math.min(100, Math.round(
    recentReturn * 400 + (recentVolRatio - 1) * 15 + (isAccelerating ? 20 : 0)
  ));

  return {
    type: 'fomo',
    intensity,
    evidence: [
      `Price up ${(recentReturn * 100).toFixed(1)}% in 5 sessions`,
      `Volume ${recentVolRatio.toFixed(1)}x average`,
      isAccelerating ? 'Parabolic price acceleration detected' : 'Strong upward momentum',
    ],
    recommendation: 'FOMO signal detected. Late buyers entering at elevated prices. Risk of sharp pullback increases. Consider taking partial profits if holding.',
  };
}

export function detectCapitulation(
  closes: number[],
  volumes: number[],
  avgVolume: number,
  rsi: number
): BehavioralSignal | null {
  if (closes.length < 10) return null;

  const tenDayReturn = (closes[closes.length - 1] - closes[closes.length - 10]) / closes[closes.length - 10];
  const recentVolRatio = volumes[volumes.length - 1] / avgVolume;
  const isExtendedDecline = tenDayReturn < -0.08;
  const isVolumeSpike = recentVolRatio > 3.0;
  const isRSIOversold = rsi < 25;

  if (!isExtendedDecline) return null;

  const intensity = Math.min(100, Math.round(
    Math.abs(tenDayReturn) * 300 +
    (isVolumeSpike ? 25 : 0) +
    (isRSIOversold ? 25 : 0)
  ));

  return {
    type: 'capitulation',
    intensity,
    evidence: [
      `Extended decline: ${(tenDayReturn * 100).toFixed(1)}% over 10 sessions`,
      isVolumeSpike ? `Volume spike: ${recentVolRatio.toFixed(1)}x average` : 'Volume elevated',
      isRSIOversold ? `RSI extremely oversold at ${rsi.toFixed(1)}` : `RSI at ${rsi.toFixed(1)}`,
    ],
    recommendation: intensity >= 70
      ? 'Strong capitulation signal. Historically marks potential bottoms. Wait for selling exhaustion before entry.'
      : 'Early capitulation signs. Not yet at extreme levels. Monitor for selling exhaustion.',
  };
}

export function detectEuphoria(
  closes: number[],
  volumes: number[],
  avgVolume: number,
  rsi: number
): BehavioralSignal | null {
  if (closes.length < 20) return null;

  const twentyDayReturn = (closes[closes.length - 1] - closes[closes.length - 20]) / closes[closes.length - 20];
  const isParabolic = twentyDayReturn > 0.15;
  const isRSIExtreme = rsi > 80;
  const isHighVolume = volumes[volumes.length - 1] / avgVolume > 2.0;

  if (!isParabolic && !isRSIExtreme) return null;

  const intensity = Math.min(100, Math.round(
    twentyDayReturn * 200 +
    (isRSIExtreme ? 30 : 0) +
    (isHighVolume ? 15 : 0)
  ));

  return {
    type: 'euphoria',
    intensity,
    evidence: [
      `Price up ${(twentyDayReturn * 100).toFixed(1)}% over 20 sessions`,
      isRSIExtreme ? `RSI extremely overbought at ${rsi.toFixed(1)}` : `RSI at ${rsi.toFixed(1)}`,
      isHighVolume ? 'Elevated volume indicates retail participation' : 'Normal volume levels',
    ],
    recommendation: 'Euphoria indicators rising. Historical data shows corrections frequently follow. Tighten stops and consider reducing position size.',
  };
}
