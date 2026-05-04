"""AI Prediction Engine - FastAPI Application."""

import os
import numpy as np
import pandas as pd
import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from .features.feature_engineering import (
    compute_technical_features,
    prepare_lstm_data,
    prepare_regression_data,
)
from .models.lstm_model import LSTMPredictor
from .models.regression_model import TrendPredictor

app = FastAPI(title="NEPSE AI Prediction Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model cache
lstm_models: dict = {}
trend_models: dict = {}


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        user=os.getenv("POSTGRES_USER", "nepse_user"),
        password=os.getenv("POSTGRES_PASSWORD", "change_me_in_production"),
        database=os.getenv("POSTGRES_DB", "nepse_analytics"),
    )


def fetch_stock_data(symbol: str, days: int = 365) -> pd.DataFrame:
    conn = get_db_connection()
    query = """
        SELECT o.date, o.open, o.high, o.low, o.close, o.volume, o.turnover
        FROM ohlc_daily o
        JOIN stocks s ON s.id = o.stock_id
        WHERE s.symbol = %s
        ORDER BY o.date ASC
        LIMIT %s
    """
    df = pd.read_sql(query, conn, params=[symbol.upper(), days])
    conn.close()
    return df


class PredictionRequest(BaseModel):
    symbol: str
    days_ahead: int = 5


class TrainRequest(BaseModel):
    symbol: str
    epochs: int = 50


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-prediction"}


@app.get("/api/predict/{symbol}")
async def predict_price(symbol: str, days_ahead: int = 5):
    """Predict future price range for a stock."""
    try:
        df = fetch_stock_data(symbol, 365)
        if len(df) < 60:
            raise HTTPException(
                status_code=400, detail="Insufficient data for prediction"
            )

        features = compute_technical_features(df)

        # Train or use cached model
        if symbol.upper() not in lstm_models:
            X, y, feature_cols = prepare_lstm_data(features, "close", lookback=30)
            if len(X) < 10:
                raise HTTPException(
                    status_code=400, detail="Not enough data points for training"
                )

            model = LSTMPredictor(lookback=30, epochs=30, batch_size=16)
            training_result = model.train(X, y)
            lstm_models[symbol.upper()] = model

        model = lstm_models[symbol.upper()]

        # Get features for prediction
        X, y, feature_cols = prepare_lstm_data(features, "close", lookback=30)
        last_sequence = X[-1]
        predictions = model.predict_next(last_sequence, n_days=days_ahead)

        current_price = float(df["close"].iloc[-1])
        pred_range = {
            "low": min(predictions) * 0.97,
            "high": max(predictions) * 1.03,
            "mean": float(np.mean(predictions)),
        }

        return {
            "symbol": symbol.upper(),
            "current_price": current_price,
            "predictions": [
                {
                    "day": i + 1,
                    "predicted_price": round(p, 2),
                    "change_percent": round(((p - current_price) / current_price) * 100, 2),
                }
                for i, p in enumerate(predictions)
            ],
            "price_range": {
                "low": round(pred_range["low"], 2),
                "high": round(pred_range["high"], 2),
                "mean": round(pred_range["mean"], 2),
            },
            "disclaimer": "AI predictions are for educational purposes only. Do not base investment decisions solely on these predictions.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/api/trend/{symbol}")
async def predict_trend(symbol: str):
    """Predict trend direction for a stock."""
    try:
        df = fetch_stock_data(symbol, 365)
        if len(df) < 60:
            raise HTTPException(
                status_code=400, detail="Insufficient data for trend analysis"
            )

        features = compute_technical_features(df)

        if symbol.upper() not in trend_models:
            X, y, feature_cols = prepare_regression_data(features, "returns")

            # Remove any NaN/Inf
            mask = np.isfinite(X).all(axis=1) & np.isfinite(y)
            X = X[mask]
            y = y[mask]

            if len(X) < 30:
                raise HTTPException(
                    status_code=400, detail="Not enough valid data points"
                )

            model = TrendPredictor()
            training_result = model.train(X, y)
            trend_models[symbol.upper()] = (model, training_result)

        model, training_info = trend_models[symbol.upper()]

        # Predict using latest features
        X, y, feature_cols = prepare_regression_data(features, "returns")
        mask = np.isfinite(X).all(axis=1)
        X = X[mask]

        if len(X) == 0:
            raise HTTPException(status_code=400, detail="No valid features for prediction")

        latest_features = X[-1]
        trend = model.predict_trend(latest_features)

        return {
            "symbol": symbol.upper(),
            "trend": trend,
            "model_accuracy": training_info.get("direction_accuracy", 0),
            "disclaimer": "Trend predictions are probabilistic and should not be the sole basis for trading decisions.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trend prediction failed: {str(e)}")


@app.post("/api/train/{symbol}")
async def train_model(symbol: str, epochs: int = 50):
    """Train/retrain models for a stock."""
    try:
        df = fetch_stock_data(symbol, 500)
        if len(df) < 60:
            raise HTTPException(
                status_code=400, detail="Insufficient data for training"
            )

        features = compute_technical_features(df)

        # Train LSTM
        X_lstm, y_lstm, _ = prepare_lstm_data(features, "close", lookback=30)
        lstm = LSTMPredictor(lookback=30, epochs=epochs, batch_size=16)
        lstm_result = lstm.train(X_lstm, y_lstm)
        lstm_models[symbol.upper()] = lstm

        # Train Trend
        X_reg, y_reg, _ = prepare_regression_data(features, "returns")
        mask = np.isfinite(X_reg).all(axis=1) & np.isfinite(y_reg)
        X_reg = X_reg[mask]
        y_reg = y_reg[mask]

        trend = TrendPredictor()
        trend_result = trend.train(X_reg, y_reg)
        trend_models[symbol.upper()] = (trend, trend_result)

        return {
            "symbol": symbol.upper(),
            "lstm": lstm_result,
            "trend": trend_result,
            "data_points": len(df),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
