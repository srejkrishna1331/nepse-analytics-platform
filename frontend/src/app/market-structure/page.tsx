'use client';

import { useState } from 'react';

interface StructurePoint {
  type: 'HH' | 'HL' | 'LH' | 'LL';
  price: number;
  date: string;
  label: string;
}

interface StructureBreak {
  type: 'BOS' | 'CHOCH';
  direction: 'bullish' | 'bearish';
  price: number;
  date: string;
  significance: 'major' | 'minor';
  confirmed: boolean;
  description: string;
}

interface TrendPhase {
  phase: string;
  direction: 'bullish' | 'bearish' | 'ranging';
  strength: number;
  duration: string;
  description: string;
}

const SAMPLE_STRUCTURE_POINTS: StructurePoint[] = [
  { type: 'HL', price: 1085, date: '2026-04-02', label: 'Higher Low — demand zone respected' },
  { type: 'HH', price: 1155, date: '2026-04-08', label: 'Higher High — bullish momentum continues' },
  { type: 'HL', price: 1120, date: '2026-04-15', label: 'Higher Low — pullback to OB zone' },
  { type: 'HH', price: 1170, date: '2026-04-22', label: 'Higher High — new swing high established' },
  { type: 'HL', price: 1135, date: '2026-04-28', label: 'Higher Low forming — structure intact' },
];

const SAMPLE_BREAKS: StructureBreak[] = [
  {
    type: 'BOS',
    direction: 'bullish',
    price: 1155,
    date: '2026-04-22',
    significance: 'major',
    confirmed: true,
    description: 'Price broke above previous swing high at Rs. 1,155. Bullish structure confirmed with volume expansion (2.1x avg).',
  },
  {
    type: 'BOS',
    direction: 'bullish',
    price: 1120,
    date: '2026-04-15',
    significance: 'minor',
    confirmed: true,
    description: 'Minor break of structure above Rs. 1,120 after consolidation. Price retraced to bullish OB before continuation.',
  },
  {
    type: 'CHOCH',
    direction: 'bullish',
    price: 1095,
    date: '2026-04-02',
    significance: 'major',
    confirmed: true,
    description: 'Change of Character: previously bearish structure shifted bullish. Price broke above last lower high at Rs. 1,095 with momentum.',
  },
  {
    type: 'BOS',
    direction: 'bearish',
    price: 1050,
    date: '2026-03-20',
    significance: 'minor',
    confirmed: true,
    description: 'Bearish BOS below swing low at Rs. 1,050 during the prior downtrend.',
  },
];

const SAMPLE_TREND: TrendPhase = {
  phase: 'Markup (Accumulation Complete)',
  direction: 'bullish',
  strength: 78,
  duration: '28 days',
  description: 'Price is in a markup phase following accumulation. Higher highs and higher lows forming consistently. Smart money distribution has not yet begun.',
};

const WYCKOFF_PHASES = [
  { name: 'Accumulation', active: false, description: 'Smart money quietly buying at low prices' },
  { name: 'Markup', active: true, description: 'Price trending upward with increasing participation' },
  { name: 'Distribution', active: false, description: 'Smart money selling to retail traders' },
  { name: 'Markdown', active: false, description: 'Price declining as selling pressure dominates' },
];

export default function MarketStructurePage() {
  const [symbol] = useState('NABIL');
  const [timeframe, setTimeframe] = useState<'1D' | '4H' | '1H'>('1D');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Market Structure</h1>
        <input
          type="text"
          defaultValue={symbol}
          className="bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-sm w-28"
          placeholder="Symbol"
        />
        <div className="flex gap-1">
          {(['1D', '4H', '1H'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                timeframe === tf ? 'bg-primary-600 text-white' : 'bg-dark-card text-gray-400 border border-dark-border'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Current Trend & Wyckoff */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-sm text-gray-400 mb-2">Current Market Phase</h3>
          <div className={`text-xl font-bold ${
            SAMPLE_TREND.direction === 'bullish' ? 'text-green-400' : SAMPLE_TREND.direction === 'bearish' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {SAMPLE_TREND.phase}
          </div>
          <p className="text-sm text-gray-400 mt-2">{SAMPLE_TREND.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-sm text-gray-400">Strength: <span className="text-white font-semibold">{SAMPLE_TREND.strength}%</span></span>
            <span className="text-sm text-gray-400">Duration: <span className="text-white">{SAMPLE_TREND.duration}</span></span>
          </div>
          <div className="mt-3 h-2 bg-dark-border rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${SAMPLE_TREND.strength}%` }} />
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-sm text-gray-400 mb-3">Wyckoff Cycle</h3>
          <div className="space-y-2">
            {WYCKOFF_PHASES.map((phase, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${
                phase.active ? 'bg-primary-600/20 border border-primary-600/40' : ''
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  phase.active ? 'bg-primary-400' : 'bg-gray-600'
                }`} />
                <div>
                  <div className={`text-sm font-medium ${phase.active ? 'text-primary-400' : 'text-gray-400'}`}>
                    {phase.name}
                  </div>
                  <div className="text-xs text-gray-500">{phase.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Structure Points (Swing Highs/Lows) */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4">Swing Points — {timeframe}</h3>
        <div className="relative">
          {/* Visual structure line */}
          <div className="flex items-end justify-between h-32 mb-4 px-4">
            {SAMPLE_STRUCTURE_POINTS.map((pt, i) => {
              const minPrice = 1050;
              const maxPrice = 1200;
              const heightPct = ((pt.price - minPrice) / (maxPrice - minPrice)) * 100;
              return (
                <div key={i} className="flex flex-col items-center gap-1" style={{ marginBottom: `${heightPct * 0.8}px` }}>
                  <span className={`text-xs font-bold ${
                    pt.type === 'HH' || pt.type === 'HL' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {pt.type}
                  </span>
                  <span className="text-xs text-white">{pt.price}</span>
                </div>
              );
            })}
          </div>
          {/* Details table */}
          <div className="space-y-2">
            {SAMPLE_STRUCTURE_POINTS.map((pt, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dark-bg/50">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    pt.type === 'HH' ? 'bg-green-900/50 text-green-400' :
                    pt.type === 'HL' ? 'bg-green-900/30 text-green-300' :
                    pt.type === 'LH' ? 'bg-red-900/30 text-red-300' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {pt.type}
                  </span>
                  <span className="text-sm text-white">Rs. {pt.price}</span>
                  <span className="text-xs text-gray-500">{pt.date}</span>
                </div>
                <span className="text-xs text-gray-400">{pt.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOS & CHOCH Events */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4">Break of Structure (BOS) & Change of Character (CHOCH)</h3>
        <div className="space-y-3">
          {SAMPLE_BREAKS.map((brk, i) => (
            <div key={i} className={`border rounded-xl p-4 ${
              brk.type === 'CHOCH'
                ? 'bg-purple-900/10 border-purple-700/40'
                : brk.direction === 'bullish'
                ? 'bg-green-900/10 border-green-800/30'
                : 'bg-red-900/10 border-red-800/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    brk.type === 'CHOCH' ? 'bg-purple-900/50 text-purple-400' :
                    brk.direction === 'bullish' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {brk.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    brk.direction === 'bullish' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
                  }`}>
                    {brk.direction.toUpperCase()}
                  </span>
                  <span className="text-white font-medium">Rs. {brk.price}</span>
                  <span className="text-xs text-gray-500">{brk.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    brk.significance === 'major' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {brk.significance.toUpperCase()}
                  </span>
                  {brk.confirmed && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-400">CONFIRMED</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">{brk.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Structure Analysis Rules</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• <strong className="text-white">BOS (Break of Structure):</strong> Price breaks a swing high/low in the direction of the trend, confirming continuation</li>
          <li>• <strong className="text-white">CHOCH (Change of Character):</strong> Price breaks a swing high/low against the trend, signaling a potential reversal</li>
          <li>• Higher Highs (HH) + Higher Lows (HL) = Bullish structure</li>
          <li>• Lower Highs (LH) + Lower Lows (LL) = Bearish structure</li>
          <li>• Always confirm structure breaks with volume and order flow</li>
        </ul>
      </div>
    </div>
  );
}
