'use client';

import { useState, useCallback } from 'react';
import { fetchScan, ScanResult } from '@/lib/api';

const SCAN_TYPES = [
  { id: 'swing', label: 'Swing Trading', desc: 'Stocks with strong momentum and high confidence scores' },
  { id: 'breakout', label: 'Breakout Scanner', desc: 'Stocks breaking out with volume confirmation' },
  { id: 'accumulation', label: 'Accumulation', desc: 'Stocks being quietly accumulated by smart money' },
  { id: 'smartmoney', label: 'Smart Money Flow', desc: 'High volume with low price movement detection' },
];

export default function ScannerPage() {
  const [activeScanner, setActiveScanner] = useState('swing');
  const [results, setResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);

  const runScan = useCallback(async (type: string) => {
    setActiveScanner(type);
    setScanning(true);
    setError(null);
    try {
      const data = await fetchScan(type);
      setResults(data.results);
      setResultCount(data.count);
    } catch {
      setError('Could not run scanner. Market data may be unavailable.');
      setResults([]);
      setResultCount(0);
    } finally {
      setScanning(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock Scanners</h1>

      {/* Scanner Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SCAN_TYPES.map((scan) => (
          <button
            key={scan.id}
            onClick={() => runScan(scan.id)}
            disabled={scanning}
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

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-3 text-sm text-red-300">{error}</div>
      )}

      {/* Results */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {SCAN_TYPES.find(s => s.id === activeScanner)?.label} Results
          </h3>
          <div className="flex items-center gap-3">
            {scanning && <span className="text-sm text-yellow-400 animate-pulse">Scanning...</span>}
            <span className="text-sm text-gray-400">{resultCount} matches found</span>
          </div>
        </div>

        {results.length === 0 && !scanning && (
          <div className="text-center text-gray-500 py-8">
            Click a scanner type above to scan the market
          </div>
        )}

        <div className="space-y-3">
          {results.map((result, i) => (
            <div key={i} className="p-4 rounded-lg bg-dark-bg border border-dark-border/50 hover:border-primary-500/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-primary-400">{result.symbol}</span>
                  <span className="text-xs text-gray-500">{result.name}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    result.signal === 'BUY' ? 'bg-green-900/50 text-green-400' : result.signal === 'SELL' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'
                  }`}>
                    {result.signal}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Price</div>
                    <div className="font-semibold">Rs. {result.price.toLocaleString()}</div>
                  </div>
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
                <span>Sector: <span className="text-white font-medium">{result.sector}</span></span>
                <span>Change: <span className={`font-medium ${result.changePercent > 0 ? 'text-green-400' : result.changePercent < 0 ? 'text-red-400' : 'text-yellow-400'}`}>{result.changePercent > 0 ? '+' : ''}{result.changePercent}%</span></span>
                <span>Vol: <span className="text-white font-medium">{result.details.volume.toLocaleString()}</span></span>
                <span>RSI: <span className="text-white font-medium">{result.details.rsi}</span></span>
                <span>Trend: <span className={`font-medium ${result.details.trend === 'Bullish' || result.details.trend === 'Breakout' ? 'text-green-400' : 'text-yellow-400'}`}>{result.details.trend}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
