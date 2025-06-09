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
import { DEFAULT_PWA_CONFIG, generateManifest, generateOfflinePage, generateServiceWorker, generateServiceWorkerRegistration } from '../../core/pwa';
import { getConfigurationManager } from '../../shared/core/ConfigurationManager';
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
  // Use await with the now-async function
  if (!(await is0x1Project(projectPath))) {
    logger.error('Not a 0x1 project. Please run this command from the root of a 0x1 project.');
    return false;
  }

  // Get PWA configuration through prompts or options
  const pwaConfig = options.skipPrompts 
    ? createConfigFromOptions(options) 
    : await promptForConfig(options);

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
  const manifestJson = generateManifest(pwaConfig);
  // Use Bun's native file API for better performance
  await Bun.write(
    join(projectPath, 'public', 'manifest.json'),
    manifestJson
  );
  manifestSpin.stop('success', 'Created manifest.json');

  // Create service worker
  const swSpin = logger.spinner('Creating service worker');
  const serviceWorkerJs = generateServiceWorker(pwaConfig);
  // Use Bun's native file API for better performance
  await Bun.write(
    join(projectPath, 'public', 'service-worker.js'),
    serviceWorkerJs
  );
  swSpin.stop('success', 'Created service worker');

  // Create offline page if offline support is enabled
  if (pwaConfig.offlineSupport) {
    const offlineSpin = logger.spinner('Creating offline page');
    const offlineHtml = generateOfflinePage(pwaConfig);
    // Use Bun's native file API for better performance
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
  // For full template, the file should be in root, for others it might be in src
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
  
  // Use Bun's native file API for better performance
  await Bun.write(swRegisterPath, registrationJs);
  regSpin.stop('success', `Created ${swRegisterPath.split('/').pop()}`);
  
  // Store the path for later reference in the next steps
  const swRegisterRelativePath = swRegisterPath.replace(`${projectPath}/`, '');

  // Generate icons if enabled
  if (pwaConfig.generateIcons) {
    const iconSpin = logger.spinner('Generating icons');
    
    try {
      await generateAllIcons(projectPath, pwaConfig);
      iconSpin.stop('success', 'Generated all PWA icons');
      
      // Show clear path information
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

  // Update HTML to include PWA meta tags and manifest
  const configManager = getConfigurationManager(projectPath);
  await configManager.savePWAConfig(pwaConfig);
  
  const htmlSpin = logger.spinner('Updating project configuration');
  htmlSpin.stop('success', 'PWA configuration saved for dynamic HTML generation');

  // Mark setup as successful
  setupSuccess = true;
  
  // Show completion message
  logger.spacer();
  logger.success('PWA functionality has been added to your project!');
  logger.spacer();
  
  // Show next steps
  logger.section('Next Steps');
  logger.log('1. Add the service worker registration to your app:');
  logger.log(`import './${swRegisterRelativePath}';`);
  logger.log('2. Test your PWA using Chrome DevTools Lighthouse');
  logger.log('3. Deploy your app to a secure (HTTPS) environment');
  logger.spacer();
  
  return setupSuccess;
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
 */
function createConfigFromOptions(options: PWACommandOptions): PWAConfig {
  return {
    ...DEFAULT_PWA_CONFIG,
    name: options.name || DEFAULT_PWA_CONFIG.name,
    shortName: options.shortName || DEFAULT_PWA_CONFIG.shortName,
    description: options.description || DEFAULT_PWA_CONFIG.description,
    themeColor: options.themeColor || DEFAULT_PWA_CONFIG.themeColor,
    backgroundColor: options.backgroundColor || DEFAULT_PWA_CONFIG.backgroundColor,
    generateIcons: options.icons ?? DEFAULT_PWA_CONFIG.generateIcons,
    offlineSupport: options.offline ?? DEFAULT_PWA_CONFIG.offlineSupport
  };
}

/**
 * Prompt user for PWA configuration
 */
async function promptForConfig(options: PWACommandOptions): Promise<PWAConfig> {
  logger.info('Please provide information for your PWA:');
  logger.spacer();

  const responses = await prompts([
    {
      type: 'text',
      name: 'name',
      message: '📱 What is the name of your application?',
      initial: options.name || 'My 0x1 App',
      validate: (value) => value.trim() ? true : 'Application name is required'
    },
    {
      type: 'text',
      name: 'shortName',
      message: '🔤 Short name for home screen:',
      initial: options.shortName || 'App',
      validate: (value) => value.trim() ? true : 'Short name is required'
    },
    {
      type: 'text',
      name: 'description',
      message: '📝 Description:',
      initial: options.description || 'Built with 0x1 - the ultra-minimal framework'
    },
    {
      type: 'text',
      name: 'themeColor',
      message: '🎨 Theme color (hex):',
      initial: options.themeColor || '#0077cc',
      validate: (value) => /^#[0-9A-Fa-f]{6}$/.test(value) ? true : 'Please enter a valid hex color (e.g. #ffffff)'
    },
    {
      type: 'text',
      name: 'backgroundColor',
      message: '🖌️ Background color (hex):',
      initial: options.backgroundColor || '#ffffff',
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
      initial: 0
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
      initial: 0
    },
    {
      type: 'select',
      name: 'generateIcons',
      message: '🖼️ Generate icons automatically?',
      choices: [
        { title: 'Yes', value: true } as ExtendedPromptChoice,
        { title: 'No', value: false } as ExtendedPromptChoice
      ],
      initial: options.icons === undefined ? 0 : (options.icons ? 0 : 1)
    },
    {
      type: 'select',
      name: 'offlineSupport',
      message: '📶 Enable offline support?',
      choices: [
        { title: 'Yes', value: true } as ExtendedPromptChoice,
        { title: 'No', value: false } as ExtendedPromptChoice
      ],
      initial: options.offline === undefined ? 0 : (options.offline ? 0 : 1)
    }
  ]);

  // Configure cache name to be project-specific
  const cacheName = `0x1-${responses.name.toLowerCase().replace(/\s+/g, '-')}-v1`;

  return {
    ...DEFAULT_PWA_CONFIG,
    ...responses,
    cacheName
  };
}
