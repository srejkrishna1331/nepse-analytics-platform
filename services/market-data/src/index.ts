import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { getCached, setCache, CACHE_KEYS, DEFAULT_TTL, EOD_TTL } from './cache/redis-cache';
import { startCronJobs } from './jobs/cron-jobs';

const app = express();
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
  res.json({ status: 'ok', service: 'market-data' });
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

// Start cron jobs
startCronJobs();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Market Data Service running on port ${PORT}`);
});

export default app;
