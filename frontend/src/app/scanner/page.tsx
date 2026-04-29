'use client';

import { useState } from 'react';

const SCAN_TYPES = [
  { id: 'swing', label: 'Swing Trading', desc: 'Stocks with strong momentum and high confidence scores' },
  { id: 'breakout', label: 'Breakout Scanner', desc: 'Stocks breaking out with volume confirmation' },
  { id: 'accumulation', label: 'Accumulation', desc: 'Stocks being quietly accumulated by smart money' },
  { id: 'smartmoney', label: 'Smart Money Flow', desc: 'High volume with low price movement detection' },
];

const SCAN_RESULTS = [
  { symbol: 'UPPER', signal: 'BUY', score: 78, confidence: 75, details: { volume_ratio: 2.1, rsi: 45, trend: 'Bullish' } },
  { symbol: 'CHCL', signal: 'BUY', score: 72, confidence: 68, details: { volume_ratio: 1.8, rsi: 42, trend: 'Bullish' } },
  { symbol: 'SHIVM', signal: 'BUY', score: 70, confidence: 65, details: { volume_ratio: 1.9, rsi: 48, trend: 'Bullish' } },
  { symbol: 'SBL', signal: 'BUY', score: 68, confidence: 62, details: { volume_ratio: 1.5, rsi: 52, trend: 'Neutral' } },
  { symbol: 'NABIL', signal: 'BUY', score: 65, confidence: 60, details: { volume_ratio: 1.4, rsi: 58, trend: 'Bullish' } },
];

export default function ScannerPage() {
  const [activeScanner, setActiveScanner] = useState('swing');
  const [scanning, setScanning] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock Scanners</h1>

      {/* Scanner Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SCAN_TYPES.map((scan) => (
          <button
            key={scan.id}
            onClick={() => setActiveScanner(scan.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeScanner === scan.id
                ? 'bg-primary-600/20 border-primary-500/50 text-primary-400'
                : 'bg-dark-card border-dark-border hover:border-dark-border/80'
            }`}
          >
            <div className="font-semibold text-sm">{scan.label}</div>
            <div className="text-xs text-gray-400 mt-1">{scan.desc}</div>
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {SCAN_TYPES.find(s => s.id === activeScanner)?.label} Results
          </h3>
          <span className="text-sm text-gray-400">{SCAN_RESULTS.length} matches found</span>
        </div>

        <div className="space-y-3">
          {SCAN_RESULTS.map((result, i) => (
            <div key={i} className="p-4 rounded-lg bg-dark-bg border border-dark-border/50 hover:border-primary-500/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-primary-400">{result.symbol}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    result.signal === 'BUY' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {result.signal}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Score</div>
                    <div className="font-bold">{result.score}/100</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Confidence</div>
                    <div className="font-bold text-primary-400">{result.confidence}%</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-400">
                <span>Vol Ratio: <span className="text-white font-medium">{result.details.volume_ratio}x</span></span>
                <span>RSI: <span className="text-white font-medium">{result.details.rsi}</span></span>
                <span>Trend: <span className={`font-medium ${result.details.trend === 'Bullish' ? 'text-green-400' : 'text-yellow-400'}`}>{result.details.trend}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
