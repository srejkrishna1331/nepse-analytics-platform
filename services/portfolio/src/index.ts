import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { z } from 'zod';

const app = express();
const PORT = parseInt(process.env.PORTFOLIO_PORT || '3004');

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
  res.json({ status: 'ok', service: 'portfolio' });
});

// Get user portfolio
app.get('/api/portfolio/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const portfolioResult = await pool.query(
      'SELECT * FROM portfolios WHERE user_id = $1',
      [userId]
    );

    if (portfolioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const portfolio = portfolioResult.rows[0];

    const holdingsResult = await pool.query(
      `SELECT ph.*, s.symbol, s.name, s.sector,
              o.close as current_price,
              ph.quantity * ph.avg_price as invested_amount,
              ph.quantity * o.close as current_value,
              (ph.quantity * o.close) - (ph.quantity * ph.avg_price) as profit_loss,
              CASE WHEN ph.avg_price > 0
                THEN ((o.close - ph.avg_price) / ph.avg_price * 100)
                ELSE 0 END as profit_loss_percent
       FROM portfolio_holdings ph
       JOIN stocks s ON s.id = ph.stock_id
       LEFT JOIN LATERAL (
         SELECT close FROM ohlc_daily WHERE stock_id = s.id ORDER BY date DESC LIMIT 1
       ) o ON true
       WHERE ph.portfolio_id = $1
       ORDER BY current_value DESC NULLS LAST`,
      [portfolio.id]
    );

    const holdings = holdingsResult.rows;
    const totalInvested = holdings.reduce((s: number, h: { invested_amount: string }) =>
      s + Number(h.invested_amount || 0), 0);
    const totalCurrentValue = holdings.reduce((s: number, h: { current_value: string }) =>
      s + Number(h.current_value || 0), 0);

    // Sector allocation
    const sectorMap: Record<string, { value: number; count: number }> = {};
    for (const h of holdings) {
      const sector = h.sector;
      const value = Number(h.current_value || 0);
      if (!sectorMap[sector]) sectorMap[sector] = { value: 0, count: 0 };
      sectorMap[sector].value += value;
      sectorMap[sector].count++;
    }

    const sectorAllocation = Object.entries(sectorMap).map(([sector, data]) => ({
      sector,
      value: data.value,
      percentage: totalCurrentValue > 0 ? (data.value / totalCurrentValue) * 100 : 0,
      holdings: data.count,
    }));

    // Risk exposure
    const maxSectorPct = Math.max(...sectorAllocation.map(s => s.percentage), 0);
    const concentration = maxSectorPct;
    const warnings: string[] = [];

    if (concentration > 50) warnings.push(`Over-concentrated: ${concentration.toFixed(0)}% in one sector`);
    if (sectorAllocation.length <= 2) warnings.push('Low diversification: Consider adding more sectors');
    if (holdings.some((h: { profit_loss_percent: string }) => Number(h.profit_loss_percent) < -20)) {
      warnings.push('Some holdings have significant unrealized losses (>20%)');
    }

    res.json({
      portfolio: {
        ...portfolio,
        holdings,
        totalInvested,
        totalCurrentValue,
        totalProfitLoss: totalCurrentValue - totalInvested,
        totalProfitLossPercent: totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0,
        sectorAllocation,
        riskExposure: {
          concentration,
          sectorDiversification: sectorAllocation.length,
          overallRisk: concentration > 60 ? 'HIGH' : concentration > 40 ? 'MEDIUM' : 'LOW',
          warnings,
        },
      },
    });
  } catch (err) {
    console.error('Portfolio error:', err);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Add holding
const addHoldingSchema = z.object({
  symbol: z.string(),
  quantity: z.number().positive(),
  avgPrice: z.number().positive(),
});

app.post('/api/portfolio/:userId/holdings', async (req, res) => {
  try {
    const { userId } = req.params;
    const { symbol, quantity, avgPrice } = addHoldingSchema.parse(req.body);

    const portfolioResult = await pool.query(
      'SELECT id FROM portfolios WHERE user_id = $1',
      [userId]
    );

    if (portfolioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const portfolioId = portfolioResult.rows[0].id;
    const stockResult = await pool.query('SELECT id FROM stocks WHERE symbol = $1', [symbol.toUpperCase()]);

    if (stockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const stockId = stockResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO portfolio_holdings (portfolio_id, stock_id, quantity, avg_price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (portfolio_id, stock_id)
       DO UPDATE SET
         quantity = portfolio_holdings.quantity + $3,
         avg_price = (portfolio_holdings.avg_price * portfolio_holdings.quantity + $4 * $3)
                     / (portfolio_holdings.quantity + $3),
         updated_at = NOW()
       RETURNING *`,
      [portfolioId, stockId, quantity, avgPrice]
    );

    // Log transaction
    await pool.query(
      `INSERT INTO transactions (portfolio_id, stock_id, type, quantity, price, amount)
       VALUES ($1, $2, 'BUY', $3, $4, $5)`,
      [portfolioId, stockId, quantity, avgPrice, quantity * avgPrice]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Add holding error:', err);
    res.status(500).json({ error: 'Failed to add holding' });
  }
});

// Sell holding
app.post('/api/portfolio/:userId/sell', async (req, res) => {
  try {
    const { userId } = req.params;
    const { symbol, quantity, price } = req.body;

    const portfolioResult = await pool.query(
      'SELECT id FROM portfolios WHERE user_id = $1',
      [userId]
    );

    if (portfolioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const portfolioId = portfolioResult.rows[0].id;
    const stockResult = await pool.query('SELECT id FROM stocks WHERE symbol = $1', [symbol.toUpperCase()]);

    if (stockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const stockId = stockResult.rows[0].id;

    // Get current holding
    const holdingResult = await pool.query(
      'SELECT * FROM portfolio_holdings WHERE portfolio_id = $1 AND stock_id = $2',
      [portfolioId, stockId]
    );

    if (holdingResult.rows.length === 0) {
      return res.status(400).json({ error: 'No holding found for this stock' });
    }

    const holding = holdingResult.rows[0];
    if (holding.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity' });
    }

    const newQuantity = holding.quantity - quantity;

    if (newQuantity === 0) {
      await pool.query('DELETE FROM portfolio_holdings WHERE id = $1', [holding.id]);
    } else {
      await pool.query(
        'UPDATE portfolio_holdings SET quantity = $1, updated_at = NOW() WHERE id = $2',
        [newQuantity, holding.id]
      );
    }

    // Log transaction
    await pool.query(
      `INSERT INTO transactions (portfolio_id, stock_id, type, quantity, price, amount)
       VALUES ($1, $2, 'SELL', $3, $4, $5)`,
      [portfolioId, stockId, quantity, price, quantity * price]
    );

    const profitLoss = (price - Number(holding.avg_price)) * quantity;

    res.json({
      message: 'Sell order executed',
      quantitySold: quantity,
      pricePerUnit: price,
      profitLoss,
      remainingQuantity: newQuantity,
    });
  } catch (err) {
    console.error('Sell error:', err);
    res.status(500).json({ error: 'Failed to process sell order' });
  }
});

// Get transaction history
app.get('/api/portfolio/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await pool.query(
      `SELECT t.*, s.symbol, s.name
       FROM transactions t
       JOIN portfolios p ON p.id = t.portfolio_id
       JOIN stocks s ON s.id = t.stock_id
       WHERE p.user_id = $1
       ORDER BY t.date DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Watchlist endpoints
app.get('/api/watchlist/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT * FROM watchlists WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Watchlist error:', err);
    res.status(500).json({ error: 'Failed to fetch watchlists' });
  }
});

app.post('/api/watchlist/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { symbol } = req.body;

    const stockResult = await pool.query('SELECT id FROM stocks WHERE symbol = $1', [symbol.toUpperCase()]);
    if (stockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const stockId = stockResult.rows[0].id;

    await pool.query(
      `UPDATE watchlists SET stock_ids = array_append(stock_ids, $1)
       WHERE user_id = $2 AND NOT ($1 = ANY(stock_ids))`,
      [stockId, userId]
    );

    res.json({ message: 'Stock added to watchlist' });
  } catch (err) {
    console.error('Add to watchlist error:', err);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio Service running on port ${PORT}`);
});

export default app;
