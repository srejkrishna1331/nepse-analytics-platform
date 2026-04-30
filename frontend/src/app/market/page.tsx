'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchLiveMarket, LiveStock } from '@/lib/api';

interface MarketStock {
  symbol: string;
  name: string;
  sector: string;
  ltp: number;
  change: number;
  pct: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
  prevClose: number;
}

const SAMPLE_STOCKS: MarketStock[] = [
  { symbol: 'NABIL', name: 'Nabil Bank Limited', sector: 'Commercial Banks', ltp: 1150, change: 8, pct: 0.70, high: 1155, low: 1138, volume: 250000, turnover: 287500000, prevClose: 1142 },
  { symbol: 'NICA', name: 'NIC Asia Bank Limited', sector: 'Commercial Banks', ltp: 930, change: 5, pct: 0.54, high: 935, low: 920, volume: 190000, turnover: 176700000, prevClose: 925 },
  { symbol: 'GBIME', name: 'Global IME Bank Limited', sector: 'Commercial Banks', ltp: 285, change: -2, pct: -0.70, high: 290, low: 282, volume: 150000, turnover: 42750000, prevClose: 287 },
  { symbol: 'SBL', name: 'Siddhartha Bank Limited', sector: 'Commercial Banks', ltp: 310, change: 4, pct: 1.31, high: 315, low: 305, volume: 120000, turnover: 37200000, prevClose: 306 },
  { symbol: 'HBL', name: 'Himalayan Bank Limited', sector: 'Commercial Banks', ltp: 420, change: -3, pct: -0.71, high: 425, low: 418, volume: 85000, turnover: 35700000, prevClose: 423 },
  { symbol: 'UPPER', name: 'Upper Tamakoshi Hydropower', sector: 'Hydro Power', ltp: 490, change: 12, pct: 2.51, high: 498, low: 478, volume: 300000, turnover: 147000000, prevClose: 478 },
  { symbol: 'NLIC', name: 'Nepal Life Insurance', sector: 'Life Insurance', ltp: 820, change: -5, pct: -0.61, high: 830, low: 815, volume: 80000, turnover: 65600000, prevClose: 825 },
  { symbol: 'CHCL', name: 'Chilime Hydro Power', sector: 'Hydro Power', ltp: 540, change: 8, pct: 1.50, high: 545, low: 530, volume: 95000, turnover: 51300000, prevClose: 532 },
  { symbol: 'NTC', name: 'Nepal Telecom', sector: 'Others', ltp: 680, change: -3, pct: -0.44, high: 688, low: 675, volume: 60000, turnover: 40800000, prevClose: 683 },
  { symbol: 'SHIVM', name: 'Shivam Cements Limited', sector: 'Manufacturing', ltp: 520, change: 15, pct: 2.97, high: 525, low: 505, volume: 45000, turnover: 23400000, prevClose: 505 },
];

function formatNum(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

function liveToMarketStock(s: LiveStock): MarketStock {
  return {
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    ltp: s.close,
    change: s.change,
    pct: s.changePercent,
    high: s.high,
    low: s.low,
    volume: s.volume,
    turnover: s.turnover,
    prevClose: s.previousClose,
  };
}

export default function MarketPage() {
  const [stocks, setStocks] = useState<MarketStock[]>(SAMPLE_STOCKS);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [isLive, setIsLive] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchLiveMarket();
      if (res.data.length > 0) {
        setStocks(res.data.map(liveToMarketStock));
        setIsLive(true);
      }
    } catch {
      // Fall back to sample data
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const sectors = ['All', ...Array.from(new Set(stocks.map(s => s.sector)))];
  const filtered = stocks.filter(s => {
    const matchSearch = s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase());
    const matchSector = sectorFilter === 'All' || s.sector === sectorFilter;
    return matchSearch && matchSector;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Market Overview</h1>
        {isLive && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search stocks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:border-primary-500"
        />
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-500"
        >
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-400 self-center">{filtered.length} stocks</span>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-border/30 text-gray-400">
                <th className="text-left py-3 px-4">Symbol</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Sector</th>
                <th className="text-right py-3 px-4">LTP</th>
                <th className="text-right py-3 px-4">Change</th>
                <th className="text-right py-3 px-4">% Change</th>
                <th className="text-right py-3 px-4">High</th>
                <th className="text-right py-3 px-4">Low</th>
                <th className="text-right py-3 px-4">Volume</th>
                <th className="text-right py-3 px-4">Turnover</th>
                <th className="text-right py-3 px-4">Prev Close</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.symbol} className="border-t border-dark-border/30 hover:bg-dark-border/20 cursor-pointer">
                  <td className="py-3 px-4 font-bold text-primary-400">{s.symbol}</td>
                  <td className="py-3 px-4 text-gray-300">{s.name}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{s.sector}</td>
                  <td className="py-3 px-4 text-right font-semibold">{s.ltp.toFixed(2)}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${s.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}
                  </td>
                  <td className={`py-3 px-4 text-right ${s.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-right text-gray-300">{s.high.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-300">{s.low.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">{formatNum(s.volume)}</td>
                  <td className="py-3 px-4 text-right text-gray-300">Rs. {formatNum(s.turnover)}</td>
                  <td className="py-3 px-4 text-right text-gray-400">{s.prevClose.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
