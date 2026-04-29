'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: Record<string, unknown>;
}

const EXAMPLE_QUERIES = [
  'Should I buy NABIL?',
  'Analyze NICA stock',
  'Best stock for swing trading?',
  'Show breakout stocks',
  'What is the market sentiment?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to NEPSE Smart Assistant! I can help you with stock analysis, trading signals, and market insights. Try asking me about a specific stock or trading strategy.',
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Simulated response
    const symbolMatch = input.match(/\b([A-Z]{2,10})\b/);
    let response: Message;

    if (symbolMatch) {
      const symbol = symbolMatch[1];
      response = {
        role: 'assistant',
        content: `**${symbol} Analysis:**\n\n` +
          `📊 **Signal: BUY** (Confidence: 72.5%)\n` +
          `📈 Score: 68.3/100 | Risk: MEDIUM\n\n` +
          `**Key Indicators:**\n` +
          `• RSI (14): 42.5 — Approaching oversold\n` +
          `• MACD: Bullish crossover confirmed\n` +
          `• SMA 20/50: Golden cross active\n` +
          `• Volume: 1.8x above average\n\n` +
          `**Support:** Rs. 1,120 | **Resistance:** Rs. 1,180\n\n` +
          `**Recommendation:** Consider accumulating in small quantities with stop-loss at Rs. 1,100.\n\n` +
          `⚠️ *This is not financial advice. Always do your own research.*`,
      };
    } else if (input.toLowerCase().includes('swing') || input.toLowerCase().includes('best')) {
      response = {
        role: 'assistant',
        content: `**Top Swing Trading Candidates:**\n\n` +
          `1. **UPPER** — Score: 78, BUY (75% confidence)\n` +
          `2. **CHCL** — Score: 72, BUY (68% confidence)\n` +
          `3. **SHIVM** — Score: 70, BUY (65% confidence)\n` +
          `4. **SBL** — Score: 68, BUY (62% confidence)\n` +
          `5. **NABIL** — Score: 65, BUY (60% confidence)\n\n` +
          `These stocks show strong momentum with volume confirmation. Consider your risk tolerance and portfolio allocation.\n\n` +
          `⚠️ *These picks are system-generated for educational purposes only.*`,
      };
    } else if (input.toLowerCase().includes('sentiment') || input.toLowerCase().includes('market')) {
      response = {
        role: 'assistant',
        content: `**Market Sentiment Analysis:**\n\n` +
          `📊 Overall: **SLIGHTLY BULLISH**\n\n` +
          `• Positive news: 3 articles\n` +
          `• Negative news: 2 articles\n` +
          `• Neutral news: 1 article\n\n` +
          `**Key Highlights:**\n` +
          `• Banking sector showing strong earnings growth\n` +
          `• Hydropower sector benefiting from favorable conditions\n` +
          `• NRB monetary policy tightening creating some headwinds\n\n` +
          `NEPSE Index: 2,285.50 (+0.67%)`,
      };
    } else {
      response = {
        role: 'assistant',
        content: `I can help you with:\n\n` +
          `• **Stock Analysis**: "Should I buy NABIL?" or "Analyze NICA"\n` +
          `• **Trading Picks**: "Best stock for swing trading?"\n` +
          `• **Market Overview**: "What is the market sentiment?"\n` +
          `• **Breakout Stocks**: "Show breakout stocks"\n\n` +
          `Try asking me one of these questions!`,
      };
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, response]);
    }, 500);

    setInput('');
  };

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
        </div>

        {/* Input */}
        <div className="p-4 border-t border-dark-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about a stock, strategy, or market..."
              className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-500"
            />
            <button
              onClick={handleSend}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
