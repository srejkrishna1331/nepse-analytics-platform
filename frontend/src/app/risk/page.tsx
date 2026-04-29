'use client';

import { useState, useMemo } from 'react';

export default function RiskManagementPage() {
  // Position Sizing Calculator
  const [accountSize, setAccountSize] = useState(1000000);
  const [riskPercent, setRiskPercent] = useState(2);
  const [entryPrice, setEntryPrice] = useState(1150);
  const [stopLoss, setStopLoss] = useState(1120);
  const [takeProfit, setTakeProfit] = useState(1210);

  const calculations = useMemo(() => {
    const riskAmount = accountSize * (riskPercent / 100);
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    const rewardPerShare = Math.abs(takeProfit - entryPrice);
    const positionSize = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
    const totalInvestment = positionSize * entryPrice;
    const potentialLoss = positionSize * riskPerShare;
    const potentialProfit = positionSize * rewardPerShare;
    const riskRewardRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;
    const maxPositionPct = accountSize > 0 ? (totalInvestment / accountSize) * 100 : 0;
    const breakevenPct = entryPrice > 0 ? (riskPerShare / entryPrice) * 100 : 0;

    return {
      riskAmount,
      riskPerShare,
      rewardPerShare,
      positionSize,
      totalInvestment,
      potentialLoss,
      potentialProfit,
      riskRewardRatio,
      maxPositionPct,
      breakevenPct,
    };
  }, [accountSize, riskPercent, entryPrice, stopLoss, takeProfit]);

  const rrColor = calculations.riskRewardRatio >= 3 ? 'text-green-400' :
    calculations.riskRewardRatio >= 2 ? 'text-blue-400' :
    calculations.riskRewardRatio >= 1 ? 'text-yellow-400' : 'text-red-400';

  const rrLabel = calculations.riskRewardRatio >= 3 ? 'Excellent' :
    calculations.riskRewardRatio >= 2 ? 'Good' :
    calculations.riskRewardRatio >= 1 ? 'Acceptable' : 'Poor';

  // Risk rules
  const rules = [
    { rule: 'Single Position Risk', value: `${riskPercent}%`, limit: '≤ 2%', status: riskPercent <= 2 },
    { rule: 'Position Size vs Portfolio', value: `${calculations.maxPositionPct.toFixed(1)}%`, limit: '≤ 20%', status: calculations.maxPositionPct <= 20 },
    { rule: 'Risk-Reward Ratio', value: `${calculations.riskRewardRatio.toFixed(2)}`, limit: '≥ 2.0', status: calculations.riskRewardRatio >= 2 },
    { rule: 'Max Drawdown (recommended)', value: '—', limit: '≤ 6%', status: true },
    { rule: 'Max Correlated Positions', value: '—', limit: '≤ 3', status: true },
  ];

  // Scenario analysis
  const scenarios = [
    { name: 'Best Case (TP hit)', pnl: calculations.potentialProfit, pct: entryPrice > 0 ? (calculations.potentialProfit / calculations.totalInvestment) * 100 : 0 },
    { name: 'Worst Case (SL hit)', pnl: -calculations.potentialLoss, pct: entryPrice > 0 ? (-calculations.potentialLoss / calculations.totalInvestment) * 100 : 0 },
    { name: 'Half Position Close', pnl: calculations.potentialProfit / 2, pct: entryPrice > 0 ? ((calculations.potentialProfit / 2) / calculations.totalInvestment) * 100 : 0 },
    { name: 'Trailing Stop (1.5R)', pnl: calculations.riskPerShare * 1.5 * calculations.positionSize, pct: entryPrice > 0 ? ((calculations.riskPerShare * 1.5 * calculations.positionSize) / calculations.totalInvestment) * 100 : 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Risk Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold">Position Sizing Calculator</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Account Size (Rs.)</label>
            <input
              type="number"
              value={accountSize}
              onChange={(e) => setAccountSize(Number(e.target.value))}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Risk Per Trade (%)</label>
            <input
              type="number"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              step="0.5"
              min="0.5"
              max="10"
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
            />
            <div className="mt-1 h-2 bg-dark-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${riskPercent <= 2 ? 'bg-green-500' : riskPercent <= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(riskPercent * 10, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Entry Price</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Stop Loss</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-red-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Take Profit</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(Number(e.target.value))}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-green-400"
              />
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold">Calculated Results</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-sm text-gray-400">Position Size</div>
              <div className="text-2xl font-bold text-white">{calculations.positionSize} shares</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-sm text-gray-400">Total Investment</div>
              <div className="text-2xl font-bold text-white">Rs. {calculations.totalInvestment.toLocaleString()}</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-sm text-gray-400">Risk Amount</div>
              <div className="text-xl font-bold text-red-400">Rs. {calculations.riskAmount.toLocaleString()}</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-sm text-gray-400">Risk-Reward Ratio</div>
              <div className={`text-xl font-bold ${rrColor}`}>
                1 : {calculations.riskRewardRatio.toFixed(2)}
              </div>
              <div className={`text-xs ${rrColor}`}>{rrLabel}</div>
            </div>
          </div>

          {/* Risk-Reward Visual */}
          <div className="bg-dark-bg rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-2">Risk vs Reward Visualization</div>
            <div className="flex items-center gap-1 h-8">
              <div className="bg-red-500/30 border border-red-500 rounded-l-lg h-full flex items-center justify-center text-xs text-red-400 px-2"
                   style={{ width: `${100 / (1 + calculations.riskRewardRatio)}%`, minWidth: '60px' }}>
                -Rs. {calculations.potentialLoss.toLocaleString()}
              </div>
              <div className="bg-green-500/30 border border-green-500 rounded-r-lg h-full flex items-center justify-center text-xs text-green-400 px-2"
                   style={{ width: `${(100 * calculations.riskRewardRatio) / (1 + calculations.riskRewardRatio)}%`, minWidth: '60px' }}>
                +Rs. {calculations.potentialProfit.toLocaleString()}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>SL: Rs. {stopLoss}</span>
              <span>Entry: Rs. {entryPrice}</span>
              <span>TP: Rs. {takeProfit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Rules */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4">Risk Rules Compliance</h3>
        <div className="space-y-2">
          {rules.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-dark-bg">
              <span className="text-sm text-white">{r.rule}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Current: <span className="text-white font-medium">{r.value}</span></span>
                <span className="text-sm text-gray-400">Limit: <span className="text-white">{r.limit}</span></span>
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                  r.status ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                }`}>
                  {r.status ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario Analysis */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4">Scenario Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenarios.map((s, i) => (
            <div key={i} className={`rounded-lg p-3 border ${
              s.pnl >= 0 ? 'bg-green-900/10 border-green-800/30' : 'bg-red-900/10 border-red-800/30'
            }`}>
              <div className="text-xs text-gray-400 mb-1">{s.name}</div>
              <div className={`text-lg font-bold ${s.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {s.pnl >= 0 ? '+' : ''}Rs. {Math.abs(s.pnl).toLocaleString()}
              </div>
              <div className={`text-sm ${s.pnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {s.pnl >= 0 ? '+' : ''}{s.pct.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kelly Criterion */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-3">Kelly Criterion Estimate</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-bg rounded-lg p-3">
            <div className="text-sm text-gray-400">Assumed Win Rate</div>
            <div className="text-xl font-bold text-white">55%</div>
          </div>
          <div className="bg-dark-bg rounded-lg p-3">
            <div className="text-sm text-gray-400">Kelly % (Full)</div>
            <div className="text-xl font-bold text-blue-400">
              {((0.55 - (0.45 / calculations.riskRewardRatio)) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-dark-bg rounded-lg p-3">
            <div className="text-sm text-gray-400">Half Kelly (Recommended)</div>
            <div className="text-xl font-bold text-green-400">
              {(((0.55 - (0.45 / calculations.riskRewardRatio)) * 100) / 2).toFixed(1)}%
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Kelly Criterion: f* = (p × b - q) / b, where p = win rate, q = 1-p, b = reward/risk ratio. Half Kelly is recommended for practical risk management.
        </p>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
        <strong className="text-yellow-400">Risk Disclaimer:</strong>
        <span className="text-sm text-gray-400 ml-2">
          Position sizing calculations are for educational purposes. Always use stop losses and never risk more than you can afford to lose. Past performance is not indicative of future results.
        </span>
      </div>
    </div>
  );
}
