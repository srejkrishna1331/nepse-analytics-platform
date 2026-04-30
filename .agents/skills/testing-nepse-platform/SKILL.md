# Testing NEPSE Analytics Platform

## Overview
The NEPSE Analytics Platform is a full-stack monorepo with a Next.js frontend and multiple Express/TypeScript microservices. Testing involves running services locally and verifying both backend endpoints and frontend UI.

## Devin Secrets Needed
No secrets required for local testing. The platform uses public NEPSE APIs.

## Environment Setup

### Prerequisites
- Redis must be running: `redis-server --daemonize yes && redis-cli ping`
- If Redis is not installed: `sudo apt-get install -y redis-server`
- Node.js dependencies installed in each service directory

### Starting Services

**Market Data Service** (default port 3001, configurable via `MARKET_DATA_PORT`):
```bash
cd services/market-data
MARKET_DATA_PORT=3002 npx ts-node-dev --respawn --transpile-only src/index.ts
```

**Frontend** (Next.js dev server):
```bash
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:3002 npm run dev -- -p 3001
```

**Important:** The market-data service and frontend both default to port 3001. When running locally without Docker, assign different ports (e.g., market-data on 3002, frontend on 3001).

### Port Configuration
| Service | Default Port | Local Testing Port |
|---------|-------------|-------------------|
| API Gateway | 3000 | 3000 |
| Market Data | 3001 | 3002 |
| Frontend | 3000/3001 | 3001 |
| Redis | 6379 | 6379 |
| PostgreSQL | 5432 | 5432 |

## NEPSE API Constraints

- The NEPSE API at `nepalstock.com/api/nots` may be unreachable from non-Nepal networks (SSL cert verification failures, geo-restrictions)
- The fallback API at `newweb.nepalstock.com.np` may have DNS resolution issues
- When testing from outside Nepal, expect the API to fail — test the **graceful degradation path** instead
- The frontend falls back to hardcoded sample data when the API is unreachable
- NEPSE trading hours: Sun-Thu 11:00-15:00 NPT (UTC+5:45). The `/api/live/status` endpoint returns `isOpen: true` during these hours based on time calculation, regardless of API connectivity

## Backend Testing

Test the 5 market data endpoints via curl:
```bash
# Health check
curl -s http://localhost:3002/health

# Live market data (returns empty array when NEPSE unreachable)
curl -s http://localhost:3002/api/live | python3 -m json.tool

# Single stock (returns 404 when no live data)
curl -s http://localhost:3002/api/stock/NABIL

# OHLC data with optional days parameter
curl -s 'http://localhost:3002/api/ohlc/NABIL?days=30' | python3 -m json.tool

# Market status
curl -s http://localhost:3002/api/live/status

# Indices
curl -s http://localhost:3002/api/live/indices
```

### Expected Responses When NEPSE API Is Unreachable
- `/api/live` → `{marketOpen: bool, count: 0, lastUpdated: "...", data: []}`
- `/api/stock/:symbol` → `{error: "Stock SYMBOL not found"}` (HTTP 404)
- `/api/ohlc/:symbol` → `{symbol: "...", days: N, count: 0, data: []}`
- `/api/live/status` → `{isOpen: bool, timestamp: "..."}` (based on time, not API)
- `/api/live/indices` → `[]`

### Verifying Retry/Fallback System
Check the market-data service console output for:
- `[NepseClient] Attempt 1/2 failed for ...` — retry system working
- `[NepseClient] Switched to fallback source` — source switching after threshold failures
- `[Poller] Market open — fetching live data` — polling scheduler active

## Frontend Testing

### Dashboard Page (`/`)
- When API returns empty data: shows sample stocks (NEPSE index "2285.50")
- "Live Data" indicator (green pulsing dot) should NOT appear when using sample data
- "Demo Mode" text appears in the header when no live data is available
- Top Gainers, Top Losers, Sector Heatmap, Volume Leaders all render with sample data

### Market Page (`/market`)
- Shows 10 sample stocks when API is unreachable
- Search filter: type in the search box to filter by symbol/name
- Sector dropdown: filter by sector (e.g., "Hydro Power" shows UPPER + CHCL)
- Stock count updates dynamically with filters
- No "Live" badge should appear when using sample data

### Browser Autocomplete Issue
Chrome may autocomplete the search field with previously typed values. If this happens:
- Use Playwright via CDP to programmatically clear the field:
  ```python
  from playwright.sync_api import sync_playwright
  with sync_playwright() as p:
      browser = p.chromium.connect_over_cdp('http://localhost:29229')
      page = browser.contexts[0].pages[-1]
      page.locator('input[placeholder="Search stocks..."]').fill('')
  ```

## Redis Verification

When NEPSE API is unreachable, Redis cache keys will NOT be populated (the service correctly avoids caching empty results). To verify Redis is working:
```bash
redis-cli ping  # Should return PONG
redis-cli keys "market:*"  # Empty when no live data
```

When live data IS available, expect keys like `market:live`, `market:status` with TTLs of 30-60 seconds.

## Build Verification

```bash
# TypeScript services
cd services/market-data && npx tsc --noEmit
cd services/api-gateway && npx tsc --noEmit
# ... repeat for other services

# Frontend production build
cd frontend && npx next build
```

## Common Issues

1. **Port conflict**: Market-data and frontend both default to 3001. Use `MARKET_DATA_PORT=3002` for the service.
2. **SSL errors from NEPSE API**: Expected from outside Nepal. The retry system handles this gracefully.
3. **React state not clearing on navigation**: Next.js client-side navigation may preserve component state. Hard-refresh or use Playwright to reset.
4. **Redis not installed**: Run `sudo apt-get install -y redis-server` then `redis-server --daemonize yes`.
