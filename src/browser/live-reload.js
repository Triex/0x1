/**
 * 0x1 Live Reload Script
 * This script is injected into HTML files during development to enable hot reloading
 * Supports both Server-Sent Events (SSE) and WebSocket with automatic fallback
 */

(function() {
  console.log('[0x1] Running in development mode ' + window.location.hostname);

  // Connection state management
  let connectionType = null; // 'sse' or 'ws'
  let isConnected = false;
  let connectionAttempts = 0;
  const maxConnectionAttempts = 10;
  let reconnectTimeout = null;
  let debugMode = localStorage.getItem('0x1_debug') === 'true';
  
  // Debug logging helper
  function debugLog(...args) {
    if (debugMode) {
      console.log('[0x1 debug]', ...args);
    }
  }
  
  // Update connection status display if it exists on the page
  function updateConnectionStatus(status, type) {
    try {
      const statusEl = document.getElementById('connection-status');
      const indicatorEl = document.getElementById('connection-indicator');
      
      if (statusEl && indicatorEl) {
        statusEl.textContent = status;
        
        // Update color based on status
        if (status.includes('Connected')) {
          indicatorEl.className = 'w-4 h-4 rounded-full bg-green-500 mr-2';
          statusEl.className = 'text-green-700 dark:text-green-400';
          statusEl.textContent += type ? ` (${type})` : '';
        } else if (status.includes('Error') || status.includes('Failed')) {
          indicatorEl.className = 'w-4 h-4 rounded-full bg-red-500 mr-2';
          statusEl.className = 'text-red-700 dark:text-red-400';
        } else if (status.includes('Connecting')) {
          indicatorEl.className = 'w-4 h-4 rounded-full bg-yellow-500 mr-2';
          statusEl.className = 'text-yellow-700 dark:text-yellow-400';
        }
      }
    } catch (err) {
      // Silently fail if elements don't exist
    }
  }
  
  // Reload the page
  function reloadPage() {
    console.log('[0x1] Reloading page due to file changes...');
    window.location.reload();
  }
  
  // Calculate reconnection delay with exponential backoff
  function getReconnectDelay(attempts) {
    return Math.min(1000 * Math.pow(1.5, attempts), 30000); // Cap at 30 seconds
  }
  
  // Refresh CSS without page reload
  function refreshCSS(path) {
    try {
      console.log('[0x1] Refreshing CSS without page reload');
      const links = document.getElementsByTagName('link');
      let refreshed = false;
      
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        if (link.rel === 'stylesheet') {
          const href = link.href.split('?')[0];
          // If a specific path was provided, only refresh that file
          if (!path || href.includes(path)) {
            const url = href + (href.includes('?') ? '&' : '?') + '_0x1_reload=' + Date.now();
            link.href = url;
            debugLog('Refreshed stylesheet:', href);
            refreshed = true;
          }
        }
      }
      
      if (!refreshed) {
        debugLog('No matching stylesheets found to refresh, reloading page');
        reloadPage();
      }
    } catch (err) {
      console.warn('[0x1] Error refreshing CSS, falling back to full reload', err);
      reloadPage();
    }
  }
  
  // Connect using Server-Sent Events as primary method
  function connectSSE() {
    // Don't reconnect if already connected
    if (isConnected) return;
    
    debugLog('Attempting SSE connection...');
    updateConnectionStatus('Connecting via SSE...');
    
    try {
      // Create SSE connection
      const eventSource = new EventSource('/__0x1_live_reload');
      
      eventSource.addEventListener('open', function() {
        console.log('[0x1] Live reload connected via SSE');
        connectionType = 'sse';
        isConnected = true;
        connectionAttempts = 0;
        updateConnectionStatus('Connected', 'SSE');
        
        // Set up heartbeat to keep connection alive
        const heartbeatInterval = setInterval(function() {
          fetch('/__0x1_ping', { 
            method: 'GET', 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          }).catch(() => {
            // Ignore errors, the ping is just to keep the connection alive
          });
        }, 25000);
        
        // Clean up on close
        eventSource.addEventListener('error', function() {
          clearInterval(heartbeatInterval);
        });
      });
      
      eventSource.addEventListener('message', function(event) {
        try {
          const data = JSON.parse(event.data);
          debugLog('Received SSE message:', data);
          
          if (data.type === 'reload') {
            reloadPage();
          } else if (data.type === 'css-update') {
            refreshCSS(data.path);
          }
        } catch (e) {
          console.warn('[0x1] Error parsing SSE message:', e);
        }
      });
      
      // Handle specific event types
      eventSource.addEventListener('connected', function(event) {
        try {
          const data = JSON.parse(event.data);
          debugLog('Received SSE connected event:', data);
        } catch (e) {
          debugLog('Error parsing SSE connected event:', e);
        }
      });
      
      eventSource.addEventListener('ping', function() {
        debugLog('Received SSE ping');
      });
      
      eventSource.addEventListener('error', function() {
        console.error('[0x1] SSE connection error');
        eventSource.close();
        isConnected = false;
        connectionType = null;
        updateConnectionStatus('Disconnected');
        
        // Try to reconnect
        connectionAttempts++;
        const delay = Math.min(1000 * connectionAttempts, 5000);
        
        setTimeout(function() {
          // Try WebSocket as fallback after several SSE failures
          if (connectionAttempts > 2) {
            connectWebSocket();
          } else {
            connectSSE();
          }
        }, delay);
      });
      
      return eventSource;
    } catch (err) {
      console.error('[0x1] Error setting up SSE connection:', err);
      isConnected = false;
      connectionType = null;
      
      // Fallback to WebSocket after a delay
      setTimeout(function() {
        connectWebSocket();
      }, 1000);
      
      return null;
    }
  }
  
  // Connect using WebSocket as fallback method
  function connectWebSocket() {
    // Don't reconnect if already connected
    if (isConnected) return;
    
    debugLog('Attempting WebSocket connection...');
    updateConnectionStatus('Connecting via WebSocket...');
    
    try {
      // Create WebSocket connection to specific 0x1 live reload endpoint
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Always use the specific WebSocket endpoint
      const wsUrl = `${wsProtocol}//${window.location.host}/__0x1_ws_live_reload`;
      debugLog(`Connecting to WebSocket at ${wsUrl}`);
      
      const socket = new WebSocket(wsUrl);
      
      socket.addEventListener('open', function() {
        console.log('[0x1] Live reload connected via WebSocket');
        connectionType = 'ws';
        isConnected = true;
        connectionAttempts = 0;
        updateConnectionStatus('Connected', 'WebSocket');
        
        // Initial message to server
        socket.send(JSON.stringify({ 
          type: 'hello', 
          timestamp: Date.now() 
        }));
        
        // Set up ping interval to keep connection alive
        const pingInterval = setInterval(function() {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            debugLog('Sent ping to server');
          } else if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
            clearInterval(pingInterval);
          }
        }, 25000);
      });
      
      socket.addEventListener('message', function(event) {
        try {
          const data = JSON.parse(event.data);
          debugLog('Received WebSocket message:', data);
          
          if (data.type === 'reload') {
            reloadPage();
          } else if (data.type === 'css-update') {
            refreshCSS(data.path);
          } 
        } catch (e) {
          console.warn('[0x1] Error parsing WebSocket message:', e);
        }
      });
      
      socket.addEventListener('close', function() {
        isConnected = false;
        connectionType = null;
        updateConnectionStatus('Disconnected');
        
        // Try to reconnect using SSE after a delay
        connectionAttempts++;
        const delay = Math.min(1000 * connectionAttempts, 5000);
        
        setTimeout(function() {
          connectSSE(); // Go back to SSE as primary method
        }, delay);
      });
      
      socket.addEventListener('error', function(err) {
        console.error('[0x1] WebSocket error - will try SSE next');
        debugLog('WebSocket error details:', err);
        // Socket.close will be triggered automatically
      });
      
      return socket;
    } catch (err) {
      console.error('[0x1] Error setting up WebSocket connection:', err);
      isConnected = false;
      connectionType = null;
      
      // Try to reconnect with a delay using SSE
      connectionAttempts++;
      const delay = Math.min(1000 * connectionAttempts, 5000);
      
      setTimeout(function() {
        connectSSE(); // Go back to SSE as primary method
      }, delay);
      
      return null;
    }
  }
  
  // Toggle debug mode via console
  window.toggleDebug0x1 = function() {
    debugMode = !debugMode;
    localStorage.setItem('0x1_debug', debugMode);
    console.log(`[0x1] Debug mode ${debugMode ? 'enabled' : 'disabled'}`);
    return debugMode;
  };
  
  // Start the connection process - try SSE first
  function startConnection() {
    connectionAttempts = 0;
    connectSSE();
  }
  
  // Start connection when page loads
  window.addEventListener('load', function() {
    setTimeout(startConnection, 100); // Small delay to ensure page is fully loaded
  });
})();
