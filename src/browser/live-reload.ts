/**
 * 0x1 Live Reload Script - TypeScript Source
 * This script is injected into HTML files during development to enable hot reloading
 * Supports Server-Sent Events (SSE) with proper connection management
 */

interface LiveReloadMessage {
  type: 'connected' | 'reload' | 'css-update' | 'file-change' | 'heartbeat';
  timestamp?: number;
  path?: string;
}

(function() {
  // CRITICAL: Absolute singleton protection
  const SINGLETON_KEY = '__0x1_liveReloadSingleton';
  if ((window as any)[SINGLETON_KEY]) {
    console.log('[0x1] Live reload singleton already running, ignoring duplicate');
    return;
  }
  (window as any)[SINGLETON_KEY] = true;
  
  console.log('[0x1] Running in development mode ' + window.location.hostname);

  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  let lastConnectionTime = 0;
  let isConnected = false;
  let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  const MAX_RECONNECT_ATTEMPTS = 3;
  const MIN_CONNECTION_INTERVAL = 15000; // Increased to 15 seconds to prevent spam
  const RECONNECT_DELAY = 20000; // Increased to 20 seconds
  const CONNECTION_TIMEOUT = 60000; // Increased to 60 seconds

  function canAttemptConnection(): boolean {
    const now = Date.now();
    return (now - lastConnectionTime) >= MIN_CONNECTION_INTERVAL;
  }

  function cleanupConnection(): void {
    if (eventSource) {
      console.log('[0x1] Cleaning up existing SSE connection');
      eventSource.close();
      eventSource = null;
    }
    
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    
    isConnected = false;
  }

  function connectSSE(): void {
    // Prevent rapid reconnections
    if (!canAttemptConnection()) {
      console.log('[0x1] Rate limiting SSE connection attempt');
      return;
    }

    // Don't connect if already connected
    if (isConnected && eventSource && eventSource.readyState === EventSource.OPEN) {
      console.log('[0x1] SSE already connected, skipping connection attempt');
      return;
    }

    // Cleanup any existing connection first
    cleanupConnection();

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[0x1] Max reconnection attempts reached, stopping live reload');
      return;
    }

    lastConnectionTime = Date.now();
    console.log(`[0x1] Establishing SSE connection (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

    try {
      eventSource = new EventSource('/__0x1_live_reload');
      
      eventSource.onopen = function() {
        console.log('[0x1] Live reload connected successfully');
        isConnected = true;
        reconnectAttempts = 0; // Reset on successful connection
        
        // Set up connection timeout to detect stale connections
        connectionTimeout = setTimeout(() => {
          console.log('[0x1] Connection timeout, reconnecting...');
          cleanupConnection();
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            setTimeout(connectSSE, RECONNECT_DELAY);
          }
        }, CONNECTION_TIMEOUT);
      };

      eventSource.onmessage = function(event: MessageEvent) {
        try {
          const data: LiveReloadMessage = JSON.parse(event.data);
          
          // Reset connection timeout on any message
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = setTimeout(() => {
              console.log('[0x1] Connection timeout, reconnecting...');
              cleanupConnection();
              if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                setTimeout(connectSSE, RECONNECT_DELAY);
              }
            }, CONNECTION_TIMEOUT);
          }
          
          // CRITICAL FIX: Only reload on actual file changes, not connection/heartbeat events
          if (data.type === 'reload' || data.type === 'css-update' || data.type === 'file-change') {
            console.log('[0x1] Received reload signal:', data.type);
            // Small delay to allow server to finish processing
            setTimeout(() => {
              window.location.reload();
            }, 100);
          } else if (data.type === 'connected') {
            // Just log the connection, don't reload
            console.log('[0x1] Live reload server connected');
          } else if (data.type === 'heartbeat') {
            // Silently handle heartbeat - don't log to avoid spam
            // Just reset the timeout which was already done above
          }
        } catch (e) {
          console.warn('[0x1] Failed to parse reload message:', e);
        }
      };

      eventSource.onerror = function() {
        console.log('[0x1] SSE connection error - will assess if reconnection needed');
        
        // Don't immediately reconnect on every error - many are transient
        if (eventSource && eventSource.readyState === EventSource.CLOSED) {
          console.log('[0x1] SSE connection closed, attempting reconnection');
          cleanupConnection();
          reconnectAttempts++;
          
          // Exponential backoff for reconnection with maximum delay
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), 60000);
            console.log('[0x1] Scheduling reconnection in', delay / 1000, 'seconds');
            setTimeout(connectSSE, delay);
          } else {
            console.log('[0x1] Max reconnection attempts reached, live reload disabled');
          }
        } else {
          // Connection is still open or connecting, just log the error
          console.log('[0x1] SSE error but connection still active, ignoring');
        }
      };

    } catch (error) {
      console.error('[0x1] Failed to create SSE connection:', error);
      reconnectAttempts++;
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(connectSSE, RECONNECT_DELAY);
      }
    }
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanupConnection);
  
  // Cleanup on page visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cleanupConnection();
    } else if (!isConnected) {
      // Reconnect when tab becomes visible again
      setTimeout(connectSSE, 1000);
    }
  });
  
  // Start initial connection with a small delay to ensure page is fully loaded
  setTimeout(connectSSE, 1000);
})(); 