-- NEPSE Analytics Platform - Initial Database Schema

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Stocks
CREATE TABLE stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    listed_shares BIGINT,
    isin VARCHAR(50),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stocks_symbol ON stocks(symbol);
CREATE INDEX idx_stocks_sector ON stocks(sector);

-- OHLC Daily Data
CREATE TABLE ohlc_daily (
    id BIGSERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    open DECIMAL(12,2) NOT NULL,
    high DECIMAL(12,2) NOT NULL,
    low DECIMAL(12,2) NOT NULL,
    close DECIMAL(12,2) NOT NULL,
    volume BIGINT NOT NULL DEFAULT 0,
    turnover DECIMAL(18,2) DEFAULT 0,
    num_transactions INTEGER DEFAULT 0,
    UNIQUE(stock_id, date)
);

CREATE INDEX idx_ohlc_daily_stock_date ON ohlc_daily(stock_id, date DESC);
CREATE INDEX idx_ohlc_daily_date ON ohlc_daily(date DESC);

-- Intraday Ticks
CREATE TABLE intraday_ticks (
    id BIGSERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    price DECIMAL(12,2) NOT NULL,
    volume BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_intraday_stock_time ON intraday_ticks(stock_id, timestamp DESC);

-- Market Indices
CREATE TABLE market_indices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    change DECIMAL(12,2),
    change_percent DECIMAL(8,4),
    turnover DECIMAL(18,2),
    volume BIGINT,
    UNIQUE(name, date)
);

CREATE INDEX idx_market_indices_name_date ON market_indices(name, date DESC);

-- Corporate Actions
CREATE TABLE corporate_actions (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bonus', 'dividend', 'right', 'split', 'merger')),
    ratio DECIMAL(10,4),
    amount DECIMAL(12,2),
    book_close_date DATE,
    announcement_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_corporate_actions_stock ON corporate_actions(stock_id);

-- Portfolios
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) DEFAULT 'My Portfolio',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_portfolios_user ON portfolios(user_id);

-- Portfolio Holdings
CREATE TABLE portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    avg_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, stock_id)
);

CREATE INDEX idx_holdings_portfolio ON portfolio_holdings(portfolio_id);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    commission DECIMAL(12,2) DEFAULT 0,
    dp_charge DECIMAL(12,2) DEFAULT 0,
    sebon_fee DECIMAL(12,2) DEFAULT 0,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_portfolio ON transactions(portfolio_id);

-- Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('price', 'indicator', 'breakout', 'news')),
    condition_field VARCHAR(50) NOT NULL,
    condition_operator VARCHAR(20) NOT NULL,
    condition_value DECIMAL(12,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_active ON alerts(active) WHERE active = true;

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('alert', 'signal', 'news', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = false;

-- Signals Log
CREATE TABLE signals_log (
    id BIGSERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    signal VARCHAR(10) NOT NULL CHECK (signal IN ('BUY', 'SELL', 'HOLD')),
    confidence DECIMAL(5,2) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    reasoning JSONB NOT NULL,
    indicators JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signals_log_stock ON signals_log(stock_id, created_at DESC);

-- News
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    source VARCHAR(255),
    url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    sentiment_score DECIMAL(5,4),
    related_symbols TEXT[],
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_news_published ON news(published_at DESC);
CREATE INDEX idx_news_symbols ON news USING GIN(related_symbols);

-- Watchlists
CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    stock_ids INTEGER[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_watchlists_user ON watchlists(user_id);

-- Backtest Results
CREATE TABLE backtest_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy TEXT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_trades INTEGER,
    win_rate DECIMAL(5,2),
    profit_percent DECIMAL(10,2),
    max_drawdown DECIMAL(10,2),
    sharpe_ratio DECIMAL(8,4),
    trades JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_backtest_user ON backtest_results(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON portfolio_holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
