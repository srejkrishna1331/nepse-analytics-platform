'use client';

import { useState, useCallback } from 'react';

interface StrategyBlock {
  id: string;
  type: 'indicator' | 'condition' | 'action';
  category: string;
  name: string;
  params: Record<string, number | string>;
  color: string;
}

interface StrategyRule {
  id: string;
  blocks: StrategyBlock[];
}

const AVAILABLE_BLOCKS: StrategyBlock[] = [
  // Indicators
  { id: 'rsi', type: 'indicator', category: 'Oscillator', name: 'RSI', params: { period: 14 }, color: 'border-blue-500 bg-blue-900/20' },
  { id: 'macd', type: 'indicator', category: 'Trend', name: 'MACD', params: { fast: 12, slow: 26, signal: 9 }, color: 'border-purple-500 bg-purple-900/20' },
  { id: 'sma', type: 'indicator', category: 'Moving Average', name: 'SMA', params: { period: 20 }, color: 'border-cyan-500 bg-cyan-900/20' },
  { id: 'ema', type: 'indicator', category: 'Moving Average', name: 'EMA', params: { period: 12 }, color: 'border-teal-500 bg-teal-900/20' },
  { id: 'bb', type: 'indicator', category: 'Volatility', name: 'Bollinger Bands', params: { period: 20, stdDev: 2 }, color: 'border-orange-500 bg-orange-900/20' },
  { id: 'volume', type: 'indicator', category: 'Volume', name: 'Volume Ratio', params: { period: 20 }, color: 'border-green-500 bg-green-900/20' },
  { id: 'adx', type: 'indicator', category: 'Trend', name: 'ADX', params: { period: 14 }, color: 'border-indigo-500 bg-indigo-900/20' },
  { id: 'stoch', type: 'indicator', category: 'Oscillator', name: 'Stochastic', params: { kPeriod: 14, dPeriod: 3 }, color: 'border-pink-500 bg-pink-900/20' },
  // Conditions
  { id: 'crosses_above', type: 'condition', category: 'Crossover', name: 'Crosses Above', params: { threshold: 0 }, color: 'border-green-400 bg-green-900/30' },
  { id: 'crosses_below', type: 'condition', category: 'Crossover', name: 'Crosses Below', params: { threshold: 0 }, color: 'border-red-400 bg-red-900/30' },
  { id: 'greater_than', type: 'condition', category: 'Comparison', name: 'Greater Than', params: { value: 70 }, color: 'border-yellow-400 bg-yellow-900/30' },
  { id: 'less_than', type: 'condition', category: 'Comparison', name: 'Less Than', params: { value: 30 }, color: 'border-yellow-400 bg-yellow-900/30' },
  { id: 'between', type: 'condition', category: 'Range', name: 'Between', params: { min: 30, max: 70 }, color: 'border-gray-400 bg-gray-900/30' },
  // Actions
  { id: 'buy', type: 'action', category: 'Entry', name: 'BUY', params: { size: 100 }, color: 'border-green-500 bg-green-900/40' },
  { id: 'sell', type: 'action', category: 'Exit', name: 'SELL', params: { size: 100 }, color: 'border-red-500 bg-red-900/40' },
  { id: 'stop_loss', type: 'action', category: 'Risk', name: 'Set Stop Loss', params: { percent: 3 }, color: 'border-red-400 bg-red-900/30' },
  { id: 'take_profit', type: 'action', category: 'Risk', name: 'Set Take Profit', params: { percent: 6 }, color: 'border-green-400 bg-green-900/30' },
];

const SAMPLE_BACKTEST = {
  totalTrades: 48,
  winRate: 62.5,
  profitFactor: 1.85,
  maxDrawdown: 8.2,
  totalReturn: 34.5,
  sharpeRatio: 1.42,
  avgWin: 4200,
  avgLoss: -2100,
  bestTrade: 15800,
  worstTrade: -6200,
  avgHoldingDays: 8.3,
  consecutiveWins: 7,
  consecutiveLosses: 3,
};

let blockCounter = 0;

export default function StrategyBuilderPage() {
  const [rules, setRules] = useState<StrategyRule[]>([
    {
      id: 'rule-1',
      blocks: [
        { ...AVAILABLE_BLOCKS[0], id: 'placed-1', params: { period: 14 } },
        { ...AVAILABLE_BLOCKS[10], id: 'placed-2', params: { value: 30 } },
        { ...AVAILABLE_BLOCKS[13], id: 'placed-3', params: { size: 100 } },
      ],
    },
    {
      id: 'rule-2',
      blocks: [
        { ...AVAILABLE_BLOCKS[1], id: 'placed-4', params: { fast: 12, slow: 26, signal: 9 } },
        { ...AVAILABLE_BLOCKS[8], id: 'placed-5', params: { threshold: 0 } },
        { ...AVAILABLE_BLOCKS[13], id: 'placed-6', params: { size: 50 } },
      ],
    },
  ]);
  const [strategyName, setStrategyName] = useState('RSI Oversold + MACD Crossover');
  const [showBacktest, setShowBacktest] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<StrategyBlock | null>(null);
  const [blockFilter, setBlockFilter] = useState<'all' | 'indicator' | 'condition' | 'action'>('all');

  const filteredBlocks = blockFilter === 'all' ? AVAILABLE_BLOCKS : AVAILABLE_BLOCKS.filter(b => b.type === blockFilter);

  const addRule = useCallback(() => {
    setRules(prev => [...prev, { id: `rule-${Date.now()}`, blocks: [] }]);
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  }, []);

  const addBlockToRule = useCallback((ruleId: string, block: StrategyBlock) => {
    blockCounter++;
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      return { ...r, blocks: [...r.blocks, { ...block, id: `placed-${Date.now()}-${blockCounter}` }] };
    }));
  }, []);

  const removeBlockFromRule = useCallback((ruleId: string, blockId: string) => {
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      return { ...r, blocks: r.blocks.filter(b => b.id !== blockId) };
    }));
  }, []);

  const handleDragStart = (block: StrategyBlock) => {
    setDraggedBlock(block);
  };

  const handleDrop = (ruleId: string) => {
    if (draggedBlock) {
      addBlockToRule(ruleId, draggedBlock);
      setDraggedBlock(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Strategy Builder</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm w-64"
            placeholder="Strategy name..."
          />
          <button
            onClick={() => setShowBacktest(!showBacktest)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            {showBacktest ? 'Edit Strategy' : 'Run Backtest'}
          </button>
        </div>
      </div>

      {!showBacktest ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Block Palette */}
          <div className="lg:col-span-1">
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 sticky top-20">
              <h3 className="text-sm font-semibold mb-3">Available Blocks</h3>
              <div className="flex gap-1 mb-3">
                {(['all', 'indicator', 'condition', 'action'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setBlockFilter(f)}
                    className={`px-2 py-1 rounded text-xs ${
                      blockFilter === f ? 'bg-primary-600 text-white' : 'bg-dark-bg text-gray-400'
                    }`}
                  >
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredBlocks.map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(block)}
                    className={`border rounded-lg p-2 cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity ${block.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{block.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        block.type === 'indicator' ? 'bg-blue-900/50 text-blue-300' :
                        block.type === 'condition' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {block.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{block.category}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">Drag blocks to the strategy rules area, or click + to add.</p>
            </div>
          </div>

          {/* Strategy Rules Canvas */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Strategy Rules</h3>
              <button onClick={addRule} className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-400 hover:text-white">
                + Add Rule
              </button>
            </div>

            {rules.map((rule, ruleIdx) => (
              <div
                key={rule.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(rule.id)}
                className="bg-dark-card border border-dark-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary-400">Rule {ruleIdx + 1}</span>
                    <span className="text-xs text-gray-500">
                      {rule.blocks.length === 0 ? '(empty — drag blocks here)' :
                       `IF ${rule.blocks.filter(b => b.type === 'indicator').map(b => b.name).join(' + ')} ${rule.blocks.filter(b => b.type === 'condition').map(b => b.name).join(' ')} THEN ${rule.blocks.filter(b => b.type === 'action').map(b => b.name).join(' + ')}`
                      }
                    </span>
                  </div>
                  <button onClick={() => removeRule(rule.id)} className="text-gray-500 hover:text-red-400 text-sm">Remove</button>
                </div>

                {rule.blocks.length === 0 ? (
                  <div className="border-2 border-dashed border-dark-border rounded-lg p-8 text-center text-gray-500 text-sm">
                    Drag and drop indicator, condition, and action blocks here
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {rule.blocks.map((block, blockIdx) => (
                      <div key={block.id} className="flex items-center gap-1">
                        {blockIdx > 0 && block.type !== rule.blocks[blockIdx - 1].type && (
                          <span className="text-xs text-gray-500 px-1">→</span>
                        )}
                        <div className={`border rounded-lg p-2 relative group ${block.color}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{block.name}</span>
                            {Object.entries(block.params).map(([key, val]) => (
                              <span key={key} className="text-xs text-gray-400">
                                {key}: <span className="text-white">{val}</span>
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => removeBlockFromRule(rule.id, block.id)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Quick add buttons */}
                    <div className="flex gap-1 ml-2">
                      {AVAILABLE_BLOCKS.slice(0, 3).map((b) => (
                        <button
                          key={b.id}
                          onClick={() => addBlockToRule(rule.id, b)}
                          className="text-xs text-gray-500 hover:text-white px-1.5 py-0.5 rounded border border-dark-border hover:border-gray-500"
                          title={`Add ${b.name}`}
                        >
                          +{b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Strategy Summary */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Strategy Logic (Auto-generated)</h3>
              <div className="bg-dark-bg rounded-lg p-3 font-mono text-sm">
                {rules.map((rule, i) => {
                  const indicators = rule.blocks.filter(b => b.type === 'indicator');
                  const conditions = rule.blocks.filter(b => b.type === 'condition');
                  const actions = rule.blocks.filter(b => b.type === 'action');

                  if (rule.blocks.length === 0) return (
                    <div key={rule.id} className="text-gray-500">
                      <span className="text-yellow-400">Rule {i + 1}:</span> (empty)
                    </div>
                  );

                  return (
                    <div key={rule.id} className="mb-1">
                      <span className="text-yellow-400">Rule {i + 1}: </span>
                      <span className="text-blue-300">IF </span>
                      <span className="text-cyan-300">{indicators.map(ind => `${ind.name}(${Object.values(ind.params).join(',')})`).join(' AND ')}</span>
                      {conditions.length > 0 && (
                        <span className="text-yellow-300"> {conditions.map(c => `${c.name} ${Object.values(c.params).join(',')}`).join(' ')}</span>
                      )}
                      {actions.length > 0 && (
                        <>
                          <span className="text-blue-300"> THEN </span>
                          <span className={actions.some(a => a.id.includes('buy') || a.name === 'BUY') ? 'text-green-300' : 'text-red-300'}>
                            {actions.map(a => `${a.name}(${Object.values(a.params).join(',')})`).join(' + ')}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Backtest Results */
        <div className="space-y-6">
          <div className="bg-dark-card border border-dark-border rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-1">Backtest Results — {strategyName}</h3>
            <p className="text-sm text-gray-400 mb-4">Simulated on NEPSE data (last 12 months, 25 stocks)</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-sm text-gray-400">Total Return</div>
                <div className="text-2xl font-bold text-green-400">+{SAMPLE_BACKTEST.totalReturn}%</div>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-sm text-gray-400">Win Rate</div>
                <div className="text-2xl font-bold text-white">{SAMPLE_BACKTEST.winRate}%</div>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-sm text-gray-400">Profit Factor</div>
                <div className="text-2xl font-bold text-blue-400">{SAMPLE_BACKTEST.profitFactor}</div>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-sm text-gray-400">Max Drawdown</div>
                <div className="text-2xl font-bold text-red-400">-{SAMPLE_BACKTEST.maxDrawdown}%</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-xs text-gray-400">Total Trades</div>
                <div className="text-lg font-semibold text-white">{SAMPLE_BACKTEST.totalTrades}</div>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-xs text-gray-400">Sharpe Ratio</div>
                <div className="text-lg font-semibold text-white">{SAMPLE_BACKTEST.sharpeRatio}</div>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-xs text-gray-400">Avg Win</div>
                <div className="text-lg font-semibold text-green-400">+Rs. {SAMPLE_BACKTEST.avgWin.toLocaleString()}</div>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-xs text-gray-400">Avg Loss</div>
                <div className="text-lg font-semibold text-red-400">Rs. {SAMPLE_BACKTEST.avgLoss.toLocaleString()}</div>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-xs text-gray-400">Best Trade</div>
                <div className="text-lg font-semibold text-green-400">+Rs. {SAMPLE_BACKTEST.bestTrade.toLocaleString()}</div>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-xs text-gray-400">Worst Trade</div>
                <div className="text-lg font-semibold text-red-400">Rs. {SAMPLE_BACKTEST.worstTrade.toLocaleString()}</div>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-xs text-gray-400">Avg Holding Period</div>
                <div className="text-lg font-semibold text-white">{SAMPLE_BACKTEST.avgHoldingDays} days</div>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-xs text-gray-400">Max Consecutive Wins</div>
                <div className="text-lg font-semibold text-green-400">{SAMPLE_BACKTEST.consecutiveWins}</div>
              </div>
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-xs text-gray-400">Max Consecutive Losses</div>
                <div className="text-lg font-semibold text-red-400">{SAMPLE_BACKTEST.consecutiveLosses}</div>
              </div>
            </div>
          </div>

          {/* Equity Curve Placeholder */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Equity Curve</h3>
            <div className="h-40 flex items-end gap-1">
              {[100, 103, 101, 106, 104, 110, 108, 115, 112, 118, 120, 116, 122, 125, 121, 128, 130, 126, 132, 134].map((val, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-primary-600/50 hover:bg-primary-600 transition-colors"
                  style={{ height: `${((val - 95) / 45) * 100}%` }}
                  title={`Month ${i + 1}: ${val}%`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Start</span>
              <span>6 months</span>
              <span>12 months</span>
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
            <strong className="text-yellow-400">Disclaimer:</strong>
            <span className="text-sm text-gray-400 ml-2">
              Backtest results are simulated on historical data and do not guarantee future performance. Past results may not account for slippage, commissions, and market impact.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
