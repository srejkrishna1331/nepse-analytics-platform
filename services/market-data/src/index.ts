import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { getCached, setCache, CACHE_KEYS, DEFAULT_TTL, EOD_TTL } from './cache/redis-cache';
import { startCronJobs } from './jobs/cron-jobs';
import { marketDataService } from './services/market-data-service';
import { initWebSocketServer, getClientCount } from './ws/websocket-server';

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.MARKET_DATA_PORT || '3001');

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
  res.json({ status: 'ok', service: 'market-data', wsClients: getClientCount() });
});

// Get all stocks with latest prices
app.get('/api/stocks', async (_req, res) => {
  try {
    const cached = await getCached(CACHE_KEYS.ALL_STOCKS);
    if (cached) return res.json(cached);

    const result = await pool.query(`
      SELECT s.*, o.open, o.high, o.low, o.close, o.volume, o.turnover, o.date,
             o.close - LAG(o.close) OVER (PARTITION BY s.id ORDER BY o.date) as change
      FROM stocks s
      LEFT JOIN LATERAL (
        SELECT * FROM ohlc_daily WHERE stock_id = s.id ORDER BY date DESC LIMIT 1
      ) o ON true
      WHERE s.active = true
      ORDER BY s.symbol
    `);

    await setCache(CACHE_KEYS.ALL_STOCKS, result.rows, DEFAULT_TTL * 5);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching stocks:', err);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

// Get OHLC data for a stock
app.get('/api/stocks/:symbol/ohlc', async (req, res) => {
  try {
    const { symbol } = req.params;
    const days = parseInt(req.query.days as string) || 365;
    const cacheKey = CACHE_KEYS.OHLC(symbol, days);

    const cached = await getCached(cacheKey);
    if (cached) return res.json(cached);

    const result = await pool.query(
      `SELECT o.date, o.open, o.high, o.low, o.close, o.volume, o.turnover
       FROM ohlc_daily o
       JOIN stocks s ON s.id = o.stock_id
       WHERE s.symbol = $1
       ORDER BY o.date DESC
       LIMIT $2`,
      [symbol.toUpperCase(), days]
    );

    await setCache(cacheKey, result.rows, EOD_TTL);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching OHLC:', err);
    res.status(500).json({ error: 'Failed to fetch OHLC data' });
  }
});

// Get stock details
app.get('/api/stocks/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = CACHE_KEYS.STOCK_PRICE(symbol);

    const cached = await getCached(cacheKey);
    if (cached) return res.json(cached);

    const result = await pool.query(
      `SELECT s.*, o.open, o.high, o.low, o.close, o.volume, o.turnover, o.date
       FROM stocks s
       LEFT JOIN LATERAL (
         SELECT * FROM ohlc_daily WHERE stock_id = s.id ORDER BY date DESC LIMIT 1
       ) o ON true
       WHERE s.symbol = $1`,
      [symbol.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    await setCache(cacheKey, result.rows[0], DEFAULT_TTL);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
});

// Get market indices
app.get('/api/indices', async (_req, res) => {
  try {
    const cached = await getCached(CACHE_KEYS.INDICES);
    if (cached) return res.json(cached);

    const result = await pool.query(
      `SELECT DISTINCT ON (name) name, date, value, change, change_percent, turnover, volume
       FROM market_indices
       ORDER BY name, date DESC`
    );

    await setCache(CACHE_KEYS.INDICES, result.rows, DEFAULT_TTL * 5);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching indices:', err);
    res.status(500).json({ error: 'Failed to fetch indices' });
  }
});

// Get market summary
app.get('/api/summary', async (_req, res) => {
  try {
    const cached = await getCached(CACHE_KEYS.MARKET_SUMMARY);
    if (cached) return res.json(cached);

    const result = await pool.query(`
      SELECT
        mi.date, mi.value as nepse_index, mi.change, mi.change_percent,
        mi.turnover as total_turnover, mi.volume as total_volume,
        (SELECT COUNT(*) FROM ohlc_daily o JOIN ohlc_daily o2 ON o.stock_id = o2.stock_id
         WHERE o.date = mi.date AND o2.date = mi.date - 1 AND o.close > o2.close) as advances,
        (SELECT COUNT(*) FROM ohlc_daily o JOIN ohlc_daily o2 ON o.stock_id = o2.stock_id
         WHERE o.date = mi.date AND o2.date = mi.date - 1 AND o.close < o2.close) as declines
      FROM market_indices mi
      WHERE mi.name = 'NEPSE'
      ORDER BY mi.date DESC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      await setCache(CACHE_KEYS.MARKET_SUMMARY, result.rows[0], DEFAULT_TTL * 5);
    }
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch market summary' });
  }
});

// Get sector data
app.get('/api/sectors', async (_req, res) => {
  try {
    const cached = await getCached(CACHE_KEYS.SECTORS);
    if (cached) return res.json(cached);

    const result = await pool.query(`
      SELECT s.sector, COUNT(*) as stocks,
             AVG(o.close) as avg_price,
             SUM(o.volume) as total_volume,
             SUM(o.turnover) as total_turnover
      FROM stocks s
      LEFT JOIN LATERAL (
        SELECT * FROM ohlc_daily WHERE stock_id = s.id ORDER BY date DESC LIMIT 1
      ) o ON true
      WHERE s.active = true
      GROUP BY s.sector
      ORDER BY total_turnover DESC NULLS LAST
    `);

    await setCache(CACHE_KEYS.SECTORS, result.rows, DEFAULT_TTL * 10);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sectors:', err);
    res.status(500).json({ error: 'Failed to fetch sectors' });
  }
});

// Get top gainers/losers
app.get('/api/top/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const orderDir = type === 'gainers' ? 'DESC' : 'ASC';

    const result = await pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (stock_id) stock_id, date, close, volume, turnover
        FROM ohlc_daily ORDER BY stock_id, date DESC
      ),
      prev AS (
        SELECT DISTINCT ON (stock_id) stock_id, close as prev_close
        FROM ohlc_daily WHERE date < (SELECT MAX(date) FROM ohlc_daily)
        ORDER BY stock_id, date DESC
      )
      SELECT s.symbol, s.name, s.sector, l.close, l.volume, l.turnover,
             l.close - p.prev_close as change,
             CASE WHEN p.prev_close > 0 THEN ((l.close - p.prev_close) / p.prev_close * 100) ELSE 0 END as change_percent
      FROM latest l
      JOIN stocks s ON s.id = l.stock_id
      LEFT JOIN prev p ON p.stock_id = l.stock_id
      WHERE p.prev_close IS NOT NULL AND p.prev_close > 0
      ORDER BY change_percent ${orderDir}
      LIMIT $1
    `, [limit]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching top stocks:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Get corporate actions
app.get('/api/corporate-actions', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT ca.*, s.symbol, s.name
      FROM corporate_actions ca
      JOIN stocks s ON s.id = ca.stock_id
      ORDER BY ca.book_close_date DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching corporate actions:', err);
    res.status(500).json({ error: 'Failed to fetch corporate actions' });
  }
});

// ---------------------------------------------------------------------------
// Real-time NEPSE Market Data endpoints (fetched from nepalstock.com APIs)
// ---------------------------------------------------------------------------

// GET /api/live — all securities with real-time prices
// (served as /api/market/live through the API Gateway)
app.get('/api/live', async (_req, res) => {
  try {
    const stocks = await marketDataService.getLiveMarket();
    const isOpen = await marketDataService.isMarketOpen();
    res.json({
      marketOpen: isOpen,
      count: stocks.length,
      lastUpdated: new Date().toISOString(),
      data: stocks,
    });
  } catch (err) {
    console.error('Error fetching live market:', err);
    res.status(500).json({ error: 'Failed to fetch live market data' });
  }
});

// GET /api/stock/:symbol — single stock real-time data
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const stock = await marketDataService.getStock(symbol);
    if (!stock) {
      return res.status(404).json({ error: `Stock ${symbol.toUpperCase()} not found` });
    }
    res.json(stock);
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// GET /api/ohlc/:symbol — OHLC data for a symbol
app.get('/api/ohlc/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const days = parseInt(req.query.days as string) || 365;
    const ohlc = await marketDataService.getOHLC(symbol, days);
    res.json({
      symbol: symbol.toUpperCase(),
      days,
      count: ohlc.length,
      data: ohlc,
    });
  } catch (err) {
    console.error('Error fetching OHLC:', err);
    res.status(500).json({ error: 'Failed to fetch OHLC data' });
  }
});

// GET /api/live/indices — real-time NEPSE indices
app.get('/api/live/indices', async (_req, res) => {
  try {
    const indices = await marketDataService.getIndices();
    res.json(indices);
  } catch (err) {
    console.error('Error fetching indices:', err);
    res.status(500).json({ error: 'Failed to fetch indices' });
  }
});

// GET /api/live/status — market open/closed
app.get('/api/live/status', async (_req, res) => {
  try {
    const isOpen = await marketDataService.isMarketOpen();
    res.json({ isOpen, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Error checking market status:', err);
    res.status(500).json({ error: 'Failed to check market status' });
  }
});

// ---------------------------------------------------------------------------
// Signal & Analysis endpoints (computed from live data)
// ---------------------------------------------------------------------------

// GET /api/analysis/:symbol — compute indicators from live data
app.get('/api/analysis/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    const stocks = await marketDataService.getLiveMarket();
    const stock = stocks.find((s) => s.symbol === symbol);

    if (!stock) {
      return res.status(404).json({ error: `Stock ${symbol} not found` });
    }

    // Derive indicator values from live data (single-bar context)
    const close = stock.close;
    const pclose = stock.previousClose || close;
    const high = stock.high || close;
    const low = stock.low || close;
    const open = stock.open || close;
    const volume = stock.volume || 0;

    const priceRange = high - low || 1;
    const midRange = (high + low) / 2;

    // Estimate RSI from single-bar price change (approximation)
    const change = close - pclose;
    const changePct = pclose > 0 ? (change / pclose) * 100 : 0;
    // Estimate RSI: map changePct to approximate RSI (heuristic for single-bar)
    const estimatedRSI = Math.max(5, Math.min(95, 50 + changePct * 5));

    // Estimate Bollinger position
    const bbMiddle = midRange;
    const bbUpper = bbMiddle + priceRange * 1.5;
    const bbLower = bbMiddle - priceRange * 1.5;
    const percentB = bbUpper !== bbLower ? (close - bbLower) / (bbUpper - bbLower) : 0.5;

    // SMA approximation from close vs open
    const smaShort = (close + pclose) / 2;
    const smaLong = pclose;

    // Volume ratio approximation
    const avgVolume = volume || 1;
    const volumeRatio = 1.0; // without history, assume average

    // MACD approximation
    const macdLine = change * 0.5;
    const signalLine = change * 0.3;
    const histogram = macdLine - signalLine;

    // VWAP
    const vwap = volume > 0 ? ((high + low + close) / 3) : close;

    // Stochastic
    const stochK = priceRange > 0 ? ((close - low) / priceRange) * 100 : 50;
    const stochD = stochK; // single-bar

    // ADX (needs history — use volume ratio as proxy for trend strength)
    const adx = Math.abs(changePct) > 2 ? 30 : Math.abs(changePct) > 1 ? 22 : 15;
    const plusDI = change > 0 ? adx * 1.2 : adx * 0.5;
    const minusDI = change < 0 ? adx * 1.2 : adx * 0.5;

    // Support / Resistance estimates
    const support1 = Math.min(low, pclose * 0.98);
    const support2 = support1 * 0.97;
    const resistance1 = Math.max(high, pclose * 1.02);
    const resistance2 = resistance1 * 1.03;

    res.json({
      symbol,
      price: close,
      open,
      high,
      low,
      previousClose: pclose,
      volume,
      turnover: stock.turnover,
      changePercent: Math.round(changePct * 100) / 100,
      indicators: {
        sma: { 20: Math.round(smaShort * 100) / 100, 50: Math.round(smaLong * 100) / 100 },
        ema: { 12: Math.round(((close * 2 + pclose) / 3) * 100) / 100, 26: Math.round(smaLong * 100) / 100 },
        rsi: Math.round(estimatedRSI * 10) / 10,
        macd: {
          line: Math.round(macdLine * 100) / 100,
          signal: Math.round(signalLine * 100) / 100,
          histogram: Math.round(histogram * 100) / 100,
        },
        bollingerBands: {
          upper: Math.round(bbUpper * 100) / 100,
          middle: Math.round(bbMiddle * 100) / 100,
          lower: Math.round(bbLower * 100) / 100,
          percentB: Math.round(percentB * 1000) / 1000,
        },
        stochastic: { k: Math.round(stochK * 10) / 10, d: Math.round(stochD * 10) / 10 },
        adx: { adx: Math.round(adx * 10) / 10, plusDI: Math.round(plusDI * 10) / 10, minusDI: Math.round(minusDI * 10) / 10 },
        vwap: Math.round(vwap * 100) / 100,
      },
      supportResistance: [
        { type: 'resistance', price: Math.round(resistance2 * 100) / 100, strength: 2 },
        { type: 'resistance', price: Math.round(resistance1 * 100) / 100, strength: 4 },
        { type: 'support', price: Math.round(support1 * 100) / 100, strength: 4 },
        { type: 'support', price: Math.round(support2 * 100) / 100, strength: 2 },
      ],
    });
  } catch (err) {
    console.error('Error computing analysis:', err);
    res.status(500).json({ error: 'Failed to compute analysis' });
  }
});

// GET /api/signal/:symbol — generate signal from live data
app.get('/api/signal/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    const stocks = await marketDataService.getLiveMarket();
    const stock = stocks.find((s) => s.symbol === symbol);
    if (!stock) {
      return res.status(404).json({ error: `Stock ${symbol} not found` });
    }

    const close = stock.close;
    const pclose = stock.previousClose || close;
    const high = stock.high || close;
    const low = stock.low || close;
    const volume = stock.volume || 0;
    const change = close - pclose;
    const changePct = pclose > 0 ? (change / pclose) * 100 : 0;
    const priceRange = high - low || 1;

    // Single-bar indicator estimates
    const rsi = Math.max(5, Math.min(95, 50 + changePct * 5));
    const macdHist = change * 0.2;
    const prevHist = 0;
    const bbMid = (high + low) / 2;
    const bbUpper = bbMid + priceRange * 1.5;
    const bbLower = bbMid - priceRange * 1.5;
    const smaShort = (close + pclose) / 2;
    const smaLong = pclose;
    const adxVal = Math.abs(changePct) > 2 ? 30 : Math.abs(changePct) > 1 ? 22 : 15;

    // Build indicator signals
    const indicators: Array<{ name: string; value: number; signal: 'BUY' | 'SELL' | 'HOLD'; weight: number; reason: string }> = [];

    // RSI
    let rsiSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let rsiReason = `RSI at ${rsi.toFixed(1)} — neutral zone`;
    if (rsi < 30) { rsiSignal = 'BUY'; rsiReason = `RSI at ${rsi.toFixed(1)} — oversold`; }
    else if (rsi > 70) { rsiSignal = 'SELL'; rsiReason = `RSI at ${rsi.toFixed(1)} — overbought`; }
    indicators.push({ name: 'RSI', value: rsi, signal: rsiSignal, weight: 15, reason: rsiReason });

    // MACD
    let macdSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let macdReason = `MACD histogram at ${macdHist.toFixed(2)}`;
    if (macdHist > 0 && prevHist <= 0) { macdSignal = 'BUY'; macdReason = 'MACD bullish crossover'; }
    else if (macdHist > 0) { macdSignal = 'BUY'; macdReason = 'MACD positive momentum'; }
    else if (macdHist < 0) { macdSignal = 'SELL'; macdReason = 'MACD negative momentum'; }
    indicators.push({ name: 'MACD', value: macdHist, signal: macdSignal, weight: 20, reason: macdReason });

    // Bollinger
    const percentB = bbUpper !== bbLower ? (close - bbLower) / (bbUpper - bbLower) : 0.5;
    let bbSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let bbReason = `Price within bands (%B: ${(percentB * 100).toFixed(1)}%)`;
    if (percentB <= 0.2) { bbSignal = 'BUY'; bbReason = `Price near lower band (%B: ${(percentB * 100).toFixed(1)}%)`; }
    else if (percentB >= 0.8) { bbSignal = 'SELL'; bbReason = `Price near upper band (%B: ${(percentB * 100).toFixed(1)}%)`; }
    indicators.push({ name: 'Bollinger Bands', value: percentB, signal: bbSignal, weight: 10, reason: bbReason });

    // SMA Crossover
    let smaSignalVal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let smaReason = 'SMA neutral';
    if (smaShort > smaLong) { smaSignalVal = 'BUY'; smaReason = 'Short-term SMA above long-term — bullish'; }
    else if (smaShort < smaLong) { smaSignalVal = 'SELL'; smaReason = 'Short-term SMA below long-term — bearish'; }
    indicators.push({ name: 'SMA Crossover', value: smaShort - smaLong, signal: smaSignalVal, weight: 15, reason: smaReason });

    // Volume
    let volSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    const volReason = `Volume at ${volume.toLocaleString()} shares`;
    indicators.push({ name: 'Volume', value: 1, signal: volSignal, weight: 10, reason: volReason });

    // ADX
    let adxSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let adxReason = `Weak trend (ADX: ${adxVal.toFixed(1)})`;
    if (adxVal > 25 && change > 0) { adxSignal = 'BUY'; adxReason = `Strong uptrend (ADX: ${adxVal.toFixed(1)})`; }
    else if (adxVal > 25 && change < 0) { adxSignal = 'SELL'; adxReason = `Strong downtrend (ADX: ${adxVal.toFixed(1)})`; }
    indicators.push({ name: 'ADX', value: adxVal, signal: adxSignal, weight: 5, reason: adxReason });

    // S/R
    const support = Math.min(low, pclose * 0.98);
    const resistance = Math.max(high, pclose * 1.02);
    const sDist = Math.abs(close - support) / close;
    const rDist = Math.abs(close - resistance) / close;
    let srSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let srReason = `S: ${support.toFixed(2)}, R: ${resistance.toFixed(2)}`;
    if (sDist < 0.02) { srSignal = 'BUY'; srReason = `Price near support at ${support.toFixed(2)}`; }
    else if (rDist < 0.02) { srSignal = 'SELL'; srReason = `Price near resistance at ${resistance.toFixed(2)}`; }
    indicators.push({ name: 'Support/Resistance', value: sDist, signal: srSignal, weight: 15, reason: srReason });

    // Compute aggregate score
    let buyScore = 0, sellScore = 0, totalWeight = 0;
    const reasoning: string[] = [];
    for (const ind of indicators) {
      totalWeight += ind.weight;
      if (ind.signal === 'BUY') buyScore += ind.weight;
      else if (ind.signal === 'SELL') sellScore += ind.weight;
      if (ind.signal !== 'HOLD') reasoning.push(`[${ind.signal}] ${ind.reason}`);
    }

    const normalizedBuy = (buyScore / totalWeight) * 100;
    const normalizedSell = (sellScore / totalWeight) * 100;
    const netScore = normalizedBuy - normalizedSell;

    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (netScore > 20) signal = 'BUY';
    else if (netScore < -20) signal = 'SELL';

    const absNet = Math.abs(netScore);
    const confidence = absNet <= 10 ? absNet * 2 : Math.min(100, 20 + (absNet - 10) * 1.2);
    const score = Math.max(0, Math.min(100, 50 + netScore / 2));

    const buyCount = indicators.filter((i) => i.signal === 'BUY').length;
    const sellCount = indicators.filter((i) => i.signal === 'SELL').length;
    const conflictRatio = Math.min(buyCount, sellCount) / Math.max(buyCount, sellCount, 1);
    let riskLevel: string = 'LOW';
    if (conflictRatio > 0.6) riskLevel = 'VERY_HIGH';
    else if (conflictRatio > 0.4 || confidence < 40) riskLevel = 'HIGH';
    else if (conflictRatio > 0.2 || confidence < 60) riskLevel = 'MEDIUM';

    if (reasoning.length === 0) reasoning.push('All indicators neutral — no clear directional bias');

    res.json({
      symbol,
      price: close,
      signal,
      confidence: Math.round(confidence * 10) / 10,
      score: Math.round(score * 10) / 10,
      riskLevel,
      reasoning,
      indicators,
    });
  } catch (err) {
    console.error('Error computing signal:', err);
    res.status(500).json({ error: 'Failed to compute signal' });
  }
});

// GET /api/scan/:type — scan all live stocks for signals
app.get('/api/scan/:type', async (req, res) => {
  try {
    const scanType = req.params.type;
    const stocks = await marketDataService.getLiveMarket();

    if (stocks.length === 0) {
      return res.json({ type: scanType, count: 0, results: [] });
    }

    const results: Array<{
      symbol: string; name: string; sector: string; signal: string;
      score: number; confidence: number; price: number; changePercent: number;
      details: { volume: number; rsi: number; trend: string };
    }> = [];

    for (const s of stocks) {
      const close = s.close;
      const pclose = s.previousClose || close;
      if (close <= 0 || pclose <= 0) continue;

      const changePct = ((close - pclose) / pclose) * 100;
      const rsi = Math.max(5, Math.min(95, 50 + changePct * 5));
      const high = s.high || close;
      const low = s.low || close;
      const priceRange = high - low;

      let score = 50;
      let signal = 'HOLD';
      let trend = 'Neutral';
      let match = false;

      switch (scanType) {
        case 'swing':
          score = 50 + changePct * 3;
          if (rsi > 40 && rsi < 60 && changePct > 0.5 && s.volume > 0) { match = true; signal = 'BUY'; trend = 'Bullish'; }
          break;
        case 'breakout':
          if (close >= high * 0.98 && changePct > 1 && s.volume > 0) { match = true; signal = 'BUY'; score = 60 + changePct * 2; trend = 'Breakout'; }
          break;
        case 'accumulation':
          if (changePct > -0.5 && changePct < 1.5 && s.volume > 0 && priceRange < close * 0.02) { match = true; signal = 'BUY'; score = 55 + (1 - priceRange / close) * 20; trend = 'Accumulating'; }
          break;
        case 'smartmoney':
          if (Math.abs(changePct) < 1 && s.volume > 0 && priceRange > 0) { match = true; signal = 'WATCH'; score = 50 + s.volume / 100000; trend = 'Smart Money'; }
          break;
        default:
          match = changePct > 0;
          signal = changePct > 0 ? 'BUY' : 'HOLD';
          score = 50 + changePct * 2;
      }

      if (match) {
        const confidence = Math.min(95, Math.max(30, score * 0.9));
        results.push({
          symbol: s.symbol,
          name: s.name,
          sector: s.sector,
          signal,
          score: Math.round(Math.max(0, Math.min(100, score))),
          confidence: Math.round(confidence),
          price: close,
          changePercent: Math.round(changePct * 100) / 100,
          details: { volume: s.volume, rsi: Math.round(rsi * 10) / 10, trend },
        });
      }
    }

    results.sort((a, b) => b.score - a.score);

    res.json({ type: scanType, count: results.length, results: results.slice(0, 20) });
  } catch (err) {
    console.error('Error scanning:', err);
    res.status(500).json({ error: 'Failed to scan' });
  }
});

// Initialise WebSocket server (upgrades from the same HTTP server)
initWebSocketServer(server);

// Start cron jobs and live polling
startCronJobs();
marketDataService.startPolling();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Market Data Service running on port ${PORT}`);
  console.log(`Live endpoints: /api/live, /api/stock/:symbol, /api/ohlc/:symbol`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
});

export default app;
