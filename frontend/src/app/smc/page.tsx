'use client';

import { useState } from 'react';

interface OrderBlock {
  type: 'bullish' | 'bearish';
  priceHigh: number;
  priceLow: number;
  volume: number;
  strength: number;
  timeframe: string;
  status: 'active' | 'mitigated' | 'partially_mitigated';
  date: string;
}

interface LiquidityZone {
  type: 'buy_side' | 'sell_side';
  price: number;
  strength: 'strong' | 'moderate' | 'weak';
  equalHighsLows: number;
  stopHuntProbability: number;
  description: string;
}

interface FairValueGap {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  size: number;
  filled: boolean;
  date: string;
}

const SAMPLE_ORDER_BLOCKS: OrderBlock[] = [
  { type: 'bullish', priceHigh: 1145, priceLow: 1120, volume: 450000, strength: 85, timeframe: 'Daily', status: 'active', date: '2026-04-22' },
  { type: 'bullish', priceHigh: 1095, priceLow: 1070, volume: 380000, strength: 72, timeframe: 'Daily', status: 'active', date: '2026-04-15' },
  { type: 'bearish', priceHigh: 1185, priceLow: 1165, volume: 520000, strength: 90, timeframe: 'Daily', status: 'active', date: '2026-04-10' },
  { type: 'bearish', priceHigh: 1210, priceLow: 1195, volume: 310000, strength: 65, timeframe: 'Weekly', status: 'mitigated', date: '2026-03-28' },
  { type: 'bullish', priceHigh: 1050, priceLow: 1030, volume: 290000, strength: 58, timeframe: 'Weekly', status: 'partially_mitigated', date: '2026-03-15' },
];

const SAMPLE_LIQUIDITY_ZONES: LiquidityZone[] = [
  { type: 'buy_side', price: 1180, strength: 'strong', equalHighsLows: 4, stopHuntProbability: 78, description: 'Equal highs cluster — likely buy-side liquidity target' },
  { type: 'sell_side', price: 1085, strength: 'strong', equalHighsLows: 3, stopHuntProbability: 72, description: 'Equal lows cluster — sell-side liquidity pool' },
  { type: 'buy_side', price: 1200, strength: 'moderate', equalHighsLows: 2, stopHuntProbability: 55, description: 'Previous swing high — potential liquidity grab' },
  { type: 'sell_side', price: 1050, strength: 'weak', equalHighsLows: 2, stopHuntProbability: 40, description: 'Minor swing low — weak sell-side liquidity' },
];

const SAMPLE_FVG: FairValueGap[] = [
  { type: 'bullish', high: 1152, low: 1138, size: 14, filled: false, date: '2026-04-25' },
  { type: 'bearish', high: 1175, low: 1160, size: 15, filled: false, date: '2026-04-20' },
  { type: 'bullish', high: 1110, low: 1098, size: 12, filled: true, date: '2026-04-12' },
];

export default function SMCPage() {
  const [symbol] = useState('NABIL');
  const [activeTab, setActiveTab] = useState<'order_blocks' | 'liquidity' | 'fvg'>('order_blocks');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Smart Money Concepts</h1>
        <input
          type="text"
          defaultValue={symbol}
          className="bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-sm w-28"
          placeholder="Symbol"
        />
      </div>

      {/* Institutional Flow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="text-gray-400 text-sm">Institutional Bias</div>
          <div className="text-2xl font-bold text-green-400 mt-1">BULLISH</div>
          <div className="text-xs text-gray-500 mt-1">Based on order flow analysis</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="text-gray-400 text-sm">Active Order Blocks</div>
          <div className="text-2xl font-bold text-white mt-1">3</div>
          <div className="text-xs text-gray-500 mt-1">2 bullish, 1 bearish</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="text-gray-400 text-sm">Liquidity Targets</div>
          <div className="text-2xl font-bold text-white mt-1">4</div>
          <div className="text-xs text-gray-500 mt-1">2 buy-side, 2 sell-side</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="text-gray-400 text-sm">Fair Value Gaps</div>
          <div className="text-2xl font-bold text-white mt-1">2</div>
          <div className="text-xs text-gray-500 mt-1">Open / unfilled</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['order_blocks', 'liquidity', 'fvg'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'bg-dark-card text-gray-400 hover:text-white border border-dark-border'
            }`}
          >
            {tab === 'order_blocks' ? 'Order Blocks' : tab === 'liquidity' ? 'Liquidity Zones' : 'Fair Value Gaps'}
          </button>
        ))}
      </div>

      {/* Order Blocks Tab */}
      {activeTab === 'order_blocks' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Order Blocks — {symbol}</h3>
          <p className="text-sm text-gray-400">
            Order blocks represent the last opposing candle before a strong impulsive move. These are institutional entry zones where smart money has placed large orders.
          </p>
          <div className="space-y-3">
            {SAMPLE_ORDER_BLOCKS.map((ob, i) => (
              <div key={i} className={`bg-dark-card border rounded-xl p-4 ${
                ob.type === 'bullish' ? 'border-green-800/50' : 'border-red-800/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      ob.type === 'bullish' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                    }`}>
                      {ob.type.toUpperCase()} OB
                    </span>
                    <span className="text-white font-medium">Rs. {ob.priceLow} — Rs. {ob.priceHigh}</span>
                    <span className="text-gray-500 text-sm">{ob.timeframe}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      ob.status === 'active' ? 'bg-blue-900/50 text-blue-400' :
                      ob.status === 'mitigated' ? 'bg-gray-700/50 text-gray-400' :
                      'bg-yellow-900/50 text-yellow-400'
                    }`}>
                      {ob.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Strength</div>
                      <div className="text-white font-semibold">{ob.strength}%</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-2 text-sm text-gray-400">
                  <span>Volume: {(ob.volume / 1000).toFixed(0)}K</span>
                  <span>Zone width: Rs. {ob.priceHigh - ob.priceLow}</span>
                  <span>Date: {ob.date}</span>
                </div>
                {/* Strength bar */}
                <div className="mt-2 h-1.5 bg-dark-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${ob.type === 'bullish' ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${ob.strength}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liquidity Zones Tab */}
      {activeTab === 'liquidity' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Liquidity Zones — {symbol}</h3>
          <p className="text-sm text-gray-400">
            Liquidity zones are areas where stop losses and pending orders cluster. Institutional traders target these zones to fill large orders, often causing &quot;stop hunts&quot; or &quot;liquidity grabs&quot;.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_LIQUIDITY_ZONES.map((lz, i) => (
              <div key={i} className={`bg-dark-card border rounded-xl p-4 ${
                lz.type === 'buy_side' ? 'border-green-800/30' : 'border-red-800/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    lz.type === 'buy_side' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {lz.type === 'buy_side' ? 'BUY-SIDE LIQ.' : 'SELL-SIDE LIQ.'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    lz.strength === 'strong' ? 'bg-red-900/50 text-red-400' :
                    lz.strength === 'moderate' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-gray-700/50 text-gray-400'
                  }`}>
                    {lz.strength.toUpperCase()}
                  </span>
                </div>
                <div className="text-xl font-bold text-white">Rs. {lz.price.toFixed(2)}</div>
                <p className="text-sm text-gray-400 mt-1">{lz.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="text-gray-400">Equal H/L: <span className="text-white">{lz.equalHighsLows}</span></span>
                  <span className="text-gray-400">Stop Hunt Prob: <span className={`font-semibold ${
                    lz.stopHuntProbability >= 70 ? 'text-red-400' : lz.stopHuntProbability >= 50 ? 'text-yellow-400' : 'text-gray-300'
                  }`}>{lz.stopHuntProbability}%</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fair Value Gaps Tab */}
      {activeTab === 'fvg' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Fair Value Gaps (FVG) — {symbol}</h3>
          <p className="text-sm text-gray-400">
            Fair Value Gaps are imbalances created when price moves aggressively, leaving a gap between candle wicks. Price tends to return to fill these gaps.
          </p>
          <div className="space-y-3">
            {SAMPLE_FVG.map((fvg, i) => (
              <div key={i} className={`bg-dark-card border rounded-xl p-4 ${
                fvg.filled ? 'border-gray-700/50 opacity-60' : fvg.type === 'bullish' ? 'border-green-800/50' : 'border-red-800/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      fvg.type === 'bullish' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                    }`}>
                      {fvg.type.toUpperCase()} FVG
                    </span>
                    <span className="text-white font-medium">Rs. {fvg.low} — Rs. {fvg.high}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      fvg.filled ? 'bg-gray-700/50 text-gray-400' : 'bg-blue-900/50 text-blue-400'
                    }`}>
                      {fvg.filled ? 'FILLED' : 'OPEN'}
                    </span>
                    <span className="text-gray-400 text-sm">{fvg.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-2 text-sm text-gray-400">
                  <span>Gap Size: Rs. {fvg.size}</span>
                  <span>Midpoint: Rs. {((fvg.high + fvg.low) / 2).toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">SMC Trading Rules</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Trade in the direction of the higher timeframe order block</li>
          <li>• Enter at order block zones, target opposite liquidity</li>
          <li>• Wait for liquidity sweeps before entering positions</li>
          <li>• Fair Value Gaps act as magnets — expect price to revisit them</li>
          <li>• Combine with market structure (BOS/CHOCH) for confirmation</li>
        </ul>
      </div>
    </div>
  );
}
