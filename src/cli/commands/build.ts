/**
 * 0x1 CLI - Build Command
 * Builds the application for production
 */

import { existsSync } from 'node:fs';
import { mkdir, readdir } from 'node:fs/promises'; // For directory operations
// We'll use Bun.file() instead of readFile/writeFile for better performance
import { basename, dirname, join, relative, resolve } from 'node:path';
import { buildAppBundle, buildComponents } from '../utils/builder'; // Import component builder utilities
import { logger } from '../utils/logger';
import { transpileJSX } from './jsx-transpiler';

// For dynamic imports
// Prefixing with underscore to indicate this interface is used for type checking only
interface _TailwindProcessor {
  process: (css: string, options: any) => Promise<{ css: string }>;
}

export interface BuildOptions {
  outDir?: string;
  minify?: boolean;
  watch?: boolean;
  silent?: boolean;
  config?: string;
  ignore?: string[];
}

/**
 * Build the application for production
 */
export async function build(options: BuildOptions = {}): Promise<void> {
  // const projectPath = process.cwd();
  // const outputPath = options.outDir || join(projectPath, 'dist');
  // const minify = options.minify ?? false;
  
  // // Define supported file extensions
  // const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

  // Start timing the build process
  const startTime = performance.now();
  // Only show logs if not silent
  const log = options.silent ?
    {
      info: () => {},
      error: () => {},
      warn: () => {},
      section: () => {},
      spinner: () => ({ stop: () => {} }),
      spacer: () => {}, // Add spacer method to silent logger
      success: () => {},
      highlight: (text: string) => text, // Make sure to include highlight
      gradient: (text: string) => text, // Include gradient function
      box: () => {}, // Add box method for silent logger
      command: () => {} // Add command method for silent logger
    } :
    logger;

  // Get project path
  const projectPath = process.cwd();

  // Load config file
  const configPath = options.config ?
    resolve(projectPath, options.config) :
    await findConfigFile(projectPath);

  const config = configPath ? await loadConfig(configPath) : {};

  // Set build options
  const outDir = options.outDir || config?.build?.outDir || 'dist';
  const minify = options.minify ?? config?.build?.minify ?? true;
  const ignorePatterns = options.ignore || config?.build?.ignore || ['node_modules', '.git', 'dist'];

  // Start build with beautiful section header
  log.section('BUILDING APPLICATION');
  log.spacer();

  // Log app structure detection
  const isAppDirStructure = existsSync(join(projectPath, 'app'));
  if (isAppDirStructure) {
    log.info('📁 App directory structure detected');
  } else {
    log.info('📁 Classic structure detected - consider migrating to app directory structure');
  }

  // Ensure output directory exists
  const outputPath = resolve(projectPath, outDir);
  await mkdir(outputPath, { recursive: true });

  // Copy static assets with file icon
  const assetsSpin = log.spinner('Copying static assets', 'file');
  try {
    await copyStaticAssets(projectPath, outputPath);
    
    // Copy 0x1 framework files to build output
    await copy0x1FrameworkFiles(outputPath);
    
    assetsSpin.stop('success', 'Static assets: copied successfully');
  } catch (error) {
    assetsSpin.stop('error', 'Failed to copy static assets');
    log.error(`${error}`);
    if (!options.silent) process.exit(1);
    return;
  }

  // Process HTML files with prettier output
  const htmlSpin = log.spinner('Processing HTML templates', 'file');
  try {
    await processHtmlFiles(projectPath, outputPath);
    htmlSpin.stop('success', 'HTML templates: generated successfully');
  } catch (error) {
    htmlSpin.stop('error', 'Failed to process HTML files');
    log.error(`${error}`);
    if (!options.silent) process.exit(1);
    return;
  }

  // Bundle JavaScript/TypeScript with enhanced Bun APIs
  // Optimized for app router structure
  await bundleJavaScript(projectPath, outputPath, { minify, ignorePatterns });
  
  // CRITICAL FIX: Add CSS processing that was missing!
  const cssProcessingSpin = log.spinner('Processing CSS files', 'css');
  try {
    await processCssFiles(projectPath, outputPath, { 
      minify, 
      ignorePatterns, 
      tailwindFailed: false // Let CSS processor handle Tailwind detection
    });
    cssProcessingSpin.stop('success', 'CSS files: processed successfully');
  } catch (error) {
    cssProcessingSpin.stop('error', 'Failed to process CSS files');
    log.error(`${error}`);
    // Don't exit - CSS failure shouldn't kill the build
    log.warn('Continuing build without CSS processing');
  }
  
  // CRITICAL FIX: Override app.js with dev-server aligned version
  logger.info('🔧 Generating production app.js aligned with dev server...');
  
  // Simple route discovery for production build
  function discoverProductionRoutes(projectPath: string) {
    const routes: Array<{ path: string; componentPath: string }> = [];
    
    try {
      const appDir = join(projectPath, 'app');
      if (existsSync(appDir)) {
        // Add root route
        const pageFiles = ['page.tsx', 'page.jsx', 'page.js', 'page.ts'];
        for (const pageFile of pageFiles) {
          if (existsSync(join(appDir, pageFile))) {
            routes.push({ 
              path: '/', 
              componentPath: `/app/${pageFile.replace(/\.(tsx|ts)$/, '.js')}` 
            });
            break;
          }
        }
      }
    } catch (error) {
      logger.debug(`Route discovery error: ${error}`);
    }
    
    return routes;
  }
  
  const discoveredRoutes = discoverProductionRoutes(projectPath);
  const routesJson = JSON.stringify(discoveredRoutes, null, 2);
  
  // Generate production app.js that matches dev server behavior
  const productionAppScript = `// 0x1 Framework App Bundle - PRODUCTION BUILD v2.0 (React 19 Compatible)
// Following Next.js 15 production best practices
console.log('[0x1 App] Starting production app...');

// Server-discovered routes
const serverRoutes = ${routesJson};

// PRODUCTION-READY INITIALIZATION SYSTEM
// Following modern React 19 and Next.js 15 patterns
class ProductionAppLoader {
  constructor() {
    this.hooksReady = false;
    this.jsxReady = false;
    this.componentsReady = false;
    this.retryCount = 0;
    this.maxRetries = 30; // Increased for slower connections
    this.errorBoundary = this.createErrorBoundary();
  }

  // Error Boundary following React 19 patterns
  createErrorBoundary() {
    return {
      hasError: false,
      error: null,
      componentStack: null,
      
      getDerivedStateFromError(error) {
        return { hasError: true, error };
      },
      
      componentDidCatch(error, errorInfo) {
        console.error('[0x1 Error Boundary] Component error:', error);
        console.error('[0x1 Error Boundary] Error info:', errorInfo);
        
        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
          gtag('event', 'exception', {
            description: error.toString(),
            fatal: false,
          });
        }
      },
      
      render(error) {
        if (this.hasError) {
          return \`
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 2rem;
              background: linear-gradient(135deg, #0070f3 0%, #6219ff 100%);
              color: white;
              font-family: system-ui, sans-serif;
            ">
              <div style="
                text-align: center;
                max-width: 500px;
                background: rgba(255,255,255,0.1);
                padding: 2rem;
                border-radius: 12px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
              ">
                <h1 style="margin-bottom: 1rem; font-size: 1.5rem;">Application Error</h1>
                <p style="margin-bottom: 1rem; opacity: 0.9;">\${error.message || 'Something went wrong'}</p>
                <button 
                  onclick="window.location.reload()" 
                  style="
                    background: white;
                    color: #0070f3;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                  "
                  onmouseover="this.style.transform='scale(1.05)'"
                  onmouseout="this.style.transform='scale(1)'"
                >
                  Reload Application
                </button>
              </div>
            </div>
          \`;
        }
        return null;
      }
    };
  }

  // Modern async initialization with proper error handling
  async initialize() {
    try {
      console.log('[0x1 App] 🚀 Initializing production app (v2.0)...');
      
      const appElement = document.getElementById('app');
      if (!appElement) {
        throw new Error('App container element not found');
      }

      // Show loading state with improved UX
      this.showLoadingState(appElement);
      
      // CRITICAL FIX: Sequential initialization following React 19 best practices
      console.log('[0x1 App] 📋 Phase 1: Framework Systems...');
      await this.initializeFrameworkSystems();
      
      console.log('[0x1 App] 🧩 Phase 2: Component Bundle...');
      await this.initializeComponentBundle();
      
      console.log('[0x1 App] 🎨 Phase 3: Application Mount...');
      await this.mountApplication(appElement);
      
      console.log('[0x1 App] ✅ Production app initialized successfully!');
      this.hideLoadingIndicator();
      
    } catch (error) {
      console.error('[0x1 App] ❌ Initialization failed:', error);
      this.handleInitializationError(error);
    }
  }

  // Enhanced loading state following modern UX patterns
  showLoadingState(appElement) {
    appElement.innerHTML = \`
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #0070f3 0%, #6219ff 100%);
        color: white;
        font-family: system-ui, sans-serif;
      ">
        <div style="text-align: center;">
          <div style="
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          "></div>
          <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Loading 0x1 App</h2>
          <p style="opacity: 0.8; font-size: 0.9rem;" id="loading-status">Initializing framework...</p>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    \`;
  }

  updateLoadingStatus(message) {
    const statusEl = document.getElementById('loading-status');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  // CRITICAL FIX: Proper sequential framework initialization
  async initializeFrameworkSystems() {
    this.updateLoadingStatus('Loading hooks system...');
    
    // Phase 1A: Load hooks module and wait for globals
    await this.loadHooksSystem();
    
    this.updateLoadingStatus('Loading JSX runtime...');
    
    // Phase 1B: Load JSX runtime and wait for globals  
    await this.loadJSXRuntime();
    
    console.log('[0x1 App] ✅ Framework systems ready');
  }

  async loadHooksSystem() {
    try {
      // Import the hooks module
      await import('/0x1/hooks.js?t=' + Date.now());
      
      // CRITICAL: Wait for globals to be available with retries
      let retries = 0;
      while (retries < this.maxRetries) {
        if (typeof window !== 'undefined' && 
            window.__0x1_enterComponentContext && 
            window.__0x1_exitComponentContext &&
            window.React && 
            window.React.useState) {
          console.log('[0x1 App] ✅ Hooks system verified');
          this.hooksReady = true;
          return true;
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      throw new Error('Hooks system failed to initialize after ' + this.maxRetries + ' attempts');
      
    } catch (error) {
      console.error('[0x1 App] ❌ Failed to initialize hooks system:', error);
      throw error;
    }
  }

  async loadJSXRuntime() {
    try {
      // Import JSX runtime
      await import('/0x1/jsx-runtime.js?t=' + Date.now());
      
      // CRITICAL: Wait for JSX globals with retries
      let retries = 0;
      while (retries < this.maxRetries) {
        if (typeof window !== 'undefined' && 
            window.jsx && 
            window.jsxs && 
            window.createElement && 
            window.renderToDOM) {
          console.log('[0x1 App] ✅ JSX runtime verified');
          this.jsxReady = true;
          return true;
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      throw new Error('JSX runtime failed to initialize after ' + this.maxRetries + ' attempts');
      
    } catch (error) {
      console.error('[0x1 App] ❌ Failed to initialize JSX runtime:', error);
      throw error;
    }
  }

  async initializeComponentBundle() {
    this.updateLoadingStatus('Loading components...');
    
    try {
      // Import app bundle with cache busting
      const bundleModule = await import('/app-bundle.js?t=' + Date.now());
      
      if (!bundleModule || !bundleModule.default) {
        throw new Error('App bundle did not export a default component');
      }
      
      console.log('[0x1 App] ✅ Component bundle loaded');
      this.componentsReady = true;
      this.appComponent = bundleModule.default;
      
    } catch (error) {
      console.error('[0x1 App] ❌ Failed to load component bundle:', error);
      throw error;
    }
  }

  async mountApplication(appElement) {
    this.updateLoadingStatus('Mounting application...');
    
    if (!this.hooksReady || !this.jsxReady || !this.componentsReady) {
      throw new Error('Framework systems not ready for mounting');
    }
    
    try {
      // Clear loading state
      appElement.innerHTML = '';
      
      // CRITICAL: Proper component context setup for React 19 compatibility
      if (window.__0x1_enterComponentContext) {
        window.__0x1_enterComponentContext('App');
      }
      
      try {
        // Use the framework's JSX system to create component
        const component = window.jsx(this.appComponent, {});
        
        // Render using the framework's renderToDOM
        const rendered = window.renderToDOM(component);
        
        if (rendered) {
          appElement.appendChild(rendered);
          console.log('[0x1 App] ✅ Component mounted successfully');
        } else {
          throw new Error('Component rendering returned null');
        }
        
      } finally {
        // Always clean up component context
        if (window.__0x1_exitComponentContext) {
          window.__0x1_exitComponentContext();
        }
      }
      
    } catch (error) {
      console.error('[0x1 App] ❌ Failed to mount application:', error);
      throw error;
    }
  }

  handleInitializationError(error) {
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = this.errorBoundary.render(error);
    }
    
    // Hide loading indicator
    this.hideLoadingIndicator();
  }

  hideLoadingIndicator() {
    if (typeof window !== 'undefined' && window.appReady) {
      window.appReady();
    }
  }
}

// Production-ready error handling
window.addEventListener('error', (event) => {
  console.error('[0x1 Global] Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[0x1 Global] Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the default browser behavior
});

// Initialize app with proper timing
const appLoader = new ProductionAppLoader();

// Start app immediately or when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => appLoader.initialize());
} else {
  // Use setTimeout to ensure all scripts have loaded
  setTimeout(() => appLoader.initialize(), 10);
}
`;

  // Write the aligned production app.js
  await Bun.write(join(outputPath, 'app.js'), productionAppScript);
  logger.info('✅ Production app.js generated (self-contained)');
  
  // Generate PWA manifest following modern standards
  const manifest = {
    name: "0x1 Framework App",
    short_name: "0x1 App", 
    description: "Fast, modern web applications built with 0x1 framework",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0070f3",
    orientation: "portrait-primary",
    scope: "/",
    categories: ["productivity", "developer"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512.png", 
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    screenshots: [
      {
        src: "/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide"
      },
      {
        src: "/screenshot-narrow.png", 
        sizes: "640x1136",
        type: "image/png",
        form_factor: "narrow"
      }
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Go to app dashboard",
        url: "/dashboard",
        icons: [{ src: "/shortcut-dashboard.png", sizes: "96x96" }]
      }
    ],
    prefer_related_applications: false,
    edge_side_panel: {
      preferred_width: 400
    }
  };
  
  await Bun.write(join(outputPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
  logger.info('✅ PWA manifest generated');
  
  // Generate Service Worker for production caching
  const serviceWorker = `// 0x1 Framework Service Worker - Production Caching Strategy
// Following modern PWA and Next.js caching patterns

const CACHE_NAME = '0x1-app-v1.0.0';
const RUNTIME_CACHE = '0x1-runtime-v1.0.0';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/styles.css',
  '/app.js',
  '/app-bundle.js',
  '/0x1/hooks.js',
  '/0x1/jsx-runtime.js',
  '/0x1/index.js',
  '/manifest.json'
];

// Cache-first strategy for static assets
const CACHE_FIRST_PATTERNS = [
  /\\.(?:js|css|woff2?|eot|ttf|otf)$/,
  /\\/0x1\\//
];

// Network-first strategy for API calls
const NETWORK_FIRST_PATTERNS = [
  /\\/api\\//,
  /\\/graphql/
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Assets precached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precaching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Cache-first for static assets
    if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await cacheFirst(request);
    }
    
    // Network-first for API calls
    if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await networkFirst(request);
    }
    
    // Stale-while-revalidate for pages
    return await staleWhileRevalidate(request);
    
  } catch (error) {
    console.error('[SW] Request handling error:', error);
    
    // Return offline fallback if available
    return await getOfflineFallback(request);
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetch(request);
  
  if (response.status === 200) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// Network-first strategy
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached); // Return cached on network error
  
  return cached || await fetchPromise;
}

// Offline fallback
async function getOfflineFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Return cached version if available
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const offlinePage = await cache.match('/');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Return a basic offline response
  return new Response(
    'Offline - Content not available',
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  );
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle failed requests when connection is restored
  console.log('[SW] Performing background sync...');
}

// Push notifications support
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  const options = {
    body: event.data.text(),
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/action-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/action-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('0x1 App', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
`;

  await Bun.write(join(outputPath, 'sw.js'), serviceWorker);
  logger.info('✅ Service Worker generated for offline support');
  
  // Generate sitemap.xml for SEO
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://0x1f.vercel.app/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  await Bun.write(join(outputPath, 'sitemap.xml'), sitemap);
  logger.info('✅ SEO sitemap generated');
  
  // Generate robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://0x1f.vercel.app/sitemap.xml`;

  await Bun.write(join(outputPath, 'robots.txt'), robotsTxt);
  logger.info('✅ Robots.txt generated');
  
  // Copy the app bundle to root for direct access
  const builtBundlePath = join(projectPath, '.0x1', 'public', 'app-bundle.js');
  if (existsSync(builtBundlePath)) {
    const bundleContent = await Bun.file(builtBundlePath).text();
    await Bun.write(join(outputPath, 'app-bundle.js'), bundleContent);
    logger.info('✅ App bundle copied to root for production access');
  }

  // Output build info with beautiful formatting
  log.box('Build Complete');
  log.info(`📦 Output directory: ${log.highlight(outputPath)}`);
  log.info(`🔧 Minification: ${minify ? 'enabled' : 'disabled'}`);

  // Calculate and display build time
  const endTime = performance.now();
  const buildTimeMs = endTime - startTime;
  const formattedTime = buildTimeMs < 1000 ?
    `${buildTimeMs.toFixed(2)}ms` :
    `${(buildTimeMs / 1000).toFixed(2)}s`;

  log.spacer();
  log.info(`⚡ Build completed in ${log.highlight(formattedTime)}`);

  // Watch mode if requested
  if (options.watch && !options.silent) {
    log.spacer();
    log.info('👀 Watching for changes...');
    log.info('Press Ctrl+C to stop');

    // Implementation of watch mode would go here
    // For now, this is a placeholder
  }
}

/**
 * Alias for compatibility with CLI index
 */
export const buildProject = build;

/**
 * Find configuration file in project directory
 */
async function findConfigFile(projectPath: string): Promise<string | null> {
  // Check for TypeScript config first
  const tsConfigPath = join(projectPath, '0x1.config.ts');
  if (existsSync(tsConfigPath)) {
    return tsConfigPath;
  }

  // Then check for JavaScript config
  const jsConfigPath = join(projectPath, '0x1.config.js');
  if (existsSync(jsConfigPath)) {
    return jsConfigPath;
  }

  // Look for package.json with 0x1 field
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(await Bun.file(packageJsonPath).text());
      if (packageJson['0x1']) {
        return packageJsonPath;
      }
    } catch (error) {
      // Ignore errors in package.json parsing
    }
  }

  return null;
}

/**
 * Load configuration from file
 */
async function loadConfig(configPath: string): Promise<any> {
  try {
    if (configPath.endsWith('.js') || configPath.endsWith('.ts')) {
      // For JS/TS configs, use dynamic import
      try {
        const config = await import(configPath);
        return config.default || config;
      } catch (error) {
        logger.warn(`Failed to import config from ${configPath}: ${error}`);
        // Fallback to reading as text and evaluating
        const content = await Bun.file(configPath).text();

        try {
          // Extract the config object literal from the file
          const match = content.match(/export\s+default\s+({[\s\S]*});?$/m);
          if (match && match[1]) {
            // Very simple approach - this will only work for basic objects
            // A real implementation would need a proper parser
            return JSON.parse(match[1].replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'));
          }
        } catch (evalError) {
          logger.warn(`Failed to evaluate config: ${evalError}`);
        }
      }
    } else if (configPath.endsWith('package.json')) {
      // For package.json, extract the 0x1 field
      const content = Bun.file(configPath).text();
      const packageJson = JSON.parse(await content);
      return packageJson['0x1'] || {};
    }

    return {};
  } catch (error) {
    logger.warn(`Failed to load config from ${configPath}: ${error}`);
    return {};
  }
}

/**
 * Copy static assets
 */
async function copyStaticAssets(projectPath: string, outputPath: string): Promise<void> {
  // We'll consider anything in the public directory as static assets
  const publicDir = join(projectPath, 'public');

  if (existsSync(publicDir)) {
    await copyDir(publicDir, outputPath);
  }
}

/**
 * Copy 0x1 framework files to build output
 */
async function copy0x1FrameworkFiles(outputPath: string): Promise<void> {
  try {
    // Create the 0x1 directory in the output
    const framework0x1Dir = join(outputPath, '0x1');
    await mkdir(framework0x1Dir, { recursive: true });
    
    // Get the path to the framework dist directory more reliably
    // From the CLI commands directory, go up to the project root and then to dist
    const currentFile = new URL(import.meta.url).pathname;
    const cliCommandsDir = dirname(currentFile);
    const frameworkRoot = resolve(cliCommandsDir, '..', '..');
    const frameworkDistPath = join(frameworkRoot, 'dist');
    
    logger.debug(`Looking for framework files in: ${frameworkDistPath}`);
    
    // Copy essential framework files
    const frameworkFiles = [
      { src: 'jsx-runtime.js', dest: 'jsx-runtime.js' },
      { src: 'jsx-dev-runtime.js', dest: 'jsx-dev-runtime.js' },
      { src: 'core/router.js', dest: 'router.js' },
      { src: 'core/hooks.js', dest: 'hooks.js' },
      { src: 'index.js', dest: 'index.js' }
    ];
    
    let copiedCount = 0;
    for (const { src, dest } of frameworkFiles) {
      const srcPath = join(frameworkDistPath, src);
      const destPath = join(framework0x1Dir, dest);
      
      if (existsSync(srcPath)) {
        const content = await Bun.file(srcPath).text();
        await Bun.write(destPath, content);
        logger.debug(`Copied framework file: ${src} -> ${dest}`);
        copiedCount++;
      } else {
        logger.warn(`Framework file not found: ${srcPath}`);
      }
    }
    
    if (copiedCount > 0) {
      logger.info(`✅ Copied ${copiedCount} 0x1 framework files to build output`);
    } else {
      logger.warn('⚠️ No 0x1 framework files were copied - build may not work in production');
    }
  } catch (error) {
    logger.warn(`Failed to copy 0x1 framework files: ${error}`);
  }
}

/**
 * Process HTML files
 */
async function processHtmlFiles(projectPath: string, outputPath: string): Promise<void> {
  // Find HTML files in the project
  const htmlFiles = await findFiles(projectPath, '.html', ['node_modules', 'dist', '.git']);

  // Process each HTML file
  for (const htmlFile of htmlFiles) {
    // Get the relative path to maintain directory structure
    const relativePath = relative(projectPath, htmlFile);
    const outputFile = join(outputPath, relativePath);

    // Create output directory if needed
    await mkdir(dirname(outputFile), { recursive: true });

    // Read the HTML file
    const content = await Bun.file(htmlFile).text();

    // Process the HTML content
    const processedContent = await processHtml(content, {
      projectPath,
      outputPath,
      relativePath
    });

    // Write the processed HTML file
    await Bun.write(outputFile, processedContent);
  }

  // If no HTML files found, create a proper index.html that loads the application
  if (htmlFiles.length === 0) {
    // Check for app entry point (app/page.tsx, app/page.jsx, app/page.js, etc.)
    const appDir = join(projectPath, 'app');
    const hasAppDir = existsSync(appDir);

    if (hasAppDir) {
      // CRITICAL FIX: Create production-specific HTML template instead of dev server template
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  
  <!-- SEO and Performance Following Next.js 15 Best Practices -->
  <title>0x1 App</title>
  <meta name="description" content="Fast, modern web applications built with 0x1 framework">
  <meta name="keywords" content="0x1, framework, react, performance, modern">
  <meta name="author" content="0x1 Framework">
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://0x1f.vercel.app/">
  <meta property="og:title" content="0x1 App">
  <meta property="og:description" content="Fast, modern web applications built with 0x1 framework">
  <meta property="og:site_name" content="0x1 Framework">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://0x1f.vercel.app/">
  <meta property="twitter:title" content="0x1 App">
  <meta property="twitter:description" content="Fast, modern web applications built with 0x1 framework">
  
  <!-- Performance Optimizations -->
  <meta name="theme-color" content="#0070f3">
  <meta name="color-scheme" content="dark light">
  <meta name="format-detection" content="telephone=no">
  
  <!-- Preload Critical Resources -->
  <link rel="preload" href="/styles.css" as="style">
  <link rel="preload" href="/0x1/hooks.js" as="script" crossorigin>
  <link rel="preload" href="/0x1/jsx-runtime.js" as="script" crossorigin>
  <link rel="preload" href="/app-bundle.js" as="script" crossorigin>
  
  <!-- DNS Prefetch for External Resources -->
  <link rel="dns-prefetch" href="//fonts.googleapis.com">
  <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
  
  <!-- Security Headers -->
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
  
  <!-- Favicons and App Icons -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.json">
  
  <!-- Main Stylesheet -->
  <link rel="stylesheet" href="/styles.css">
  
  <style>
    /* Critical CSS for First Paint - Following Core Web Vitals Best Practices */
    :root {
      --primary: #0070f3;
      --primary-dark: #0051cc;
      --secondary: #6219ff;
      --secondary-dark: #4d0cc7;
      --background: #0a0a0a;
      --background-secondary: #1a1a1a;
      --text: #ffffff;
      --text-secondary: #a0a0a0;
      --border: #333333;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    html {
      /* Improved scrolling behavior */
      scroll-behavior: smooth;
      /* Better font rendering */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    
    body {
      font-family: var(--font);
      background: var(--background);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      /* Prevent horizontal scroll on mobile */
      overflow-x: hidden;
      /* Better font rendering */
      font-feature-settings: "kern" 1, "liga" 1;
      font-variant-ligatures: common-ligatures;
    }
    
    /* Focus management for accessibility */
    :focus {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
    
    :focus:not(:focus-visible) {
      outline: none;
    }
    
    /* App container optimizations */
    #app {
      min-height: 100vh;
      position: relative;
      /* Prevent layout shift */
      contain: layout style paint;
    }
    
    /* Reduced motion for accessibility */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: light) {
      :root {
        --background: #ffffff;
        --background-secondary: #f8f9fa;
        --text: #000000;
        --text-secondary: #666666;
        --border: #e1e5e9;
      }
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      :root {
        --primary: #0000ff;
        --secondary: #8b00ff;
        --border: #000000;
      }
    }
    
    /* Loading states following React 19 Suspense patterns */
    .app-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      position: fixed;
      top: 0;
      left: 0;
      background: var(--background);
      z-index: 1000;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    
    .app-loading.loaded {
      opacity: 0;
      visibility: hidden;
    }
    
    /* Enhanced loading animations */
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top: 3px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Error boundary styles */
    .error-boundary {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: white;
      font-family: var(--font);
    }
    
    .error-content {
      text-align: center;
      max-width: 500px;
      background: rgba(255,255,255,0.1);
      padding: 2rem;
      border-radius: 12px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .error-button {
      background: white;
      color: var(--primary);
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      font-family: inherit;
    }
    
    .error-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .error-button:active {
      transform: translateY(0);
    }
    
    /* Skip to content for accessibility */
    .skip-to-content {
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
      background: var(--primary);
      color: white;
      padding: 8px 16px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
    }
    
    .skip-to-content:focus {
      position: absolute;
      left: 6px;
      top: 6px;
      width: auto;
      height: auto;
      overflow: visible;
      z-index: 10000;
    }
  </style>
</head>
<body>
  <!-- Skip to content for screen readers -->
  <a href="#main-content" class="skip-to-content">Skip to main content</a>
  
  <!-- Main application container -->
  <div id="app" role="main" aria-label="Application"></div>
  
  <!-- Loading overlay with improved accessibility -->
  <div class="app-loading" id="app-loading" role="status" aria-live="polite" aria-label="Loading application">
    <div style="text-align: center;">
      <div class="loading-spinner" aria-hidden="true"></div>
      <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Loading 0x1 App</h2>
      <p style="opacity: 0.8; font-size: 0.9rem;" id="loading-status">Initializing framework...</p>
    </div>
  </div>
  
  <!-- Error container with accessibility -->
  <div class="error-container" id="error-container" style="display: none;" role="alert" aria-live="assertive">
    <div class="error-content">
      <h1 style="margin-bottom: 1rem; font-size: 1.5rem;">Application Error</h1>
      <p style="margin-bottom: 1rem; opacity: 0.9;">Failed to load the application.</p>
      <p class="error-details" id="error-details" style="margin-bottom: 1.5rem; font-size: 0.9rem;">Check browser console for more details.</p>
      <button class="error-button" onclick="window.location.reload()" type="button">
        Reload Application
      </button>
    </div>
  </div>
  
  <!-- Service Worker Registration -->
  <script>
    // Service worker for caching (PWA support)
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('[SW] Registered:', registration);
          })
          .catch(registrationError => {
            console.log('[SW] Registration failed:', registrationError);
          });
      });
    }
  </script>
  
  <!-- Performance monitoring -->
  <script>
    // Core Web Vitals tracking following Next.js patterns
    function sendToAnalytics(metric) {
      if (typeof gtag !== 'undefined') {
        gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        });
      }
      
      console.log('[Performance]', metric.name, Math.round(metric.value), metric.rating);
    }
    
    // Import Web Vitals library if available
    if (typeof webVitals !== 'undefined') {
      webVitals.getCLS(sendToAnalytics);
      webVitals.getFID(sendToAnalytics);
      webVitals.getFCP(sendToAnalytics);
      webVitals.getLCP(sendToAnalytics);
      webVitals.getTTFB(sendToAnalytics);
    }
  </script>
  
  <!-- Enhanced error handling -->
  <script>
    // Global error handling with better UX
    window.addEventListener('error', function(e) {
      console.error('[Global Error]:', e.error);
      
      const errorContainer = document.getElementById('error-container');
      const errorDetails = document.getElementById('error-details');
      const appLoading = document.getElementById('app-loading');
      
      if (appLoading) {
        appLoading.style.display = 'none';
      }
      
      if (errorContainer && errorDetails) {
        errorContainer.style.display = 'flex';
        errorDetails.textContent = e.error ? e.error.toString() : 'Unknown error occurred';
      }
    });
    
    window.addEventListener('unhandledrejection', function(e) {
      console.error('[Unhandled Promise Rejection]:', e.reason);
      e.preventDefault();
    });
    
    // Hide loading overlay when app is ready
    window.appReady = function() {
      const loadingEl = document.getElementById('app-loading');
      if (loadingEl) {
        loadingEl.classList.add('loaded');
        setTimeout(() => {
          loadingEl.remove();
        }, 500);
      }
    };
    
    // Fallback timeout with better messaging
    setTimeout(() => {
      const loadingEl = document.getElementById('app-loading');
      if (loadingEl && !loadingEl.classList.contains('loaded')) {
        console.warn('[App] Loading timeout reached');
        loadingEl.classList.add('loaded');
      }
    }, 10000); // Increased timeout for slower connections
  </script>
  
  <!-- Process polyfill for browser compatibility -->
  <script>
    // Enhanced process polyfill for Node.js compatibility
    if (typeof process === 'undefined') {
      window.process = {
        env: {
          NODE_ENV: 'production',
          CI: false,
          VERCEL: typeof window !== 'undefined' && window.location.hostname.includes('vercel'),
          NETLIFY: false,
          GITHUB_ACTIONS: false,
          GITLAB_CI: false,
          DEBUG: false
        },
        stdout: {
          isTTY: false,
          clearLine: undefined,
          cursorTo: undefined
        },
        version: 'v18.0.0',
        versions: { 
          node: '18.0.0',
          v8: '10.0.0',
          uv: '1.43.0',
          zlib: '1.2.11',
          brotli: '1.0.9',
          ares: '1.18.1',
          modules: '108',
          nghttp2: '1.47.0',
          napi: '8',
          llhttp: '6.0.4',
          openssl: '3.0.2'
        },
        platform: 'browser',
        arch: 'x64',
        browser: true,
        cwd: () => '/',
        chdir: () => {},
        exit: () => {},
        nextTick: (fn) => Promise.resolve().then(fn)
      };
    }
  </script>
  
  <!-- Load the production application with proper error handling -->  
  <script src="/app.js" type="module" onerror="console.error('Failed to load app.js')" async></script>
</body>
</html>`;

      await Bun.write(join(outputPath, 'index.html'), indexHtml);
      logger.info('✅ Created production-specific index.html');
    }
  }
}

/**
 * Process HTML content
 */
async function processHtml(
  content: string,
  _options: { projectPath: string; outputPath: string; relativePath: string }
): Promise<string> {
  // This is a placeholder for more complex HTML processing
  // In a real implementation, you might want to:
  // - Inject CSS and JS bundles
  // - Add preload hints
  // - Minify HTML
  // - Add CSP headers
  // - etc.
  return content;
}

/**
 * Bundle JavaScript/TypeScript with enhanced Bun APIs
 * Optimized for app router structure
 */
async function bundleJavaScript(
  projectPath: string,
  outputPath: string,
  options: { minify: boolean, ignorePatterns?: string[] }
): Promise<void> {
  const { minify, ignorePatterns = ['node_modules', '.git', 'dist'] } = options;
  // File extensions to look for
  const fileExtensions = ['.tsx', '.ts', '.jsx', '.js'];

  // Create public directory for bundled JS (but also put main files in root)
  const jsOutputPath = join(outputPath, 'public', 'js');
  await mkdir(jsOutputPath, { recursive: true });
  
  // Also ensure we can put main files directly in the output root
  await mkdir(outputPath, { recursive: true });

  // Create .0x1 directory for temp files if it doesn't exist
  const tempDir = join(projectPath, '.0x1', 'temp');
  await mkdir(tempDir, { recursive: true });
  
  // Helper function to find main entry file
  function findMainEntryFile(dir: string): string | null {
    const entryFileNames = ['index.js', 'index.ts', 'index.tsx', 'index.jsx', 'app.js', 'app.ts', 'app.tsx', 'app.jsx', '_app.js', '_app.ts', '_app.tsx', '_app.jsx'];

    for (const fileName of entryFileNames) {
      const entryPath = join(dir, fileName);
      if (existsSync(entryPath)) {
        return entryPath;
      }
    }
    return null;
  }
  
  // First build all components using our new builder utility
  const componentsBuilt = await buildComponents(projectPath);
  
  if (!componentsBuilt) {
    logger.warn('No components were found or built. Application may not function correctly.');
  }
  
  // Build the app bundle
  const bundleBuilt = await buildAppBundle(projectPath);
  
  if (!bundleBuilt) {
    // If bundle build fails, try traditional entry point approach as fallback
    logger.warn('Failed to build using modern app structure, falling back to traditional entry point detection');
    
    // Find entry points using traditional approach
    let mainEntryFile = findMainEntryFile(join(projectPath, 'app'));

    // If no entry point found in app/, try src/ directory
    if (!mainEntryFile && existsSync(join(projectPath, 'src'))) {
      mainEntryFile = findMainEntryFile(join(projectPath, 'src'));
    }

    // If no entry point found in src/, check project root
    if (!mainEntryFile) {
      mainEntryFile = findMainEntryFile(projectPath);
    }

    if (!mainEntryFile) {
      throw new Error('No entry point found. Please create app/page.tsx or src/index.js');
    }

    // Process bundle
    await processJSBundle(mainEntryFile, projectPath, { minify });
  } else {
    logger.info('✅ App bundle built successfully using modern structure');
    
    // Copy the built bundle to the output directory directly
    const builtBundlePath = join(projectPath, '.0x1', 'public', 'app-bundle.js');
    if (existsSync(builtBundlePath)) {
      const bundleContent = await Bun.file(builtBundlePath).text();
      
      // Use the bundle content directly - it should already have proper imports and component handling
      await Bun.write(join(outputPath, 'app.js'), bundleContent);
      logger.info('✅ App bundle deployed successfully');
    } else {
      // Bundle build reported success but no file created - create a diagnostic bundle
      logger.warn('Bundle build succeeded but no file found - creating diagnostic bundle');
      const diagnosticBundle = `// 0x1 Diagnostic Bundle
import { jsx, jsxs, Fragment, createElement } from '/0x1/jsx-runtime.js';

function DiagnosticApp() {
  return jsx('div', { 
    className: 'p-8 text-center',
    children: [
      jsx('h1', { className: 'text-2xl font-bold mb-4', children: '0x1 Diagnostic' }),
      jsx('p', { className: 'mb-2', children: 'App bundle build succeeded but no bundle file was found.' }),
      jsx('p', { className: 'text-sm opacity-75', children: 'Check your app/page.tsx file and build process.' })
    ]
  });
}

// Mount the diagnostic app
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app');
    if (appRoot) {
      appRoot.innerHTML = '';
      appRoot.appendChild(DiagnosticApp());
      console.log('✅ Diagnostic app rendered');
      if (window.appReady) window.appReady();
    }
  });
}

export default DiagnosticApp;
`;
      await Bun.write(join(outputPath, 'app.js'), diagnosticBundle);
      logger.warn('Created diagnostic bundle as fallback');
    }
  }
}

/**
 * Process JavaScript/TypeScript file bundle
 */
async function processJSBundle(entryFile: string, projectPath: string, options: { minify: boolean }): Promise<boolean | void> {
  // Use direct transpilation for .tsx files to avoid bundling issues
  if (entryFile.endsWith('.tsx') || entryFile.endsWith('.jsx')) {
    // Calculate output file path similar to how it's done for other files
    const relativePath = relative(projectPath, entryFile);
    const outputDir = join(projectPath, 'dist');
    const baseName = relativePath.replace(/\\/g, '/'); // Normalize path separators for Windows
    const outputFile = join(outputDir, baseName.replace(/\.(tsx|jsx|ts|js)$/, '.js'));

    // Call transpileJSX with correct parameters
    return await transpileJSX(entryFile, dirname(outputFile), options.minify, projectPath);
  }
  const { minify } = options;

  // Not needed to check for TypeScript file type since we handle all file types

  // Get the relative path to the entry file from the project root
  const relativePath = relative(projectPath, entryFile);

  // Calculate the output file path
  // Convert .tsx/.ts to .js
  const outputName = relativePath
    .replace(/\.tsx?$/, '.js')
    .replace(/\.jsx$/, '.js');

  // Determine the output file path
  const outputFile = join(projectPath, 'dist', outputName);

  try {
    // Ensure the output directory exists
    await mkdir(dirname(outputFile), { recursive: true });

    // Read the entry file content
    const fileContent = await Bun.file(entryFile).text();

    // Configure Bun's bundler with proper JSX handling
    const loader: { [key: string]: 'tsx' | 'jsx' | 'js' | 'ts' } = {
      '.tsx': 'tsx',
      '.jsx': 'jsx',
      '.ts': 'ts',
      '.js': 'js'
    };

    // Check for 0x1 framework imports
    const file0x1Imports = fileContent.match(/from\s+['"]0x1(\/[\w-]+)?['"]|import\s+['"]0x1(\/[\w-]+)?['"]/);
    const routerImport = fileContent.match(/from\s+['"]0x1\/router['"]|import\s+['"]0x1\/router['"]/);

    // Modify content based on imports
    let modifiedContent = fileContent;

    // If we have router imports, replace them with global declarations
    if (routerImport) {
      logger.debug(`File ${relative(projectPath, entryFile)} contains router imports. Converting to global approach.`);

      // Replace router imports with global declarations
      modifiedContent = modifiedContent.replace(
        /import\s+\{\s*(?:Router|Link|NavLink|Redirect)(?:\s*,\s*(?:Router|Link|NavLink|Redirect))*\s*\}\s+from\s+['"]0x1\/router['"];?/g,
        '// Router components are available as globals from the script in index.html\n' +
        'declare const Router: any;\n' +
        'declare const Link: any;\n' +
        'declare const NavLink: any;\n' +
        'declare const Redirect: any;'
      );
    }

    // For other 0x1 framework imports, we still need to set up browser compatibility
    if (file0x1Imports && !routerImport) {
      logger.debug(`File ${relative(projectPath, entryFile)} contains other 0x1 framework imports. Setting up browser compatibility.`);

      // Create 0x1 module for browser compatibility
      const framework0x1Dir = join(dirname(outputFile), '0x1');

      // Transform bare imports like 'import { createElement, Fragment } from "0x1"'
      modifiedContent = modifiedContent.replace(
        /from\s+["'](0x1)["']|import\s+["']0x1["']|import\(["']0x1["']\)/g,
        (match) => {
          return match.replace(/["']0x1["']/, '"/0x1/index.js"');
        }
      );

      // Handle submodule imports like 'import { Router } from "0x1/router"'
      modifiedContent = modifiedContent.replace(
        /from\s+["'](0x1\/[\w-]+)["']|import\s+["']0x1(\/[\w-]+)["']|import\(["']0x1(\/[\w-]+)["']\)/g,
        (match, subpath1, subpath2, subpath3) => {
          const subpath = subpath1 || subpath2 || subpath3;
          return match.replace(/["']0x1(\/[\w-]+)["']/, '"/0x1' + subpath + '.js"');
        }
      );

      await mkdir(framework0x1Dir, { recursive: true });

      // Create browser-compatible index module for the 0x1 framework
      const indexJsContent = `
// 0x1 Framework - Browser Compatible Version

// Import main hooks system first
import * as hooks from './core/hooks.js';

// Import JSX runtime components
import { jsx, jsxs, Fragment, createElement } from './jsx-runtime.js';

// Import router components with consistent naming
import { Router, RouterLink, RouterNavLink, RouterRedirect, createRouter } from './router.js';

// Export version
export const version = '0.1.0';

// Export all hooks
export const {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useClickOutside,
  useFetch,
  useForm,
  useLocalStorage,
  setComponentContext,
  clearComponentContext,
  unmountComponent,
  isComponentMounted,
  getComponentStats,
  getAllComponentStats
} = hooks;

// Export all components and utilities
export {
  // JSX Runtime exports
  jsx,
  jsxs,
  Fragment,
  createElement,
  
  // Router exports
  Router,
  createRouter,
  RouterLink as Link, 
  RouterNavLink as NavLink,
  RouterRedirect as Redirect
};

// Default export for easy access to all components
export default {
  // Hooks
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useClickOutside,
  useFetch,
  useForm,
  useLocalStorage,
  setComponentContext,
  clearComponentContext,
  
  // JSX Runtime
  jsx,
  jsxs,
  Fragment,
  createElement,
  
  // Router components
  Router,
  createRouter,
  Link: RouterLink,
  NavLink: RouterNavLink,
  Redirect: RouterRedirect,
  
  // Version
  version
};`;

      await Bun.write(join(framework0x1Dir, 'index.js'), indexJsContent);
      
      // Also ensure hooks are available at the framework level
      const frameworkHooksDir = join(framework0x1Dir, 'core');
      await mkdir(frameworkHooksDir, { recursive: true });
      
      // Copy the transpiled hooks from dist if available
      const distHooksPath = join(__dirname, '..', '..', '..', 'dist', 'core', 'hooks.js');
      const nodeModulesHooksPath = join(framework0x1Dir, 'core', 'hooks.js');
      
      if (existsSync(distHooksPath)) {
        await Bun.write(nodeModulesHooksPath, await Bun.file(distHooksPath).text());
        console.log('✅ Hooks system copied to project framework directory');
        
        // Also ensure it's available in the node_modules structure for dev server
        const nodeModulesDevPath = join(framework0x1Dir, '..', '..', 'node_modules', '0x1', 'core');
        await mkdir(nodeModulesDevPath, { recursive: true });
        await Bun.write(join(nodeModulesDevPath, 'hooks.js'), await Bun.file(distHooksPath).text());
        console.log('✅ Hooks system copied to node_modules dev path');
      } else {
        console.warn('⚠️ Transpiled hooks not found at:', distHooksPath);
      }
    }
    // Create a temporary file path for modified content
    let actualEntryFile = entryFile;
    const tempFile = join(dirname(entryFile), `.temp-${basename(entryFile)}`);

    // If we modified the content, use the temp file for bundling
    if (modifiedContent !== fileContent) {
      // Use the temp file for bundling instead
      // Note: We don't actually modify entryFile directly as it could cause TypeScript errors
      await Bun.write(tempFile, modifiedContent);
      actualEntryFile = tempFile;
    }

    // Get base filename for naming configuration
    const baseName = basename(entryFile).split('.')[0];

    // Direct JSX handling approach using Bun's internal transpilation
    // This minimizes external dependencies for better reliability
    if (actualEntryFile.endsWith('.tsx') || actualEntryFile.endsWith('.jsx')) {
      logger.info(`Processing JSX in ${basename(actualEntryFile)}...`);

      try {
        // Create a simple JS file that directly imports our JSX runtime
        // and uses Bun's native JSX handling
        const tempJsFile = join(dirname(actualEntryFile), `.jsx-transpiled-${basename(actualEntryFile).replace(/\.tsx$|\.jsx$/, '.js')}`);

        // Create a temporary file that configures Bun's transpiler correctly
        const tempTsConfigFile = join(dirname(actualEntryFile), `.temp-tsconfig-jsx.json`);
        await Bun.write(tempTsConfigFile, JSON.stringify({
          "compilerOptions": {
            "target": "ESNext",
            "module": "ESNext",
            "jsx": "preserve",
            "jsxFactory": "createElement",
            "jsxFragmentFactory": "Fragment"
          }
        }));

        // Create a unique directory for the transpiled output
        const uniqueOutDir = dirname(tempJsFile);
        if (!existsSync(uniqueOutDir)) {
          await mkdir(uniqueOutDir, { recursive: true });
        }

        // Use Bun's built-in transpiler to handle JSX with unique settings to avoid conflicts
        // Create a completely unique output file to prevent collisions
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 10);
        const fileName = basename(actualEntryFile).replace(/\.tsx$/, '');
        const uniqueOutFile = join(uniqueOutDir, `${fileName}.${timestamp}-${randomId}.js`);

        // Use Bun's spawn for better performance and reliability
        const transpileResult = Bun.spawn([
          'bun', 'build', actualEntryFile,
          '--outfile', uniqueOutFile,
          '--tsconfig-override', tempTsConfigFile,
          '--external:@tailwind*',
          '--external:tailwindcss',
          '--external:postcss*',
          '--external:*.css',
          '--no-bundle-nodejs-globals'
        ]);

        const exitCode = await transpileResult.exited;
        if (exitCode === 0) {
          logger.debug(`Successfully transpiled JSX in ${basename(actualEntryFile)}`);

          // Modify the transpiled file to ensure it imports our JSX runtime properly
          let jsContent = await Bun.file(tempJsFile).text();

          // Add our JSX runtime imports at the top
          // Make sure we're defining Fragment properly with a consistent identifier
          const jsxRuntimeImport = `// Add JSX runtime imports\nimport { createElement, Fragment, jsx, jsxs, jsxDEV } from '/0x1/jsx-runtime.js';\n\n// Ensure Fragment is globally available with a consistent name\nwindow.Fragment = Fragment;\n\n`;

          jsContent = jsxRuntimeImport + jsContent;
          await Bun.write(tempJsFile, jsContent);

          // Use the pre-processed JS file for the main bundle
          actualEntryFile = tempJsFile;
        } else {
          logger.error(`Failed to transpile JSX in ${basename(actualEntryFile)}`);
        }
      } catch (err) {
        logger.error(`Error processing JSX: ${String(err)}`);
      }
    }

    // Create JSX runtime support files for the build - focused on modern approach
    const jsxRuntimeDir = dirname(outputFile);
    await mkdir(jsxRuntimeDir, { recursive: true });

    // Write JSX runtime shim that re-exports from the framework
    const jsxRuntimePath = join(jsxRuntimeDir, 'jsx-runtime.js');
    const jsxRuntimeContent = `// 0x1 Framework - JSX Runtime
// This exports all JSX runtime functions needed for components
import { createElement, Fragment, jsx, jsxs } from '/0x1/jsx-runtime.js';

// Export JSX runtime functions
export { createElement, Fragment, jsx, jsxs };
export const jsxDEV = jsx; // Development mode alias

// Also export as default for module interop
export default {
  createElement, Fragment, jsx, jsxs, jsxDEV
};
`;

    await Bun.write(jsxRuntimePath, jsxRuntimeContent);

    // Create dev runtime variant
    const jsxDevRuntimePath = join(jsxRuntimeDir, 'jsx-dev-runtime.js');
    const jsxDevRuntimeContent = jsxRuntimeContent.replace(/jsx-runtime\.js/g, 'jsx-dev-runtime.js');
    await Bun.write(jsxDevRuntimePath, jsxDevRuntimeContent);
    
    logger.info('✅ JSX runtime files created for modern imports');
    
    // Define build options using Bun's API
    const result = await Bun.build({
      entrypoints: [actualEntryFile],
      outdir: dirname(outputFile),
      naming: `[dir]/[name]${baseName === 'index' ? '' : '.[name]'}.js`,
      loader,
      // Apply minification based on options
      minify,
      // Add source maps for better debugging
      sourcemap: options.minify ? 'none' : 'external',
      // Define environment variables and JSX handling
      define: {
        'process.env.NODE_ENV': options.minify ? '"production"' : '"development"',
        'process.env.APP_DIR': existsSync(join(projectPath, 'app')) ? 'true' : 'false'
      },
      // Improve module resolution and tree shaking
      // treeshake: options.minify, // Removing unsupported property
      // Handle node modules properly
      external: ['*'],
      // Enable better error messages
      // logLevel: 'error', // Removing unsupported property
    });

    try {
      if (!result.success) {
        // Enhanced error logging to diagnose the JSX transpilation issue
        console.error('\n=============== BUILD ERROR DETAILS ===============');
        console.error('Build logs:', result.logs?.join('\n'));
        console.error('File being bundled:', actualEntryFile);

        // Try to read the file to see what might be causing the error
        try {
          const fileContent = await Bun.file(actualEntryFile).text();
          console.error('\nFile content snippet (first 200 chars):', fileContent.substring(0, 200) + '...');
        } catch (err) {
          console.error('Could not read file content:', err);
        }

        console.error('\n===============================================');
        throw new Error(`Bundle failed: ${result.logs?.join('\n') || 'Unknown error'}`);
      }
    } catch (error: any) {
      logger.error(`Error during bundling of ${entryFile}: ${error.message || error}`);
      if (error.stack) {
        logger.debug(`Stack trace: ${error.stack}`);
      }
      throw new Error(`Failed to bundle ${entryFile}: ${error.message || error}`);
    }

    logger.debug(`Bundle generated: ${outputFile}`);
  } catch (error: any) {
    logger.error(`Error during bundling of ${entryFile}: ${error.message || error}`);
    if (error.stack) {
      logger.debug(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Failed to bundle ${entryFile}: ${error.message || error}`);
  }
}

/**
 * Helper function to minify CSS with a simple, reliable implementation
 */
async function minifyCss(css: string): Promise<string> {
  // Simple, reliable CSS minification without complex Bun.spawn execution
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/[\r\n\t]+/g, '') // Remove newlines and tabs
    .replace(/ {2,}/g, ' ') // Replace multiple spaces with single space
    .replace(/([{:;,}]) /g, '$1') // Remove space after punctuation
    .replace(/ ([{:;,}])/g, '$1') // Remove space before punctuation
    .replace(/; }/g, '}') // Remove trailing semicolons before closing braces
    .replace(/;\}/g, '}') // Remove trailing semicolons before closing braces (no space)
    .trim();
}

/**
 * Process CSS files
 */
async function processCssFiles(
  projectPath: string,
  outputPath: string,
  options: { minify: boolean, ignorePatterns?: string[], tailwindFailed: boolean }
): Promise<void> {
  const { minify, ignorePatterns = ['node_modules', '.git', 'dist'], tailwindFailed } = options;

  // Get all css files
  const cssFiles = await findFiles(projectPath, '.css', ignorePatterns);

  // Check for tailwind config files
  const hasTailwind = existsSync(join(projectPath, 'tailwind.config.js')) ||
    existsSync(join(projectPath, 'tailwind.config.ts'));

  // If Tailwind processing already failed upstream, go directly to standard processing
  if (tailwindFailed) {
    logger.info('Using standard CSS processing (Tailwind failed upstream)');
    await processCssFilesStandard();
    return;
  }

  // Process Tailwind CSS if available and not already attempted
  if (hasTailwind) {
    // Create a combined CSS file for all CSS files
    let combinedCSS = '';

    // First add Tailwind directives
    combinedCSS = `
      /* Tailwind Directives */
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
    `;

    // Then add all other CSS files
    for (const cssFile of cssFiles) {
      const cssContent = await Bun.file(cssFile).text();
      combinedCSS += `\n/* From ${relative(projectPath, cssFile)} */\n${cssContent}`;
    }

    try {
      // Use Bun's built-in process.spawn to run tailwind CLI instead of importing modules
      // This avoids TypeScript errors with missing type declarations
      const tailwindCssOutputPath = join(outputPath, 'styles.css');
      // Write the combined CSS to a temporary file
      const tempCssPath = join(projectPath, '.temp-tailwind-input.css');
      await Bun.write(tempCssPath, combinedCSS);

      // Use Bun to process Tailwind CSS
      try {
        // Using Bun to run tailwindcss for optimal performance
        const args = [
          'bunx', 'tailwindcss',
          '-i', tempCssPath,
          '-o', tailwindCssOutputPath
        ];

        if (minify) {
          args.push('--minify');
        }

        const result = Bun.spawnSync(args, {
          cwd: projectPath,
          env: process.env,
          stdout: 'pipe',
          stderr: 'pipe'
        });

        // Clean up temporary file
        try {
          Bun.spawnSync(['rm', tempCssPath], { cwd: projectPath });
        } catch (e) {
          // Ignore cleanup errors
        }

        if (result.exitCode === 0) {
          logger.info('🎨 Tailwind CSS: processed successfully');
        } else {
          const error = new TextDecoder().decode(result.stderr);
          throw new Error(`Failed to process Tailwind CSS: ${error}`);
        }
      } catch (error) {
        // Clean up temporary file if it still exists
        if (existsSync(tempCssPath)) {
          try {
            Bun.spawnSync(['rm', tempCssPath], { cwd: projectPath });
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        throw error;
      }
    } catch (error) {
      logger.warn(`Failed to process Tailwind CSS: ${error}`);
      logger.info('Falling back to standard CSS processing');

      // Fall back to standard CSS processing
      await processCssFilesStandard();
    }
  } else {
    // Process CSS files without Tailwind
    await processCssFilesStandard();
  }

  // Standard CSS processing
  async function processCssFilesStandard() {
    if (cssFiles.length === 0) {
      logger.info('No CSS files found');

      // Create a minimal styles.css file with modern CSS resets
      const minimalCSS = `
        /* Modern CSS Reset */
        *, *::before, *::after {
          box-sizing: border-box;
        }

        body, h1, h2, h3, h4, p, figure, blockquote, dl, dd {
          margin: 0;
        }

        html:focus-within {
          scroll-behavior: smooth;
        }

        body {
          min-height: 100vh;
          text-rendering: optimizeSpeed;
          line-height: 1.6;
          font-family: system-ui, sans-serif;
        }

        img, picture {
          max-width: 100%;
          display: block;
        }

        input, button, textarea, select {
          font: inherit;
        }

        /* Basic styles for 0x1 app */
        #app {
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }
      `;

      const finalCSS = minify ? await minifyCss(minimalCSS) : minimalCSS;
      await Bun.write(join(outputPath, 'styles.css'), finalCSS);
      return;
    }

    // Combine all CSS files
    let combinedCSS = '';

    for (const cssFile of cssFiles) {
      const relativePath = relative(projectPath, cssFile);
      const cssContent = await Bun.file(cssFile).text();

      combinedCSS += `\n/* From ${relativePath} */\n${cssContent}`;
    }

    // Minify if needed
    const finalCSS = minify ? await minifyCss(combinedCSS) : combinedCSS;

    // Write the combined CSS file
    await Bun.write(join(outputPath, 'styles.css'), finalCSS);
  }
}

/**
 * Helper function to copy a directory recursively
 * Using Bun's optimized implementation for better performance
 */
async function copyDir(source: string, destination: string): Promise<void> {
  // Use Bun's native spawnSync for optimal performance when copying directories
  // This is much faster than recursive file copying for large directories
  try {
    // Ensure destination exists
    await mkdir(destination, { recursive: true });

    // Use cp -r for high-performance directory copying
    // This is faster than manually walking directories and copying files
    const result = Bun.spawnSync(['cp', '-r', `${source}/.`, destination], {
      cwd: process.cwd(),
      env: process.env,
      stdin: 'ignore',
      stdout: 'ignore',
      stderr: 'pipe'
    });

    if (result.exitCode !== 0) {
      // Handle copy errors more gracefully
      const error = new TextDecoder().decode(result.stderr);
      throw new Error(`Failed to copy directory: ${error}`);
    }
  } catch (error) {
    // Fallback to manual copying if the command fails
    // Get all files and subdirectories in the source directory
    const entries = await readdir(source, { withFileTypes: true });

    // Copy each entry
    for (const entry of entries) {
      const sourcePath = join(source, entry.name);
      const destPath = join(destination, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy subdirectory
        await copyDir(sourcePath, destPath);
      } else {
        // Copy file using Bun's optimized file API
        const file = Bun.file(sourcePath);
        await Bun.write(destPath, file);
      }
    }
  }
}

/**
 * Helper function to find files with specific extensions
 */
async function findFiles(dir: string, extensions: string | string[], ignorePatterns: string[] = ['node_modules', '.git', 'dist']): Promise<string[]> {
  const extensionsArray = Array.isArray(extensions) ? extensions : [extensions];
  const result: string[] = [];

  // Helper function to check if a path should be ignored
  function shouldIgnore(path: string): boolean {
    return ignorePatterns.some(pattern => {
      // Convert pattern to regex if it has wildcards
      if (pattern.includes('*')) {
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(path);
      }
      return path.includes(pattern);
    });
  }

  // Recursive function to search directories
  async function searchDir(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const path = join(currentDir, entry.name);
      const relativePath = relative(dir, path);

      // Skip ignored paths
      if (shouldIgnore(relativePath) || shouldIgnore(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        await searchDir(path);
      } else if (extensionsArray.some(ext => entry.name.endsWith(ext))) {
        result.push(path);
      }
    }
  }

  await searchDir(dir);
  return result;
}
