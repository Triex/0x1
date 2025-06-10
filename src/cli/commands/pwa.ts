/**
 * 0x1 PWA Command
 * Add Progressive Web App functionality to a 0x1 project
 */

import { existsSync } from 'fs';
import { mkdir } from 'fs/promises'; // Keep mkdir for directory creation
import { join } from 'path';
import prompts from 'prompts';
// Import with underscore prefix to satisfy linting while preserving type info
import type { PWAConfig } from '../../core/pwa';
import { DEFAULT_PWA_CONFIG, generateManifest, generateOfflinePage, generateServiceWorker, generateServiceWorkerRegistration, loadPWAConfig } from '../../core/pwa';
import { generateAllIcons } from '../../utils/icon-generator';
import { logger } from '../utils/logger';

// Extended choice type to support descriptions in prompts
interface ExtendedPromptChoice {
  title: string;
  value: any;
  description?: string;
}

interface PWACommandOptions {
  name?: string;
  shortName?: string;
  themeColor?: string;
  backgroundColor?: string;
  description?: string;
  icons?: boolean;
  offline?: boolean;
  skipPrompts?: boolean;
  logoText?: string;
  theme?: string;
  statusBarStyle?: 'default' | 'black' | 'black-translucent';
}

/**
 * Add PWA functionality to a 0x1 project
 * ENHANCED: Now supports complex nested 0x1.config.ts structures
 */
export async function addPWA(options: PWACommandOptions = {}, customProjectPath?: string): Promise<boolean> {
  let setupSuccess = false;
  // Display banner
  logger.banner(['0x1 PWA Setup']);
  logger.spacer();
  logger.info('Adding Progressive Web App functionality to your project...');
  logger.spacer();

  // Use custom project path or current directory
  const projectPath = customProjectPath || process.cwd();
  
  if (!(await is0x1Project(projectPath))) {
    logger.error('Not a 0x1 project. Please run this command from the root of a 0x1 project.');
    return false;
  }

  // ENHANCED: First try to load existing complex configuration
  let existingPwaConfig: PWAConfig | null = null;
  
  try {
    // Change to project directory to load config
    const originalCwd = process.cwd();
    process.chdir(projectPath);
    
    existingPwaConfig = await loadPWAConfig();
    
    // Restore original working directory
    process.chdir(originalCwd);
    
    if (existingPwaConfig) {
      logger.info('✅ Found existing PWA configuration in 0x1.config.ts');
      logger.info(`   App: ${existingPwaConfig.name} (${existingPwaConfig.shortName})`);
      logger.info(`   Theme: ${existingPwaConfig.themeColor}`);
      logger.spacer();
    }
  } catch (error) {
    logger.debug(`No existing PWA config found or failed to load: ${error}`);
  }

  // Get PWA configuration through prompts or options
  const baseConfig = existingPwaConfig || DEFAULT_PWA_CONFIG;
  const pwaConfig = options.skipPrompts 
    ? createConfigFromOptions(options, baseConfig) 
    : await promptForConfig(options, baseConfig);

  // Start PWA setup
  logger.section('Setting up PWA');

  // Create icons directory if it doesn't exist
  const iconsPath = join(projectPath, 'public', 'icons');
  if (!existsSync(iconsPath)) {
    await mkdir(iconsPath, { recursive: true });
    logger.success('Created icons directory');
  }

  // Create manifest.json
  const manifestSpin = logger.spinner('Creating manifest.json');
  const manifestJson = generateManifest(pwaConfig, projectPath);
  await Bun.write(
    join(projectPath, 'public', 'manifest.json'),
    manifestJson
  );
  manifestSpin.stop('success', 'Created manifest.json');

  // Create service worker
  const swSpin = logger.spinner('Creating service worker');
  const serviceWorkerJs = generateServiceWorker(pwaConfig);
  await Bun.write(
    join(projectPath, 'public', 'service-worker.js'),
    serviceWorkerJs
  );
  swSpin.stop('success', 'Created service worker');

  // Create offline page if offline support is enabled
  if (pwaConfig.offlineSupport) {
    const offlineSpin = logger.spinner('Creating offline page');
    const offlineHtml = generateOfflinePage(pwaConfig);
    await Bun.write(
      join(projectPath, 'public', 'offline.html'),
      offlineHtml
    );
    offlineSpin.stop('success', 'Created offline.html');
  }

  // Create service worker registration script
  const regSpin = logger.spinner('Creating service worker registration');
  const registrationJs = generateServiceWorkerRegistration();
  
  // Determine if we're using TypeScript or JavaScript
  const isTypeScript = existsSync(join(projectPath, 'tsconfig.json'));
  const extension = isTypeScript ? 'ts' : 'js';
  
  // Check different possible locations for the file
  let swRegisterPath;
  
  // First try root directory
  if (existsSync(join(projectPath, 'sw-register.ts')) || existsSync(join(projectPath, 'sw-register.js'))) {
    swRegisterPath = join(projectPath, `sw-register.${extension}`);
  } 
  // Then try src directory
  else if (existsSync(join(projectPath, 'src'))) {
    swRegisterPath = join(projectPath, 'src', `register-sw.${extension}`);
  } 
  // Default to root if neither exists
  else {
    swRegisterPath = join(projectPath, `sw-register.${extension}`);
  }
  
  // Create the parent directory if it doesn't exist
  const parentDir = swRegisterPath.substring(0, swRegisterPath.lastIndexOf('/'));
  if (!existsSync(parentDir)) {
    logger.debug(`Creating directory: ${parentDir}`);
    await mkdir(parentDir, { recursive: true });
  }
  
  await Bun.write(swRegisterPath, registrationJs);
  regSpin.stop('success', `Created ${swRegisterPath.split('/').pop()}`);
  
  const swRegisterRelativePath = swRegisterPath.replace(`${projectPath}/`, '');

  // Generate icons if enabled
  if (pwaConfig.generateIcons) {
    const iconSpin = logger.spinner('Generating icons');
    
    try {
      await generateAllIcons(projectPath, pwaConfig);
      iconSpin.stop('success', 'Generated all PWA icons');
      
      const urlPath = pwaConfig.iconsPath || '/icons';
      const filesystemPath = urlPath.startsWith('/') ? `public${urlPath}` : pwaConfig.iconsPath;
      
      logger.info(`📁 Icons generated to: ${filesystemPath}/`);
      logger.info(`🌐 Icons served from: ${urlPath}/`);
      
    } catch (error) {
      setupSuccess = false;
      iconSpin.stop('error', 'Failed to generate icons');
      logger.error(`Error generating icons: ${error}`);
    }
  }

  // ENHANCED: Update or create 0x1.config.ts with PWA configuration
  await updateProjectConfig(projectPath, pwaConfig);

  // Mark setup as successful
  setupSuccess = true;
  
  // Show completion message
  logger.spacer();
  logger.success('PWA functionality has been added to your project!');
  logger.spacer();
  
  // Show next steps
  logger.section('Next Steps');
  if (!existingPwaConfig) {
    logger.log('1. Add the service worker registration to your app:');
    logger.log(`   import './${swRegisterRelativePath}';`);
    logger.log('2. Test your PWA using Chrome DevTools Lighthouse');
    logger.log('3. Deploy your app to a secure (HTTPS) environment');
  } else {
    logger.log('1. Your existing PWA configuration has been updated');
    logger.log('2. Test your updated PWA using Chrome DevTools Lighthouse');
    logger.log('3. Deploy your app to see the changes');
  }
  logger.spacer();
  
  return setupSuccess;
}

/**
 * Update project configuration with PWA settings
 * ENHANCED: Handles both simple and complex 0x1.config.ts structures
 */
async function updateProjectConfig(projectPath: string, pwaConfig: PWAConfig): Promise<void> {
  const configPaths = [
    join(projectPath, '0x1.config.ts'),
    join(projectPath, '0x1.config.js'),
    join(projectPath, 'ox1.config.ts'),
    join(projectPath, 'ox1.config.js')
  ];
  
  let configPath = configPaths.find(path => existsSync(path));
  
  if (configPath) {
    // Update existing config file
    const configSpin = logger.spinner('Updating 0x1.config.ts with PWA settings');
    
    try {
      const configContent = await Bun.file(configPath).text();
      
      // Check if it has nested app.pwa structure
      const hasNestedStructure = configContent.includes('app:') && configContent.includes('pwa:');
      
      if (hasNestedStructure) {
        // Update the existing nested PWA config
        await updateNestedPWAConfig(configPath, pwaConfig);
      } else {
        // Add or update flat PWA config
        await updateFlatPWAConfig(configPath, pwaConfig);
      }
      
      configSpin.stop('success', 'Updated PWA configuration in 0x1.config.ts');
    } catch (error) {
      configSpin.stop('warn', 'Could not update config file automatically');
      logger.warn(`Please manually add PWA configuration: ${error}`);
    }
  } else {
    // Create new config file with PWA settings
    const configSpin = logger.spinner('Creating 0x1.config.ts with PWA settings');
    
    configPath = join(projectPath, '0x1.config.ts');
    const configContent = createBasicConfigWithPWA(pwaConfig);
    
    await Bun.write(configPath, configContent);
    configSpin.stop('success', 'Created 0x1.config.ts with PWA configuration');
  }
}

/**
 * Update nested app.pwa configuration structure
 */
async function updateNestedPWAConfig(configPath: string, pwaConfig: PWAConfig): Promise<void> {
  const content = await Bun.file(configPath).text();
  
  // Find and update the app.pwa section
  const pwaConfigString = `    pwa: {
      name: "${pwaConfig.name}",
      shortName: "${pwaConfig.shortName}",
      description: "${pwaConfig.description}",
      themeColor: "${pwaConfig.themeColor}",
      backgroundColor: "${pwaConfig.backgroundColor}",
      display: "${pwaConfig.display}",
      startUrl: "${pwaConfig.startUrl}",
      orientation: "${pwaConfig.orientation}",
      iconsPath: "${pwaConfig.iconsPath}",
      generateIcons: ${pwaConfig.generateIcons},
      offlineSupport: ${pwaConfig.offlineSupport},
      cacheStrategy: "${pwaConfig.cacheStrategy}",
      cacheName: "${pwaConfig.cacheName}",
      statusBarStyle: "${pwaConfig.statusBarStyle}",
      precacheResources: ${JSON.stringify(pwaConfig.precacheResources, null, 8)},
    },`;
  
  // Replace existing pwa config or add it to app section
  let updatedContent;
  if (content.includes('pwa:')) {
    // Replace existing pwa config
    updatedContent = content.replace(/pwa:\s*\{[^}]*\}[^,]*,?/s, pwaConfigString);
  } else {
    // Add pwa config to app section
    updatedContent = content.replace(
      /(app:\s*\{[^}]*)(,?\s*\})/s, 
      `$1,\n${pwaConfigString}\n  $2`
    );
  }
  
  await Bun.write(configPath, updatedContent);
}

/**
 * Update flat PWA configuration structure
 */
async function updateFlatPWAConfig(configPath: string, pwaConfig: PWAConfig): Promise<void> {
  const content = await Bun.file(configPath).text();
  
  const pwaConfigString = `  pwa: {
    name: "${pwaConfig.name}",
    shortName: "${pwaConfig.shortName}",
    description: "${pwaConfig.description}",
    themeColor: "${pwaConfig.themeColor}",
    backgroundColor: "${pwaConfig.backgroundColor}",
    display: "${pwaConfig.display}",
    startUrl: "${pwaConfig.startUrl}",
    orientation: "${pwaConfig.orientation}",
    iconsPath: "${pwaConfig.iconsPath}",
    generateIcons: ${pwaConfig.generateIcons},
    offlineSupport: ${pwaConfig.offlineSupport},
    cacheStrategy: "${pwaConfig.cacheStrategy}",
    cacheName: "${pwaConfig.cacheName}",
    statusBarStyle: "${pwaConfig.statusBarStyle}",
    precacheResources: ${JSON.stringify(pwaConfig.precacheResources, null, 4)},
  },`;
  
  // Add PWA config to the main export
  const updatedContent = content.replace(
    /(export\s+default\s+\{[^}]*)(,?\s*\}[^}]*$)/s, 
    `$1,\n${pwaConfigString}\n$2`
  );
  
  await Bun.write(configPath, updatedContent);
}

/**
 * Create basic config file with PWA settings
 */
function createBasicConfigWithPWA(pwaConfig: PWAConfig): string {
  return `/**
 * 0x1 Configuration with PWA Support
 */

/** @type {import('0x1')._0x1Config} */
export default {
  app: {
    name: "${pwaConfig.name}",
    description: "${pwaConfig.description}",
    pwa: {
      name: "${pwaConfig.name}",
      shortName: "${pwaConfig.shortName}",
      description: "${pwaConfig.description}",
      themeColor: "${pwaConfig.themeColor}",
      backgroundColor: "${pwaConfig.backgroundColor}",
      display: "${pwaConfig.display}",
      startUrl: "${pwaConfig.startUrl}",
      orientation: "${pwaConfig.orientation}",
      iconsPath: "${pwaConfig.iconsPath}",
      generateIcons: ${pwaConfig.generateIcons},
      offlineSupport: ${pwaConfig.offlineSupport},
      cacheStrategy: "${pwaConfig.cacheStrategy}",
      cacheName: "${pwaConfig.cacheName}",
      statusBarStyle: "${pwaConfig.statusBarStyle}",
      precacheResources: ${JSON.stringify(pwaConfig.precacheResources, null, 6)},
    },
  },
  build: {
    outDir: "dist",
    minify: true,
    sourcemap: true,
  },
};
`;
}

/**
 * Check if the current directory is a 0x1 project
 */
// Made async to use Bun.file().text()
async function is0x1Project(projectPath: string): Promise<boolean> {
  // Check for package.json
  const packageJsonPath = join(projectPath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return false;
  }

  try {
    // Read package.json content
    // Use Bun's native file API for better performance
    const packageJsonText = await Bun.file(packageJsonPath).text();
    const packageJson = JSON.parse(packageJsonText);
    
    // Check if this is a 0x1 project by examining package.json
    // Consider it a 0x1 project if it has 0x1-related scripts or dependencies
    const scripts = packageJson.scripts || {};
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    
    // Check for 0x1 scripts
    const has0x1Scripts = Object.values(scripts).some((script) => 
      typeof script === 'string' && script.includes('0x1'));
      
    // Check for 0x1 as a dependency
    const has0x1Dependency = '0x1' in dependencies || '0x1' in devDependencies;
    
    // Check for src, pages, or components directory (common in 0x1 projects)
    const hasStructure = existsSync(join(projectPath, 'src')) || 
                         existsSync(join(projectPath, 'pages')) || 
                         existsSync(join(projectPath, 'components'));
    
    return has0x1Scripts || has0x1Dependency || hasStructure;
  } catch (error) {
    logger.debug(`Error checking if directory is a 0x1 project: ${error}`);
    return false;
  }
}

/**
 * Create PWA config from command line options
 * ENHANCED: Now merges with existing config
 */
function createConfigFromOptions(options: PWACommandOptions, baseConfig: PWAConfig = DEFAULT_PWA_CONFIG): PWAConfig {
  return {
    ...baseConfig,
    name: options.name || baseConfig.name,
    shortName: options.shortName || baseConfig.shortName,
    description: options.description || baseConfig.description,
    themeColor: options.themeColor || baseConfig.themeColor,
    backgroundColor: options.backgroundColor || baseConfig.backgroundColor,
    generateIcons: options.icons ?? baseConfig.generateIcons,
    offlineSupport: options.offline ?? baseConfig.offlineSupport,
    statusBarStyle: options.statusBarStyle || baseConfig.statusBarStyle,
  };
}

/**
 * Prompt user for PWA configuration
 * ENHANCED: Now uses existing config as defaults
 */
async function promptForConfig(options: PWACommandOptions, baseConfig: PWAConfig = DEFAULT_PWA_CONFIG): Promise<PWAConfig> {
  logger.info('Please provide information for your PWA:');
  logger.spacer();

  const responses = await prompts([
    {
      type: 'text',
      name: 'name',
      message: '📱 What is the name of your application?',
      initial: options.name || baseConfig.name,
      validate: (value) => value.trim() ? true : 'Application name is required'
    },
    {
      type: 'text',
      name: 'shortName',
      message: '🔤 Short name for home screen:',
      initial: options.shortName || baseConfig.shortName,
      validate: (value) => value.trim() ? true : 'Short name is required'
    },
    {
      type: 'text',
      name: 'description',
      message: '📝 Description:',
      initial: options.description || baseConfig.description
    },
    {
      type: 'text',
      name: 'themeColor',
      message: '🎨 Theme color (hex):',
      initial: options.themeColor || baseConfig.themeColor,
      validate: (value) => /^#[0-9A-Fa-f]{6}$/.test(value) ? true : 'Please enter a valid hex color (e.g. #ffffff)'
    },
    {
      type: 'text',
      name: 'backgroundColor',
      message: '🖌️ Background color (hex):',
      initial: options.backgroundColor || baseConfig.backgroundColor,
      validate: (value) => /^#[0-9A-Fa-f]{6}$/.test(value) ? true : 'Please enter a valid hex color (e.g. #ffffff)'
    },
    {
      type: 'select',
      name: 'display',
      message: '📱 Display mode:',
      choices: [
        { title: 'Standalone', value: 'standalone', description: 'App-like experience with system UI hidden' } as ExtendedPromptChoice,
        { title: 'Fullscreen', value: 'fullscreen', description: 'Full device screen with all browser UI hidden' } as ExtendedPromptChoice,
        { title: 'Minimal UI', value: 'minimal-ui', description: 'Similar to standalone with minimal UI elements' } as ExtendedPromptChoice,
        { title: 'Browser', value: 'browser', description: 'Regular browser experience' } as ExtendedPromptChoice
      ],
      initial: ['standalone', 'fullscreen', 'minimal-ui', 'browser'].indexOf(baseConfig.display) || 0
    },
    {
      type: 'select',
      name: 'cacheStrategy',
      message: '💾 Caching strategy:',
      choices: [
        { 
          title: 'Stale While Revalidate', 
          value: 'stale-while-revalidate', 
          description: 'Serve cached content immediately, update in background' 
        } as ExtendedPromptChoice,
        { 
          title: 'Cache First', 
          value: 'cache-first', 
          description: 'Always serve from cache, fall back to network' 
        } as ExtendedPromptChoice,
        { 
          title: 'Network First', 
          value: 'network-first',
          description: 'Try network first, fall back to cache if offline' 
        } as ExtendedPromptChoice
      ],
      initial: ['stale-while-revalidate', 'cache-first', 'network-first'].indexOf(baseConfig.cacheStrategy || 'stale-while-revalidate') || 0
    },
    {
      type: 'select',
      name: 'generateIcons',
      message: '🖼️ Generate icons automatically?',
      choices: [
        { title: 'Yes', value: true } as ExtendedPromptChoice,
        { title: 'No', value: false } as ExtendedPromptChoice
      ],
      initial: options.icons === undefined ? (baseConfig.generateIcons ? 0 : 1) : (options.icons ? 0 : 1)
    },
    {
      type: 'select',
      name: 'offlineSupport',
      message: '📶 Enable offline support?',
      choices: [
        { title: 'Yes', value: true } as ExtendedPromptChoice,
        { title: 'No', value: false } as ExtendedPromptChoice
      ],
      initial: options.offline === undefined ? (baseConfig.offlineSupport ? 0 : 1) : (options.offline ? 0 : 1)
    }
  ]);

  // Configure cache name to be project-specific
  const cacheName = `0x1-${responses.name.toLowerCase().replace(/\s+/g, '-')}-v1`;

  return {
    ...baseConfig,
    ...responses,
    cacheName
  };
}
