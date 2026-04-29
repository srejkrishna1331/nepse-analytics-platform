'use client';

import { useState } from 'react';

const NEWS = [
  { id: 1, title: 'NABIL Bank Reports Record Quarterly Profit', source: 'ShareSansar', date: '2026-04-28', sentiment: 'positive', score: 0.85, symbols: ['NABIL'], summary: 'Nabil Bank Limited has reported a record quarterly profit of Rs 2.5 billion for Q3 FY2026, driven by strong lending growth and improved asset quality.' },
  { id: 2, title: 'NIC Asia Expands Branch Network', source: 'MeroLagani', date: '2026-04-27', sentiment: 'positive', score: 0.72, symbols: ['NICA'], summary: 'NIC Asia Bank has opened 5 new branches across Nepal, expanding its reach to remote areas and targeting financial inclusion.' },
  { id: 3, title: 'Nepal Rastra Bank Tightens Monetary Policy', source: 'Nepali Times', date: '2026-04-26', sentiment: 'negative', score: -0.45, symbols: ['NABIL', 'NICA', 'GBIME', 'SBL', 'HBL'], summary: 'NRB has announced tighter monetary policy measures including higher CRR requirements and lending rate caps affecting the banking sector.' },
  { id: 4, title: 'Hydropower Sector Shows Strong Growth', source: 'ShareSansar', date: '2026-04-25', sentiment: 'positive', score: 0.68, symbols: ['NHPC', 'CHCL', 'BPCL', 'UPPER'], summary: 'Hydropower companies report increased generation capacity and revenue growth due to favorable monsoon conditions.' },
  { id: 5, title: 'SEBON Introduces New Margin Lending Rules', source: 'MeroLagani', date: '2026-04-24', sentiment: 'neutral', score: 0.1, symbols: [], summary: 'Securities Board of Nepal has introduced new margin lending regulations aimed at reducing market volatility and protecting retail investors.' },
  { id: 6, title: 'Insurance Sector Faces Regulatory Headwinds', source: 'Nepali Times', date: '2026-04-23', sentiment: 'negative', score: -0.35, symbols: ['NLIC', 'ALICL'], summary: 'New regulatory requirements for insurance companies may impact profitability in the short term as companies need to increase capital reserves.' },
];

export default function NewsPage() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? NEWS : NEWS.filter(n => n.sentiment === filter);

  const sentimentCounts = {
    positive: NEWS.filter(n => n.sentiment === 'positive').length,
    negative: NEWS.filter(n => n.sentiment === 'negative').length,
    neutral: NEWS.filter(n => n.sentiment === 'neutral').length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">News & Sentiment</h1>

      {/* Market Sentiment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card border border-green-800/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{sentimentCounts.positive}</div>
          <div className="text-sm text-gray-400">Positive</div>
        </div>
        <div className="bg-dark-card border border-red-800/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{sentimentCounts.negative}</div>
          <div className="text-sm text-gray-400">Negative</div>
        </div>
        <div className="bg-dark-card border border-yellow-800/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{sentimentCounts.neutral}</div>
          <div className="text-sm text-gray-400">Neutral</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'positive', 'negative', 'neutral'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filtered.map((article) => (
          <div key={article.id} className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-primary-500/30 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{article.summary}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-gray-500">{article.source}</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-500">{article.date}</span>
                  {article.symbols.length > 0 && (
                    <>
                      <span className="text-gray-600">|</span>
                      <div className="flex gap-1">
                        {article.symbols.map(s => (
                          <span key={s} className="bg-primary-900/30 text-primary-400 px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className={`flex-shrink-0 px-3 py-1 rounded-lg text-sm font-semibold ${
                article.sentiment === 'positive' ? 'bg-green-900/30 text-green-400 border border-green-800/30' :
                article.sentiment === 'negative' ? 'bg-red-900/30 text-red-400 border border-red-800/30' :
                'bg-yellow-900/30 text-yellow-400 border border-yellow-800/30'
              }`}>
                {article.sentiment.toUpperCase()}
                <div className="text-xs mt-0.5 text-center">{article.score > 0 ? '+' : ''}{article.score.toFixed(2)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
