# NEPSE Analytics Platform — Local Development

## Project Structure
Monorepo with:
- `frontend/` — Next.js 14, React 18, Tailwind CSS, Zustand
- `mobile/` — React Native (Expo)
- `services/` — 6 TypeScript microservices + API Gateway
- `services/ai-prediction/` — Python FastAPI (LSTM/ML)
- `services/news-sentiment/` — Python FastAPI (NLP)
- `db/` — PostgreSQL schema and seed data
- `packages/shared/` — Shared TypeScript types/utils

## Frontend Dev Server
```bash
cd frontend && npm install && npm run dev
```
Default port 3000 (falls back to 3001 if 3000 is in use).
All pages use hardcoded demo data — backend services are NOT required for frontend testing.

## Build Verification
```bash
# Frontend
cd frontend && npx next build

# TypeScript services (repeat for each)
cd services/api-gateway && npx tsc --noEmit
cd services/market-data && npx tsc --noEmit
cd services/technical-analysis && npx tsc --noEmit
cd services/signal-engine && npx tsc --noEmit
cd services/portfolio && npx tsc --noEmit
cd services/notification && npx tsc --noEmit

# Python services
python3 -c "import ast; ast.parse(open('services/ai-prediction/app/main.py').read())"
python3 -c "import ast; ast.parse(open('services/news-sentiment/app/main.py').read())"
```

## Full Stack (Docker)
```bash
cp .env.example .env
docker-compose up -d
```
Services: API Gateway (:3000), Market Data (:3001), Technical Analysis (:3002), Signal Engine (:3003), Portfolio (:3004), Notification (:3005), AI Prediction (:8000), News Sentiment (:8001), PostgreSQL (:5432), Redis (:6379).

## Frontend Pages (8 total)
- `/` — Dashboard (indices, gainers/losers, heatmap, volume leaders)
- `/market` — Market Overview (stock table with search/filter)
- `/analysis` — Technical Analysis (indicators, S/R, Fibonacci, patterns)
- `/signals` — Signal Engine (BUY/SELL/HOLD with scoring)
- `/scanner` — Stock Scanners (swing, breakout, accumulation, smart money)
- `/portfolio` — Portfolio (holdings, P/L, sector allocation, transactions)
- `/news` — News & Sentiment (articles with positive/negative/neutral badges)
- `/assistant` — Smart Assistant (chat with keyword-matched responses)

## Testing Notes
- No automated test suite configured
- All frontend pages render with hardcoded sample data (no API calls needed)
- Header shows "Demo Mode" when no user is logged in
- Sidebar collapses via hamburger toggle in the header
