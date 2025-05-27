/**
 * 0x1 Live Reload System
 * 
 * This module provides a unified interface for both WebSocket and SSE-based
 * live reloading functionality for the 0x1 framework.
 */

import { Server } from "bun";
import { logger } from "../../../utils/logger";
import { createSSEHandler } from "./sse-handler";
import { createWebSocketHandler } from "./ws-handler";

/**
 * Create a live reload system that supports both WebSockets and SSE
 */
export function createLiveReloadSystem(server: Server) {
  // Create the individual handlers
  const wsHandler = createWebSocketHandler(server);
  const sseHandler = createSSEHandler();
  
  // Configure the server with WebSocket handlers
  const websocketConfig = {
    websocket: {
      message: wsHandler.handleMessage,
      open: wsHandler.handleOpen,
      close: wsHandler.handleClose,
      drain: undefined
    }
  };
  
  // Create the server with WebSocket handlers
  // We don't directly set server.websocket as it's not directly settable
  // The handlers are already configured in the WebSocketHandler instance
  
  /**
   * Handle HTTP requests for live reload endpoints
   */
  function handleRequest(req: Request): Response | undefined {
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Handle WebSocket upgrade requests
    if (req.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      return wsHandler.handleUpgrade(req);
    }
    
    // Handle SSE connection requests
    if (path === "/__0x1_sse_live_reload") {
      return sseHandler.handleConnection(req);
    }
    
    // Handle live reload script requests
    if (path === "/__0x1_live_reload.js") {
      return serveLiveReloadScript(req, url.host);
    }
    
    // Not a live reload request
    return undefined;
  }
  
  /**
   * Broadcast a reload message to all connected clients
   */
  function broadcast(type: 'reload' | 'css', path?: string) {
    const wsCount = wsHandler.getClientCount();
    const sseCount = sseHandler.getClientCount();
    
    logger.debug(`Broadcasting ${type} to ${wsCount} WebSocket and ${sseCount} SSE clients`);
    
    // Broadcast to both types of clients
    wsHandler.broadcast(type, path);
    sseHandler.broadcast(type, path);
  }
  
  /**
   * Clean up inactive clients
   * Should be called periodically
   */
  function cleanup() {
    return sseHandler.cleanupInactiveClients();
  }
  
  /**
   * Serve the live reload client script
   */
  function serveLiveReloadScript(req: Request, host: string): Response {
    const wsProtocol = host.includes('localhost') ? 'ws' : 'wss';
    const wsUrl = `${wsProtocol}://${host}/__0x1_ws_live_reload`;
    const sseUrl = `http://${host}/__0x1_sse_live_reload`;
    
    // Client-side script that tries WebSocket first, falls back to SSE
    const script = `
    /* 0x1 Framework Live Reload Client */
    (function() {
      console.log('[0x1] Initializing live reload client');
      
      let reconnectTimer = null;
      let socket = null;
      let isSSE = false;
      
      // Connect to the server
      function connect() {
        try {
          // Try WebSocket first
          socket = new WebSocket('${wsUrl}');
          
          socket.onopen = () => {
            console.log('[0x1] Live reload connected via WebSocket');
            clearReconnectTimer();
          };
          
          socket.onclose = () => {
            console.log('[0x1] WebSocket connection closed, will try to reconnect');
            socket = null;
            scheduleReconnect();
          };
          
          socket.onerror = (err) => {
            console.error('[0x1] Error establishing WebSocket connection:', err);
            socket = null;
            // Fall back to SSE
            connectSSE();
          };
          
          socket.onmessage = (event) => {
            handleMessage(JSON.parse(event.data));
          };
        } catch (err) {
          console.error('[0x1] Error establishing WebSocket connection:', err);
          // Fall back to SSE
          connectSSE();
        }
      }
      
      // Connect using Server-Sent Events as fallback
      function connectSSE() {
        try {
          if (typeof EventSource === 'undefined') {
            console.log('[0x1] SSE not supported, using polling fallback');
            return;
          }
          
          console.log('[0x1] Connecting via SSE');
          isSSE = true;
          
          const eventSource = new EventSource('${sseUrl}');
          
          eventSource.onopen = () => {
            console.log('[0x1] Live reload connected via SSE');
            clearReconnectTimer();
          };
          
          eventSource.onerror = () => {
            console.log('[0x1] SSE connection error, falling back to polling');
            eventSource.close();
            scheduleReconnect();
          };
          
          eventSource.addEventListener('connected', (e) => {
            console.log('[0x1] SSE connection established');
          });
          
          eventSource.addEventListener('update', (e) => {
            handleMessage(JSON.parse(e.data));
          });
          
          eventSource.addEventListener('css-update', (e) => {
            handleMessage(JSON.parse(e.data));
          });
          
          // Store reference
          socket = eventSource;
        } catch (err) {
          console.log('[0x1] SSE not supported, using polling');
          scheduleReconnect();
        }
      }
      
      // Handle incoming messages
      function handleMessage(msg) {
        console.log('[0x1] Received message:', msg);
        
        if (msg.type === 'reload') {
          console.log('[0x1] Reloading page...');
          window.location.reload();
        } 
        else if (msg.type === 'css') {
          console.log('[0x1] Updating CSS without reload');
          updateCSS();
        }
      }
      
      // Update CSS without full page reload
      function updateCSS() {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        
        if (links.length > 0) {
          links.forEach(link => {
            // Add cache busting parameter
            const href = link.href.replace(/[?&]_reload=\\d+/, '');
            link.href = href + (href.includes('?') ? '&' : '?') + '_reload=' + Date.now();
          });
          console.log('[0x1] Updated', links.length, 'CSS stylesheets');
        } else {
          // If no stylesheet links found, just reload the page
          console.log('[0x1] No CSS links found, performing full reload');
          window.location.reload();
        }
      }
      
      // Schedule reconnection
      function scheduleReconnect() {
        clearReconnectTimer();
        reconnectTimer = setTimeout(() => {
          console.log('[0x1] Attempting to reconnect...');
          if (isSSE) {
            connectSSE();
          } else {
            connect();
          }
        }, 2000);
      }
      
      // Clear reconnection timer
      function clearReconnectTimer() {
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      }
      
      // Start connection
      connect();
      
      // Ping the server periodically to keep the connection alive
      setInterval(() => {
        if (socket && socket.readyState === 1 && !isSSE) {
          socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      }, 30000);
    })();
    `;
    
    return new Response(script, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  }
  
  // Return the public API
  return {
    handleRequest,
    broadcast,
    cleanup,
    getStats: () => ({
      websocket: wsHandler.getClientCount(),
      sse: sseHandler.getClientCount()
    })
  };
}
