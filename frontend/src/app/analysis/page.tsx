'use client';

import { useState } from 'react';

const INDICATORS = {
  sma: { 20: 1128.5, 50: 1095.2, 200: 1020.8 },
  ema: { 12: 1135.4, 26: 1110.3 },
  rsi: 58.4,
  macd: { line: 12.5, signal: 8.2, histogram: 4.3 },
  bollingerBands: { upper: 1185.2, middle: 1128.5, lower: 1071.8 },
  stochastic: { k: 65.2, d: 58.8 },
  adx: { adx: 32.5, plusDI: 28.4, minusDI: 18.2 },
  vwap: 1138.6,
};

const FIBONACCI = [
  { level: '0.0%', price: 1280.00 },
  { level: '23.6%', price: 1205.60 },
  { level: '38.2%', price: 1162.80 },
  { level: '50.0%', price: 1130.00 },
  { level: '61.8%', price: 1097.20 },
  { level: '78.6%', price: 1045.20 },
  { level: '100%', price: 980.00 },
];

const SR_LEVELS = [
  { type: 'resistance', price: 1180, strength: 4 },
  { type: 'resistance', price: 1155, strength: 3 },
  { type: 'support', price: 1120, strength: 5 },
  { type: 'support', price: 1085, strength: 3 },
  { type: 'support', price: 1050, strength: 2 },
];

const PATTERNS = [
  { pattern: 'Ascending Triangle', type: 'bullish', confidence: 72, description: 'Ascending triangle with flat resistance at 1155 and rising support.' },
  { pattern: 'Volume Breakout', type: 'bullish', confidence: 68, description: 'Volume 2.1x average with upward price movement.' },
];

export default function AnalysisPage() {
  const [symbol, setSymbol] = useState('NABIL');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Technical Analysis</h1>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-sm w-32 focus:outline-none focus:border-primary-500"
          placeholder="Symbol"
        />
      </div>

      {/* Chart Placeholder */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-3">{symbol} - Interactive Chart</h3>
        <div className="h-80 bg-dark-bg rounded-lg flex items-center justify-center border border-dark-border/50">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p>TradingView Lightweight Chart</p>
            <p className="text-xs mt-1">Connect to live market data to render interactive charts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moving Averages */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">Moving Averages</h3>
          <div className="space-y-3">
            {Object.entries(INDICATORS.sma).map(([period, val]) => (
              <div key={`sma-${period}`} className="flex justify-between items-center">
                <span className="text-gray-400">SMA ({period})</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{val.toFixed(2)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${1150 > val ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {1150 > val ? 'Above' : 'Below'}
                  </span>
                </div>
              </div>
            ))}
            {Object.entries(INDICATORS.ema).map(([period, val]) => (
              <div key={`ema-${period}`} className="flex justify-between items-center">
                <span className="text-gray-400">EMA ({period})</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{val.toFixed(2)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${1150 > val ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {1150 > val ? 'Above' : 'Below'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Oscillators */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">Oscillators</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">RSI (14)</span>
                <span className="font-semibold">{INDICATORS.rsi}</span>
              </div>
              <div className="w-full bg-dark-border rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${INDICATORS.rsi}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Oversold (30)</span><span>Neutral</span><span>Overbought (70)</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-xs text-gray-400">MACD Line</div>
                <div className="font-semibold text-green-400">{INDICATORS.macd.line}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Signal Line</div>
                <div className="font-semibold">{INDICATORS.macd.signal}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Histogram</div>
                <div className="font-semibold text-green-400">+{INDICATORS.macd.histogram}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400">Stochastic %K</div>
                <div className="font-semibold">{INDICATORS.stochastic.k}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Stochastic %D</div>
                <div className="font-semibold">{INDICATORS.stochastic.d}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-400">ADX</div>
                <div className="font-semibold">{INDICATORS.adx.adx}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">+DI</div>
                <div className="font-semibold text-green-400">{INDICATORS.adx.plusDI}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">-DI</div>
                <div className="font-semibold text-red-400">{INDICATORS.adx.minusDI}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">VWAP</div>
              <div className="font-semibold">{INDICATORS.vwap}</div>
            </div>
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">Support & Resistance</h3>
          <div className="space-y-2">
            {SR_LEVELS.map((level, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dark-bg">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${level.type === 'resistance' ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                    {level.type === 'resistance' ? 'R' : 'S'}
                  </span>
                  <span className="font-semibold">{level.price.toFixed(2)}</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className={`w-2 h-2 rounded-full ${j < level.strength ? (level.type === 'resistance' ? 'bg-red-400' : 'bg-green-400') : 'bg-dark-border'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fibonacci */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">Fibonacci Retracement</h3>
          <div className="space-y-2">
            {FIBONACCI.map((f) => (
              <div key={f.level} className="flex justify-between items-center p-2">
                <span className="text-gray-400 text-sm">{f.level}</span>
                <div className="flex-1 mx-4 h-px bg-dark-border relative">
                  {Math.abs(f.price - 1150) < 30 && (
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-primary-400 rounded-full" />
                  )}
                </div>
                <span className="font-semibold text-sm">{f.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pattern Detection */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4">Pattern Detection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PATTERNS.map((p, i) => (
            <div key={i} className={`p-4 rounded-lg border ${p.type === 'bullish' ? 'border-green-800/50 bg-green-900/20' : p.type === 'bearish' ? 'border-red-800/50 bg-red-900/20' : 'border-dark-border bg-dark-bg'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{p.pattern}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${p.type === 'bullish' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {p.type.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-400">{p.description}</p>
              <div className="mt-2 text-sm">
                Confidence: <span className="font-semibold text-primary-400">{p.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
