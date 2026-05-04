# NEPSE Analytics Platform — API Documentation

Base URL: `http://localhost:3000`

All endpoints are proxied through the API Gateway. Protected endpoints require a Bearer token in the `Authorization` header.

---

## Authentication

### POST `/api/auth/register`

Register a new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### POST `/api/auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" }
}
```

### GET `/api/auth/me`

Get current user profile. Requires authentication.

---

## Market Data Service

### GET `/api/market/stocks`

List all stocks with latest prices.

**Response:**
```json
[
  {
    "id": "uuid",
    "symbol": "NABIL",
    "name": "Nabil Bank Limited",
    "sector": "Commercial Banks",
    "close": 1150.00,
    "change": 8.00,
    "change_percent": 0.70,
    "volume": 250000,
    "turnover": 287500000
  }
]
```

### GET `/api/market/stocks/:symbol`

Get details for a specific stock.

### GET `/api/market/stocks/:symbol/ohlc`

Get OHLC data for a stock.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | number | 30 | Number of days |

**Response:**
```json
[
  {
    "date": "2026-04-29",
    "open": 1145.00,
    "high": 1158.00,
    "low": 1140.00,
    "close": 1150.00,
    "volume": 250000,
    "turnover": 287500000
  }
]
```

### GET `/api/market/indices`

Get market index data (NEPSE, SENSITIVE, BANKING, etc.)

### GET `/api/market/summary`

Get market summary (turnover, volume, advances/declines).

### GET `/api/market/top/:type`

Get top gainers/losers/active stocks.

**Path Parameters:** `type` = `gainers` | `losers` | `active`

### GET `/api/market/sectors`

Get sector-wise summary.

### GET `/api/market/corporate-actions`

Get recent corporate actions (dividends, bonuses, rights).

---

## Technical Analysis Engine

### GET `/api/ta/indicators/:symbol`

Calculate all technical indicators for a stock.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | number | 20 | Indicator period |

**Response:**
```json
{
  "symbol": "NABIL",
  "dates": ["2026-04-01", "2026-04-02", ...],
  "sma": { "20": [1128.5, ...], "50": [1095.2, ...] },
  "ema": { "12": [1135.4, ...], "26": [1110.3, ...] },
  "rsi": [58.4, ...],
  "macd": { "macdLine": [...], "signalLine": [...], "histogram": [...] },
  "bollingerBands": { "upper": [...], "middle": [...], "lower": [...], "bandwidth": [...] },
  "stochastic": { "k": [...], "d": [...] },
  "adx": { "adx": [...], "plusDI": [...], "minusDI": [...] },
  "vwap": [1138.6, ...]
}
```

### GET `/api/ta/fibonacci/:symbol`

Calculate Fibonacci retracement levels.

**Response:**
```json
{
  "symbol": "NABIL",
  "high": 1280.00,
  "low": 980.00,
  "isUptrend": true,
  "levels": [
    { "level": "0.0%", "price": 1280.00 },
    { "level": "23.6%", "price": 1209.20 },
    { "level": "38.2%", "price": 1165.40 },
    { "level": "50.0%", "price": 1130.00 },
    { "level": "61.8%", "price": 1094.60 },
    { "level": "78.6%", "price": 1044.20 },
    { "level": "100%", "price": 980.00 }
  ]
}
```

### GET `/api/ta/support-resistance/:symbol`

Detect support and resistance levels using pivot clustering.

### GET `/api/ta/patterns/:symbol`

Detect chart patterns (Head & Shoulders, Double Top/Bottom, Triangles, Flags).

---

## Signal Engine

### GET `/api/signal/signal/:symbol`

Generate a trading signal for a stock.

**Response:**
```json
{
  "symbol": "NABIL",
  "signal": "BUY",
  "confidence": 72.5,
  "score": 68.3,
  "riskLevel": "MEDIUM",
  "reasoning": [
    "RSI at 42.5 approaching oversold - potential rebound",
    "MACD bullish crossover confirmed",
    "Price near support at 1120"
  ],
  "indicators": [
    { "name": "RSI", "signal": "BUY", "weight": 0.15, "reason": "RSI at 42.5" },
    { "name": "MACD", "signal": "BUY", "weight": 0.20, "reason": "Bullish crossover" }
  ],
  "recommendation": "Strong accumulation opportunity near support levels"
}
```

### GET `/api/signal/scan/:type`

Run a stock scanner.

**Path Parameters:** `type` = `swing` | `breakout` | `accumulation` | `smartmoney`

**Response:**
```json
{
  "type": "swing",
  "results": [
    { "symbol": "UPPER", "signal": "BUY", "score": 78, "confidence": 75 }
  ],
  "total": 5,
  "timestamp": "2026-04-29T12:00:00.000Z"
}
```

### POST `/api/signal/assistant`

Smart assistant endpoint for natural language queries.

**Body:**
```json
{ "query": "Should I buy NABIL?" }
```

---

## AI Prediction Engine

### GET `/api/ai/predict/:symbol`

Get price predictions using LSTM model.

**Response:**
```json
{
  "symbol": "NABIL",
  "predictions": [
    { "date": "2026-04-30", "predicted": 1162.50, "low": 1148.00, "high": 1177.00 },
    { "date": "2026-05-01", "predicted": 1168.30, "low": 1150.00, "high": 1186.60 }
  ],
  "model": "lstm",
  "confidence": 0.68
}
```

### GET `/api/ai/trend/:symbol`

Get trend prediction using gradient boosting.

**Response:**
```json
{
  "symbol": "NABIL",
  "direction": "UP",
  "predicted_return": 0.012,
  "confidence": 0.72,
  "probabilities": { "UP": 0.72, "DOWN": 0.28 }
}
```

### POST `/api/ai/train/:symbol`

Trigger model retraining for a stock.

---

## Portfolio Service

### GET `/api/portfolio/portfolio/:userId`

Get user portfolio with holdings, P/L, sector allocation, and risk metrics.

### POST `/api/portfolio/portfolio/:userId/holdings`

Add or merge stock holdings.

**Body:**
```json
{
  "symbol": "NABIL",
  "quantity": 100,
  "average_price": 1050.00
}
```

### POST `/api/portfolio/portfolio/:userId/sell`

Sell stock from portfolio.

**Body:**
```json
{
  "symbol": "NABIL",
  "quantity": 50,
  "sell_price": 1150.00
}
```

---

## Notification Service

### GET `/api/notification/alerts/:userId`

Get user alerts.

### POST `/api/notification/alerts`

Create a new alert.

**Body:**
```json
{
  "user_id": "uuid",
  "symbol": "NABIL",
  "condition_type": "price_above",
  "condition_value": 1200.00
}
```

### GET `/api/notification/notifications/:userId`

Get user notifications.

---

## News & Sentiment Service

### GET `/api/news/news`

Get latest financial news with sentiment analysis.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Number of articles |
| `sentiment` | string | Filter: positive, negative, neutral |

### GET `/api/news/sentiment/:symbol`

Get sentiment analysis for a specific stock.

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "details": "Additional context (optional)"
}
```

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General | 100 requests/minute |
| Auth endpoints | 20 requests/minute |
| Signal generation | 30 requests/minute |
