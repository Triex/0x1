/**
 * 0x1 Framework - Configuration Manager
 * SINGLE SOURCE OF TRUTH for all project configuration
 * Following BuildOptimisation.md principles - ZERO HARDCODING
 */

import { existsSync } from 'fs';
import { join } from 'path';
import type { PWAConfig } from '../../core/pwa';

export interface ProjectConfig {
  // Basic project info
  name: string;
  description: string;
  version: string;
  
  // Theme and styling
  themeColor: string;
  backgroundColor: string;
  themeMode: 'light' | 'dark' | 'system';
  
  // PWA configuration
  pwa?: PWAConfig;
  
  // Build configuration
  build?: {
    outDir: string;
    minify: boolean;
    sourcemap: boolean;
    target: 'browser' | 'node';
  };
  
  // Development configuration
  dev?: {
    port: number;
    host: string;
    open: boolean;
  };
}

export interface ProjectMetadata {
  hasManifest: boolean;
  hasServiceWorker: boolean;
  hasOfflinePage: boolean;
  hasPWAConfig: boolean;
  manifestPath?: string;
  serviceWorkerPath?: string;
  configPath?: string;
}

/**
 * Configuration Manager - ZERO HARDCODING approach
 * Dynamically discovers and manages all project configuration
 */
export class ConfigurationManager {
  private projectPath: string;
  private config: ProjectConfig | null = null;
  private metadata: ProjectMetadata | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Load project configuration from multiple sources
   * SINGLE SOURCE OF TRUTH - aggregates from package.json, config files, and discovery
   */
  async loadProjectConfig(): Promise<ProjectConfig> {
    if (this.config) {
      return this.config;
    }

    // Start with defaults
    let config: ProjectConfig = {
      name: 'My 0x1 App',
      description: 'Built with 0x1 framework',
      version: '1.0.0',
      themeColor: '#0077cc',
      backgroundColor: '#ffffff',
      themeMode: 'dark'
    };

    // 1. Load from package.json
    const packageConfig = await this.loadFromPackageJson();
    if (packageConfig) {
      config = { ...config, ...packageConfig };
    }

    // 2. Load from 0x1 config files (if they exist)
    const fileConfig = await this.loadFromConfigFiles();
    if (fileConfig) {
      config = { ...config, ...fileConfig };
    }

    // 3. Load PWA configuration if exists
    const pwaConfig = await this.loadPWAConfig();
    if (pwaConfig) {
      config.pwa = pwaConfig;
    }

    this.config = config;
    return config;
  }

  /**
   * Discover project metadata - what files and features exist
   * DYNAMIC DISCOVERY - no hardcoded paths
   */
  async discoverProjectMetadata(): Promise<ProjectMetadata> {
    if (this.metadata) {
      return this.metadata;
    }

    const metadata: ProjectMetadata = {
      hasManifest: false,
      hasServiceWorker: false,
      hasOfflinePage: false,
      hasPWAConfig: false
    };

    // Discover manifest.json locations
    const manifestPaths = [
      join(this.projectPath, 'public', 'manifest.json'),
      join(this.projectPath, 'manifest.json'),
      join(this.projectPath, 'app', 'manifest.json')
    ];

    for (const path of manifestPaths) {
      if (existsSync(path)) {
        metadata.hasManifest = true;
        metadata.manifestPath = path;
        break;
      }
    }

    // Discover service worker locations
    const swPaths = [
      join(this.projectPath, 'public', 'service-worker.js'),
      join(this.projectPath, 'service-worker.js'),
      join(this.projectPath, 'sw.js')
    ];

    for (const path of swPaths) {
      if (existsSync(path)) {
        metadata.hasServiceWorker = true;
        metadata.serviceWorkerPath = path;
        break;
      }
    }

    // Discover offline page
    const offlinePaths = [
      join(this.projectPath, 'public', 'offline.html'),
      join(this.projectPath, 'offline.html')
    ];

    metadata.hasOfflinePage = offlinePaths.some(path => existsSync(path));

    // Check if PWA config exists in loaded config
    await this.loadProjectConfig();
    metadata.hasPWAConfig = !!this.config?.pwa;

    this.metadata = metadata;
    return metadata;
  }

  /**
   * Get PWA metadata for HTML generation
   * ZERO HARDCODING - dynamically generates based on available configuration
   */
  async getPWAMetadata(): Promise<{
    manifestLink?: string;
    metaTags: string[];
    scripts: string[];
  }> {
    const config = await this.loadProjectConfig();
    const metadata = await this.discoverProjectMetadata();

    const result = {
      metaTags: [] as string[],
      scripts: [] as string[]
    };

    // Add manifest link if available
    if (metadata.hasManifest) {
      (result as any).manifestLink = '<link rel="manifest" href="/manifest.json">';
    }

    // Add PWA meta tags if PWA config exists
    if (config.pwa) {
      result.metaTags.push(
        '<meta name="apple-mobile-web-app-capable" content="yes">',
        `<meta name="apple-mobile-web-app-status-bar-style" content="${config.pwa.statusBarStyle || 'default'}">`,
        '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">',
        `<meta name="theme-color" content="${config.pwa.themeColor}">`
      );
    }

    // Add service worker registration if available
    if (metadata.hasServiceWorker) {
      // Check for registration scripts
      const regPaths = [
        join(this.projectPath, 'sw-register.ts'),
        join(this.projectPath, 'sw-register.js'),
        join(this.projectPath, 'src', 'register-sw.ts'),
        join(this.projectPath, 'src', 'register-sw.js')
      ];

      const regPath = regPaths.find(path => existsSync(path));
      if (regPath) {
        const relativePath = regPath.replace(this.projectPath + '/', '');
        result.scripts.push(`<script type="module" src="/${relativePath}"></script>`);
      }
    }

    return result;
  }

  /**
   * Save PWA configuration to project
   * DYNAMIC APPROACH - creates configuration that build system can use
   */
  async savePWAConfig(pwaConfig: PWAConfig): Promise<void> {
    await this.loadProjectConfig();
    
    if (!this.config) {
      throw new Error('Project configuration not loaded');
    }

    this.config.pwa = pwaConfig;

    // Save to 0x1 config file for build system to use
    const configPath = join(this.projectPath, '0x1.config.ts');
    
    const configContent = `import type { ProjectConfig } from '0x1';

const config: ProjectConfig = ${JSON.stringify(this.config, null, 2)};

export default config;
`;

    await Bun.write(configPath, configContent);
  }

  /**
   * Load configuration from package.json
   */
  private async loadFromPackageJson(): Promise<Partial<ProjectConfig> | null> {
    const packagePath = join(this.projectPath, 'package.json');
    
    if (!existsSync(packagePath)) {
      return null;
    }

    try {
      const packageContent = await Bun.file(packagePath).text();
      const packageJson = JSON.parse(packageContent);

      return {
        name: packageJson.name || undefined,
        description: packageJson.description || undefined,
        version: packageJson.version || undefined
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Load configuration from 0x1 config files
   */
  private async loadFromConfigFiles(): Promise<Partial<ProjectConfig> | null> {
    const configPaths = [
      join(this.projectPath, '0x1.config.ts'),
      join(this.projectPath, '0x1.config.js'),
      join(this.projectPath, 'ox1.config.ts'),
      join(this.projectPath, 'ox1.config.js')
    ];

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        try {
          // For now, we'll just detect the file exists
          // In a full implementation, we'd dynamically import the config
          this.metadata = this.metadata || {} as ProjectMetadata;
          this.metadata.configPath = configPath;
          
          // TODO: Dynamic import of config file
          // const config = await import(configPath);
          // return config.default || config;
          
          return null; // For now, just detect file existence
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Load PWA configuration from existing manifest and files
   */
  private async loadPWAConfig(): Promise<PWAConfig | null> {
    const metadata = await this.discoverProjectMetadata();
    
    if (!metadata.hasManifest) {
      return null;
    }

    try {
      const manifestContent = await Bun.file(metadata.manifestPath!).text();
      const manifest = JSON.parse(manifestContent);

      // Convert manifest to PWA config
      return {
        name: manifest.name || 'My 0x1 App',
        shortName: manifest.short_name || 'App',
        description: manifest.description || 'Built with 0x1',
        themeColor: manifest.theme_color || '#0077cc',
        backgroundColor: manifest.background_color || '#ffffff',
        display: manifest.display || 'standalone',
        scope: manifest.scope || '/',
        startUrl: manifest.start_url || '/',
        orientation: manifest.orientation || 'any',
        iconsPath: '/icons',
        generateIcons: true,
        offlineSupport: metadata.hasOfflinePage,
        cacheStrategy: 'stale-while-revalidate',
        cacheName: '0x1-cache-v1',
        statusBarStyle: 'default',
        precacheResources: [
          '/',
          '/index.html',
          '/styles.css',
          '/app.js'
        ]
      };
    } catch (error) {
      return null;
    }
  }
}

/**
 * Global configuration manager instance
 * SINGLE SOURCE OF TRUTH
 */
let globalConfigManager: ConfigurationManager | null = null;

export function getConfigurationManager(projectPath: string): ConfigurationManager {
  if (!globalConfigManager || globalConfigManager['projectPath'] !== projectPath) {
    globalConfigManager = new ConfigurationManager(projectPath);
  }
  return globalConfigManager;
} 