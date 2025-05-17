/**
 * 0x1 Live Reload Script
 * This script is injected into HTML files during development to enable hot reloading
 */

(() => {
  console.log('[0x1] Live reload enabled');

  let retryCount = 0;
  const maxRetries = 10;
  const retryDelay = 1000;
  
  // Create EventSource for SSE connection
  function createEventSource() {
    try {
      const eventSource = new EventSource('/__0x1_live_reload');
      
      // Connection opened
      eventSource.onopen = () => {
        console.log('[0x1] Live reload connected');
        retryCount = 0;
      };
      
      // Handle messages
      eventSource.addEventListener('message', (event) => {
        if (event.data === 'reload') {
          console.log('[0x1] Reloading page...');
          window.location.reload();
        }
      });
      
      // Handle errors
      eventSource.onerror = (err) => {
        console.error('[0x1] Live reload connection error', err);
        eventSource.close();
        
        // Retry connection with backoff
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`[0x1] Retrying connection in ${retryDelay}ms (${retryCount}/${maxRetries})`);
          setTimeout(createEventSource, retryDelay);
        } else {
          console.error('[0x1] Max retries reached, live reload disabled');
        }
      };
      
      return eventSource;
    } catch (err) {
      console.error('[0x1] Failed to initialize live reload', err);
    }
  }
  
  // Initialize connection
  let eventSource = createEventSource();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (eventSource) {
      eventSource.close();
    }
  });
})();
