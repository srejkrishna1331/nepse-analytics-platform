import cron from 'node-cron';
import { Pool } from 'pg';
import { fetchAllStocks, fetchIndices, fetchMarketSummary } from '../scrapers/nepse-scraper';
import { setCache, CACHE_KEYS, DEFAULT_TTL, EOD_TTL, invalidateCache } from '../cache/redis-cache';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'nepse_user',
  password: process.env.POSTGRES_PASSWORD || 'change_me_in_production',
  database: process.env.POSTGRES_DB || 'nepse_analytics',
});

export function startCronJobs(): void {
  // Intraday data fetch - every minute during market hours (Sun-Thu, 11:00-15:00 NPT)
  cron.schedule('* 11-14 * * 0-4', async () => {
    console.log('[CRON] Fetching intraday data...');
    try {
      const stocks = await fetchAllStocks();
      if (stocks) {
        await setCache(CACHE_KEYS.ALL_STOCKS, stocks, DEFAULT_TTL);
        console.log(`[CRON] Updated ${stocks.length} stock prices`);
      }

      const indices = await fetchIndices();
      if (indices) {
        await setCache(CACHE_KEYS.INDICES, indices, DEFAULT_TTL);
      }
    } catch (err) {
      console.error('[CRON] Intraday fetch error:', err);
    }
  }, { timezone: 'Asia/Kathmandu' });

  // EOD data collection - 3:30 PM NPT on trading days
  cron.schedule('30 15 * * 0-4', async () => {
    console.log('[CRON] Collecting EOD data...');
    try {
      const stocks = await fetchAllStocks();
      if (!stocks) {
        console.error('[CRON] Failed to fetch EOD stocks');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      for (const stock of stocks) {
        try {
          // Upsert stock info
          const stockResult = await pool.query(
            `INSERT INTO stocks (symbol, name, sector)
             VALUES ($1, $2, $3)
             ON CONFLICT (symbol) DO UPDATE SET name = $2, sector = $3
             RETURNING id`,
            [stock.symbol, stock.name, stock.sector]
          );

          const stockId = stockResult.rows[0].id;

          // Insert daily OHLC
          await pool.query(
            `INSERT INTO ohlc_daily (stock_id, date, open, high, low, close, volume, turnover)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (stock_id, date) DO UPDATE SET
               open = $3, high = $4, low = $5, close = $6, volume = $7, turnover = $8`,
            [stockId, today, stock.open, stock.high, stock.low, stock.close, stock.volume, stock.turnover]
          );
        } catch (err) {
          console.error(`[CRON] Error saving ${stock.symbol}:`, err);
        }
      }

      // Save indices
      const indices = await fetchIndices();
      if (indices) {
        for (const idx of indices) {
          await pool.query(
            `INSERT INTO market_indices (name, date, value, change, change_percent, turnover)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (name, date) DO UPDATE SET
               value = $3, change = $4, change_percent = $5, turnover = $6`,
            [idx.index, today, idx.currentValue, idx.change, idx.changePercent, idx.turnover]
          );
        }
      }

      // Invalidate caches
      await invalidateCache('market:*');
      console.log('[CRON] EOD data collection complete');
    } catch (err) {
      console.error('[CRON] EOD collection error:', err);
    }
  }, { timezone: 'Asia/Kathmandu' });

  // Market summary - every 5 minutes during market hours
  cron.schedule('*/5 11-14 * * 0-4', async () => {
    try {
      const summary = await fetchMarketSummary();
      if (summary) {
        await setCache(CACHE_KEYS.MARKET_SUMMARY, summary, DEFAULT_TTL * 5);
      }
    } catch (err) {
      console.error('[CRON] Market summary error:', err);
    }
  }, { timezone: 'Asia/Kathmandu' });

  console.log('[CRON] All cron jobs scheduled');
}
