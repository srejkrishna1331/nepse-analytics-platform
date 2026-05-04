'use client';

import { useState, useCallback } from 'react';
import { fetchSignal, SignalResponse } from '@/lib/api';

const SAMPLE_SIGNAL: SignalResponse = {
  symbol: 'NABIL',
  price: 0,
  signal: 'HOLD',
  confidence: 0,
  score: 50,
  riskLevel: 'MEDIUM',
  reasoning: ['Enter a stock symbol and click Generate Signal'],
  indicators: [],
};

export default function SignalsPage() {
  const [symbol, setSymbol] = useState('NABIL');
  const [signal, setSignal] = useState<SignalResponse>(SAMPLE_SIGNAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSignal = useCallback(async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSignal(symbol.trim());
      setSignal(data);
    } catch (err) {
      setError(`Could not generate signal for ${symbol}. Market data may be unavailable.`);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const signalColor = signal.signal === 'BUY' ? 'green' : signal.signal === 'SELL' ? 'red' : 'yellow';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Signal Engine</h1>
        <div className="flex gap-2">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && generateSignal()}
            className="bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-sm w-32 focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={generateSignal}
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {loading ? 'Analyzing...' : 'Generate Signal'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-3 text-sm text-red-300">{error}</div>
      )}

      {/* Signal Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`bg-dark-card border rounded-xl p-6 text-center border-${signalColor}-800/50`}>
          <div className="text-sm text-gray-400 mb-2">Signal</div>
          <div className={`text-4xl font-bold text-${signalColor}-400`}>{signal.signal}</div>
          {signal.price > 0 && <div className="text-xs text-gray-500 mt-1">Rs. {signal.price.toLocaleString()}</div>}
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 text-center">
          <div className="text-sm text-gray-400 mb-2">Confidence</div>
          <div className="text-4xl font-bold text-primary-400">{signal.confidence}%</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 text-center">
          <div className="text-sm text-gray-400 mb-2">Score</div>
          <div className="text-4xl font-bold">{signal.score}</div>
          <div className="text-xs text-gray-500">out of 100</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 text-center">
          <div className="text-sm text-gray-400 mb-2">Risk Level</div>
          <div className={`text-2xl font-bold ${signal.riskLevel === 'LOW' ? 'text-green-400' : signal.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'}`}>
            {signal.riskLevel}
          </div>
        </div>
      </div>

      {/* Score Gauge */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Signal Score Breakdown</h3>
        <div className="w-full bg-dark-border rounded-full h-4 mb-2">
          <div
            className={`h-4 rounded-full ${signal.score > 60 ? 'bg-green-500' : signal.score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${signal.score}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Strong Sell (0)</span>
          <span>Neutral (50)</span>
          <span>Strong Buy (100)</span>
        </div>
      </div>

      {/* Indicator Signals */}
      {signal.indicators.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">Individual Indicator Signals</h3>
          <div className="space-y-3">
            {signal.indicators.map((ind, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-dark-bg">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${ind.signal === 'BUY' ? 'bg-green-400' : ind.signal === 'SELL' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                  <span className="font-medium">{ind.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">{ind.reason}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${ind.signal === 'BUY' ? 'bg-green-900/50 text-green-400' : ind.signal === 'SELL' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                    {ind.signal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4">Signal Reasoning</h3>
        <div className="space-y-2">
          {signal.reasoning.map((reason, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 ${reason.includes('[BUY]') ? 'text-green-400' : reason.includes('[SELL]') ? 'text-red-400' : 'text-yellow-400'}`}>
                {reason.includes('[BUY]') ? '▲' : reason.includes('[SELL]') ? '▼' : '●'}
              </span>
              <span className="text-gray-300">{reason.replace(/\[(BUY|SELL|HOLD)\]\s*/, '')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl p-4 text-sm text-yellow-200/70">
        <strong>Disclaimer:</strong> Signals are generated by algorithmic analysis for educational purposes only.
        Always conduct your own research and consider consulting a financial advisor before making investment decisions.
        Past signal accuracy does not guarantee future results.
      </div>
    </div>
  );
}
