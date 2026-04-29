import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { calculateSMA, calculateEMA, calculateWMA } from './indicators/moving-averages';
import { calculateRSI } from './indicators/rsi';
import { calculateMACD } from './indicators/macd';
import { calculateBollingerBands } from './indicators/bollinger';
import { calculateStochastic } from './indicators/stochastic';
import { calculateADX } from './indicators/adx';
import { calculateVWAP } from './indicators/vwap';
import { calculateFibonacciRetracement } from './indicators/fibonacci';
import { detectSupportResistance, detectTrendlines } from './patterns/support-resistance';
import { detectPatterns } from './patterns/chart-patterns';
import { detectOrderBlocks, detectLiquidityZones, detectFairValueGaps, detectMarketStructure } from './indicators/smc';

const app = express();
const PORT = parseInt(process.env.TECHNICAL_ANALYSIS_PORT || '3002');

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
  res.json({ status: 'ok', service: 'technical-analysis' });
});

async function getOHLCData(symbol: string, days: number) {
  const result = await pool.query(
    `SELECT o.date, o.open, o.high, o.low, o.close, o.volume, o.turnover
     FROM ohlc_daily o
     JOIN stocks s ON s.id = o.stock_id
     WHERE s.symbol = $1
     ORDER BY o.date ASC
     LIMIT $2`,
    [symbol.toUpperCase(), days]
  );
  return result.rows;
}

// Get all indicators for a stock
app.get('/api/indicators/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const days = parseInt(req.query.days as string) || 365;

    const data = await getOHLCData(symbol, days);
    if (data.length === 0) {
      return res.status(404).json({ error: 'No data found for symbol' });
    }

    const closes = data.map((d: { close: number }) => Number(d.close));
    const highs = data.map((d: { high: number }) => Number(d.high));
    const lows = data.map((d: { low: number }) => Number(d.low));
    const volumes = data.map((d: { volume: number }) => Number(d.volume));

    const indicators = {
      sma: {
        5: calculateSMA(closes, 5),
        10: calculateSMA(closes, 10),
        20: calculateSMA(closes, 20),
        50: calculateSMA(closes, 50),
        100: calculateSMA(closes, 100),
        200: calculateSMA(closes, 200),
      },
      ema: {
        9: calculateEMA(closes, 9),
        12: calculateEMA(closes, 12),
        21: calculateEMA(closes, 21),
        26: calculateEMA(closes, 26),
        50: calculateEMA(closes, 50),
        200: calculateEMA(closes, 200),
      },
      wma: {
        14: calculateWMA(closes, 14),
      },
      rsi: calculateRSI(closes, 14),
      macd: calculateMACD(closes, 12, 26, 9),
      bollingerBands: calculateBollingerBands(closes, 20, 2),
      stochastic: calculateStochastic(highs, lows, closes, 14, 3),
      adx: calculateADX(highs, lows, closes, 14),
      vwap: calculateVWAP(highs, lows, closes, volumes),
    };

    res.json({
      symbol: symbol.toUpperCase(),
      dataPoints: data.length,
      indicators,
      dates: data.map((d: { date: string }) => d.date),
    });
  } catch (err) {
    console.error('Error calculating indicators:', err);
    res.status(500).json({ error: 'Failed to calculate indicators' });
  }
});

// Get Fibonacci levels
app.get('/api/fibonacci/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const days = parseInt(req.query.days as string) || 90;

    const data = await getOHLCData(symbol, days);
    if (data.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    const highs = data.map((d: { high: number }) => Number(d.high));
    const lows = data.map((d: { low: number }) => Number(d.low));
    const closes = data.map((d: { close: number }) => Number(d.close));

    const highestHigh = Math.max(...highs);
    const lowestLow = Math.min(...lows);
    const currentPrice = closes[closes.length - 1];
    const isUptrend = currentPrice > (highestHigh + lowestLow) / 2;

    const levels = calculateFibonacciRetracement(highestHigh, lowestLow, isUptrend);

    res.json({ symbol: symbol.toUpperCase(), levels, highestHigh, lowestLow, isUptrend });
  } catch (err) {
    console.error('Error calculating Fibonacci:', err);
    res.status(500).json({ error: 'Failed to calculate Fibonacci levels' });
  }
});

// Detect support/resistance
app.get('/api/support-resistance/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await getOHLCData(symbol, 365);
    if (data.length < 20) {
      return res.status(400).json({ error: 'Insufficient data for analysis' });
    }

    const highs = data.map((d: { high: number }) => Number(d.high));
    const lows = data.map((d: { low: number }) => Number(d.low));
    const closes = data.map((d: { close: number }) => Number(d.close));

    const levels = detectSupportResistance(highs, lows, closes);
    const trendlines = detectTrendlines(highs, lows);

    res.json({ symbol: symbol.toUpperCase(), levels, trendlines });
  } catch (err) {
    console.error('Error detecting S/R:', err);
    res.status(500).json({ error: 'Failed to detect support/resistance' });
  }
});

// Detect chart patterns
app.get('/api/patterns/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await getOHLCData(symbol, 200);
    if (data.length < 20) {
      return res.status(400).json({ error: 'Insufficient data for pattern detection' });
    }

    const highs = data.map((d: { high: number }) => Number(d.high));
    const lows = data.map((d: { low: number }) => Number(d.low));
    const closes = data.map((d: { close: number }) => Number(d.close));
    const volumes = data.map((d: { volume: number }) => Number(d.volume));

    const patterns = detectPatterns(highs, lows, closes, volumes);

    res.json({ symbol: symbol.toUpperCase(), patterns });
  } catch (err) {
    console.error('Error detecting patterns:', err);
    res.status(500).json({ error: 'Failed to detect patterns' });
  }
});

// Smart Money Concepts — Order Blocks, Liquidity Zones, FVG, Market Structure
app.get('/api/smc/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await getOHLCData(symbol, 200);
    if (data.length < 30) {
      return res.status(400).json({ error: 'Insufficient data for SMC analysis' });
    }

    const opens = data.map((d: { open: number }) => Number(d.open));
    const highs = data.map((d: { high: number }) => Number(d.high));
    const lows = data.map((d: { low: number }) => Number(d.low));
    const closes = data.map((d: { close: number }) => Number(d.close));
    const volumes = data.map((d: { volume: number }) => Number(d.volume));

    const orderBlocks = detectOrderBlocks(opens, highs, lows, closes, volumes);
    const liquidityZones = detectLiquidityZones(highs, lows);
    const fairValueGaps = detectFairValueGaps(highs, lows, closes);
    const marketStructure = detectMarketStructure(highs, lows);

    res.json({
      symbol: symbol.toUpperCase(),
      orderBlocks,
      liquidityZones,
      fairValueGaps,
      marketStructure,
    });
  } catch (err) {
    console.error('Error in SMC analysis:', err);
    res.status(500).json({ error: 'Failed to perform SMC analysis' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Technical Analysis Service running on port ${PORT}`);
});

export default app;
