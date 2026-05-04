"""News scraper for NEPSE-related financial news."""

import requests
from bs4 import BeautifulSoup
from typing import Optional
import time

SOURCES = {
    "sharesansar": {
        "url": "https://www.sharesansar.com/category/latest",
        "selector": "div.featured-news-list",
    },
    "merolagani": {
        "url": "https://merolagani.com/NewsList.aspx",
        "selector": "div.media-body",
    },
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

MAX_RETRIES = 3


def scrape_news(source: str = "sharesansar", max_articles: int = 20) -> list[dict]:
    """Scrape financial news from specified source."""
    articles = []

    for attempt in range(MAX_RETRIES):
        try:
            config = SOURCES.get(source)
            if not config:
                return []

            response = requests.get(config["url"], headers=HEADERS, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            # Generic article extraction
            for article in soup.find_all("article")[:max_articles]:
                title_el = article.find(["h2", "h3", "h4", "a"])
                if not title_el:
                    continue

                title = title_el.get_text(strip=True)
                link = title_el.get("href", "") if title_el.name == "a" else ""
                if not link:
                    link_el = article.find("a")
                    link = link_el.get("href", "") if link_el else ""

                summary_el = article.find("p")
                summary = summary_el.get_text(strip=True) if summary_el else ""

                if title:
                    articles.append(
                        {
                            "title": title,
                            "url": link,
                            "source": source,
                            "summary": summary,
                        }
                    )

            break
        except Exception as e:
            print(f"Scrape attempt {attempt + 1} failed for {source}: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 * (attempt + 1))

    return articles


def extract_related_symbols(text: str, known_symbols: list[str]) -> list[str]:
    """Extract stock symbols mentioned in text."""
    text_upper = text.upper()
    found = []
    for symbol in known_symbols:
        if symbol in text_upper:
            found.append(symbol)
    return found
