import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { z } from 'zod';

const app = express();
const PORT = parseInt(process.env.NOTIFICATION_PORT || '3005');

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
  res.json({ status: 'ok', service: 'notification' });
});

// Get notifications for user
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const unreadOnly = req.query.unread === 'true';

    let query = `SELECT * FROM notifications WHERE user_id = $1`;
    if (unreadOnly) query += ` AND read = false`;
    query += ` ORDER BY created_at DESC LIMIT $2`;

    const result = await pool.query(query, [userId, limit]);
    res.json(result.rows);
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read = true WHERE id = $1', [req.params.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Create alert
const createAlertSchema = z.object({
  userId: z.string().uuid(),
  symbol: z.string(),
  type: z.enum(['price', 'indicator', 'breakout', 'news']),
  conditionField: z.string(),
  conditionOperator: z.enum(['gt', 'lt', 'gte', 'lte', 'eq', 'crosses_above', 'crosses_below']),
  conditionValue: z.number(),
});

app.post('/api/alerts', async (req, res) => {
  try {
    const data = createAlertSchema.parse(req.body);

    const stockResult = await pool.query('SELECT id FROM stocks WHERE symbol = $1', [data.symbol.toUpperCase()]);
    if (stockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const result = await pool.query(
      `INSERT INTO alerts (user_id, stock_id, type, condition_field, condition_operator, condition_value)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.userId, stockResult.rows[0].id, data.type, data.conditionField, data.conditionOperator, data.conditionValue]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Create alert error:', err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Get user alerts
app.get('/api/alerts/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, s.symbol, s.name
       FROM alerts a
       JOIN stocks s ON s.id = a.stock_id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Delete alert
app.delete('/api/alerts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM alerts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    console.error('Delete alert error:', err);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// Send notification (internal)
app.post('/api/notify', async (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Notification Service running on port ${PORT}`);
});

export default app;
