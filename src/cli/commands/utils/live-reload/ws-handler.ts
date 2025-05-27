/**
 * WebSocket Handler for 0x1 Live Reload
 * 
 * This module provides a clean implementation of WebSocket-based live reloading
 * using Bun's native WebSocket support.
 */

import { Server, ServerWebSocket } from "bun";
import { logger } from "../../../utils/logger.js";

// Type definition for our WebSocket connection data
export interface LiveReloadSocketData {
  connectionId: string;
}

// Type for our WebSocket connection
export type LiveReloadSocket = ServerWebSocket<LiveReloadSocketData>;

/**
 * Create a WebSocket handler for the live reload system
 */
export function createWebSocketHandler(server: Server) {
  // Track connected clients
  const clients = new Set<LiveReloadSocket>();
  
  /**
   * Handle WebSocket message events
   */
  function handleMessage(ws: LiveReloadSocket, message: string | Buffer) {
    try {
      const data = JSON.parse(message.toString());
      logger.debug(`WebSocket message received: ${message}`);
      
      // Handle client pings
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      logger.error(`Error handling WebSocket message: ${err}`);
    }
  }
  
  /**
   * Handle WebSocket close events
   */
  function handleClose(ws: LiveReloadSocket) {
    clients.delete(ws);
    logger.info(`[0x1] WebSocket client disconnected (${ws.data.connectionId})`);
  }
  
  /**
   * Handle WebSocket open events
   */
  function handleOpen(ws: LiveReloadSocket) {
    clients.add(ws);
    logger.info(`[0x1] WebSocket client connected (${ws.data.connectionId})`);
    
    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      timestamp: Date.now(),
      connectionId: ws.data.connectionId
    }));
  }
  
  /**
   * Broadcast a message to all connected WebSocket clients
   */
  function broadcast(type: 'reload' | 'css', path?: string) {
    const clientCount = clients.size;
    logger.debug(`Broadcasting ${type} to ${clientCount} WebSocket clients`);
    
    if (clientCount === 0) {
      return; // No clients connected
    }
    
    const message = JSON.stringify({
      type,
      timestamp: Date.now(),
      path
    });
    
    // Send to all connected clients
    for (const client of clients) {
      try {
        client.send(message);
      } catch (err) {
        logger.error(`Failed to send message to WebSocket ${client.data.connectionId}: ${err instanceof Error ? err.message : String(err)}`);
        
        try {
          client.close();
          clients.delete(client);
        } catch (closeErr) {
          logger.error(`Failed to close problematic WebSocket: ${closeErr}`);
        }
      }
    }
  }
  
  /**
   * Handle WebSocket upgrade requests
   */
  function handleUpgrade(req: Request): Response | undefined {
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Only handle WebSocket upgrades for our specific endpoint
    if (path !== "/__0x1_ws_live_reload") {
      return undefined;
    }
    
    // Check if this is a WebSocket upgrade request
    if (req.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return undefined;
    }
    
    logger.info("🔄 WebSocket upgrade request for live reload endpoint");
    
    try {
      // Generate a unique connection ID
      const connectionId = `ws-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Attempt to upgrade the connection
      const upgraded = server.upgrade(req, { 
        data: { connectionId }
      });
      
      if (!upgraded) {
        logger.error("❌ Failed to upgrade WebSocket connection");
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
      
      // Important: Return nothing when upgrade succeeds
      // This allows Bun to handle the connection properly
      return undefined;
    } catch (err) {
      logger.error(`❌ WebSocket upgrade error: ${err instanceof Error ? err.message : String(err)}`);
      return new Response(`WebSocket error: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
    }
  }
  
  return {
    handleMessage,
    handleClose,
    handleOpen,
    broadcast,
    handleUpgrade,
    getClientCount: () => clients.size
  };
}
