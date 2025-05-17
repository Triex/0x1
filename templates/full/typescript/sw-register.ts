/**
 * Service Worker Registration
 * Enables Progressive Web App functionality
 */

/**
 * Interface to extend ServiceWorkerRegistration with sync capability
 */
interface SyncServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
  };
}

/**
 * Submit form data to an API endpoint
 */
async function submitFormData(data: Record<string, any>): Promise<void> {
  // Implement your API submission logic here
  console.log('Submitting form data:', data);
  
  // Example implementation:
  // await fetch('/api/submit', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(data),
  // });
}

/**
 * Save form data to IndexedDB for later sync
 */
async function saveFormDataForSync(data: Record<string, any>): Promise<void> {
  // Simple IndexedDB implementation
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('FormSyncDB', 1);
    
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('formData')) {
        db.createObjectStore('formData', { autoIncrement: true });
      }
    };
    
    open.onerror = (event) => {
      reject(event);
    };
    
    open.onsuccess = () => {
      try {
        const db = open.result;
        const tx = db.transaction('formData', 'readwrite');
        const store = tx.objectStore('formData');
        
        store.add({
          data,
          timestamp: Date.now()
        });
        
        tx.oncomplete = () => resolve();
        tx.onerror = (event) => reject(event);
      } catch (error) {
        reject(error);
      }
    };
  });
}

/**
 * Initialize background sync for form submissions
 */
async function initBackgroundSync() {
  const registration = await navigator.serviceWorker.ready as SyncServiceWorkerRegistration;
  
  // Listen for form submissions that might need to be synced
  document.addEventListener('submit', async (event) => {
    // Only intercept forms with data-sync attribute
    if (event.target instanceof HTMLFormElement && event.target.dataset.sync) {
      event.preventDefault();
      
      try {
        // Extract form data
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        // Try to submit directly if online
        if (navigator.onLine) {
          await submitFormData(data);
        } else {
          // Save to IndexedDB for later sync
          await saveFormDataForSync(data);
          // Register for background sync
          await registration.sync.register('sync-forms');
          
          // Show notification
          const toastEvent = new CustomEvent('app:toast', { 
            detail: { 
              message: 'Form will be submitted when you\'re back online',
              type: 'info'
            } 
          });
          window.dispatchEvent(toastEvent);
        }
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  });
}

// Check if service workers are supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./public/service-worker.js', {
        scope: '/'
      });
      console.log('Service Worker registered with scope:', registration.scope);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update notification
              const updateEvent = new CustomEvent('app:update-available');
              window.dispatchEvent(updateEvent);
            }
          });
        }
      });
      
      // Listen for controller change to reload the page after update
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
  
  // Background sync for forms
  if ('SyncManager' in window) {
    // Initialize background sync functionality
    initBackgroundSync();
  }
  
  // Check for updates periodically
  setInterval(() => {
    if (navigator.onLine) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }
  }, 60 * 60 * 1000); // Check every hour
}
