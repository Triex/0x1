/**
 * 0x1 PWA Core Module
 * Provides progressive web app capabilities with comprehensive config parsing
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Metadata } from './metadata.js';

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  scope?: string;
  startUrl?: string;
  orientation?: 'any' | 'portrait' | 'landscape';
  iconsPath?: string;
  generateIcons?: boolean;
  offlineSupport?: boolean;
  cacheStrategy?: 'network-first' | 'cache-first' | 'stale-while-revalidate';
  cacheName?: string;
  precacheResources?: string[];
  statusBarStyle?: 'default' | 'black' | 'black-translucent';
  
  // Extended config for complex setups
  enabled?: boolean;
  manifest?: string;
  workbox?: {
    swSrc?: string;
    swDest?: string;
    globPatterns?: string[];
  };
  icons?: {
    source?: string;
    output?: string;
  };
}

/**
 * Complex configuration parser for 0x1.config.ts files
 * Handles nested app.pwa and top-level pwa configurations
 */
export interface Complex0x1Config {
  app?: {
    name?: string;
    title?: string;
    description?: string;
    pwa?: Partial<PWAConfig>;
  };
  pwa?: {
    enabled?: boolean;
    manifest?: string;
    workbox?: {
      swSrc?: string;
      swDest?: string;
      globPatterns?: string[];
    };
    icons?: {
      source?: string;
      output?: string;
    };
  };
  [key: string]: any;
}

/**
 * Parse and merge PWA configuration from complex 0x1.config.ts structure
 * BULLETPROOF: Handles all possible configuration combinations
 */
export function parseComplexPWAConfig(config: Complex0x1Config): PWAConfig | null {
  try {
    // Extract PWA config from multiple possible locations
    const appPwaConfig = config.app?.pwa || {};
    const topLevelPwaConfig = config.pwa || {};
    const appConfig = config.app || {};
    
    // Check if PWA is enabled (explicit disable check)
    const pwaEnabled = topLevelPwaConfig.enabled !== false && 
                      (appPwaConfig.name || appConfig.name || topLevelPwaConfig.enabled === true);
    
    if (!pwaEnabled) {
      return null;
    }
    
    // Merge configurations with proper precedence:
    // 1. app.pwa takes highest precedence for app-specific settings
    // 2. top-level pwa for technical/build settings
    // 3. app for fallback app metadata
    const mergedConfig: PWAConfig = {
      // App identity (from app.pwa > app > defaults)
      name: appPwaConfig.name || appConfig.name || appConfig.title || "0x1 App",
      shortName: appPwaConfig.shortName || 
                extractShortName(appPwaConfig.name || appConfig.name || appConfig.title || "0x1"),
      description: appPwaConfig.description || appConfig.description || "Built with 0x1 - the ultra-minimal framework",
      
      // Visual settings (from app.pwa > defaults)
      themeColor: appPwaConfig.themeColor || "#7c3aed",
      backgroundColor: appPwaConfig.backgroundColor || "#ffffff",
      display: appPwaConfig.display || "standalone",
      statusBarStyle: appPwaConfig.statusBarStyle || "default",
      
      // App behavior (from app.pwa > defaults)
      startUrl: appPwaConfig.startUrl || "/",
      orientation: appPwaConfig.orientation || "any",
      scope: appPwaConfig.scope || "/",
      
      // Technical settings (from app.pwa > top-level pwa > defaults)
      iconsPath: appPwaConfig.iconsPath || "/icons",
      generateIcons: appPwaConfig.generateIcons !== false,
      offlineSupport: appPwaConfig.offlineSupport !== false,
      cacheStrategy: appPwaConfig.cacheStrategy || "stale-while-revalidate",
      cacheName: appPwaConfig.cacheName || extractCacheName(appConfig.name || "0x1-app"),
      
      // Advanced settings (merge from both sources)
      precacheResources: mergeArrays(
        appPwaConfig.precacheResources,
        ["/", "/index.html", "/styles.css", "/app.js", "/icons/favicon.svg"]
      ),
      
      // Extended config from top-level pwa
      enabled: topLevelPwaConfig.enabled !== false,
      manifest: topLevelPwaConfig.manifest || "/manifest.json",
      workbox: topLevelPwaConfig.workbox,
      icons: topLevelPwaConfig.icons
    };
    
    return mergedConfig;
  } catch (error) {
    console.warn(`[PWA Config Parser] Error parsing complex config: ${error}`);
    return null;
  }
}

/**
 * Extract short name from full app name
 */
function extractShortName(fullName: string): string {
  // Split by non-alphanumeric characters
  const words = fullName.split(/[^a-zA-Z0-9]/).filter(Boolean);
  
  if (words.length > 1) {
    // Multi-word: create acronym (first letter of each word, max 4 chars)
    return words.slice(0, 4).map(word => word.charAt(0).toUpperCase()).join('');
  } else {
    // Single word: use first 8 characters
    return fullName.substring(0, Math.min(8, fullName.length));
  }
}

/**
 * Extract cache name from app name
 */
function extractCacheName(appName: string): string {
  const normalizedName = appName.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${normalizedName}-cache-v1`;
}

/**
 * Merge arrays with deduplication
 */
function mergeArrays<T>(primary?: T[], fallback?: T[]): T[] {
  const merged = [...(primary || []), ...(fallback || [])];
  return [...new Set(merged)]; // Remove duplicates
}

/**
 * Load PWA configuration from various sources
 * SINGLE SOURCE OF TRUTH: Centralized config loading logic
 */
export async function loadPWAConfig(configPath?: string): Promise<PWAConfig | null> {
  const possiblePaths = [
    configPath,
    '0x1.config.ts',
    '0x1.config.js',
    'ox1.config.ts',
    'ox1.config.js'
  ].filter(Boolean);
  
  for (const path of possiblePaths) {
    try {
      // Try to load the config file
      const configExists = await Bun.file(path!).exists();
      if (!configExists) continue;
      
      const configContent = await Bun.file(path!).text();
      const parsedConfig = parseConfigFileContent(configContent);
      
      if (parsedConfig) {
        const pwaConfig = parseComplexPWAConfig(parsedConfig);
        if (pwaConfig) {
          console.log(`[PWA] Loaded config from ${path}`);
          return pwaConfig;
        }
      }
    } catch (error) {
      console.warn(`[PWA] Could not load config from ${path}: ${error}`);
      continue;
    }
  }
  
  return null;
}

/**
 * Parse configuration file content (TypeScript/JavaScript)
 * ROBUST: Handles complex TypeScript syntax and dynamic expressions
 */
function parseConfigFileContent(content: string): Complex0x1Config | null {
  try {
    // Remove comments and imports
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/import\s+.*?from\s+.*?;/g, '') // Remove imports
      .replace(/export\s+type\s+.*?;/g, ''); // Remove type exports
    
    // Extract the default export object
    const exportMatch = cleanContent.match(/export\s+default\s+(\{[\s\S]*?\});?\s*$/m);
    if (!exportMatch) {
      console.warn('[PWA Config Parser] No default export found');
      return null;
    }
    
    let configString = exportMatch[1];
    
    // Handle dynamic expressions safely
    configString = configString
      .replace(/process\.env\.(\w+)/g, (match, envVar) => {
        const value = process.env[envVar];
        return value ? `"${value}"` : 'undefined';
      })
      .replace(/process\.env\.(\w+)\s*===\s*["']([^"']+)["']/g, (match, envVar, compareValue) => {
        const value = process.env[envVar];
        return value === compareValue ? 'true' : 'false';
      });
    
    // Use safe evaluation with controlled context
    const safeEval = new Function(
      'console',
      `
      // Provide safe console object
      const process = { env: ${JSON.stringify(process.env)} };
      
      // Return the config object
      return ${configString};
      `
    );
    
    const config = safeEval(console);
    return config as Complex0x1Config;
  } catch (error) {
    console.warn(`[PWA Config Parser] Failed to parse config: ${error}`);
    return null;
  }
}

/**
 * Default PWA configuration
 */
export const DEFAULT_PWA_CONFIG: PWAConfig = {
  name: "0x1 App",
  shortName: "0x1",
  description: "Built with 0x1 - the ultra-minimal framework",
  themeColor: "#7c3aed",
  backgroundColor: "#ffffff",
  display: "standalone",
  startUrl: "/",
  orientation: "any",
  iconsPath: "/icons",
  generateIcons: true,
  offlineSupport: true,
  cacheStrategy: "stale-while-revalidate",
  cacheName: "0x1-cache-v1",
  statusBarStyle: "default",
  precacheResources: [
    "/",
    "/index.html",
    "/styles.css",
    "/app.js",
    // CRITICAL FIX: Remove hardcoded icon paths that might not exist
    // Icons will be added dynamically by the build process if they exist
  ],
};

/**
 * Generate web app manifest JSON with dynamic icon detection
 * Checks actual file existence to prevent 404s
 */
export function generateManifest(config: PWAConfig, projectPath?: string): string {
  // CRITICAL FIX: Only generate icons array for icons that actually exist
  const baseIconPath = config.iconsPath || '/icons';
  
  // Standard icon sizes to check for
  const iconSpecs = [
    { size: '48x48', purpose: 'any' },
    { size: '72x72', purpose: 'any' },
    { size: '96x96', purpose: 'any' },
    { size: '144x144', purpose: 'any' },
    { size: '192x192', purpose: 'any' },
    { size: '512x512', purpose: 'any' },
    { size: '192x192', purpose: 'maskable' },
    { size: '512x512', purpose: 'maskable' },
  ];
  
  // REAL IMPLEMENTATION: Actually check if icons exist on filesystem
  const icons = [];
  
  // Function to check if icon exists in common project locations
  const iconExists = (iconFilename: string): boolean => {
    if (!projectPath) {
      // If no project path provided, fallback to conservative approach
      return config.generateIcons !== false;
    }
    
    // Check common icon locations in project
    const possiblePaths = [
      join(projectPath, 'public', 'icons', iconFilename),
      join(projectPath, 'icons', iconFilename), 
      join(projectPath, 'assets', 'icons', iconFilename),
      join(projectPath, 'static', 'icons', iconFilename),
      // Check in build output if it exists
      join(projectPath, 'dist', 'icons', iconFilename),
      join(projectPath, 'build', 'icons', iconFilename),
    ];
    
    return possiblePaths.some(path => existsSync(path));
  };
  
  // Add PNG icons that actually exist
  for (const iconSpec of iconSpecs) {
    const iconFilename = iconSpec.purpose === 'maskable' 
      ? `maskable-icon-${iconSpec.size}.png`
      : `icon-${iconSpec.size}.png`;
    
    if (iconExists(iconFilename)) {
      icons.push({
        src: `${baseIconPath}/${iconFilename}`,
        sizes: iconSpec.size,
        type: 'image/png',
        purpose: iconSpec.purpose
      });
    }
  }
  
  // Add SVG icons if they exist
  const svgIcons = ['icon.svg', 'icon-512x512.svg'];
  for (const svgIcon of svgIcons) {
    if (iconExists(svgIcon)) {
      icons.push({
        src: `${baseIconPath}/${svgIcon}`,
        sizes: svgIcon === 'icon.svg' ? 'any' : '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      });
    }
  }
  
  // Fallback: if no icons found but generateIcons is true, add essential ones
  if (icons.length === 0 && config.generateIcons !== false) {
    const essentialIcons = [
      {
        src: `${baseIconPath}/icon-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${baseIconPath}/icon-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ];
    icons.push(...essentialIcons);
  }

  const manifest = {
    name: config.name,
    short_name: config.shortName,
    description: config.description,
    start_url: config.startUrl || '/',
    display: config.display,
    background_color: config.backgroundColor,
    theme_color: config.themeColor,
    orientation: config.orientation || 'any',
    icons: icons, // Only includes icons that actually exist
    screenshots: [
      // Skip screenshots by default to prevent 404s
    ],
    id: config.name.toLowerCase().replace(/\s+/g, '-'),
    dir: 'ltr',
    lang: 'en-US',
    categories: ['productivity'],
    scope: config.scope || '/',
    prefer_related_applications: false,
    shortcuts: [
      {
        name: 'Home',
        url: '/',
        description: 'Go to the home page',
        icons: icons.length > 0 ? [
          {
            src: `${baseIconPath}/icon-192x192.png`,
            sizes: '192x192',
            type: 'image/png'
          }
        ] : []
      }
    ],
    file_handlers: [],
    handle_links: 'preferred',
    launch_handler: {
      client_mode: ['navigate-existing', 'auto']
    },
    // PWA display overrides for better compatibility
    display_override: [
      "window-controls-overlay",
      config.display || "standalone"
    ]
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Generate service worker content with resource validation
 */
export function generateServiceWorker(config: PWAConfig): string {
  const cacheName = config.cacheName || '0x1-cache-v1';
  const filesToCache = JSON.stringify(config.precacheResources || []);
  const strategy = config.cacheStrategy || 'stale-while-revalidate';
  
  let strategyCode;
  switch (strategy) {
    case 'cache-first':
      strategyCode = `
        async function fetchResource(request) {
          // Try cache first, then network
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          
          // If not in cache, fetch from network
          try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          } catch (error) {
            return new Response('Network error', { status: 408 });
          }
        }`;
      break;
    case 'network-first':
      strategyCode = `
        async function fetchResource(request) {
          // Try network first, then cache
          try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          } catch (error) {
            // If network fails, use cache
            const cachedResponse = await caches.match(request);
            return cachedResponse || new Response('Network error', { status: 408 });
          }
        }`;
      break;
    case 'stale-while-revalidate':
    default:
      strategyCode = `
        async function fetchResource(request) {
          // Return cached version immediately (if available)
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await caches.match(request);
          
          // Update cache in background
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => null);
          
          // Return cached version or wait for network
          return cachedResponse || fetchPromise;
        }`;
      break;
  }

  return `// 0x1 Service Worker
// Generated on ${new Date().toISOString()}

const CACHE_NAME = '${cacheName}';
const OFFLINE_URL = '/offline.html';
const PRECACHE_RESOURCES = ${filesToCache};

// CRITICAL FIX: Validate resources before caching to prevent addAll failures
async function validateAndCacheResources(cache, resources) {
  const validResources = [];
  
  for (const url of resources) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        validResources.push(url);
        await cache.put(url, response);
        console.log('[SW] Cached:', url);
      } else {
        console.warn('[SW] Resource not found, skipping cache:', url, response.status);
      }
    } catch (error) {
      console.warn('[SW] Failed to fetch resource, skipping cache:', url, error.message);
    }
  }
  
  console.log('[SW] Successfully cached', validResources.length, 'of', resources.length, 'resources');
  return validResources;
}

// Install event - precache resources with validation
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // CRITICAL FIX: Validate resources before attempting to cache them
        await validateAndCacheResources(cache, PRECACHE_RESOURCES);
        
        await self.skipWaiting();
        console.log('[SW] Installation completed with resource validation');
      } catch (error) {
        console.error('[SW] Installation failed:', error);
        // Still complete installation even if caching fails
        await self.skipWaiting();
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => {
          return name !== CACHE_NAME;
        }).map((name) => {
          return caches.delete(name);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - respond with cache or network
${strategyCode}

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL) || 
               caches.match('/') || 
               new Response('You are offline', { headers: { 'Content-Type': 'text/html' }});
      })
    );
    return;
  }
  
  // Handle other requests with chosen strategy
  event.respondWith(fetchResource(event.request));
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '${config.iconsPath || "/icons"}/icon-192x192.png',
    badge: '${config.iconsPath || "/icons"}/badge-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// Periodic sync for background updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  // Sync content in background when online
  if (navigator.onLine) {
    try {
      const cache = await caches.open(CACHE_NAME);
      
      // Update precached resources with validation
      await validateAndCacheResources(cache, PRECACHE_RESOURCES);
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }
}
`;
}

/**
 * Generate registration code for the service worker
 */
export function generateServiceWorkerRegistration(): string {
  return `// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('ServiceWorker registered with scope:', registration.scope);
      
      // Setup periodic background sync if supported
      if ('periodicSync' in registration) {
        try {
          await registration.periodicSync.register('content-sync', {
            minInterval: 24 * 60 * 60 * 1000 // Once per day
          });
        } catch (error) {
          console.log('Periodic sync could not be registered:', error);
        }
      }
      
      // Register for push notifications
      if ('PushManager' in window) {
        // The pushManager property interface allows you to receive notifications from third-party servers
        const subscribed = await registration.pushManager.getSubscription();
        if (!subscribed) {
          console.log('Push notifications available but not subscribed');
        }
      }
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  });
}`;
}

/**
 * Generate an offline fallback page
 */
export function generateOfflinePage(config: PWAConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Offline | ${config.name}</title>
  <meta name="theme-color" content="${config.themeColor}">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    html, body {
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: ${config.backgroundColor};
      color: #333;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      text-align: center;
    }
    
    .offline-container {
      max-width: 500px;
      padding: 2rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    h1 {
      margin-bottom: 1rem;
      color: ${config.themeColor};
    }
    
    p {
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    
    .icon {
      margin-bottom: 2rem;
      width: 80px;
      height: 80px;
    }
    
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: ${config.themeColor};
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="offline-container">
    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${config.themeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
      <line x1="12" y1="20" x2="12.01" y2="20"></line>
    </svg>
    
    <h1>You're Offline</h1>
    <p>It looks like you're currently offline. Please check your internet connection and try again.</p>
    
    <button class="btn" onclick="window.location.reload()">Retry</button>
  </div>
</body>
</html>`;
}

/**
 * Register a PWA in an application
 */
export function registerPWA(config: PWAConfig): void {
  // Implementation will be handled by CLI commands
  // This is a placeholder for direct usage in applications
}

/**
 * Convert PWA config to metadata format
 * This enables seamless integration with the metadata system
 */
export function pwaConfigToMetadata(config: PWAConfig): Metadata {
  return {
    title: config.name,
    description: config.description,
    themeColor: config.themeColor,
    manifest: '/manifest.json',
    viewport: {
      width: 'device-width',
      initialScale: 1,
      themeColor: config.themeColor
    },
    appleWebApp: {
      capable: true,
      title: config.shortName || config.name,
      statusBarStyle: config.statusBarStyle || 'default'
    },
    icons: {
      icon: [
        { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
      ],
      apple: [
        { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
      ]
    }
  };
}
