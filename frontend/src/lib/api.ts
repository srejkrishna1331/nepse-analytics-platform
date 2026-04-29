import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Market Data
export const marketAPI = {
  getStocks: () => api.get('/market/api/stocks'),
  getStock: (symbol: string) => api.get(`/market/api/stocks/${symbol}`),
  getOHLC: (symbol: string, days = 365) => api.get(`/market/api/stocks/${symbol}/ohlc?days=${days}`),
  getIndices: () => api.get('/market/api/indices'),
  getSummary: () => api.get('/market/api/summary'),
  getSectors: () => api.get('/market/api/sectors'),
  getTopGainers: (limit = 10) => api.get(`/market/api/top/gainers?limit=${limit}`),
  getTopLosers: (limit = 10) => api.get(`/market/api/top/losers?limit=${limit}`),
  getCorporateActions: () => api.get('/market/api/corporate-actions'),
};

// Technical Analysis
export const taAPI = {
  getIndicators: (symbol: string, days = 365) => api.get(`/ta/api/indicators/${symbol}?days=${days}`),
  getFibonacci: (symbol: string) => api.get(`/ta/api/fibonacci/${symbol}`),
  getSupportResistance: (symbol: string) => api.get(`/ta/api/support-resistance/${symbol}`),
  getPatterns: (symbol: string) => api.get(`/ta/api/patterns/${symbol}`),
};

// Signal Engine
export const signalAPI = {
  getSignal: (symbol: string) => api.get(`/signal/api/signal/${symbol}`),
  scan: (type: string) => api.get(`/signal/api/scan/${type}`),
  askAssistant: (query: string) => api.post('/signal/api/assistant', { query }),
};

// Portfolio
export const portfolioAPI = {
  getPortfolio: (userId: string) => api.get(`/portfolio/api/portfolio/${userId}`),
  addHolding: (userId: string, data: { symbol: string; quantity: number; avgPrice: number }) =>
    api.post(`/portfolio/api/portfolio/${userId}/holdings`, data),
  sellHolding: (userId: string, data: { symbol: string; quantity: number; price: number }) =>
    api.post(`/portfolio/api/portfolio/${userId}/sell`, data),
  getTransactions: (userId: string) => api.get(`/portfolio/api/portfolio/${userId}/transactions`),
  getWatchlist: (userId: string) => api.get(`/portfolio/api/watchlist/${userId}`),
};

// AI Prediction
export const aiAPI = {
  predict: (symbol: string, days = 5) => api.get(`/ai/api/predict/${symbol}?days_ahead=${days}`),
  getTrend: (symbol: string) => api.get(`/ai/api/trend/${symbol}`),
};

// News & Sentiment
export const newsAPI = {
  getNews: (limit = 20, symbol?: string) =>
    api.get(`/news/api/news?limit=${limit}${symbol ? `&symbol=${symbol}` : ''}`),
  getMarketSentiment: () => api.get('/news/api/sentiment/market'),
};

// Notifications
export const notificationAPI = {
  getNotifications: (userId: string) => api.get(`/notification/api/notifications/${userId}`),
  markRead: (id: string) => api.patch(`/notification/api/notifications/${id}/read`),
  createAlert: (data: Record<string, unknown>) => api.post('/notification/api/alerts', data),
  getAlerts: (userId: string) => api.get(`/notification/api/alerts/${userId}`),
};

// Auth
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export default api;
