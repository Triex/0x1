/**
 * SSE (Server-Sent Events) Handler for 0x1 Live Reload
 * 
 * This module provides a clean implementation of SSE-based live reloading
 * as a fallback for browsers that don't support WebSockets.
 */
import { logger } from "../../../utils/logger.js";

// Type definition for an SSE client
export interface SSEClient {
  controller: ReadableStreamDefaultController;
  lastActive: number;
  id: string;
}

/**
 * Create an SSE handler for the live reload system
 */
export function createSSEHandler() {
  // Track connected SSE clients
  const clients = new Map<string, SSEClient>();
  
  /**
   * Handle a new SSE connection
   */
  function handleConnection(req: Request): Response {
    // Generate a unique client ID
    const clientId = `sse-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    logger.info(`[0x1] SSE client connecting (${clientId})`);
    
    // Create a new readable stream for this client
    const stream = new ReadableStream({
      start(controller) {
        // Store the client
        clients.set(clientId, {
          controller,
          lastActive: Date.now(),
          id: clientId
        });
        
        // Send initial connection event
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`));
        
        logger.info(`[0x1] SSE client connected (${clientId})`);
      },
      cancel() {
        // Remove the client when the connection is closed
        clients.delete(clientId);
        logger.info(`[0x1] SSE client disconnected (${clientId})`);
      }
    });
    
    // Return the SSE response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Connection": "keep-alive"
      }
    });
  }
  
  /**
   * Broadcast a message to all connected SSE clients
   */
  function broadcast(type: 'reload' | 'css', path?: string) {
    const clientCount = clients.size;
    logger.debug(`Broadcasting ${type} to ${clientCount} SSE clients`);
    
    if (clientCount === 0) {
      return; // No clients connected
    }
    
    // Format the event data
    const eventType = type === 'css' ? 'css-update' : 'update';
    const eventData = JSON.stringify({ 
      type, 
      path, 
      timestamp: Date.now() 
    });
    const message = `event: ${eventType}\ndata: ${eventData}\n\n`;
    const encoded = new TextEncoder().encode(message);
    
    // Send to all connected clients
    for (const [id, client] of clients.entries()) {
      try {
        client.controller.enqueue(encoded);
        client.lastActive = Date.now();
      } catch (err) {
        logger.error(`Failed to send message to SSE client ${id}: ${err instanceof Error ? err.message : String(err)}`);
        clients.delete(id);
      }
    }
  }
  
  /**
   * Clean up inactive SSE clients
   * Should be called periodically
   */
  function cleanupInactiveClients(maxAgeMs = 30000) {
    const now = Date.now();
    let removed = 0;
    
    for (const [id, client] of clients.entries()) {
      if (now - client.lastActive > maxAgeMs) {
        clients.delete(id);
        removed++;
      }
    }
    
    if (removed > 0) {
      logger.debug(`Cleaned up ${removed} inactive SSE clients`);
    }
    
    return removed;
  }
  
  return {
    handleConnection,
    broadcast,
    cleanupInactiveClients,
    getClientCount: () => clients.size
  };
}
