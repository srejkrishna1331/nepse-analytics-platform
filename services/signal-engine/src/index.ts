import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { Pool } from 'pg';
import {
  evaluateRSI,
  evaluateMACD,
  evaluateBollinger,
  evaluateSMACrossover,
  evaluateVolume,
  evaluateADX,
} from './rules/signal-rules';
import { calculateSignalScore } from './scoring/score-calculator';

const app = express();
const PORT = parseInt(process.env.SIGNAL_ENGINE_PORT || '3003');

const TA_SERVICE = process.env.TECHNICAL_ANALYSIS_URL || 'http://technical-analysis:3002';
const MARKET_SERVICE = process.env.MARKET_DATA_URL || 'http://market-data:3001';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'nepse_user',
  password: process.env.POSTGRES_PASSWORD || 'change_me_in_production',
  database: process.env.POSTGRES_DB || 'nepse_analytics',
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'signal-engine' });
});

// Generate signal for a stock
app.get('/api/signal/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    // Fetch indicators from TA service
    const [taResponse, srResponse] = await Promise.all([
      axios.get(`${TA_SERVICE}/api/indicators/${symbol}?days=365`),
      axios.get(`${TA_SERVICE}/api/support-resistance/${symbol}`),
    ]);

    const { indicators } = taResponse.data;
    const { levels: srLevels } = srResponse.data;

    // Get latest values
    const rsi = indicators.rsi;
    const macd = indicators.macd;
    const bb = indicators.bollingerBands;
    const sma = indicators.sma;
    const adx = indicators.adx;
    const vwap = indicators.vwap;

    if (!rsi.length || !macd.macdLine.length) {
      return res.status(400).json({ error: 'Insufficient data for signal generation' });
    }

    // Get OHLC for volume analysis
    const ohlcResponse = await axios.get(`${MARKET_SERVICE}/api/stocks/${symbol}/ohlc?days=30`);
    const ohlcData = ohlcResponse.data;

    const lastRSI = rsi[rsi.length - 1];
    const lastMACD = macd.macdLine[macd.macdLine.length - 1];
    const lastSignal = macd.signalLine[macd.signalLine.length - 1];
    const lastHistogram = macd.histogram[macd.histogram.length - 1];
    const prevHistogram = macd.histogram.length > 1 ? macd.histogram[macd.histogram.length - 2] : 0;

    const lastUpper = bb.upper[bb.upper.length - 1];
    const lastLower = bb.lower[bb.lower.length - 1];
    const lastMiddle = bb.middle[bb.middle.length - 1];

    const lastClose = ohlcData.length > 0 ? Number(ohlcData[0].close) : 0;
    const prevClose = ohlcData.length > 1 ? Number(ohlcData[1].close) : lastClose;

    const lastVolume = ohlcData.length > 0 ? Number(ohlcData[0].volume) : 0;
    const avgVolume = ohlcData.slice(0, 20).reduce((s: number, d: { volume: number }) => s + Number(d.volume), 0) / Math.min(20, ohlcData.length);

    const shortSMA = sma['20']?.length > 0 ? sma['20'][sma['20'].length - 1] : lastClose;
    const longSMA = sma['50']?.length > 0 ? sma['50'][sma['50'].length - 1] : lastClose;
    const prevShortSMA = sma['20']?.length > 1 ? sma['20'][sma['20'].length - 2] : shortSMA;
    const prevLongSMA = sma['50']?.length > 1 ? sma['50'][sma['50'].length - 2] : longSMA;

    const lastADX = adx.adx.length > 0 ? adx.adx[adx.adx.length - 1] : 0;
    const lastPlusDI = adx.plusDI.length > 0 ? adx.plusDI[adx.plusDI.length - 1] : 0;
    const lastMinusDI = adx.minusDI.length > 0 ? adx.minusDI[adx.minusDI.length - 1] : 0;

    const supports = srLevels.filter((l: { type: string }) => l.type === 'support').map((l: { price: number }) => l.price);
    const resistances = srLevels.filter((l: { type: string }) => l.type === 'resistance').map((l: { price: number }) => l.price);

    // Evaluate all rules
    const signals = [
      evaluateRSI(lastRSI),
      evaluateMACD(lastMACD, lastSignal, lastHistogram, prevHistogram),
      evaluateBollinger(lastClose, lastUpper, lastLower, lastMiddle),
      evaluateSMACrossover(shortSMA, longSMA, prevShortSMA, prevLongSMA),
      evaluateVolume(lastVolume, avgVolume, lastClose - prevClose),
      evaluateADX(lastADX, lastPlusDI, lastMinusDI),
    ];

    // Calculate final signal
    const result = calculateSignalScore(signals);

    // Log signal to database
    const stockResult = await pool.query('SELECT id FROM stocks WHERE symbol = $1', [symbol.toUpperCase()]);
    if (stockResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO signals_log (stock_id, signal, confidence, score, risk_level, reasoning, indicators)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          stockResult.rows[0].id,
          result.signal,
          result.confidence,
          result.score,
          result.riskLevel,
          JSON.stringify(result.reasoning),
          JSON.stringify(result.indicators),
        ]
      );
    }

    res.json({
      symbol: symbol.toUpperCase(),
      ...result,
      disclaimer: 'This signal is for educational purposes only. Always conduct your own research before making investment decisions.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error generating signal:', err);
    res.status(500).json({ error: 'Failed to generate signal' });
  }
});

// Scan all stocks for signals
app.get('/api/scan/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const stocksResult = await pool.query('SELECT symbol FROM stocks WHERE active = true ORDER BY symbol');
    const symbols = stocksResult.rows.map((r: { symbol: string }) => r.symbol);

    const results = [];

    for (const symbol of symbols.slice(0, 25)) {
      try {
        const signalResponse = await axios.get(`http://localhost:${PORT}/api/signal/${symbol}`);
        const signal = signalResponse.data;

        let include = false;
        switch (type) {
          case 'swing':
            include = signal.score > 60 && signal.confidence > 50;
            break;
          case 'breakout':
            include = signal.indicators.some((i: { name: string; signal: string }) =>
              i.name === 'Volume' && i.signal === 'BUY'
            );
            break;
          case 'accumulation':
            include = signal.indicators.some((i: { name: string; value: number }) =>
              i.name === 'Volume' && i.value > 1.5
            ) && signal.score > 45 && signal.score < 60;
            break;
          case 'smartmoney':
            include = signal.indicators.some((i: { name: string; value: number }) =>
              i.name === 'Volume' && i.value > 2
            );
            break;
          default:
            include = signal.signal === 'BUY';
        }

        if (include) {
          results.push(signal);
        }
      } catch {
        // Skip stocks with insufficient data
      }
    }

    results.sort((a, b) => b.score - a.score);

    res.json({
      scannerType: type,
      results,
      totalScanned: symbols.length,
      matchCount: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Scanner error:', err);
    res.status(500).json({ error: 'Scanner failed' });
  }
});

// Smart assistant endpoint
app.post('/api/assistant', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Extract stock symbol from query
    const symbolMatch = query.match(/\b([A-Z]{2,10})\b/);
    let response: Record<string, unknown> = {};

    if (symbolMatch) {
      const symbol = symbolMatch[1];
      try {
        const signalResponse = await axios.get(`http://localhost:${PORT}/api/signal/${symbol}`);
        const signal = signalResponse.data;

        response = {
          type: 'stock_analysis',
          symbol,
          analysis: {
            signal: signal.signal,
            confidence: signal.confidence,
            score: signal.score,
            riskLevel: signal.riskLevel,
            reasoning: signal.reasoning,
          },
          recommendation: generateRecommendation(signal),
          riskWarning: 'Trading involves significant risk. Never invest more than you can afford to lose.',
        };
      } catch {
        response = {
          type: 'info',
          message: `Unable to analyze ${symbol}. The stock may not exist in our database or have sufficient data.`,
        };
      }
    } else if (query.toLowerCase().includes('swing') || query.toLowerCase().includes('best stock')) {
      const scanResponse = await axios.get(`http://localhost:${PORT}/api/scan/swing`);
      const topStocks = scanResponse.data.results.slice(0, 5);

      response = {
        type: 'scanner_results',
        title: 'Top Swing Trading Candidates',
        stocks: topStocks.map((s: { symbol: string; signal: string; confidence: number; score: number }) => ({
          symbol: s.symbol,
          signal: s.signal,
          confidence: s.confidence,
          score: s.score,
        })),
        riskWarning: 'These are system-generated picks for educational purposes only.',
      };
    } else {
      response = {
        type: 'help',
        message: 'I can help with stock analysis. Try asking: "Should I buy NABIL?" or "Best stock for swing trading?"',
        examples: [
          'Should I buy NABIL?',
          'Analyze NICA',
          'Best stock for swing trading?',
          'Show breakout stocks',
        ],
      };
    }

    res.json(response);
  } catch (err) {
    console.error('Assistant error:', err);
    res.status(500).json({ error: 'Assistant unavailable' });
  }
});

function generateRecommendation(signal: {
  signal: string;
  confidence: number;
  score: number;
  riskLevel: string;
}): string {
  const { signal: sig, confidence, riskLevel } = signal;

  if (sig === 'BUY' && confidence > 70) {
    return `Strong BUY signal with ${confidence}% confidence. Consider entering a position with proper stop-loss.`;
  }
  if (sig === 'BUY') {
    return `Moderate BUY signal. Consider accumulating in small quantities. Risk: ${riskLevel}.`;
  }
  if (sig === 'SELL' && confidence > 70) {
    return `Strong SELL signal. Consider booking profits or setting tight stop-losses.`;
  }
  if (sig === 'SELL') {
    return `Moderate SELL pressure detected. Exercise caution. Risk: ${riskLevel}.`;
  }
  return `HOLD - No clear directional bias. Wait for a clearer setup before entering.`;
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Signal Engine running on port ${PORT}`);
});

export default app;
