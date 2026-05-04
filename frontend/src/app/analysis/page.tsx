'use client';

import { useState, useCallback, useEffect } from 'react';
import { fetchAnalysis, AnalysisResponse } from '@/lib/api';

const STATIC_INDICATORS = {
  sma: { 20: 0, 50: 0 },
  ema: { 12: 0, 26: 0 },
  rsi: 50,
  macd: { line: 0, signal: 0, histogram: 0 },
  bollingerBands: { upper: 0, middle: 0, lower: 0, percentB: 0.5 },
  stochastic: { k: 50, d: 50 },
  adx: { adx: 0, plusDI: 0, minusDI: 0 },
  vwap: 0,
};

export default function AnalysisPage() {
  const [symbol, setSymbol] = useState('NABIL');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = useCallback(async (sym: string) => {
    if (!sym.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnalysis(sym.trim());
      setAnalysis(data);
    } catch {
      setError(`Could not load analysis for ${sym}. Market data may be unavailable.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnalysis(symbol); }, []);

  const ind = analysis?.indicators ?? STATIC_INDICATORS;
  const price = analysis?.price ?? 0;
  const srLevels = analysis?.supportResistance ?? [];

  // Compute fibonacci from price range
  const fibHigh = analysis ? Math.max(analysis.high, price * 1.05) : 1280;
  const fibLow = analysis ? Math.min(analysis.low, price * 0.85) : 980;
  const fibRange = fibHigh - fibLow;
  const FIBONACCI = [
    { level: '0.0%', price: fibHigh },
    { level: '23.6%', price: fibHigh - fibRange * 0.236 },
    { level: '38.2%', price: fibHigh - fibRange * 0.382 },
    { level: '50.0%', price: fibHigh - fibRange * 0.5 },
    { level: '61.8%', price: fibHigh - fibRange * 0.618 },
    { level: '78.6%', price: fibHigh - fibRange * 0.786 },
    { level: '100%', price: fibLow },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Technical Analysis</h1>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && loadAnalysis(symbol)}
          className="bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-sm w-32 focus:outline-none focus:border-primary-500"
          placeholder="Symbol"
        />
        <button
          onClick={() => loadAnalysis(symbol)}
          disabled={loading}
          className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {loading ? 'Loading...' : 'Analyze'}
        </button>
        {analysis && (
          <span className="text-sm text-gray-400">
            Rs. {price.toLocaleString()} ({analysis.changePercent > 0 ? '+' : ''}{analysis.changePercent}%)
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-3 text-sm text-red-300">{error}</div>
      )}

      {/* Chart Placeholder */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-3">{analysis?.symbol ?? symbol} - Interactive Chart</h3>
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
            {Object.entries(ind.sma).map(([period, val]) => (
              <div key={`sma-${period}`} className="flex justify-between items-center">
                <span className="text-gray-400">SMA ({period})</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{Number(val).toFixed(2)}</span>
                  {price > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded ${price > Number(val) ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {price > Number(val) ? 'Above' : 'Below'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {Object.entries(ind.ema).map(([period, val]) => (
              <div key={`ema-${period}`} className="flex justify-between items-center">
                <span className="text-gray-400">EMA ({period})</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{Number(val).toFixed(2)}</span>
                  {price > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded ${price > Number(val) ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {price > Number(val) ? 'Above' : 'Below'}
                    </span>
                  )}
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
                <span className="font-semibold">{ind.rsi}</span>
              </div>
              <div className="w-full bg-dark-border rounded-full h-2">
                <div className={`h-2 rounded-full ${ind.rsi > 70 ? 'bg-red-500' : ind.rsi < 30 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${ind.rsi}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Oversold (30)</span><span>Neutral</span><span>Overbought (70)</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-xs text-gray-400">MACD Line</div>
                <div className={`font-semibold ${ind.macd.line >= 0 ? 'text-green-400' : 'text-red-400'}`}>{ind.macd.line}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Signal Line</div>
                <div className="font-semibold">{ind.macd.signal}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Histogram</div>
                <div className={`font-semibold ${ind.macd.histogram >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {ind.macd.histogram >= 0 ? '+' : ''}{ind.macd.histogram}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400">Stochastic %K</div>
                <div className="font-semibold">{ind.stochastic.k}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Stochastic %D</div>
                <div className="font-semibold">{ind.stochastic.d}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-400">ADX</div>
                <div className="font-semibold">{ind.adx.adx}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">+DI</div>
                <div className="font-semibold text-green-400">{ind.adx.plusDI}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">-DI</div>
                <div className="font-semibold text-red-400">{ind.adx.minusDI}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">VWAP</div>
              <div className="font-semibold">{ind.vwap}</div>
            </div>
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">Support & Resistance</h3>
          <div className="space-y-2">
            {srLevels.map((level, i) => (
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
            {srLevels.length === 0 && <p className="text-sm text-gray-500">No data available</p>}
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
                  {price > 0 && Math.abs(f.price - price) < price * 0.02 && (
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-primary-400 rounded-full" />
                  )}
                </div>
                <span className="font-semibold text-sm">{f.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bollinger Bands */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4">Bollinger Bands</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-400">Upper Band</div>
            <div className="font-semibold text-red-400">{ind.bollingerBands.upper.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Middle (SMA 20)</div>
            <div className="font-semibold">{ind.bollingerBands.middle.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Lower Band</div>
            <div className="font-semibold text-green-400">{ind.bollingerBands.lower.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">%B Position</div>
            <div className="font-semibold">{(ind.bollingerBands.percentB * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
