/**
 * 0x1 Live Reload Script
 * This script is injected into HTML files during development to enable hot reloading
 */

(function() {
  console.log('[0x1] Running in development mode ' + window.location.hostname);

  let retryCount = 0;
  const maxRetries = 15;
  const retryDelay = 1000;
  
  // Create EventSource for SSE connection
  function createEventSource() {
    try {
      // Use both possible endpoints to improve reliability
      const eventSource = new EventSource(
        location.protocol + '//' + location.host + '/__0x1_live_reload'
      );
      
      // Connection opened
      eventSource.onopen = function() {
        console.log('[0x1] Live reload connected');
        retryCount = 0;
      };
      
      // Handle messages
      eventSource.addEventListener('message', function(event) {
        if (event.data === 'update') {
          console.log('[0x1] Reloading page due to file changes...');
          window.location.reload();
        }
      });
      
      // Handle update event specifically
      eventSource.addEventListener('update', function() {
        console.log('[0x1] Reloading page due to file changes...');
        window.location.reload();
      });
      
      // Handle errors
      eventSource.onerror = function(_err) { // Using _err to indicate intentionally unused parameter
        console.warn('[0x1] Live reload connection error, reconnecting...');
        eventSource.close();
        
        // Retry connection with backoff
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`[0x1] Retrying connection in ${retryDelay}ms (${retryCount}/${maxRetries})`);
          setTimeout(createEventSource, retryDelay * retryCount);
        } else {
          console.error('[0x1] Max retries reached, live reload disabled');
        }
      };
      
      return eventSource;
    } catch (err) {
      console.error('[0x1] Failed to initialize live reload', err);
      return null;
    }
  }
  
  // Initialize connection with a slight delay to ensure the server is ready
  let eventSource = null;
  setTimeout(function() {
    eventSource = createEventSource();
  }, 500);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', function() {
    if (eventSource) {
      eventSource.close();
    }
  });
})();
