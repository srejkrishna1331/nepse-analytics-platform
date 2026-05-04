'use client';

import { useMemo } from 'react';
import { useMarketWebSocket } from '@/hooks/useMarketWebSocket';

interface Holding {
  symbol: string;
  name: string;
  sector: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
}

const STATIC_HOLDINGS: Holding[] = [
  { symbol: 'NABIL', name: 'Nabil Bank Limited', sector: 'Commercial Banks', qty: 100, avgPrice: 1050, currentPrice: 1150 },
  { symbol: 'NICA', name: 'NIC Asia Bank Limited', sector: 'Commercial Banks', qty: 200, avgPrice: 880, currentPrice: 930 },
  { symbol: 'UPPER', name: 'Upper Tamakoshi', sector: 'Hydro Power', qty: 150, avgPrice: 450, currentPrice: 490 },
  { symbol: 'NLIC', name: 'Nepal Life Insurance', sector: 'Life Insurance', qty: 50, avgPrice: 850, currentPrice: 820 },
];

const TRANSACTIONS = [
  { date: '2026-04-28', symbol: 'NABIL', type: 'BUY', qty: 50, price: 1142, amount: 57100 },
  { date: '2026-04-25', symbol: 'UPPER', type: 'BUY', qty: 100, price: 478, amount: 47800 },
  { date: '2026-04-22', symbol: 'NICA', type: 'BUY', qty: 100, price: 905, amount: 90500 },
  { date: '2026-04-20', symbol: 'NLIC', type: 'SELL', qty: 30, price: 835, amount: 25050 },
];

function formatCurrency(n: number): string {
  return `Rs. ${n.toLocaleString()}`;
}

export default function PortfolioPage() {
  const ws = useMarketWebSocket();

  // Merge live prices into holdings
  const holdings = useMemo(() => {
    return STATIC_HOLDINGS.map((h) => {
      let livePrice = h.currentPrice;
      if (ws.stocks && ws.stocks.data.length > 0) {
        const liveStock = ws.stocks.data.find((s) => s.symbol === h.symbol);
        if (liveStock && liveStock.close > 0) {
          livePrice = liveStock.close;
        }
      }
      const invested = h.qty * h.avgPrice;
      const currentValue = h.qty * livePrice;
      const pl = currentValue - invested;
      const plPct = invested > 0 ? (pl / invested) * 100 : 0;
      return { ...h, currentPrice: livePrice, invested, currentValue, pl, plPct };
    });
  }, [ws.stocks]);

  const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);
  const totalCurrent = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalPL = totalCurrent - totalInvested;
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  const sectors: Record<string, number> = {};
  holdings.forEach(h => { sectors[h.sector] = (sectors[h.sector] || 0) + h.currentValue; });

  const isLive = ws.isLive;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        {isLive && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className={`w-2 h-2 rounded-full ${ws.isWsConnected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
            {ws.isWsConnected ? 'Live (WebSocket)' : 'Live (Polling)'}
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="text-sm text-gray-400">Total Invested</div>
          <div className="text-xl font-bold mt-1">{formatCurrency(totalInvested)}</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="text-sm text-gray-400">Current Value</div>
          <div className="text-xl font-bold mt-1">{formatCurrency(totalCurrent)}</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="text-sm text-gray-400">Total P/L</div>
          <div className={`text-xl font-bold mt-1 ${totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}
          </div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="text-sm text-gray-400">Returns</div>
          <div className={`text-xl font-bold mt-1 ${totalPLPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPLPct >= 0 ? '+' : ''}{totalPLPct.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">Holdings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-dark-border">
                  <th className="text-left py-2 px-3">Symbol</th>
                  <th className="text-right py-2 px-3">Qty</th>
                  <th className="text-right py-2 px-3">Avg Price</th>
                  <th className="text-right py-2 px-3">LTP</th>
                  <th className="text-right py-2 px-3">P/L</th>
                  <th className="text-right py-2 px-3">P/L %</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.symbol} className="border-b border-dark-border/30 hover:bg-dark-border/20">
                    <td className="py-2 px-3">
                      <div className="font-bold text-primary-400">{h.symbol}</div>
                      <div className="text-xs text-gray-500">{h.sector}</div>
                    </td>
                    <td className="py-2 px-3 text-right">{h.qty}</td>
                    <td className="py-2 px-3 text-right">{h.avgPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-semibold">{h.currentPrice.toFixed(2)}</td>
                    <td className={`py-2 px-3 text-right font-semibold ${h.pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {h.pl >= 0 ? '+' : ''}{formatCurrency(h.pl)}
                    </td>
                    <td className={`py-2 px-3 text-right ${h.plPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {h.plPct >= 0 ? '+' : ''}{h.plPct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">Sector Allocation</h3>
          <div className="space-y-3">
            {Object.entries(sectors).sort((a, b) => b[1] - a[1]).map(([sector, value]) => {
              const pct = (value / totalCurrent) * 100;
              return (
                <div key={sector}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{sector}</span>
                    <span>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-dark-border rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-dark-border">
              <th className="text-left py-2 px-3">Date</th>
              <th className="text-left py-2 px-3">Symbol</th>
              <th className="text-center py-2 px-3">Type</th>
              <th className="text-right py-2 px-3">Qty</th>
              <th className="text-right py-2 px-3">Price</th>
              <th className="text-right py-2 px-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map((t, i) => (
              <tr key={i} className="border-b border-dark-border/30">
                <td className="py-2 px-3 text-gray-400">{t.date}</td>
                <td className="py-2 px-3 font-bold text-primary-400">{t.symbol}</td>
                <td className="py-2 px-3 text-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.type === 'BUY' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {t.type}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">{t.qty}</td>
                <td className="py-2 px-3 text-right">{t.price.toFixed(2)}</td>
                <td className="py-2 px-3 text-right">{formatCurrency(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
