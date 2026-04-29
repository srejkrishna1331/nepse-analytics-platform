"""Feature engineering for ML models."""

import numpy as np
import pandas as pd


def compute_technical_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute technical indicator features from OHLCV data."""
    features = df.copy()

    # Price-based features
    features["returns"] = features["close"].pct_change()
    features["log_returns"] = np.log(features["close"] / features["close"].shift(1))

    # Moving averages
    for period in [5, 10, 20, 50]:
        features[f"sma_{period}"] = features["close"].rolling(window=period).mean()
        features[f"ema_{period}"] = features["close"].ewm(span=period, adjust=False).mean()
        features[f"sma_ratio_{period}"] = features["close"] / features[f"sma_{period}"]

    # RSI
    delta = features["close"].diff()
    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss.replace(0, np.nan)
    features["rsi"] = 100 - (100 / (1 + rs))

    # MACD
    ema12 = features["close"].ewm(span=12, adjust=False).mean()
    ema26 = features["close"].ewm(span=26, adjust=False).mean()
    features["macd"] = ema12 - ema26
    features["macd_signal"] = features["macd"].ewm(span=9, adjust=False).mean()
    features["macd_histogram"] = features["macd"] - features["macd_signal"]

    # Bollinger Bands
    bb_sma = features["close"].rolling(window=20).mean()
    bb_std = features["close"].rolling(window=20).std()
    features["bb_upper"] = bb_sma + 2 * bb_std
    features["bb_lower"] = bb_sma - 2 * bb_std
    features["bb_width"] = (features["bb_upper"] - features["bb_lower"]) / bb_sma
    features["bb_pct"] = (features["close"] - features["bb_lower"]) / (
        features["bb_upper"] - features["bb_lower"]
    )

    # Volume features
    features["volume_sma"] = features["volume"].rolling(window=20).mean()
    features["volume_ratio"] = features["volume"] / features["volume_sma"]

    # Volatility
    features["volatility_10"] = features["returns"].rolling(window=10).std()
    features["volatility_20"] = features["returns"].rolling(window=20).std()

    # Price range
    features["high_low_range"] = (features["high"] - features["low"]) / features["close"]
    features["open_close_range"] = (features["close"] - features["open"]) / features["open"]

    # Momentum
    features["momentum_5"] = features["close"] / features["close"].shift(5) - 1
    features["momentum_10"] = features["close"] / features["close"].shift(10) - 1

    # Fill NaN
    features = features.fillna(method="bfill").fillna(0)

    return features


def prepare_lstm_data(
    features: pd.DataFrame, target_col: str = "close", lookback: int = 30
):
    """Prepare sequences for LSTM model."""
    feature_cols = [
        c
        for c in features.columns
        if c not in ["date", "symbol", "stock_id", target_col]
    ]

    data = features[feature_cols].values
    target = features[target_col].values

    X, y = [], []
    for i in range(lookback, len(data)):
        X.append(data[i - lookback : i])
        y.append(target[i])

    return np.array(X), np.array(y), feature_cols


def prepare_regression_data(features: pd.DataFrame, target_col: str = "returns"):
    """Prepare data for regression model."""
    feature_cols = [
        c
        for c in features.columns
        if c
        not in ["date", "symbol", "stock_id", "close", "open", "high", "low", target_col]
    ]

    X = features[feature_cols].values
    y = features[target_col].values

    return X, y, feature_cols
