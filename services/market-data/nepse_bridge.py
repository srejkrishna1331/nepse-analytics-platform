"""Lightweight FastAPI bridge that exposes nepse-data-api as JSON endpoints.

The NEPSE official API requires WASM-based token auth.  The `nepse-data-api`
Python package handles this automatically.  This bridge exposes the data over
localhost so the Node.js market-data service can consume it without re-
implementing the auth flow.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from nepse_data_api import Nepse

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("nepse-bridge")

app = FastAPI(title="NEPSE Bridge", docs_url=None, redoc_url=None)

# ---------------------------------------------------------------------------
# Client management — reinitialise on stale tokens
# ---------------------------------------------------------------------------

_nepse: Nepse | None = None


def get_nepse(force_new: bool = False) -> Nepse:
    global _nepse
    if _nepse is None or force_new:
        log.info("Initialising new Nepse client")
        _nepse = Nepse()
    return _nepse


# ---------------------------------------------------------------------------
# In-memory TTL cache
# ---------------------------------------------------------------------------

_cache: dict[str, tuple[float, Any]] = {}
CACHE_TTL = 10  # seconds


def cached(key: str, ttl: int = CACHE_TTL):
    entry = _cache.get(key)
    if entry and (time.time() - entry[0]) < ttl:
        return entry[1]
    return None


def set_cache(key: str, value: Any) -> None:
    _cache[key] = (time.time(), value)


def _fetch_with_retry(fn_name: str, *args: Any, **kwargs: Any) -> Any:
    """Call nepse-data-api with one retry using a fresh client."""
    try:
        result = getattr(get_nepse(), fn_name)(*args, **kwargs)
        if isinstance(result, list) and len(result) == 0:
            log.warning("Empty result from %s — reinitialising client", fn_name)
            result = getattr(get_nepse(force_new=True), fn_name)(*args, **kwargs)
        return result
    except Exception:
        log.warning("Exception in %s — reinitialising client", fn_name, exc_info=True)
        try:
            return getattr(get_nepse(force_new=True), fn_name)(*args, **kwargs)
        except Exception as exc2:
            raise exc2


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok", "service": "nepse-bridge"}


@app.get("/market-status")
def market_status():
    key = "market-status"
    hit = cached(key)
    if hit is not None:
        return hit
    try:
        data = _fetch_with_retry("get_market_status")
        set_cache(key, data)
        return data
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=502)


@app.get("/stocks")
def stocks():
    key = "stocks"
    hit = cached(key)
    if hit is not None:
        return hit
    try:
        data = _fetch_with_retry("get_stocks")
        if data:
            log.info("Fetched %d stocks from NEPSE", len(data))
            set_cache(key, data)
        return data
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=502)


@app.get("/indices")
def indices():
    key = "indices"
    hit = cached(key)
    if hit is not None:
        return hit
    try:
        data = _fetch_with_retry("get_sub_indices")
        set_cache(key, data)
        return data
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=502)


@app.get("/top-gainers")
def top_gainers():
    key = "top-gainers"
    hit = cached(key)
    if hit is not None:
        return hit
    try:
        data = _fetch_with_retry("get_top_gainers")
        set_cache(key, data)
        return data
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=502)


@app.get("/top-losers")
def top_losers():
    key = "top-losers"
    hit = cached(key)
    if hit is not None:
        return hit
    try:
        data = _fetch_with_retry("get_top_losers")
        set_cache(key, data)
        return data
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=502)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=4000)
