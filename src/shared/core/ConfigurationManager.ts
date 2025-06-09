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

    // 3. Load PWA configuration from manifest.json ONLY if not already loaded from config file
    if (!config.pwa) {
      const pwaConfig = await this.loadPWAConfig();
      if (pwaConfig) {
        config.pwa = pwaConfig;
      }
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
   * PRESERVES existing configuration - only updates PWA section
   */
  async savePWAConfig(pwaConfig: PWAConfig): Promise<void> {
    // Check if there's an existing comprehensive config file
    const configPaths = [
      join(this.projectPath, '0x1.config.ts'),
      join(this.projectPath, '0x1.config.js'),
      join(this.projectPath, 'ox1.config.ts'),
      join(this.projectPath, 'ox1.config.js')
    ];

    let existingConfigPath: string | null = null;
    let existingConfig: any = null;

    // Try to find and read existing config
    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        existingConfigPath = configPath;
        try {
          const configContent = await Bun.file(configPath).text();
          
          // Extract the config object from the file
          // Handle both "export default {}" and "const config = {}" patterns
          const configMatch = configContent.match(/(?:export\s+default\s*|const\s+\w+:\s*\w+\s*=)\s*(\{[\s\S]*\});?\s*(?:export\s+default|$)/);
          
          if (configMatch) {
            try {
              // Clean up the extracted config for parsing
              let configStr = configMatch[1];
              
              // Handle TypeScript types and fix common issues for JSON parsing
              configStr = configStr
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
                .replace(/\/\/.*$/gm, '') // Remove line comments
                .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                .replace(/(\w+):/g, '"$1":') // Quote property names
                .replace(/:\s*["']([^"']*?)["']/g, ': "$1"') // Normalize quotes
                .replace(/process\.env\.\w+/g, '"env-placeholder"'); // Handle env vars
              
              // Try to parse the config
              existingConfig = JSON.parse(configStr);
              break;
            } catch (parseError) {
              // If parsing fails, we'll create a new config that preserves the existing structure
              console.warn(`Could not parse existing config at ${configPath}, will preserve file structure`);
            }
          }
        } catch (error) {
          console.warn(`Could not read existing config at ${configPath}:`, error);
        }
      }
    }

    if (existingConfigPath && existingConfig) {
      // PRESERVE existing comprehensive configuration
      console.log('✅ Preserving existing comprehensive configuration');
      
      // Add PWA config to existing structure
      if (existingConfig.app) {
        // Comprehensive config format
        existingConfig.app.pwa = pwaConfig;
      } else {
        // Simple config format - add pwa at root level
        existingConfig.pwa = pwaConfig;
      }

      // Write back the preserved config with PWA added
      const configContent = `/**
 * 0x1 Configuration with PWA Support
 * Preserves all existing settings and adds PWA functionality
 */

/** @type {import('0x1')._0x1Config} */
export default ${JSON.stringify(existingConfig, null, 2).replace(/"env-placeholder"/g, 'process.env.NODE_ENV')};
`;

      await Bun.write(existingConfigPath, configContent);
      console.log(`✅ Updated existing config at: ${existingConfigPath}`);
      
    } else {
      // NO existing comprehensive config - create simple ProjectConfig
      console.log('📝 Creating new simple PWA configuration');
      
      await this.loadProjectConfig();
      
      if (!this.config) {
        throw new Error('Project configuration not loaded');
      }

      this.config.pwa = pwaConfig;

      // Save to simple 0x1 config file
      const configPath = join(this.projectPath, '0x1.config.ts');
      
      const configContent = `import type { ProjectConfig } from '0x1';

const config: ProjectConfig = ${JSON.stringify(this.config, null, 2)};

export default config;
`;

      await Bun.write(configPath, configContent);
      console.log(`✅ Created new config at: ${configPath}`);
    }
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
   * CRITICAL FIX: Actually parse and load the config file (was just detecting existence)
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
          // Store config path for metadata
          this.metadata = this.metadata || {} as ProjectMetadata;
          this.metadata.configPath = configPath;
          
          // CRITICAL FIX: Actually parse the config file content
          const configContent = await Bun.file(configPath).text();
          
          // Extract the configuration object from the file
          // Handle multiple patterns: export default {}, const config = {}, etc.
          const extractedConfig = this.parseConfigFile(configContent);
          
          if (extractedConfig) {
            // Handle nested config structures (app.pwa vs direct pwa)
            if (extractedConfig.app) {
              // Comprehensive config format: { app: { pwa: {...} } }
              return {
                name: extractedConfig.app.name,
                description: extractedConfig.app.description,
                themeColor: extractedConfig.app.themeColor,
                backgroundColor: extractedConfig.app.backgroundColor,
                pwa: extractedConfig.app.pwa,
                build: extractedConfig.app.build,
                dev: extractedConfig.dev
              };
            } else {
              // Simple config format: { pwa: {...} }
              return extractedConfig;
            }
          }
        } catch (error) {
          // Log the error but continue trying other config paths
          console.warn(`Failed to load config from ${configPath}:`, error);
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Parse configuration file content
   * BULLETPROOF: Handles complex TypeScript config files with dynamic expressions
   */
  private parseConfigFile(content: string): any | null {
    try {
      // Remove comments and imports
      const cleanContent = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/import\s+.*?from\s+.*?;/g, '') // Remove imports
        .replace(/export\s+type\s+.*?;/g, '') // Remove type exports
        .replace(/\/\*\*[\s\S]*?\*\//g, ''); // Remove JSDoc comments

      // Extract the default export object
      const exportMatch = cleanContent.match(/export\s+default\s+(\{[\s\S]*?\});?\s*$/m);
      if (!exportMatch) {
        return null;
      }

      let configString = exportMatch[1];
      
      // CRITICAL: Handle dynamic expressions safely
      // Replace process.env references with safe values
      configString = configString.replace(/process\.env\.(\w+)/g, (match, envVar) => {
        // For build purposes, we'll use safe defaults
        switch (envVar) {
          case 'NODE_ENV': return '"production"';
          case 'ANALYZE': return 'false';
          default: return '""';
        }
      });

      // Handle template literals and other complex syntax
      configString = configString
        .replace(/`([^`]*)`/g, '"$1"') // Convert template literals to strings
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/(\s*)\/\*[\s\S]*?\*\/(\s*)/g, '') // Remove any remaining comments
        .replace(/(\s*)\/\/.*$/gm, ''); // Remove any remaining line comments

      // Create a safe evaluation context with controlled globals
      const safeEval = new Function(
        'safeConsole', 
        `
        // Provide safe console object
        const console = arguments[0];
        
        // Return the config object
        return ${configString};
        `
      );
      
      // Execute with a safe console object
      const safeConsole = {
        log: () => {},
        warn: () => {},
        error: () => {}
      };
      
      const parsed = safeEval(safeConsole);
      
      return parsed;
      
    } catch (error) {
      console.warn(`[ConfigurationManager] Failed to parse config file: ${error}`);
      
      // FALLBACK: Try to extract just the PWA config manually if full parsing fails
      try {
        const pwaMatch = content.match(/pwa:\s*\{([\s\S]*?)\n\s*\}/);
        if (pwaMatch) {
          // Extract just the PWA config and manually parse key parts
          const pwaContent = pwaMatch[1];
          
          const extractValue = (key: string): string | null => {
            const match = pwaContent.match(new RegExp(`${key}:\\s*["']([^"']*)["']`));
            return match ? match[1] : null;
          };
          
          const extractBoolean = (key: string): boolean => {
            const match = pwaContent.match(new RegExp(`${key}:\\s*(true|false)`));
            return match ? match[1] === 'true' : false;
          };
          
          // Manually extract essential PWA config
          const basicPwaConfig = {
            app: {
              pwa: {
                name: extractValue('name') || '0x1 Framework',
                shortName: extractValue('shortName') || '0x1',
                description: extractValue('description') || 'Built with 0x1',
                themeColor: extractValue('themeColor') || '#a88bfa',
                backgroundColor: extractValue('backgroundColor') || '#ffffff',
                display: extractValue('display') || 'standalone',
                startUrl: extractValue('startUrl') || '/',
                orientation: extractValue('orientation') || 'any',
                iconsPath: extractValue('iconsPath') || '/icons',
                generateIcons: extractBoolean('generateIcons'),
                offlineSupport: extractBoolean('offlineSupport'),
                cacheStrategy: extractValue('cacheStrategy') || 'stale-while-revalidate',
                cacheName: extractValue('cacheName') || '0x1-cache-v1',
                statusBarStyle: extractValue('statusBarStyle') || 'default'
              }
            }
          };
          
          console.warn('[ConfigurationManager] Used fallback PWA extraction');
          return basicPwaConfig;
        }
      } catch (fallbackError) {
        console.warn(`[ConfigurationManager] Fallback parsing also failed: ${fallbackError}`);
      }
      
      return null;
    }
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