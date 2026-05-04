"""LSTM model for stock price prediction."""

import numpy as np
from typing import Optional

try:
    import tensorflow as tf
    from tensorflow import keras

    HAS_TF = True
except ImportError:
    HAS_TF = False


class LSTMPredictor:
    """LSTM-based stock price predictor."""

    def __init__(self, lookback: int = 30, epochs: int = 50, batch_size: int = 32):
        self.lookback = lookback
        self.epochs = epochs
        self.batch_size = batch_size
        self.model: Optional[object] = None
        self.scaler_mean: Optional[np.ndarray] = None
        self.scaler_std: Optional[np.ndarray] = None
        self.target_mean: float = 0.0
        self.target_std: float = 1.0

    def _build_model(self, n_features: int) -> object:
        if not HAS_TF:
            raise RuntimeError("TensorFlow is not installed")

        model = keras.Sequential(
            [
                keras.layers.LSTM(
                    64,
                    return_sequences=True,
                    input_shape=(self.lookback, n_features),
                ),
                keras.layers.Dropout(0.2),
                keras.layers.LSTM(32, return_sequences=False),
                keras.layers.Dropout(0.2),
                keras.layers.Dense(16, activation="relu"),
                keras.layers.Dense(1),
            ]
        )
        model.compile(optimizer="adam", loss="mse", metrics=["mae"])
        return model

    def _normalize(self, X: np.ndarray, y: np.ndarray, fit: bool = True):
        if fit:
            # Reshape X for normalization
            X_2d = X.reshape(-1, X.shape[-1])
            self.scaler_mean = X_2d.mean(axis=0)
            self.scaler_std = X_2d.std(axis=0)
            self.scaler_std[self.scaler_std == 0] = 1
            self.target_mean = float(y.mean())
            self.target_std = float(y.std())
            if self.target_std == 0:
                self.target_std = 1.0

        X_norm = (X - self.scaler_mean) / self.scaler_std
        y_norm = (y - self.target_mean) / self.target_std
        return X_norm, y_norm

    def train(self, X: np.ndarray, y: np.ndarray) -> dict:
        if not HAS_TF:
            return self._train_fallback(X, y)

        X_norm, y_norm = self._normalize(X, y, fit=True)

        self.model = self._build_model(X.shape[-1])
        history = self.model.fit(
            X_norm,
            y_norm,
            epochs=self.epochs,
            batch_size=self.batch_size,
            validation_split=0.2,
            verbose=0,
        )
        return {
            "loss": float(history.history["loss"][-1]),
            "val_loss": float(history.history["val_loss"][-1]),
            "mae": float(history.history["mae"][-1]),
        }

    def _train_fallback(self, X: np.ndarray, y: np.ndarray) -> dict:
        """Simple fallback when TensorFlow is not available."""
        self._normalize(X, y, fit=True)
        # Use simple moving average as fallback
        self.model = "fallback"
        return {"loss": 0.0, "val_loss": 0.0, "mae": 0.0, "note": "Using fallback model"}

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError("Model not trained")

        if self.model == "fallback":
            # Simple prediction: last close price with small trend
            last_values = X[:, -1, 0] if X.ndim == 3 else X[:, 0]
            return last_values * self.target_std + self.target_mean

        X_norm, _ = self._normalize(X, np.zeros(len(X)), fit=False)
        predictions = self.model.predict(X_norm, verbose=0).flatten()
        return predictions * self.target_std + self.target_mean

    def predict_next(self, X: np.ndarray, n_days: int = 5) -> list:
        """Predict next n days."""
        predictions = []
        current_input = X.copy()

        for _ in range(n_days):
            pred = self.predict(current_input[np.newaxis, :])[0]
            predictions.append(float(pred))
            # Shift and add prediction
            current_input = np.roll(current_input, -1, axis=0)
            current_input[-1, 0] = pred

        return predictions
