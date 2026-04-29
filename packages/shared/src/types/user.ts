export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  type: 'price' | 'indicator' | 'breakout' | 'news';
  condition: AlertCondition;
  active: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

export interface AlertCondition {
  field: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'crosses_above' | 'crosses_below';
  value: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'alert' | 'signal' | 'news' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface NewsSentiment {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  relatedSymbols: string[];
  summary: string;
}
