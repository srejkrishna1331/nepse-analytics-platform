# NEPSE Analytics Platform

A production-grade Nepal Stock Exchange (NEPSE) analytics platform with real-time market data, technical analysis, AI-powered predictions, and intelligent trading signals.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)              │
│                    Mobile (React Native / Expo)       │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│                   API Gateway (:3000)                 │
│           JWT Auth · Rate Limiting · Routing          │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬────────┘
   │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐
│Mkt  ││ TA  ││ Sig ││Port ││Notif││ AI  ││News │
│Data ││     ││ Eng ││folio││     ││Pred ││Sent │
│:3001││:3002││:3003││:3004││:3005││:8000││:8001│
└──┬──┘└─────┘└─────┘└─────┘└─────┘└──┬──┘└──┬──┘
   │                                    │      │
   ▼                                    ▼      ▼
┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │    Redis     │
│   :5432      │  │    :6379     │
└──────────────┘  └──────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Zustand |
| Mobile | React Native (Expo) |
| Backend | Express.js (TypeScript), Node.js 20 |
| AI Engine | Python 3.11, FastAPI, TensorFlow, scikit-learn |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Deployment | Docker & Docker Compose |

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3000 | JWT authentication, rate limiting, request routing |
| Market Data | 3001 | NEPSE data scraping, OHLC storage, Redis caching |
| Technical Analysis | 3002 | SMA, EMA, RSI, MACD, Bollinger, Stochastic, ADX, VWAP, Fibonacci |
| Signal Engine | 3003 | Rule-based + weighted scoring signals, scanners, smart assistant |
| Portfolio | 3004 | Holdings, P/L calculation, sector allocation, risk exposure |
| Notification | 3005 | Price/indicator/breakout alerts, web push |
| AI Prediction | 8000 | LSTM price prediction, gradient boosting trend analysis |
| News & Sentiment | 8001 | News scraping, NLP sentiment analysis |
| Frontend | 3010 | Next.js web dashboard |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for AI services)

### 1. Clone and configure

```bash
git clone <repo-url>
cd nepse-analytics-platform
cp .env.example .env
```

### 2. Start with Docker Compose

```bash
docker-compose up -d
```

This starts all services including PostgreSQL and Redis. The database is auto-initialized with schema and sample data.

### 3. Access the platform

- **Web Dashboard**: http://localhost:3010
- **API Gateway**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

### Local Development

```bash
# Install dependencies for a specific service
cd services/api-gateway && npm install

# Run in development mode
npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## API Documentation

See [docs/API.md](docs/API.md) for full API reference.

### Quick Reference

```bash
# Register
POST /api/auth/register { "email": "...", "password": "...", "name": "..." }

# Login
POST /api/auth/login { "email": "...", "password": "..." }

# Market Data
GET /api/market/stocks
GET /api/market/stocks/:symbol/ohlc?period=30
GET /api/market/indices
GET /api/market/summary
GET /api/market/top/gainers

# Technical Analysis
GET /api/ta/indicators/:symbol?period=20
GET /api/ta/fibonacci/:symbol
GET /api/ta/support-resistance/:symbol
GET /api/ta/patterns/:symbol

# Signals
GET /api/signal/signal/:symbol
GET /api/signal/scan/swing
GET /api/signal/scan/breakout

# AI Predictions
GET /api/ai/predict/:symbol
GET /api/ai/trend/:symbol

# Portfolio
GET /api/portfolio/portfolio/:userId
POST /api/portfolio/portfolio/:userId/holdings

# News
GET /api/news/news
GET /api/news/sentiment/:symbol
```

## Features

### Technical Indicators (Built from Scratch)
- Simple, Exponential, and Weighted Moving Averages
- Relative Strength Index (RSI)
- MACD with Signal Line and Histogram
- Bollinger Bands with %B and Bandwidth
- Stochastic Oscillator (%K, %D)
- Average Directional Index (ADX, +DI, -DI)
- Volume Weighted Average Price (VWAP)
- Fibonacci Retracement Levels

### Chart Pattern Detection
- Head & Shoulders / Inverse Head & Shoulders
- Double Top / Double Bottom
- Triangle (Symmetric, Ascending, Descending)
- Flag & Pennant with volume confirmation
- Volume Breakout / Breakdown detection

### Signal Engine
- Weighted multi-indicator scoring (0-100)
- Confidence calculation with risk assessment
- Conflict detection for signal reliability
- Signal types: BUY, SELL, HOLD with reasoning

### Stock Scanners
- Swing Trading Scanner
- Breakout Scanner
- Accumulation Detection
- Smart Money Flow Detection

### AI Prediction
- LSTM neural network for price prediction
- Gradient Boosting for trend direction
- Feature engineering with 20+ technical features
- Multi-day forward prediction with confidence ranges

### Portfolio Management
- Real-time P/L calculation
- Average price tracking with merge logic
- Sector allocation analysis
- Risk exposure assessment with warnings

## Database Schema

20+ tables including:
- `users` - Authentication and profiles
- `stocks` - NEPSE listed companies
- `ohlc_daily` - Daily OHLC price data
- `intraday_ticks` - Intraday tick data
- `market_indices` - Index data (NEPSE, SENSITIVE, etc.)
- `portfolios` / `portfolio_holdings` - User portfolios
- `signals_log` - Signal generation history
- `alerts` / `notifications` - Alert system
- `news` - Financial news with sentiment
- `backtest_results` - Strategy backtesting

## Security

- JWT token authentication
- bcrypt password hashing (10 rounds)
- Rate limiting (100 req/min general, 20 req/min auth)
- CORS configuration
- Helmet.js security headers
- Input validation and sanitization

## Project Structure

```
nepse-analytics-platform/
├── frontend/                 # Next.js 14 web application
├── mobile/                   # React Native (Expo) mobile app
├── services/
│   ├── api-gateway/          # Express.js API Gateway
│   ├── market-data/          # Market data service
│   ├── technical-analysis/   # Technical indicator engine
│   ├── signal-engine/        # Signal generation engine
│   ├── ai-prediction/        # Python FastAPI ML service
│   ├── portfolio/            # Portfolio management
│   ├── notification/         # Alert & notification service
│   └── news-sentiment/       # News scraping & sentiment
├── packages/
│   └── shared/               # Shared types & utilities
├── db/
│   ├── migrations/           # SQL schema migrations
│   └── seed/                 # Sample data
├── docs/                     # API documentation
├── docker-compose.yml        # Docker orchestration
└── .env.example              # Environment template
```

## Disclaimer

This platform provides analytical tools and signals for **educational purposes only**. All trading decisions are made at your own risk. Past performance does not guarantee future results. Always conduct your own research before making investment decisions.

## License

MIT
