/**
 * 0x1 PWA Command
 * Add Progressive Web App functionality to a 0x1 project
 */

import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import prompts from 'prompts';
import type { PromptObject } from 'prompts';

// Extended choice type to support descriptions in prompts
interface ExtendedPromptChoice {
  title: string;
  value: any;
  description?: string;
}
import type { PWAConfig } from '../../core/pwa.js';
import { DEFAULT_PWA_CONFIG, generateManifest, generateOfflinePage, generateServiceWorker, generateServiceWorkerRegistration } from '../../core/pwa.js';
import { generateAllIcons } from '../../utils/icon-generator.js';
import { logger } from '../utils/logger.js';

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
export async function addPWA(options: PWACommandOptions = {}, customProjectPath?: string): Promise<void> {
  // Display banner
  logger.banner(['0x1 PWA Setup']);
  logger.spacer();
  logger.info('Adding Progressive Web App functionality to your project...');
  logger.spacer();

  // Use custom project path or current directory
  const projectPath = customProjectPath || process.cwd();
  if (!is0x1Project(projectPath)) {
    logger.error('Not a 0x1 project. Please run this command from the root of a 0x1 project.');
    process.exit(1);
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
  await writeFile(
    join(projectPath, 'public', 'manifest.json'),
    manifestJson
  );
  manifestSpin.stop('success', 'Created manifest.json');

  // Create service worker
  const swSpin = logger.spinner('Creating service worker');
  const serviceWorkerJs = generateServiceWorker(pwaConfig);
  await writeFile(
    join(projectPath, 'public', 'service-worker.js'),
    serviceWorkerJs
  );
  swSpin.stop('success', 'Created service worker');

  // Create offline page if offline support is enabled
  if (pwaConfig.offlineSupport) {
    const offlineSpin = logger.spinner('Creating offline page');
    const offlineHtml = generateOfflinePage(pwaConfig);
    await writeFile(
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
  
  await writeFile(
    join(projectPath, 'src', `register-sw.${extension}`),
    registrationJs
  );
  regSpin.stop('success', `Created register-sw.${extension}`);

  // Generate icons if enabled
  if (pwaConfig.generateIcons) {
    const iconSpin = logger.spinner('Generating icons');
    
    try {
      await generateAllIcons(projectPath, pwaConfig);
      iconSpin.stop('success', 'Generated all PWA icons');
    } catch (error) {
      iconSpin.stop('error', 'Failed to generate icons');
      logger.error(`Error generating icons: ${error}`);
    }
  }

  // Update HTML to include PWA meta tags and manifest
  await updateHtmlFile(projectPath, isTypeScript, options);

  // Show completion message
  logger.spacer();
  logger.success('PWA functionality has been added to your project!');
  logger.spacer();
  
  // Show next steps
  logger.section('Next Steps');
  logger.log('1. Add the service worker registration to your app:');
  logger.log(`import './register-sw.${extension}';`);
  logger.log('2. Test your PWA using Chrome DevTools Lighthouse');
  logger.log('3. Deploy your app to a secure (HTTPS) environment');
  logger.spacer();
}

/**
 * Check if the current directory is a 0x1 project
 */
function is0x1Project(projectPath: string): boolean {
  // Check for package.json
  const packageJsonPath = join(projectPath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return false;
  }

  // Check for src directory
  const srcPath = join(projectPath, 'src');
  if (!existsSync(srcPath)) {
    return false;
  }

  // Either 0x1.config.js or 0x1.config.ts should exist
  const configJsPath = join(projectPath, '0x1.config.js');
  const configTsPath = join(projectPath, '0x1.config.ts');
  
  return existsSync(configJsPath) || existsSync(configTsPath);
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

/**
 * Update HTML file to include PWA meta tags and manifest
 */
async function updateHtmlFile(projectPath: string, isTypeScript: boolean, pwaOptions?: PWACommandOptions): Promise<void> {
  const htmlSpin = logger.spinner('Updating HTML file');

  try {
    // Find the HTML file
    const srcDir = join(projectPath, 'src');
    let htmlFile = 'index.html';
    
    // Check if HTML file exists in src directory
    const htmlPath = join(srcDir, htmlFile);
    if (!existsSync(htmlPath)) {
      throw new Error('Could not find index.html in src directory');
    }
    
    // Read HTML file
    const html = await Bun.file(htmlPath).text();
    
    // Check if manifest is already included
    if (html.includes('<link rel="manifest"')) {
      htmlSpin.stop('success', 'Manifest already included in HTML file');
      return;
    }
    
    // Find head tag
    const headIndex = html.indexOf('</head>');
    if (headIndex === -1) {
      throw new Error('Could not find </head> tag in HTML file');
    }
    
    // Determine status bar style
    let statusBarStyle = 'default';
    
    if (pwaOptions) {
      // If options provided, create config from them
      const pwaConfig = createConfigFromOptions(pwaOptions);
      statusBarStyle = pwaConfig.statusBarStyle || 'default';
    }
    
    // Add PWA meta tags and manifest
    const pwaLinks = `
  <!-- PWA Meta Tags -->
  <link rel="manifest" href="/manifest.json">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="${statusBarStyle}">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <!-- PWA Script -->
  <script type="module" src="./register-sw.${isTypeScript ? 'ts' : 'js'}"></script>
`;
    
    const updatedHtml = html.slice(0, headIndex) + pwaLinks + html.slice(headIndex);
    
    // Write updated HTML file
    await writeFile(htmlPath, updatedHtml);
    
    htmlSpin.stop('success', 'Updated HTML file with PWA meta tags and manifest');
  } catch (error) {
    htmlSpin.stop('error', 'Failed to update HTML file');
    logger.error(`Error updating HTML file: ${error}`);
    logger.info('You will need to manually add PWA meta tags and manifest to your HTML file');
  }
}
