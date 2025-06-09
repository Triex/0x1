/**
 * 0x1 Framework - Shared PWA Handler
 * SINGLE SOURCE OF TRUTH for all PWA functionality (BuildOptimisation.md compliant)
 * Context-aware implementation for both development and production
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: string;
  startUrl: string;
  orientation?: string;
  iconsPath: string;
  generateIcons: boolean;
  offlineSupport: boolean;
  cacheStrategy: string;
}

export interface PWAResources {
  manifestLink: string;
  metaTags: string[];
  scripts: string[];
  serviceWorkerRegistration: string;
}

export interface PWAHandlerContext {
  mode: 'development' | 'production';
  projectPath: string;
  outputPath?: string;
  silent?: boolean;
  debug?: boolean;
}

export class PWAHandler {
  private context: PWAHandlerContext;

  constructor(context: PWAHandlerContext) {
    this.context = context;
  }

  /**
   * Generate complete PWA resources for HTML injection
   * CONTEXT-AWARE: Different behavior for dev vs production
   */
  async generatePWAResources(pwaConfig: PWAConfig | null): Promise<PWAResources> {
    if (!pwaConfig) {
      return {
        manifestLink: '',
        metaTags: [],
        scripts: [],
        serviceWorkerRegistration: ''
      };
    }

    const resources: PWAResources = {
      manifestLink: '',
      metaTags: [],
      scripts: [],
      serviceWorkerRegistration: ''
    };

    // Generate manifest link
    resources.manifestLink = '<link rel="manifest" href="/manifest.json">';

    // Generate essential PWA meta tags
    resources.metaTags = [
      `<meta name="theme-color" content="${pwaConfig.themeColor}">`,
      `<meta name="application-name" content="${pwaConfig.shortName}">`,
      `<meta name="apple-mobile-web-app-capable" content="yes">`,
      `<meta name="apple-mobile-web-app-status-bar-style" content="default">`,
      `<meta name="apple-mobile-web-app-title" content="${pwaConfig.name}">`,
      `<meta name="mobile-web-app-capable" content="yes">`,
      `<meta name="msapplication-TileColor" content="${pwaConfig.themeColor}">`,
      `<meta name="msapplication-tap-highlight" content="no">`
    ];

    // Add icon meta tags if icons exist
    if (await this.iconsExist(pwaConfig.iconsPath)) {
      resources.metaTags.push(
        `<link rel="apple-touch-icon" href="${pwaConfig.iconsPath}/icon-180x180.png">`,
        `<link rel="icon" type="image/png" sizes="32x32" href="${pwaConfig.iconsPath}/icon-32x32.png">`,
        `<link rel="icon" type="image/png" sizes="16x16" href="${pwaConfig.iconsPath}/icon-16x16.png">`,
        `<link rel="mask-icon" href="${pwaConfig.iconsPath}/icon-maskable.svg" color="${pwaConfig.themeColor}">`
      );
    }

    // Generate service worker registration (CONTEXT-AWARE)
    resources.serviceWorkerRegistration = this.generateServiceWorkerRegistration();

    // Add service worker script if it should be auto-injected
    if (pwaConfig.offlineSupport) {
      resources.scripts.push(resources.serviceWorkerRegistration);
    }

    return resources;
  }

  /**
   * Generate service worker registration script
   * CONTEXT-AWARE: Different logging for dev vs production
   */
  private generateServiceWorkerRegistration(): string {
    const logPrefix = this.context.mode === 'development' ? '[0x1 PWA Dev]' : '[0x1 PWA]';
    
    return `<script>
    // ${logPrefix} Auto-register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('${logPrefix} ✅ Service Worker registered:', registration.scope);
          
          // Check for updates periodically in ${this.context.mode} mode
          ${this.context.mode === 'development' ? `
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute in development
          ` : `
          setInterval(() => {
            registration.update();
          }, 300000); // Check every 5 minutes in production
          `}
        } catch (error) {
          console.error('${logPrefix} ❌ Service Worker registration failed:', error);
        }
      });
    } else {
      console.warn('${logPrefix} ⚠️ Service Worker not supported in this browser');
    }
  </script>`;
  }

  /**
   * Check if PWA icons exist at the specified path
   * Works for both filesystem (build) and URL paths (dev)
   */
  private async iconsExist(iconsPath: string): Promise<boolean> {
    if (!iconsPath) return false;

    // Convert URL path to filesystem path for checking
    const filesystemPath = iconsPath.startsWith('/') 
      ? join(this.context.projectPath, 'public', iconsPath.substring(1))
      : join(this.context.projectPath, iconsPath);

    // Check for essential PWA icons
    const essentialIcons = [
      'icon-192x192.png',
      'icon-512x512.png'
    ];

    return essentialIcons.some(icon => existsSync(join(filesystemPath, icon)));
  }

  /**
   * Generate import map entries for PWA-related modules
   * CONTEXT-AWARE: Different cache-busting for dev vs production
   */
  generatePWAImportMapEntries(): Record<string, string> {
    const cacheBust = this.context.mode === 'development' 
      ? `?v=${Date.now()}` 
      : `?v=${this.getProductionCacheBust()}`;

    return {
      'pwa/sw': `/service-worker.js${cacheBust}`,
      'pwa/manifest': `/manifest.json${cacheBust}`
    };
  }

  /**
   * Get production cache bust token (build time)
   */
  private getProductionCacheBust(): string {
    // In production, use a more stable cache bust based on build time
    return Date.now().toString();
  }

  /**
   * Inject PWA resources into HTML content
   * SINGLE SOURCE OF TRUTH for HTML PWA injection
   */
  injectPWAIntoHTML(htmlContent: string, pwaResources: PWAResources): string {
    // Inject manifest link in <head>
    if (pwaResources.manifestLink) {
      htmlContent = htmlContent.replace(
        '</head>',
        `  ${pwaResources.manifestLink}\n</head>`
      );
    }

    // Inject meta tags in <head>
    if (pwaResources.metaTags.length > 0) {
      const metaTagsString = pwaResources.metaTags.map(tag => `  ${tag}`).join('\n');
      htmlContent = htmlContent.replace(
        '</head>',
        `${metaTagsString}\n</head>`
      );
    }

    // Inject scripts before </body>
    if (pwaResources.scripts.length > 0) {
      const scriptsString = pwaResources.scripts.map(script => `  ${script}`).join('\n');
      htmlContent = htmlContent.replace(
        '</body>',
        `${scriptsString}\n</body>`
      );
    }

    return htmlContent;
  }

  /**
   * Log PWA status (context-aware logging)
   */
  logPWAStatus(pwaConfig: PWAConfig | null, hasIcons: boolean): void {
    if (this.context.silent) return;

    const mode = this.context.mode === 'development' ? 'Dev' : 'Build';
    
    if (!pwaConfig) {
      if (this.context.debug) {
        console.log(`[0x1 PWA ${mode}] ❌ PWA not configured`);
      }
      return;
    }

    console.log(`[0x1 PWA ${mode}] ✅ PWA enabled: ${pwaConfig.name}`);
    console.log(`[0x1 PWA ${mode}] 📱 Display: ${pwaConfig.display}`);
    console.log(`[0x1 PWA ${mode}] 🎨 Theme: ${pwaConfig.themeColor}`);
    console.log(`[0x1 PWA ${mode}] 🖼️  Icons: ${hasIcons ? '✅ Generated' : '⚠️ Missing'}`);
    console.log(`[0x1 PWA ${mode}] 📡 Offline: ${pwaConfig.offlineSupport ? '✅ Enabled' : '❌ Disabled'}`);
  }

  /**
   * Static factory method for easy creation
   */
  static create(context: PWAHandlerContext): PWAHandler {
    return new PWAHandler(context);
  }
}

/**
 * Convenience function for getting PWA resources
 * CONTEXT-AWARE helper
 */
export async function getPWAResources(
  context: PWAHandlerContext,
  pwaConfig: PWAConfig | null
): Promise<PWAResources> {
  const handler = PWAHandler.create(context);
  return await handler.generatePWAResources(pwaConfig);
}

/**
 * Convenience function for injecting PWA into HTML
 * SINGLE SOURCE OF TRUTH for HTML injection
 */
export function injectPWAIntoHTML(
  htmlContent: string,
  context: PWAHandlerContext,
  pwaResources: PWAResources
): string {
  const handler = PWAHandler.create(context);
  return handler.injectPWAIntoHTML(htmlContent, pwaResources);
} 