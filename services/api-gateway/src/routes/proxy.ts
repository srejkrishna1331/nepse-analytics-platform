import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = Router();

const SERVICES = {
  market: process.env.MARKET_DATA_URL || 'http://market-data:3001',
  ta: process.env.TECHNICAL_ANALYSIS_URL || 'http://technical-analysis:3002',
  signal: process.env.SIGNAL_ENGINE_URL || 'http://signal-engine:3003',
  portfolio: process.env.PORTFOLIO_URL || 'http://portfolio:3004',
  notification: process.env.NOTIFICATION_URL || 'http://notification:3005',
  ai: process.env.AI_PREDICTION_URL || 'http://ai-prediction:8000',
  news: process.env.NEWS_SENTIMENT_URL || 'http://news-sentiment:8001',
};

router.use(
  '/market',
  createProxyMiddleware({
    target: SERVICES.market,
    changeOrigin: true,
    pathRewrite: { '^/api/market': '/api' },
  })
);

router.use(
  '/ta',
  createProxyMiddleware({
    target: SERVICES.ta,
    changeOrigin: true,
    pathRewrite: { '^/api/ta': '/api' },
  })
);

router.use(
  '/signal',
  createProxyMiddleware({
    target: SERVICES.signal,
    changeOrigin: true,
    pathRewrite: { '^/api/signal': '/api' },
  })
);

router.use(
  '/portfolio',
  createProxyMiddleware({
    target: SERVICES.portfolio,
    changeOrigin: true,
    pathRewrite: { '^/api/portfolio': '/api' },
  })
);

router.use(
  '/notification',
  createProxyMiddleware({
    target: SERVICES.notification,
    changeOrigin: true,
    pathRewrite: { '^/api/notification': '/api' },
  })
);

router.use(
  '/ai',
  createProxyMiddleware({
    target: SERVICES.ai,
    changeOrigin: true,
    pathRewrite: { '^/api/ai': '/api' },
  })
);

router.use(
  '/news',
  createProxyMiddleware({
    target: SERVICES.news,
    changeOrigin: true,
    pathRewrite: { '^/api/news': '/api' },
  })
);

export default router;
