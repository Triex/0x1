/**
 * Service Worker Registration
 * Enable PWA capabilities
 * 
 * @module register-sw
 */

// Make this a proper module by exporting something
export {}

// Type declarations for service worker APIs that TypeScript doesn't know about
interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistrationExtended extends ServiceWorkerRegistration {
  periodicSync?: PeriodicSyncManager;
}

// Augment BeforeInstallPromptEvent which is not in standard TypeScript types
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
    'appinstalled': Event;
  }
}

// Register service worker only in production or when explicitly enabled
const shouldRegisterSW = 
  process.env.NODE_ENV === 'production' || 
  process.env.ENABLE_PWA === 'true';

if (shouldRegisterSW && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      }) as ServiceWorkerRegistrationExtended;
      
      console.log('ServiceWorker registered with scope:', registration.scope);
      
      // Setup periodic background sync if supported
      if (registration.periodicSync) {
        try {
          await registration.periodicSync.register('content-sync', {
            minInterval: 24 * 60 * 60 * 1000 // Once per day
          });
        } catch (error) {
          console.log('Periodic sync could not be registered:', error);
        }
      }
      
      // Register for push notifications if needed
      if ('PushManager' in window) {
        const subscribed = await registration.pushManager.getSubscription();
        if (!subscribed) {
          // User is not subscribed to push notifications
          // You can implement subscription UI here if needed
        }
      }
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  });
}

// Listen for app install event (Add to Home Screen)
window.addEventListener('beforeinstallprompt', (event) => {
  // Prevent the mini-infobar from appearing on mobile
  event.preventDefault();
  
  // Store the event for later use
  // You can trigger installation when user clicks a custom "Install" button
  const deferredPrompt = event;
  
  // Optional: Show your own install button or UI
  // Example: document.querySelector('.install-button').style.display = 'block';
  
  // When your install button is clicked:
  // deferredPrompt.prompt();
  // deferredPrompt.userChoice.then((choiceResult) => {
  //   if (choiceResult.outcome === 'accepted') {
  //     console.log('User accepted the install prompt');
  //   }
  //   // Clear the deferredPrompt variable
  //   deferredPrompt = null;
  // });
});

// Listen for successful installation
window.addEventListener('appinstalled', () => {
  // Hide the app-provided install promotion
  // Example: document.querySelector('.install-button').style.display = 'none';
  console.log('PWA was installed');
});
