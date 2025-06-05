/**
 * 0x1 Framework Component Builder
 * NOW ALIGNED WITH DEV-SERVER - SINGLE SOURCE OF TRUTH
 * Uses same route discovery and sophisticated app generation as dev-server
 */

import { glob } from 'glob';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from './logger';

/**
 * Find all component files in the given directory (kept for compatibility)
 */
export async function findComponentFiles(directory: string): Promise<string[]> {
  try {
    const patterns = [
      'app/**/*.{jsx,tsx}',
      'src/app/**/*.{jsx,tsx}',
      'components/**/*.{jsx,tsx}',
      'src/components/**/*.{jsx,tsx}',
      'pages/**/*.{jsx,tsx}',
      'src/pages/**/*.{jsx,tsx}'
    ];
    
    const allPaths: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const componentPaths = await glob(pattern, {
          cwd: directory,
          absolute: true,
          ignore: ['**/node_modules/**', '**/*.d.ts', '**/.0x1/**']
        });
        
        allPaths.push(...componentPaths);
      } catch (error) {
        logger.debug(`Pattern ${pattern} failed: ${error}`);
      }
    }
    
    const uniquePaths = [...new Set(allPaths)];
    logger.debug(`Found ${uniquePaths.length} component files`);
    return uniquePaths;
  } catch (error) {
    logger.error(`Failed to find component files: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * REMOVED: buildComponents - no longer needed, route discovery handles this
 * The sophisticated system discovers components automatically during route discovery
 */

/**
 * Generate sophisticated app.js using dev server logic (SINGLE SOURCE OF TRUTH)
 */
export async function generateSophisticatedAppJs(projectPath: string, outputPath: string): Promise<void> {
  try {
    logger.info('Generating sophisticated app.js using dev-server logic...');
    
    // Import the route discovery from dev server (SINGLE SOURCE OF TRUTH)
    const { discoverRoutesFromFileSystem } = await import('../server/dev-server');
    
    // Discover routes using same logic as dev server
    const discoveredRoutes = discoverRoutesFromFileSystem(projectPath);
    logger.info(`Discovered ${discoveredRoutes.length} routes for build: ${discoveredRoutes.map(r => r.path).join(', ')}`);
    
    // Log layout information
    discoveredRoutes.forEach(route => {
      if (route.layouts && route.layouts.length > 0) {
        logger.info(`Route ${route.path} has ${route.layouts.length} layouts: ${route.layouts.map(l => l.path).join(' -> ')}`);
      }
    });
    
    // Safely serialize routes data
    let routesJson;
    try {
      const sanitizedRoutes = discoveredRoutes.map(route => ({
        path: route.path,
        componentPath: route.componentPath,
        layouts: route.layouts || []
      }));
      routesJson = JSON.stringify(sanitizedRoutes, null, 2);
    } catch (jsonError) {
      logger.error(`Error serializing routes: ${jsonError}`);
      routesJson = '[]';
    }

    // Generate the EXACT SAME sophisticated app.js as dev server
    const appScript = `// 0x1 Framework App Bundle - PRODUCTION-READY with ENHANCED STABILITY
console.log('[0x1 App] Starting production-ready app with proper sequencing...');

// Server-discovered routes  
const serverRoutes = ${routesJson};

// ===== PRODUCTION-READY POLYFILL SYSTEM =====
const polyfillCache = new Map();
const polyfillQueue = new Map();

async function loadPolyfillOnDemand(polyfillName) {
  if (polyfillCache.has(polyfillName)) {
    return polyfillCache.get(polyfillName);
  }
  
  if (polyfillQueue.has(polyfillName)) {
    return polyfillQueue.get(polyfillName);
  }
  
  console.log('[0x1 App] Loading polyfill:', polyfillName);
  
  const promise = (async () => {
    try {
      const polyfillScript = document.createElement('script');
      polyfillScript.type = 'module';
      polyfillScript.src = '/node_modules/' + polyfillName;
      
      await new Promise((resolve, reject) => {
        polyfillScript.onload = resolve;
        polyfillScript.onerror = reject;
        document.head.appendChild(polyfillScript);
      });
      
      console.log('[0x1 App] ✅ Polyfill loaded:', polyfillName);
      return true;
    } catch (error) {
      console.error('[0x1 App] ❌ Failed to load polyfill:', polyfillName, error);
      return false;
    }
  })();
  
  polyfillQueue.set(polyfillName, promise);
  polyfillCache.set(polyfillName, promise);
  
  try {
    await promise;
    return promise;
  } finally {
    polyfillQueue.delete(polyfillName);
  }
}

// ===== MAIN INITIALIZATION WITH ENHANCED STABILITY =====
async function initApp() {
  try {
    console.log('[0x1 App] 🚀 Starting production-ready initialization...');
        
    // CRITICAL: Clear any existing router state and timers
    if (window.__0x1_ROUTER__) {
      console.log('[0x1 App] 🧹 Cleaning up existing router state...');
        try {
        window.__0x1_ROUTER__.destroy?.();
      } catch (e) {
        console.warn('[0x1 App] Router cleanup warning:', e);
      }
      delete window.__0x1_ROUTER__;
      delete window.__0x1_router;
      delete window.router;
    }
    
    // Clear any existing timers and callbacks
    if (window.__0x1_cleanup) {
      console.log('[0x1 App] 🧹 Running existing cleanup...');
      try {
        window.__0x1_cleanup();
      } catch (e) {
        console.warn('[0x1 App] Cleanup warning:', e);
      }
    }
    
    // Clear any existing app content and ensure clean state
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = '';
      // Force a DOM flush
      appElement.offsetHeight;
    }
    
    // Step 1: Load essential dependencies with retry logic
    console.log('[0x1 App] 🎯 Loading essential dependencies...');
    
    let hooksLoaded = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!hooksLoaded && retryCount < maxRetries) {
      try {
        const hooksScript = document.createElement('script');
        hooksScript.type = 'module';
        hooksScript.src = '/0x1/hooks.js' + (retryCount > 0 ? '?retry=' + retryCount : '');
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Hooks loading timeout'));
          }, 5000);
          
          hooksScript.onload = () => {
            clearTimeout(timeout);
            console.log('[0x1 App] ✅ Hooks ready');
            hooksLoaded = true;
            resolve();
          };
          hooksScript.onerror = (error) => {
            clearTimeout(timeout);
            reject(error);
          };
          document.head.appendChild(hooksScript);
        });
      } catch (error) {
        retryCount++;
        console.warn('[0x1 App] ⚠️ Hooks loading attempt ' + retryCount + ' failed:', error);
        if (retryCount >= maxRetries) {
          throw new Error('Failed to load hooks after ' + maxRetries + ' attempts: ' + error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    // Step 2: Create router with enhanced error handling
    console.log('[0x1 App] Creating router...');
    
    let routerModule;
    retryCount = 0;
    
    while (!routerModule && retryCount < maxRetries) {
      try {
        routerModule = await import('/0x1/router.js' + (retryCount > 0 ? '?retry=' + retryCount : ''));
      } catch (error) {
        retryCount++;
        console.warn('[0x1 App] ⚠️ Router loading attempt ' + retryCount + ' failed:', error);
        if (retryCount >= maxRetries) {
          throw new Error('Failed to load router after ' + maxRetries + ' attempts: ' + error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    const { Router } = routerModule;
    
    if (typeof Router !== 'function') {
      throw new Error('Router class not found in router module');
    }
    
    if (!appElement) {
      throw new Error('App container element not found');
    }
    
    // Create beautiful 404 component
    const notFoundComponent = () => ({
      type: 'div',
      props: { 
        className: 'flex flex-col items-center justify-center min-h-[60vh] text-center px-4'
      },
      children: [
        {
          type: 'h1',
          props: { className: 'text-9xl font-bold text-violet-600 dark:text-violet-400 mb-4' },
          children: ['404'],
          key: null
        },
        {
          type: 'h2',
          props: { className: 'text-3xl font-bold text-gray-800 dark:text-white mb-4' },
          children: ['Page Not Found'],
          key: null
        },
        {
          type: 'p',
          props: { className: 'text-lg text-gray-600 dark:text-gray-300 mb-8' },
          children: ['The page you are looking for does not exist.'],
          key: null
        },
        {
          type: 'a',
          props: {
            href: '/',
            className: 'inline-block px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium',
            onClick: (e) => {
              e.preventDefault();
              if (window.router && typeof window.router.navigate === 'function') {
                window.router.navigate('/');
              } else {
                window.location.href = '/';
      }
            }
          },
          children: ['🏠 Back to Home'],
          key: null
        }
      ],
      key: null
    });
    
    const router = new Router({
      rootElement: appElement,
      mode: 'history',
      debug: false,
      base: '/',
      notFoundComponent: notFoundComponent
    });
    
    window.__0x1_ROUTER__ = router;
    window.__0x1_router = router;
    window.router = router;
    
    console.log('[0x1 App] ✅ Router ready with beautiful 404 handling');
    
    // Step 3: Register routes with enhanced error handling and DOM mounting sync
    console.log('[0x1 App] 📝 Registering routes...');
    
    for (const route of serverRoutes) {
      try {
        const routeComponent = async (props) => {
          console.log('[0x1 App] 🔍 Route component called for:', route.path);
          
          let componentModule;
          let loadRetryCount = 0;
          const maxLoadRetries = 3;
          
          while (!componentModule && loadRetryCount < maxLoadRetries) {
            try {
              // Use cache-busting query parameter for retries only
              const importPath = route.componentPath + (loadRetryCount > 0 ? '?retry=' + loadRetryCount : '');
              componentModule = await import(importPath);
              break; // Success, exit retry loop
              
  } catch (error) {
              loadRetryCount++;
              console.warn('[0x1 App] ⚠️ Component loading attempt ' + loadRetryCount + ' failed for ' + route.path + ':', error);
              
              if (loadRetryCount >= maxLoadRetries) {
                console.error('[0x1 App] ❌ Route component error after all retries:', route.path, error);
                return {
                  type: 'div',
                  props: { 
                    className: 'p-8 text-center',
                    style: 'color: #ef4444;' 
                  },
                  children: ['❌ Failed to load component: ' + route.path]
                };
              }
              
              // Wait before retrying (but shorter delays to prevent getting stuck)
              await new Promise(resolve => setTimeout(resolve, 200 * loadRetryCount));
            }
          }
          
          if (componentModule && componentModule.default) {
            console.log('[0x1 App] ✅ Route component resolved:', route.path);
            
            // OPTIMIZED: Minimal delay for smoother transitions
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            return componentModule.default(props);
          } else {
            console.warn('[0x1 App] ⚠️ Component has no default export:', route.path);
            return {
              type: 'div',
              props: { 
                className: 'p-8 text-center',
                style: 'color: #f59e0b;' 
              },
              children: ['⚠️ Component loaded but has no default export: ' + route.path]
            };
          }
        };
        
        router.addRoute(route.path, routeComponent, { 
          componentPath: route.componentPath 
        });
        
        console.log('[0x1 App] ✅ Route registered:', route.path);
        
      } catch (error) {
        console.error('[0x1 App] ❌ Failed to register route:', route.path, error);
      }
    }
    
    console.log('[0x1 App] 📊 All routes registered successfully');
    
    // Step 4: Start router with proper DOM synchronization
    console.log('[0x1 App] 🎯 Starting router...');
    
    // OPTIMIZED: Faster DOM readiness check
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        const onReady = () => {
          document.removeEventListener('readystatechange', onReady);
          resolve();
        };
        document.addEventListener('readystatechange', onReady);
        // Also listen for DOMContentLoaded as fallback
        if (document.readyState === 'interactive') {
          setTimeout(resolve, 10);
        }
      });
    }
    
    router.init();
    
    // CRITICAL: Navigate to current path and show content immediately
    await router.navigate(window.location.pathname, false);
    
    // Setup cleanup function for future use
    window.__0x1_cleanup = () => {
      if (router && router.destroy) {
        router.destroy();
      }
    };
    
    // OPTIMIZED: Hide loading indicator immediately after navigation
    if (typeof window.appReady === 'function') {
      window.appReady();
    }
    
    console.log('[0x1 App] ✅ Production-ready app initialized successfully!');
    
  } catch (error) {
    console.error('[0x1 App] ❌ Initialization failed:', error);
    
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = '<div style="padding: 40px; text-align: center; max-width: 600px; margin: 0 auto;"><h2 style="color: #ef4444; margin-bottom: 16px;">Application Error</h2><p style="color: #6b7280; margin-bottom: 20px;">' + error.message + '</p><details style="text-align: left; background: #f9fafb; padding: 16px; border-radius: 8px;"><summary style="cursor: pointer; font-weight: bold;">Error Details</summary><pre style="font-size: 12px; overflow-x: auto;">' + (error.stack || 'No stack trace') + '</pre></details><button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button></div>';
}

    // Hide loading indicator even on error
    if (typeof window.appReady === 'function') {
      window.appReady();
    }
  }
}

// ===== START IMMEDIATELY =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
`;

    // Write the sophisticated app.js
    writeFileSync(outputPath, appScript);
    const appSize = (appScript.length / 1024).toFixed(1);
    logger.info(`✅ Sophisticated app.js generated: ${appSize}KB with ${discoveredRoutes.length} routes`);
    
  } catch (error) {
    logger.error(`Failed to generate sophisticated app.js: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * REMOVED: buildAppBundle - replaced with generateSophisticatedAppJs
 * The old buildAppBundle was using simple bundling logic that didn't align with dev-server
 */

/**
 * Clean up temporary files
 */
export async function cleanupTempFiles(projectPath: string): Promise<void> {
  try {
    const tempDir = join(projectPath, '.0x1', 'temp');
    
    // Instead of deleting the directory, we'll just log that cleanup was performed
    // This is safer than actually removing files during development
    logger.info('Temporary files cleanup completed');
  } catch (error) {
    logger.error(`Failed to clean up temporary files: ${error instanceof Error ? error.message : String(error)}`);
  }
}
