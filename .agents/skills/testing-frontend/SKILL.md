# Testing NEPSE Analytics Platform Frontend

## Setup

1. Install dependencies: `cd frontend && npm install`
2. Start dev server: `npm run dev` (runs on port 3000, or 3001 if 3000 is occupied)
3. Verify server is up: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/`

**Important:** If Tailwind styles are not rendering (you see unstyled HTML with large SVG icons), restart the dev server. This can happen when new pages were added since the last server start.

## Frontend Pages (13 total)

### Original 8 Pages
| Route | Page | Key Elements |
|-------|------|-------------|
| `/` | Dashboard | NEPSE index value, market summary cards |
| `/market` | Market | Stock table with search/filter |
| `/analysis` | Analysis | Technical indicator charts |
| `/signals` | Signals | BUY/SELL signals with confidence % |
| `/scanner` | Scanner | Swing/breakout/accumulation scanners |
| `/portfolio` | Portfolio | Holdings, P/L calculations |
| `/news` | News | News feed with sentiment tags |
| `/assistant` | Assistant | Chat interface, responds to stock queries |

### 5 Advanced Analysis Pages
| Route | Page | Key Interactive Elements |
|-------|------|------------------------|
| `/smc` | Smart Money Concepts | 3 tabs (Order Blocks, Liquidity Zones, Fair Value Gaps) |
| `/market-structure` | Market Structure | Timeframe selector (1D/4H/1H), Wyckoff cycle |
| `/risk` | Risk Management | Position sizing calculator with reactive inputs |
| `/behavioral` | Behavioral Finance | Signal filter buttons (All/Panic/FOMO/Capitulation/Euphoria) |
| `/strategy` | Strategy Builder | Toggle between Edit Strategy and Run Backtest modes |

## Testing Tips

### Risk Management Calculator
The calculator is fully reactive — changing any input immediately recalculates all outputs. Good test: change Stop Loss from default 1120 to 1100 and verify Position Size changes from 666 to 400 shares.

### Strategy Builder
Click "Run Backtest" to toggle from edit mode to backtest results view. Click "Edit Strategy" to go back. The strategy name input persists between views.

### Behavioral Finance Filters
Filter buttons isolate signals by type. When a filter is active (e.g., FOMO), only matching signals appear. Click "All Signals" to reset.

### SMC Page Tabs
Each tab (Order Blocks, Liquidity Zones, Fair Value Gaps) shows different data. The summary cards at the top remain constant across tabs.

### Sidebar Navigation
All 13 pages are accessible via the sidebar. The active page is highlighted. The sidebar can be collapsed via the hamburger menu icon in the header.

## Build Verification

```bash
# TypeScript check for backend services
cd services/technical-analysis && npx tsc --noEmit
cd services/signal-engine && npx tsc --noEmit

# Frontend build
cd frontend && npx next build
```

## Devin Secrets Needed

No secrets are required for frontend-only testing. All pages use hardcoded demo data.

For full-stack testing with Docker Compose, a `.env` file would be needed (copy from `.env.example`).
