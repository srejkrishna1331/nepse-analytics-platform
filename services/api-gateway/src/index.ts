import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth';
import proxyRoutes from './routes/proxy';
import { generalLimiter } from './middleware/rateLimiter';

const app = express();
const PORT = parseInt(process.env.API_GATEWAY_PORT || '3000');

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api', proxyRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
});

export default app;
