import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export interface WsMarketMessage {
  type: 'market_update' | 'index_update' | 'status_update';
  timestamp: string;
  data: unknown;
}

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log(`[WS] Client connected (total: ${wss!.clients.size})`);
    ws.on('close', () => {
      console.log(`[WS] Client disconnected (total: ${wss!.clients.size})`);
    });
    ws.on('error', (err) => {
      console.error('[WS] Client error:', err.message);
    });
  });

  console.log('[WS] WebSocket server initialised on /ws');
  return wss;
}

export function broadcast(message: WsMarketMessage): void {
  if (!wss) return;
  const payload = JSON.stringify(message);
  let sent = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
      sent++;
    }
  });
  if (sent > 0) {
    console.log(`[WS] Broadcast ${message.type} to ${sent} client(s)`);
  }
}

export function getClientCount(): number {
  return wss?.clients.size ?? 0;
}
