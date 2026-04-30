'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  fetchLiveMarket,
  fetchIndices,
  LiveMarketResponse,
  LiveIndex,
} from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketWsState {
  stocks: LiveMarketResponse | null;
  indices: LiveIndex[];
  isLive: boolean;
  isWsConnected: boolean;
  lastUpdated: string | null;
  marketOpen: boolean | null;
}

type Listener = (state: MarketWsState) => void;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const POLL_INTERVAL_MS = 10_000;

function wsUrl(): string {
  if (typeof window === 'undefined') return '';
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  // In dev the market-data service may be on a different port; use env or
  // fall back to same host with a known port.
  const host =
    process.env.NEXT_PUBLIC_WS_URL ||
    `${proto}://${window.location.hostname}:3002/ws`;
  return host;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMarketWebSocket(): MarketWsState {
  const [state, setState] = useState<MarketWsState>({
    stocks: null,
    indices: [],
    isLive: false,
    isWsConnected: false,
    lastUpdated: null,
    marketOpen: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // ----- HTTP polling fallback -----
  const pollHttp = useCallback(async () => {
    try {
      const [marketRes, idxRes] = await Promise.allSettled([
        fetchLiveMarket(),
        fetchIndices(),
      ]);

      if (!mountedRef.current) return;

      const next: Partial<MarketWsState> = {};

      if (marketRes.status === 'fulfilled' && marketRes.value.data.length > 0) {
        next.stocks = marketRes.value;
        next.marketOpen = marketRes.value.marketOpen;
        next.lastUpdated = marketRes.value.lastUpdated;
        next.isLive = true;
      }
      if (idxRes.status === 'fulfilled' && idxRes.value.length > 0) {
        next.indices = idxRes.value;
      }

      if (Object.keys(next).length > 0) {
        setState((prev) => ({ ...prev, ...next }));
      }
    } catch {
      // silently ignore — will retry next interval
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimer.current) return;
    pollTimer.current = setInterval(pollHttp, POLL_INTERVAL_MS);
  }, [pollHttp]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // ----- WebSocket connection -----
  const connect = useCallback(() => {
    const url = wsUrl();
    if (!url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('[WS] Connected');
        reconnectAttempt.current = 0;
        setState((prev) => ({ ...prev, isWsConnected: true }));
        // Stop HTTP polling while WS is active
        stopPolling();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            timestamp: string;
            data: unknown;
          };

          setState((prev) => {
            const next = { ...prev, isLive: true, lastUpdated: msg.timestamp };

            if (msg.type === 'market_update') {
              next.stocks = msg.data as LiveMarketResponse;
              next.marketOpen = (msg.data as LiveMarketResponse).marketOpen;
            } else if (msg.type === 'index_update') {
              next.indices = msg.data as LiveIndex[];
            } else if (msg.type === 'status_update') {
              next.marketOpen = (msg.data as { isOpen: boolean }).isOpen;
            }

            return next;
          });
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        console.log('[WS] Disconnected');
        setState((prev) => ({ ...prev, isWsConnected: false }));
        wsRef.current = null;
        // Fall back to polling while reconnecting
        startPolling();
        scheduleReconnect();
      };

      ws.onerror = () => {
        // onclose will fire after this — reconnect handled there
      };
    } catch {
      startPolling();
      scheduleReconnect();
    }
  }, [startPolling, stopPolling]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) return;
    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** reconnectAttempt.current,
      RECONNECT_MAX_MS,
    );
    reconnectAttempt.current++;
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempt.current})`);
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      if (mountedRef.current) connect();
    }, delay);
  }, [connect]);

  // ----- Lifecycle -----
  useEffect(() => {
    mountedRef.current = true;

    // Initial HTTP fetch for immediate data
    void pollHttp();

    // Try WebSocket
    connect();

    // Start polling as fallback (stopped when WS connects)
    startPolling();

    return () => {
      mountedRef.current = false;
      stopPolling();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };
  }, [connect, pollHttp, startPolling, stopPolling]);

  return state;
}
