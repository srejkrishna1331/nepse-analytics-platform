"""News & Sentiment Engine - FastAPI Application."""

import os
from datetime import datetime
import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .scrapers.news_scraper import scrape_news, extract_related_symbols
from .nlp.sentiment import analyze_sentiment

app = FastAPI(title="NEPSE News & Sentiment Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        user=os.getenv("POSTGRES_USER", "nepse_user"),
        password=os.getenv("POSTGRES_PASSWORD", "change_me_in_production"),
        database=os.getenv("POSTGRES_DB", "nepse_analytics"),
    )


def get_known_symbols() -> list[str]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT symbol FROM stocks WHERE active = true")
    symbols = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()
    return symbols


@app.get("/health")
async def health():
    return {"status": "ok", "service": "news-sentiment"}


@app.get("/api/news")
async def get_news(limit: int = 20, symbol: str = None):
    """Get latest news with sentiment analysis."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        if symbol:
            cur.execute(
                """SELECT id, title, source, url, published_at, sentiment,
                          sentiment_score, related_symbols, summary
                   FROM news
                   WHERE %s = ANY(related_symbols)
                   ORDER BY published_at DESC
                   LIMIT %s""",
                (symbol.upper(), limit),
            )
        else:
            cur.execute(
                """SELECT id, title, source, url, published_at, sentiment,
                          sentiment_score, related_symbols, summary
                   FROM news
                   ORDER BY published_at DESC
                   LIMIT %s""",
                (limit,),
            )

        columns = [desc[0] for desc in cur.description]
        rows = [dict(zip(columns, row)) for row in cur.fetchall()]
        cur.close()
        conn.close()

        return {"news": rows, "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch news: {str(e)}")


@app.post("/api/news/scrape")
async def scrape_and_store():
    """Scrape fresh news, analyze sentiment, and store."""
    try:
        known_symbols = get_known_symbols()
        articles = scrape_news("sharesansar", max_articles=20)

        conn = get_db_connection()
        cur = conn.cursor()
        stored = 0

        for article in articles:
            full_text = f"{article['title']} {article.get('summary', '')}"
            sentiment_result = analyze_sentiment(full_text)
            related_symbols = extract_related_symbols(full_text, known_symbols)

            try:
                cur.execute(
                    """INSERT INTO news (title, source, url, published_at, sentiment,
                              sentiment_score, related_symbols, summary)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT DO NOTHING""",
                    (
                        article["title"],
                        article["source"],
                        article["url"],
                        datetime.now(),
                        sentiment_result["sentiment"],
                        sentiment_result["score"],
                        related_symbols,
                        article.get("summary", ""),
                    ),
                )
                stored += 1
            except Exception as e:
                print(f"Error storing article: {e}")

        conn.commit()
        cur.close()
        conn.close()

        return {"scraped": len(articles), "stored": stored}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")


class SentimentRequest(BaseModel):
    text: str


@app.post("/api/sentiment/analyze")
async def analyze_text_sentiment(request: SentimentRequest):
    """Analyze sentiment of custom text."""
    result = analyze_sentiment(request.text)
    return result


@app.get("/api/sentiment/market")
async def market_sentiment():
    """Get overall market sentiment from recent news."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """SELECT sentiment, COUNT(*) as count, AVG(sentiment_score) as avg_score
               FROM news
               WHERE published_at > NOW() - INTERVAL '7 days'
               GROUP BY sentiment"""
        )

        results = {}
        total = 0
        for row in cur.fetchall():
            results[row[0]] = {"count": row[1], "avg_score": float(row[2]) if row[2] else 0}
            total += row[1]

        cur.close()
        conn.close()

        positive = results.get("positive", {}).get("count", 0)
        negative = results.get("negative", {}).get("count", 0)

        overall = "neutral"
        if positive > negative * 1.5:
            overall = "bullish"
        elif negative > positive * 1.5:
            overall = "bearish"

        return {
            "overall_sentiment": overall,
            "breakdown": results,
            "total_articles": total,
            "period": "7 days",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get market sentiment: {str(e)}"
        )
