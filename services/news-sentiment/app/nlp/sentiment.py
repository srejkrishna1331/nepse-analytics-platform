"""Sentiment analysis for financial news."""

from typing import Literal

# Financial sentiment keywords
POSITIVE_WORDS = {
    "profit", "growth", "gain", "rally", "surge", "bullish", "upgrade",
    "dividend", "bonus", "record", "expansion", "recovery", "strong",
    "outperform", "buy", "accumulate", "positive", "rise", "increase",
    "improved", "higher", "up", "growing", "breakthrough", "success",
}

NEGATIVE_WORDS = {
    "loss", "decline", "fall", "drop", "bearish", "downgrade", "crash",
    "deficit", "default", "weak", "underperform", "sell", "negative",
    "decrease", "lower", "down", "shrink", "concern", "risk", "warning",
    "penalty", "fraud", "scam", "bankruptcy", "layoff", "debt",
}

INTENSIFIERS = {
    "very", "extremely", "significantly", "sharply", "dramatically",
    "massive", "huge", "substantial", "remarkable", "exceptional",
}


def analyze_sentiment(
    text: str,
) -> dict:
    """Analyze sentiment of financial text using keyword-based approach."""
    words = text.lower().split()
    word_set = set(words)

    positive_count = len(word_set & POSITIVE_WORDS)
    negative_count = len(word_set & NEGATIVE_WORDS)
    intensifier_count = len(word_set & INTENSIFIERS)

    # Apply intensifier multiplier
    multiplier = 1 + (intensifier_count * 0.2)

    if positive_count > negative_count:
        sentiment: Literal["positive", "negative", "neutral"] = "positive"
        score = min(1.0, (positive_count - negative_count) / max(len(words) * 0.1, 1) * multiplier)
    elif negative_count > positive_count:
        sentiment = "negative"
        score = max(-1.0, -(negative_count - positive_count) / max(len(words) * 0.1, 1) * multiplier)
    else:
        sentiment = "neutral"
        score = 0.0

    return {
        "sentiment": sentiment,
        "score": round(score, 4),
        "positive_words": list(word_set & POSITIVE_WORDS),
        "negative_words": list(word_set & NEGATIVE_WORDS),
    }


def batch_analyze(texts: list[str]) -> list[dict]:
    """Analyze sentiment of multiple texts."""
    return [analyze_sentiment(text) for text in texts]
