'use client';

import { useState } from 'react';

interface BehavioralSignal {
  type: 'panic_selling' | 'fomo' | 'capitulation' | 'euphoria' | 'fear' | 'greed';
  symbol: string;
  intensity: number;
  evidence: string[];
  recommendation: string;
  timestamp: string;
}

interface MarketSentimentGauge {
  label: string;
  value: number;
  zone: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
}

const SAMPLE_SIGNALS: BehavioralSignal[] = [
  {
    type: 'panic_selling',
    symbol: 'GBIME',
    intensity: 72,
    evidence: [
      'Volume 3.8x average on a -2.5% decline',
      'Retail sell orders dominate (85% of total)',
      'Price dropped below 200-day SMA',
      'Social media mentions increased 4x with negative sentiment',
    ],
    recommendation: 'Panic selling detected. Smart money often accumulates during retail panic. Watch for volume exhaustion and reversal candles.',
    timestamp: '2026-04-29 14:30',
  },
  {
    type: 'fomo',
    symbol: 'UPPER',
    intensity: 68,
    evidence: [
      'Price up 12% in 5 sessions with accelerating volume',
      'New retail account openings spiked 40%',
      'Social media hype: "UPPER to the moon" trending',
      'RSI at 78 — overbought territory',
    ],
    recommendation: 'FOMO signal detected. Late buyers entering at elevated prices. Risk of sharp pullback increases. Consider taking partial profits if holding.',
    timestamp: '2026-04-29 13:15',
  },
  {
    type: 'capitulation',
    symbol: 'NLIC',
    intensity: 55,
    evidence: [
      'Extended decline: -8% over 2 weeks',
      'Volume increasing on down days',
      'Institutional holdings reduced by 3%',
    ],
    recommendation: 'Early capitulation signs. Not yet at extreme levels. Monitor for selling exhaustion before considering entry.',
    timestamp: '2026-04-28 15:00',
  },
  {
    type: 'euphoria',
    symbol: 'SHIVM',
    intensity: 62,
    evidence: [
      'Price at 52-week high with parabolic acceleration',
      'Multiple broker upgrades in rapid succession',
      'Retail participation at 90%+ of daily volume',
    ],
    recommendation: 'Euphoria indicators rising. Historical data shows 70% of euphoria signals precede a correction within 2 weeks. Tighten stops.',
    timestamp: '2026-04-28 11:00',
  },
];

const MARKET_SENTIMENT: MarketSentimentGauge = {
  label: 'Fear & Greed Index',
  value: 62,
  zone: 'greed',
};

const CROWD_METRICS = [
  { name: 'Retail Buy/Sell Ratio', value: '1.8', interpretation: 'Retail heavily buying — contrarian bearish signal', bias: 'bullish_crowd' as const },
  { name: 'Broker Margin Utilization', value: '78%', interpretation: 'High leverage — increased risk of forced selling', bias: 'risk' as const },
  { name: 'New Account Openings', value: '+35%', interpretation: 'Surge in new participants — possible late-stage rally', bias: 'bullish_crowd' as const },
  { name: 'Institutional vs Retail Flow', value: '-12M net sell', interpretation: 'Institutions net selling while retail buys', bias: 'bearish_smart' as const },
  { name: 'Put-Call Equivalent Ratio', value: '0.65', interpretation: 'Low hedging activity — complacency', bias: 'risk' as const },
  { name: 'Social Media Sentiment', value: '72% Bullish', interpretation: 'Overwhelmingly positive — contrarian caution', bias: 'bullish_crowd' as const },
];

const typeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  panic_selling: { label: 'PANIC SELLING', color: 'text-red-400', bgColor: 'bg-red-900/50' },
  fomo: { label: 'FOMO', color: 'text-orange-400', bgColor: 'bg-orange-900/50' },
  capitulation: { label: 'CAPITULATION', color: 'text-red-300', bgColor: 'bg-red-900/30' },
  euphoria: { label: 'EUPHORIA', color: 'text-yellow-400', bgColor: 'bg-yellow-900/50' },
  fear: { label: 'FEAR', color: 'text-purple-400', bgColor: 'bg-purple-900/50' },
  greed: { label: 'GREED', color: 'text-green-400', bgColor: 'bg-green-900/50' },
};

export default function BehavioralFinancePage() {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? SAMPLE_SIGNALS : SAMPLE_SIGNALS.filter(s => s.type === filter);

  const sentimentRotation = ((MARKET_SENTIMENT.value / 100) * 180) - 90;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Behavioral Finance</h1>

      {/* Fear & Greed Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 flex flex-col items-center">
          <h3 className="text-sm text-gray-400 mb-4">{MARKET_SENTIMENT.label}</h3>
          {/* Semicircle gauge */}
          <div className="relative w-48 h-24 overflow-hidden">
            <div className="absolute inset-0 rounded-t-full" style={{
              background: 'conic-gradient(from 180deg, #ef4444, #f59e0b, #22c55e, #f59e0b, #ef4444)',
              clipPath: 'polygon(0 100%, 0 0, 100% 0, 100% 100%)',
            }} />
            <div className="absolute bottom-0 left-1/2 w-1 h-20 bg-white origin-bottom rounded-full"
                 style={{ transform: `translateX(-50%) rotate(${sentimentRotation}deg)` }} />
            <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-white rounded-full" style={{ transform: 'translateX(-50%) translateY(50%)' }} />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{MARKET_SENTIMENT.value}</div>
          <div className={`text-sm font-semibold mt-1 ${
            MARKET_SENTIMENT.zone === 'extreme_greed' ? 'text-green-400' :
            MARKET_SENTIMENT.zone === 'greed' ? 'text-green-300' :
            MARKET_SENTIMENT.zone === 'neutral' ? 'text-yellow-400' :
            MARKET_SENTIMENT.zone === 'fear' ? 'text-red-300' : 'text-red-400'
          }`}>
            {MARKET_SENTIMENT.zone.replace('_', ' ').toUpperCase()}
          </div>
          <div className="flex justify-between w-full text-xs text-gray-500 mt-2">
            <span>Extreme Fear</span>
            <span>Neutral</span>
            <span>Extreme Greed</span>
          </div>
        </div>

        {/* Active Alerts Summary */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-sm text-gray-400 mb-3">Active Behavioral Alerts</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-400">Panic Selling</span>
              <span className="text-white font-semibold">1 stock</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-400">FOMO Detected</span>
              <span className="text-white font-semibold">1 stock</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-300">Capitulation</span>
              <span className="text-white font-semibold">1 stock</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-400">Euphoria</span>
              <span className="text-white font-semibold">1 stock</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-dark-border">
            <div className="text-xs text-gray-500">Total signals: <span className="text-white">{SAMPLE_SIGNALS.length}</span></div>
          </div>
        </div>

        {/* Contrarian Indicator */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-sm text-gray-400 mb-3">Contrarian Signal</h3>
          <div className="text-xl font-bold text-yellow-400">CAUTION</div>
          <p className="text-sm text-gray-400 mt-2">
            Retail sentiment is overwhelmingly bullish (72%) while institutional flow is net negative. This divergence historically precedes corrections 65% of the time.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs text-yellow-400">Active warning</span>
          </div>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'panic_selling', 'fomo', 'capitulation', 'euphoria'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-dark-card text-gray-400 border border-dark-border'
            }`}
          >
            {f === 'all' ? 'All Signals' : typeConfig[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Behavioral Signals */}
      <div className="space-y-4">
        {filtered.map((signal, i) => {
          const config = typeConfig[signal.type];
          return (
            <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.bgColor} ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-white font-semibold text-lg">{signal.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Intensity</div>
                    <div className={`font-bold ${signal.intensity >= 70 ? 'text-red-400' : signal.intensity >= 50 ? 'text-yellow-400' : 'text-gray-300'}`}>
                      {signal.intensity}/100
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{signal.timestamp}</span>
                </div>
              </div>
              {/* Intensity bar */}
              <div className="h-2 bg-dark-border rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${
                    signal.intensity >= 70 ? 'bg-red-500' : signal.intensity >= 50 ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}
                  style={{ width: `${signal.intensity}%` }}
                />
              </div>
              <div className="mb-3">
                <div className="text-sm text-gray-400 mb-1 font-medium">Evidence:</div>
                <ul className="text-sm text-gray-300 space-y-1">
                  {signal.evidence.map((e, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="text-gray-500 mt-1">•</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-sm text-gray-400 font-medium mb-1">Recommendation:</div>
                <p className="text-sm text-gray-300">{signal.recommendation}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Crowd Psychology Metrics */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4">Crowd Psychology Metrics</h3>
        <div className="space-y-2">
          {CROWD_METRICS.map((m, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-dark-bg">
              <div>
                <div className="text-sm text-white font-medium">{m.name}</div>
                <div className="text-xs text-gray-500">{m.interpretation}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-semibold">{m.value}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  m.bias === 'bearish_smart' ? 'bg-red-900/50 text-red-400' :
                  m.bias === 'risk' ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-green-900/50 text-green-400'
                }`}>
                  {m.bias === 'bearish_smart' ? 'SMART MONEY SELL' :
                   m.bias === 'risk' ? 'ELEVATED RISK' : 'RETAIL BULLISH'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
        <strong className="text-yellow-400">Note:</strong>
        <span className="text-sm text-gray-400 ml-2">
          Behavioral signals are probabilistic indicators based on historical patterns. They should be used alongside technical and fundamental analysis, not as standalone trading decisions.
        </span>
      </div>
    </div>
  );
}
