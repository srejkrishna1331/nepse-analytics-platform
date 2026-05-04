'use client';

import { useMemo } from 'react';
import { LiveStock, LiveIndex } from '@/lib/api';
import { useMarketWebSocket } from '@/hooks/useMarketWebSocket';

interface StockData {
  symbol: string;
  name: string;
  sector: string;
  close: number;
  change: number;
  change_percent: number;
  volume: number;
  turnover: number;
}

interface IndexData {
  name: string;
  value: number;
  change: number;
  change_percent: number;
}

const SAMPLE_STOCKS: StockData[] = [
  { symbol: 'NABIL', name: 'Nabil Bank Limited', sector: 'Commercial Banks', close: 1150, change: 8, change_percent: 0.70, volume: 250000, turnover: 287500000 },
  { symbol: 'NICA', name: 'NIC Asia Bank Limited', sector: 'Commercial Banks', close: 930, change: 5, change_percent: 0.54, volume: 190000, turnover: 176700000 },
  { symbol: 'GBIME', name: 'Global IME Bank Limited', sector: 'Commercial Banks', close: 285, change: -2, change_percent: -0.70, volume: 150000, turnover: 42750000 },
  { symbol: 'SBL', name: 'Siddhartha Bank Limited', sector: 'Commercial Banks', close: 310, change: 4, change_percent: 1.31, volume: 120000, turnover: 37200000 },
  { symbol: 'UPPER', name: 'Upper Tamakoshi Hydropower', sector: 'Hydro Power', close: 490, change: 12, change_percent: 2.51, volume: 300000, turnover: 147000000 },
  { symbol: 'NLIC', name: 'Nepal Life Insurance', sector: 'Life Insurance', close: 820, change: -5, change_percent: -0.61, volume: 80000, turnover: 65600000 },
  { symbol: 'CHCL', name: 'Chilime Hydro Power', sector: 'Hydro Power', close: 540, change: 8, change_percent: 1.50, volume: 95000, turnover: 51300000 },
  { symbol: 'NTC', name: 'Nepal Telecom', sector: 'Others', close: 680, change: -3, change_percent: -0.44, volume: 60000, turnover: 40800000 },
];

const SAMPLE_INDICES: IndexData[] = [
  { name: 'NEPSE', value: 2285.50, change: 15.30, change_percent: 0.67 },
  { name: 'SENSITIVE', value: 432.15, change: 2.85, change_percent: 0.66 },
  { name: 'FLOAT', value: 178.40, change: 1.20, change_percent: 0.68 },
  { name: 'BANKING', value: 1820.30, change: 12.50, change_percent: 0.69 },
];

const SECTORS = [
  { name: 'Commercial Banks', change: 1.2, turnover: 2.8, color: 'bg-green-500' },
  { name: 'Hydro Power', change: 2.1, turnover: 1.5, color: 'bg-green-600' },
  { name: 'Life Insurance', change: -0.5, turnover: 0.8, color: 'bg-red-500' },
  { name: 'Development Banks', change: 0.3, turnover: 0.6, color: 'bg-green-400' },
  { name: 'Microfinance', change: -1.2, turnover: 0.4, color: 'bg-red-600' },
  { name: 'Non Life Insurance', change: 0.8, turnover: 0.5, color: 'bg-green-400' },
  { name: 'Manufacturing', change: 1.5, turnover: 0.3, color: 'bg-green-500' },
  { name: 'Hotels', change: -0.2, turnover: 0.2, color: 'bg-red-400' },
];

function formatNum(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

function liveStockToStockData(s: LiveStock): StockData {
  return {
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    close: s.close,
    change: s.change,
    change_percent: s.changePercent,
    volume: s.volume,
    turnover: s.turnover,
  };
}

function liveIndexToIndexData(i: LiveIndex): IndexData {
  return {
    name: i.index,
    value: i.currentValue,
    change: i.change,
    change_percent: i.changePercent,
  };
}

export default function Dashboard() {
  const ws = useMarketWebSocket();

  const stocks = useMemo<StockData[]>(() => {
    if (ws.stocks && ws.stocks.data.length > 0) {
      return ws.stocks.data.map(liveStockToStockData);
    }
    return SAMPLE_STOCKS;
  }, [ws.stocks]);

  const indices = useMemo<IndexData[]>(() => {
    if (ws.indices.length > 0) {
      return ws.indices.map(liveIndexToIndexData);
    }
    return SAMPLE_INDICES;
  }, [ws.indices]);

  const isLive = ws.isLive;
  const lastUpdated = ws.lastUpdated;
  const marketOpen = ws.marketOpen;

  const gainers = [...stocks].filter(s => s.change > 0).sort((a, b) => b.change_percent - a.change_percent);
  const losers = [...stocks].filter(s => s.change < 0).sort((a, b) => a.change_percent - b.change_percent);

  const totalTurnover = stocks.reduce((sum, s) => sum + s.turnover, 0);
  const totalVolume = stocks.reduce((sum, s) => sum + s.volume, 0);
  const advances = stocks.filter(s => s.change > 0).length;
  const declines = stocks.filter(s => s.change < 0).length;

  return (
    <div className="space-y-6">
      {/* Live Data Indicator */}
      {isLive && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className={`w-2 h-2 rounded-full ${ws.isWsConnected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
          <span>{ws.isWsConnected ? 'Live (WebSocket)' : 'Live (Polling)'}</span>
          {marketOpen !== null && (
            <span className={`px-2 py-0.5 rounded text-xs ${marketOpen ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              Market {marketOpen ? 'Open' : 'Closed'}
            </span>
          )}
          {lastUpdated && (
            <span>| Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
        </div>
      )}

      {/* Market Indices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((idx) => (
          <div key={idx.name} className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="text-sm text-gray-400">{idx.name}</div>
            <div className="text-2xl font-bold mt-1">{idx.value.toFixed(2)}</div>
            <div className={`text-sm mt-1 ${idx.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({idx.change >= 0 ? '+' : ''}{idx.change_percent.toFixed(2)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Market Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Total Turnover</h3>
          <div className="text-xl font-bold">Rs. {formatNum(totalTurnover)}</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Total Volume</h3>
          <div className="text-xl font-bold">{formatNum(totalVolume)}</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Advances / Declines</h3>
          <div className="text-xl font-bold">
            <span className="text-green-400">{advances}</span>
            <span className="text-gray-500 mx-2">/</span>
            <span className="text-red-400">{declines}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4 text-green-400">Top Gainers</h3>
          <div className="space-y-2">
            {gainers.slice(0, 10).map((s) => (
              <div key={s.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-dark-border/30">
                <div>
                  <div className="font-semibold text-sm">{s.symbol}</div>
                  <div className="text-xs text-gray-500">{s.sector}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{s.close.toFixed(2)}</div>
                  <div className="text-xs text-green-400">+{s.change_percent.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4 text-red-400">Top Losers</h3>
          <div className="space-y-2">
            {losers.slice(0, 10).map((s) => (
              <div key={s.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-dark-border/30">
                <div>
                  <div className="font-semibold text-sm">{s.symbol}</div>
                  <div className="text-xs text-gray-500">{s.sector}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{s.close.toFixed(2)}</div>
                  <div className="text-xs text-red-400">{s.change_percent.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sector Heatmap */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4">Sector Heatmap</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SECTORS.map((sector) => (
            <div
              key={sector.name}
              className={`p-4 rounded-lg ${
                sector.change >= 0 ? 'bg-green-900/30 border border-green-800/50' : 'bg-red-900/30 border border-red-800/50'
              }`}
            >
              <div className="text-sm font-medium truncate">{sector.name}</div>
              <div className={`text-lg font-bold ${sector.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">Rs. {sector.turnover.toFixed(1)}B</div>
            </div>
          ))}
        </div>
      </div>

      {/* Volume Leaders */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4">Volume Leaders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-dark-border">
                <th className="text-left py-2 px-3">Symbol</th>
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-right py-2 px-3">LTP</th>
                <th className="text-right py-2 px-3">Change</th>
                <th className="text-right py-2 px-3">Volume</th>
                <th className="text-right py-2 px-3">Turnover</th>
              </tr>
            </thead>
            <tbody>
              {[...stocks].sort((a, b) => b.volume - a.volume).slice(0, 20).map((s) => (
                <tr key={s.symbol} className="border-b border-dark-border/30 hover:bg-dark-border/20">
                  <td className="py-2 px-3 font-semibold text-primary-400">{s.symbol}</td>
                  <td className="py-2 px-3 text-gray-300">{s.name}</td>
                  <td className="py-2 px-3 text-right">{s.close.toFixed(2)}</td>
                  <td className={`py-2 px-3 text-right ${s.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {s.change >= 0 ? '+' : ''}{s.change_percent.toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-right">{formatNum(s.volume)}</td>
                  <td className="py-2 px-3 text-right">Rs. {formatNum(s.turnover)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Disclaimer */}
      <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl p-4 text-sm text-yellow-200/70">
        <strong>Disclaimer:</strong> This platform provides analytical tools and signals for educational purposes only.
        All trading decisions are made at your own risk. Past performance does not guarantee future results.
        Always conduct your own research before making investment decisions.
      </div>
    </div>
  );
}
