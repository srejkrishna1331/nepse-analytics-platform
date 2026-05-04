'use client';

import { useState, useCallback } from 'react';
import { fetchSignal, fetchScan, SignalResponse } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const EXAMPLE_QUERIES = [
  'Should I buy NABIL?',
  'Analyze NICA stock',
  'Best stock for swing trading?',
  'Show breakout stocks',
  'What is the market sentiment?',
];

function formatSignalResponse(data: SignalResponse): string {
  const emoji = data.signal === 'BUY' ? '📈' : data.signal === 'SELL' ? '📉' : '📊';
  let msg = `**${data.symbol} Analysis** (Rs. ${data.price.toLocaleString()}):\n\n`;
  msg += `${emoji} **Signal: ${data.signal}** (Confidence: ${data.confidence}%)\n`;
  msg += `📊 Score: ${data.score}/100 | Risk: ${data.riskLevel}\n\n`;
  msg += `**Key Indicators:**\n`;
  for (const ind of data.indicators) {
    const icon = ind.signal === 'BUY' ? '▲' : ind.signal === 'SELL' ? '▼' : '●';
    msg += `${icon} ${ind.name}: ${ind.reason}\n`;
  }
  msg += `\n**Reasoning:**\n`;
  for (const r of data.reasoning) {
    msg += `• ${r.replace(/\[(BUY|SELL|HOLD)\]\s*/, '')}\n`;
  }
  msg += `\n⚠️ *This is algorithmic analysis for educational purposes only. Not financial advice.*`;
  return msg;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to NEPSE Smart Assistant! I analyze stocks using real market data. Try asking about a specific stock or trading strategy.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');

    const userMessage: Message = { role: 'user', content: userText };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Extract stock symbol from query
      const symbolMatch = userText.match(/\b([A-Z]{2,10})\b/);
      const lowerText = userText.toLowerCase();

      if (symbolMatch && (lowerText.includes('buy') || lowerText.includes('sell') || lowerText.includes('analyze') || lowerText.includes('signal'))) {
        const symbol = symbolMatch[1];
        try {
          const data = await fetchSignal(symbol);
          const content = formatSignalResponse(data);
          setMessages((prev) => [...prev, { role: 'assistant', content }]);
        } catch {
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: `Could not fetch live data for **${symbol}**. The market may be closed or data is unavailable.\n\nNEPSE trading hours: Sun-Thu 11:00-15:00 NPT. Try again during market hours for live analysis.`,
          }]);
        }
      } else if (lowerText.includes('swing') || lowerText.includes('best')) {
        try {
          const data = await fetchScan('swing');
          if (data.results.length > 0) {
            let msg = `**Top Swing Trading Candidates** (${data.count} matches):\n\n`;
            data.results.slice(0, 5).forEach((r, i) => {
              msg += `${i + 1}. **${r.symbol}** — Rs. ${r.price.toLocaleString()} (${r.changePercent > 0 ? '+' : ''}${r.changePercent}%) | Score: ${r.score} | ${r.details.trend}\n`;
            });
            msg += `\n⚠️ *System-generated picks based on live data. Not financial advice.*`;
            setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
          } else {
            setMessages((prev) => [...prev, { role: 'assistant', content: 'No swing trading candidates found. The market may be closed — try during trading hours (Sun-Thu 11:00-15:00 NPT).' }]);
          }
        } catch {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'Could not scan the market. Try again during trading hours.' }]);
        }
      } else if (lowerText.includes('breakout')) {
        try {
          const data = await fetchScan('breakout');
          if (data.results.length > 0) {
            let msg = `**Breakout Scanner Results** (${data.count} stocks):\n\n`;
            data.results.slice(0, 5).forEach((r, i) => {
              msg += `${i + 1}. **${r.symbol}** — Rs. ${r.price.toLocaleString()} (+${r.changePercent}%) | Volume: ${r.details.volume.toLocaleString()}\n`;
            });
            msg += `\n⚠️ *Breakout detection based on live data. Not financial advice.*`;
            setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
          } else {
            setMessages((prev) => [...prev, { role: 'assistant', content: 'No breakout stocks detected right now. Market may be closed.' }]);
          }
        } catch {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'Could not scan for breakouts. Try again during market hours.' }]);
        }
      } else if (lowerText.includes('sentiment') || lowerText.includes('market')) {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: `**Market Sentiment Analysis:**\n\nSentiment data requires real-time news feed integration. Currently, you can check:\n\n• **Dashboard** — Live NEPSE index, top gainers/losers, volume leaders\n• **Scanner** — Run swing, breakout, and accumulation scans\n• **Signals** — Generate signals for specific stocks\n\nNEPSE trading hours: Sun-Thu 11:00-15:00 NPT`,
        }]);
      } else if (symbolMatch) {
        // Just a symbol mentioned without specific action
        try {
          const data = await fetchSignal(symbolMatch[1]);
          const content = formatSignalResponse(data);
          setMessages((prev) => [...prev, { role: 'assistant', content }]);
        } catch {
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: `Could not fetch data for **${symbolMatch[1]}**. Market may be closed.\n\nTry during NEPSE trading hours: Sun-Thu 11:00-15:00 NPT.`,
          }]);
        }
      } else {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: `I can help you with:\n\n• **Stock Analysis**: "Should I buy NABIL?" or "Analyze NICA"\n• **Trading Picks**: "Best stock for swing trading?"\n• **Breakout Stocks**: "Show breakout stocks"\n• **Market Overview**: "What is the market sentiment?"\n\nMention a stock symbol (e.g., NABIL, UPPER, NICA) and I'll fetch live data and generate a signal.`,
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'An error occurred. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Smart Assistant</h1>

      {/* Quick queries */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => setInput(q)}
            className="bg-dark-card border border-dark-border rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-primary-500/50 transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="bg-dark-card border border-dark-border rounded-xl h-[60vh] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-bg border border-dark-border text-gray-300'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-dark-bg border border-dark-border text-gray-400 p-3 rounded-xl text-sm animate-pulse">
                Analyzing...
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-dark-border p-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about a stock or trading strategy..."
            className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
