"""Regression model for trend prediction."""

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, accuracy_score
import joblib
from typing import Optional


class TrendPredictor:
    """Gradient Boosting based trend predictor."""

    def __init__(self):
        self.regressor: Optional[GradientBoostingRegressor] = None
        self.classifier: Optional[RandomForestClassifier] = None
        self.scaler = StandardScaler()

    def train(self, X: np.ndarray, y: np.ndarray) -> dict:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, shuffle=False
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train regressor for returns prediction
        self.regressor = GradientBoostingRegressor(
            n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42
        )
        self.regressor.fit(X_train_scaled, y_train)

        y_pred = self.regressor.predict(X_test_scaled)
        mae = mean_absolute_error(y_test, y_pred)

        # Train classifier for direction
        y_direction_train = (y_train > 0).astype(int)
        y_direction_test = (y_test > 0).astype(int)

        self.classifier = RandomForestClassifier(
            n_estimators=100, max_depth=10, random_state=42
        )
        self.classifier.fit(X_train_scaled, y_direction_train)

        direction_pred = self.classifier.predict(X_test_scaled)
        accuracy = accuracy_score(y_direction_test, direction_pred)

        return {"mae": float(mae), "direction_accuracy": float(accuracy)}

    def predict_trend(self, X: np.ndarray) -> dict:
        if self.regressor is None or self.classifier is None:
            raise RuntimeError("Model not trained")

        X_scaled = self.scaler.transform(X.reshape(1, -1))

        predicted_return = float(self.regressor.predict(X_scaled)[0])
        direction_prob = self.classifier.predict_proba(X_scaled)[0]

        direction = "UP" if predicted_return > 0 else "DOWN"
        confidence = float(max(direction_prob))

        return {
            "predicted_return": predicted_return,
            "direction": direction,
            "confidence": confidence,
            "up_probability": float(direction_prob[1]) if len(direction_prob) > 1 else 0.5,
            "down_probability": float(direction_prob[0]) if len(direction_prob) > 1 else 0.5,
        }

    def save(self, path: str):
        joblib.dump(
            {
                "regressor": self.regressor,
                "classifier": self.classifier,
                "scaler": self.scaler,
            },
            path,
        )

    def load(self, path: str):
        data = joblib.load(path)
        self.regressor = data["regressor"]
        self.classifier = data["classifier"]
        self.scaler = data["scaler"]
