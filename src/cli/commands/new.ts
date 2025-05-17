/**
 * 0x1 CLI - New Project Command
 * Creates a new 0x1 project with the specified template
 */

import { existsSync, readdirSync } from 'fs';
import { mkdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import prompts from 'prompts';
import { logger } from '../utils/logger.js';
import { addMITLicense, addTDLLicense } from './license-utils.js';
// Add execa type definition
type ExecaModule = { execa: (command: string, args: string[], options?: any) => Promise<{stdout: string; stderr: string}> };

interface NewProjectOptions {
  template?: string;
  tailwind?: boolean;
  typescript?: boolean;
  minimal?: boolean;
  force?: boolean;
  stateManagement?: boolean;
  tdlLicense?: boolean;
  overwrite?: boolean;
  complexity?: 'minimal' | 'standard' | 'full';
  pwa?: boolean;
}

/**
 * Create a new 0x1 project
 */
export async function createNewProject(
  name: string,
  options: NewProjectOptions = {}
): Promise<void> {
  if (!name) {
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: 'What is the name of your project?',
      validate: (value: string) => value.trim() ? true : 'Project name is required'
    });
    
    name = response.name;
    
    if (!name) {
      logger.error('Project name is required');
      process.exit(1);
    }
  }
  
  // Normalize project name
  name = name.trim().replace(/\s+/g, '-').toLowerCase();
  
  // Validate project name
  if (!/^[a-z0-9-]+$/.test(name)) {
    logger.error('Project name can only contain lowercase letters, numbers, and hyphens');
    process.exit(1);
  }
  
  // Create project directory
  const projectPath = resolve(process.cwd(), name);
  
  // Check if directory exists
  if (existsSync(projectPath)) {
    if (options.force || options.overwrite) {
      logger.warn(`Directory ${name} already exists. Overwriting...`);
    } else {
      // Prompt for overwrite
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${name} already exists. Overwrite?`,
        initial: false
      });
      
      if (!overwrite) {
        logger.info('Project creation canceled.');
        process.exit(0);
      }
    }
  }
  
  // Determine the complexity from options
  let defaultComplexity: 'minimal' | 'standard' | 'full';
  
  // If --complexity is provided directly, use it
  if (options.complexity && ['minimal', 'standard', 'full'].includes(options.complexity)) {
    defaultComplexity = options.complexity as 'minimal' | 'standard' | 'full';
  } 
  // If --minimal flag is provided, set to minimal
  else if (options.minimal) {
    defaultComplexity = 'minimal';
  }
  // If --template is provided, extract complexity from template path
  else if (options.template) {
    // Template format should be complexity/language (e.g., minimal/typescript)
    const parts = options.template.split('/');
    if (parts.length >= 1 && ['minimal', 'standard', 'full'].includes(parts[0])) {
      defaultComplexity = parts[0] as 'minimal' | 'standard' | 'full';
    } else {
      defaultComplexity = 'standard'; // Default if template format is incorrect
    }
  } 
  // Default to standard if no options specified
  else {
    defaultComplexity = 'standard';
  }
  
  // Get project options through the interactive prompts
  const projectOptions = await promptProjectOptions({
    template: options.template,
    tailwind: options.tailwind,
    typescript: options.typescript,
    stateManagement: options.stateManagement,
    tdlLicense: options.tdlLicense,
    complexity: defaultComplexity,
    pwa: options.pwa,
    statusBarStyle: options.statusBarStyle
  });
  
  logger.debug(`Using template complexity: ${projectOptions.complexity}`);

  // Store project options for use throughout the function
  const template = projectOptions.template;
  const useTailwind = projectOptions.tailwind;
  const useTypescript = projectOptions.typescript;
  const useStateManagement = projectOptions.stateManagement || false;
  const usePwa = projectOptions.pwa || false;
  
  // Create project
  logger.section('Creating project');
  const spin = logger.spinner('Setting up project structure');
  
  try {
    // Create project directory if it doesn't exist
    await mkdir(projectPath, { recursive: true });
    
    try {
      // Check for existing README.md and LICENSE to preserve if they exist
      const readmePath = join(projectPath, 'README.md');
      const licensePath = join(projectPath, 'LICENSE');
      const hasReadme = existsSync(readmePath);
      const hasLicense = existsSync(licensePath);
      
      // Preserve existing README and LICENSE if they exist
      let readmeContent = '';
      let licenseContent = '';
      
      if (hasReadme) {
        readmeContent = await Bun.file(readmePath).text();
        logger.info('Found existing README.md. This file will be preserved.');
      }
      
      if (hasLicense) {
        licenseContent = await readFile(licensePath, 'utf8');
        logger.info('Found existing LICENSE file. This file will be preserved.');
      }
      
      // Copy template files
      await copyTemplate(
        projectOptions.template, 
        projectPath, 
        {
          useTailwind: projectOptions.tailwind,
          useTypescript: projectOptions.typescript,
          complexity: projectOptions.complexity
        }
      );
      
      // Handle license based on user preference
      if (projectOptions.tdlLicense) {
        // Add TDL license
        await addTDLLicense(projectPath);
      } else if (hasLicense) {
        // Restore original license
        await Bun.write(join(projectPath, 'LICENSE'), licenseContent);
        logger.info('Restored original LICENSE file.');
      } else {
        // Add standard MIT license
        await addMITLicense(projectPath, name);
      }
      
      // Restore README if it existed
      if (hasReadme) {
        await Bun.write(join(projectPath, 'README.md'), readmeContent);
        logger.info('Restored original README.md file.');
      }
      
      spin.stop('success', `Project structure created at ${name}`);
      
      // Stage 3: Set up PWA if requested
      if (usePwa) {
        logger.section('Setting up PWA');
        const pwaSpin = logger.spinner('Configuring Progressive Web App');
        
        try {
          // Import PWA setup utilities here to avoid circular dependencies
          const { addPWA } = await import('./pwa.js');
          
          // Configure PWA with project name
          const projectName = projectPath.split('/').pop() || 'My 0x1 App';
          
          // Generate PWA logo text based on project name
          // Extract 1-3 meaningful characters from the project name
          let logoText = '';
          
          // Check if project name has multiple words
          const words = projectName.split(/[-_ ]/); // Split by common word separators
          
          if (words.length > 1) {
            // Use first letter of each word (up to 3)
            logoText = words.slice(0, 3).map(word => word.charAt(0).toUpperCase()).join('');
          } else {
            // Use first 1-3 characters of the project name
            logoText = projectName.substring(0, Math.min(3, projectName.length)).toUpperCase();
          }
          
          // Generate a short name based on the project name
          const shortName = words.length > 1 ? 
            words.map(word => word.charAt(0).toUpperCase()).join('') : // acronym for multi-word names
            projectName.length > 10 ? logoText : projectName; // full name or acronym for short names
          
          // Setup PWA with automatic configuration based on project name and user-selected theme
          await addPWA({
            skipPrompts: true, // Skip prompts since this is part of project creation
            name: projectName, 
            shortName: shortName,
            themeColor: projectOptions.themeColor,
            backgroundColor: projectOptions.secondaryColor,
            description: `${projectName} - Built with 0x1 framework`,
            logoText: logoText, // Pass the generated logo text
            icons: true,
            offline: true,
            // Additional options for extended templating
            theme: projectOptions.theme as string,
            // Pass the iOS status bar style
            statusBarStyle: projectOptions.statusBarStyle as 'default' | 'black' | 'black-translucent' | undefined
          }, projectPath);
          
          pwaSpin.stop('success', 'PWA functionality added');
        } catch (error) {
          pwaSpin.stop('error', 'Failed to set up PWA');
          logger.error(`Error setting up PWA: ${error}`);
          // Continue anyway as this is not critical for project creation
        }
      }
      
      // Stage 4: Install dependencies
      logger.section('Installing dependencies');
      
      const installSpin = logger.spinner('Installing dependencies with Bun');
      
      try {
        process.chdir(projectPath);
        
        // Run bun install
        const { execa } = await import('execa') as ExecaModule;
        await execa('bun', ['install'], { stdio: 'pipe' });
        
        installSpin.stop('success', 'Dependencies installed');
        
        // Show success message
        logger.spacer();
        logger.box(`
🎉 Successfully created project ${name}!

Next steps:
  cd ${name}
  bun dev

To build for production:
  bun run build
`);
      } catch (error) {
        installSpin.stop('error', 'Failed to install dependencies');
        logger.error(`${error}`);
        logger.info('You can try installing dependencies manually:');
        logger.command(`cd ${name} && bun install`);
      }
    } catch (error) {
      spin.stop('error', 'Failed to create project');
      logger.error(`${error}`);
      process.exit(1);
    }
  } catch (error) {
    spin.stop('error', 'Failed to create project');
    logger.error(`${error}`);
    process.exit(1);
  }
}

/**
 * Enhanced interactive prompt for project setup
 */
interface NewProjectOptions {
  template?: string;
  tailwind?: boolean;
  typescript?: boolean;
  stateManagement?: boolean;
  tdlLicense?: boolean;
  pwa?: boolean;
  themeColor?: string;
  secondaryColor?: string;
  textColor?: string;
  theme?: string;
  complexity?: 'minimal' | 'standard' | 'full';
  [key: string]: any;
}

async function promptProjectOptions(defaultOptions: NewProjectOptions): Promise<{ 
  template: string; 
  tailwind: boolean; 
  typescript: boolean; 
  stateManagement: boolean; 
  tdlLicense: boolean;
  complexity: 'minimal' | 'standard' | 'full';
  pwa: boolean;
  themeColor: string;
  secondaryColor: string;
  textColor: string;
  theme: string;
  statusBarStyle: string;
}> {
  // Create a wrapper for prompts that handles cancellation
  const promptWithCancel = async (options: any) => {
    const response = await prompts(options, {
      onCancel: () => {
        logger.warn('Project setup canceled.');
        process.exit(0);
      }
    });
    
    return response;
  };
  
  logger.spacer();
  
  // Language choice
  const languageResponse = await promptWithCancel({
    type: 'select',
    name: 'language',
    message: '🔤 Select language:',
    choices: [
      { title: 'TypeScript', value: 'typescript' },
      { title: 'JavaScript', value: 'javascript' }
    ],
    initial: defaultOptions.typescript === false ? 1 : 0,
  });

  logger.spacer();

  // Template complexity choice
  const complexityResponse = await promptWithCancel({
    type: 'select',
    name: 'complexity',
    message: '🏗️ Project complexity:',
    choices: [
      { title: 'Minimal', description: 'Bare-bones starter with just the essentials', value: 'minimal' },
      { title: 'Standard', description: 'Recommended setup for most projects', value: 'standard' },
      { title: 'Full', description: 'Complete setup with all features', value: 'full' }
    ],
    initial: defaultOptions.complexity === 'minimal' ? 0 : 
             defaultOptions.complexity === 'full' ? 2 : 1, // Default to standard if not specified
  });

  logger.spacer();

  // Ask about license choice
  const licenseResponse = await promptWithCancel({
    type: 'select',
    name: 'tdlLicense',
    message: '🔐 Choose a license:',
    choices: [
      { title: 'MIT License', value: false, description: 'Permissive license' },
      { title: 'TDL License', value: true, description: 'TriexDev License' }
    ],
    initial: defaultOptions.tdlLicense ? 1 : 0
  });
  
  logger.spacer();

  // Ask about project theme
  const themeResponse = await promptWithCancel({
    type: 'select',
    name: 'theme',
    message: '🎨 Choose a project theme:',
    choices: [
      { 
        title: 'Midnight Blue', 
        value: 'midnight-blue', 
        description: 'Dark blue theme with modern accents' 
      },
      { 
        title: 'Forest Green', 
        value: 'forest-green', 
        description: 'Natural green theme with earthy tones' 
      },
      { 
        title: 'Royal Purple', 
        value: 'royal-purple', 
        description: 'Rich purple theme with elegant styling' 
      },
      { 
        title: 'Slate Gray', 
        value: 'slate-gray', 
        description: 'Neutral gray theme with professional look' 
      },
      { 
        title: 'Classic', 
        value: 'classic', 
        description: 'Default 0x1 styling' 
      }
    ],
    initial: 4
  });
  
  logger.spacer();

  // Ask about PWA support (not needed for minimal templates)
  const pwaResponse = complexityResponse.complexity !== 'minimal' ? await promptWithCancel({
    type: 'select',
    name: 'pwa',
    message: '📱 Add Progressive Web App (PWA) support?',
    choices: [
      { 
        title: 'Yes', 
        value: true, 
        description: 'Add PWA support with app icons, manifest, and offline capability' 
      },
      { 
        title: 'No', 
        value: false, 
        description: 'Skip PWA setup' 
      }
    ],
    initial: defaultOptions.pwa ? 0 : 1
  }) : { pwa: false };
  
  // Map theme selection to appropriate PWA colors
  const themeColorMap: Record<string, { primary: string; secondary: string; text: string }> = {
    'midnight-blue': { primary: '#1e3a8a', secondary: '#bfdbfe', text: '#f8fafc' },
    'forest-green': { primary: '#166534', secondary: '#bbf7d0', text: '#f8fafc' },
    'royal-purple': { primary: '#5b21b6', secondary: '#e9d5ff', text: '#f8fafc' },
    'slate-gray': { primary: '#334155', secondary: '#f1f5f9', text: '#f8fafc' },
    'classic': { primary: '#0077cc', secondary: '#ffffff', text: '#111827' }
  };
  
  // Get colors based on selected theme
  const themeKey = themeResponse.theme as string;
  const selectedThemeColors = themeColorMap[themeKey] || themeColorMap['classic'];
  
  // Use theme color for PWA by default
  let themeColor = selectedThemeColors.primary;
  let secondaryColor = selectedThemeColors.secondary;
  let textColor = selectedThemeColors.text;
  
  // Ask for PWA options if PWA is enabled
  // Default to 'default' status bar style
  let statusBarStyle: string = 'default';
  
  if (pwaResponse.pwa) {
    // Ask about status bar style first
    const statusBarResponse = await promptWithCancel({
      type: 'select',
      name: 'statusBarStyle',
      message: '📱 iOS status bar style:',
      choices: [
        { title: 'Default', value: 'default', description: 'Default style with gray background' },
        { title: 'Black', value: 'black', description: 'Black background with white text' },
        { title: 'Black Translucent', value: 'black-translucent', description: 'Content appears under status bar (fullscreen)' }
      ],
      initial: 0
    });
    
    statusBarStyle = statusBarResponse.statusBarStyle;
    
    // Ask about theme colors
    const usePredefinedColors = await promptWithCancel({
      type: 'select',
      name: 'usePredefined',
      message: '🎨 Use selected theme colors for PWA?',
      choices: [
        { title: 'Yes', value: true, description: 'Use theme colors selected earlier' },
        { title: 'No', value: false, description: 'Choose custom PWA colors' }
      ],
      initial: 0
    });
    
    if (!usePredefinedColors.usePredefined) {
      const customColorResponse = await promptWithCancel({
        type: 'select',
        name: 'themeColor',
        message: '🎨 Select a custom PWA theme color:',
        choices: [
          { title: 'Blue', value: '#0077cc', description: 'Classic blue theme' },
          { title: 'Slate', value: '#475569', description: 'Modern slate gray theme' },
          { title: 'Green', value: '#059669', description: 'Fresh green theme' },
          { title: 'Purple', value: '#7c3aed', description: 'Vibrant purple theme' },
          { title: 'Rose', value: '#e11d48', description: 'Bold rose theme' },
          { title: 'Custom', value: 'custom', description: 'Enter a custom hex color' }
        ],
        initial: 0
      });
      
      themeColor = customColorResponse.themeColor;
      
      // Ask for custom color if selected
      if (themeColor === 'custom') {
        const hexColorResponse = await promptWithCancel({
          type: 'text',
          name: 'customColor',
          message: '🎨 Enter a custom hex color (e.g. #ff5500):',
          validate: (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value) ? true : 'Please enter a valid hex color (e.g. #ff5500)'
        });
        themeColor = hexColorResponse.customColor;
      }
    }
  }

  // State management is included by default in full template or can be specified
  const useStateManagement = defaultOptions.stateManagement ?? 
                             (complexityResponse.complexity === 'full');

  // Tailwind is enabled by default now
  const useTailwind = defaultOptions.tailwind ?? true;
  
  // Construct the template path based on language and complexity
  const templatePath = `${complexityResponse.complexity}/${languageResponse.language}`;

  return {
    template: defaultOptions.template || templatePath,
    typescript: languageResponse.language === 'typescript',
    tailwind: useTailwind,
    stateManagement: useStateManagement,
    tdlLicense: licenseResponse.tdlLicense,
    complexity: complexityResponse.complexity,
    pwa: pwaResponse.pwa,
    themeColor: themeColor,
    secondaryColor: secondaryColor,
    textColor: textColor,
    theme: themeResponse.theme,
    statusBarStyle: statusBarStyle
  };
}

/**
 * Copy template files to project directory
 */
async function copyTemplate(
  template: string,
  projectPath: string,
  options: {
    useTailwind: boolean;
    useTypescript: boolean;
    complexity: 'minimal' | 'standard' | 'full';
  }
): Promise<void> {
  const { useTailwind, useTypescript, complexity } = options;
  
  // The template variable already includes the complexity and language (e.g., 'full/typescript')
  // so we don't need to append the language again
  const templatePath = join(import.meta.dirname || '', '../../../templates', template);
  
  // Copy template files using internal copy function
  await copyTemplateFiles(templatePath, projectPath, { 
    useTailwind, 
    useTypescript, 
    complexity,
    useStateManagement: complexity === 'full' // Enable state management for full template
  });
}

/**
 * Copy template files recursively
 */
async function copyTemplateFiles(
  sourcePath: string,
  destPath: string,
  options: {
    useTailwind: boolean;
    useTypescript: boolean;
    complexity: 'minimal' | 'standard' | 'full';
    useStateManagement?: boolean;
  }
): Promise<void> {
  // The sourceType should already include the language folder (typescript/javascript)
  // Based on the path constructed in copyTemplate function
  const fullSourcePath = sourcePath;
  
  logger.debug(`Copying template from ${fullSourcePath} to ${destPath}`);
  logger.debug(`Options: ${JSON.stringify(options)}`);
  
  // Check if the source path exists
  if (!existsSync(fullSourcePath)) {
    throw new Error(`Template path does not exist: ${fullSourcePath}`);
  }
  
  try {
    // Recursive function to copy files and directories
    async function copyRecursive(src: string, dest: string) {
      const stats = await Bun.file(src).stat();
      
      // Check if it's a directory by checking if the mode indicates a directory
      // Directories typically have the directory bit set in their mode
      const isDirectory = stats.mode & 0x4000;
      
      if (isDirectory) {
        // Create the destination directory if it doesn't exist
        if (!existsSync(dest)) {
          await mkdir(dest, { recursive: true });
        }
        
        // Read all items in the source directory
        const items = readdirSync(src);
        
        // Process each item
        for (const item of items) {
          const srcPath = join(src, item);
          const destPath = join(dest, item);
          
          // Skip node_modules and other common files/folders to ignore
          if (item === 'node_modules' || item === '.git' || item === 'dist' || 
              item === 'bun.lockb' || item === '.DS_Store') {
            continue;
          }
          
          // Recursively copy
          await copyRecursive(srcPath, destPath);
        }
      } else {
        // It's a file, copy it directly
        const content = await Bun.file(src).text();
        await Bun.write(dest, content);
        logger.debug(`Copied: ${src} to ${dest}`);
      }
    }
    
    // Start the recursive copy
    await copyRecursive(fullSourcePath, destPath);
    
    // Create package.json with appropriate dependencies if it doesn't exist after copying
    // This ensures we don't overwrite a custom package.json
    if (!existsSync(join(destPath, 'package.json'))) {
      await createPackageJson(destPath, options);
    }
    
    logger.debug('Template files copied successfully');
  } catch (error) {
    logger.error(`Error copying template files: ${error}`);
    throw error;
  }
}

/**
 * Create package.json file
 */
async function createPackageJson(
  projectPath: string,
  options: {
    useTailwind: boolean;
    useTypescript: boolean;
    useStateManagement?: boolean;
    minimal?: boolean;
  }
): Promise<void> {
  const { useTailwind, useTypescript, useStateManagement, minimal } = options;
  
  // Basic package.json structure
  const packageJson = {
    name: projectPath.split('/').pop(),
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: '0x1 dev',
      build: '0x1 build',
      preview: '0x1 preview'
    },
    dependencies: {
      0x1: '*'
    },
    devDependencies: {} as Record<string, string>
  };
  
  // Add Tailwind if needed
  if (useTailwind) {
    Object.assign(packageJson.devDependencies, {
      tailwindcss: '^3.4.1',
      autoprefixer: '^10.4.17',
      postcss: '^8.4.35'
    });
  }
  
  // Add TypeScript if needed
  if (useTypescript) {
    Object.assign(packageJson.devDependencies, {
      typescript: '^5.3.3'
    });
  }
  
  // Write package.json file
  await Bun.write(
    join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

/**
 * Create basic source files
 */
async function createBasicSourceFiles(
  projectPath: string,
  options: {
    useTailwind: boolean;
    useTypescript: boolean;
    useStateManagement?: boolean;
    complexity: 'minimal' | 'standard' | 'full';
  }
): Promise<void> {
  const { useTypescript, complexity } = options;
  const ext = useTypescript ? 'ts' : 'js';
  
  // Create index.html at the root level
  const indexPath = 'index.html';
  
  // Create index.html based on complexity level
  if (complexity === 'full') {
    // For full template, use a more comprehensive HTML with proper structure
    await Bun.write(
      join(projectPath, indexPath),
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 Full App</title>
  <link rel="stylesheet" href="/styles/main.css">
  <link rel="icon" href="/public/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="/public/manifest.json">
  <meta name="theme-color" content="#0077cc">
  <meta name="description" content="0x1 Full-Featured Application">
  <!-- iOS PWA meta tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="apple-touch-icon" href="/public/icons/icon-192x192.png">
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white min-h-screen">
  <div id="app" class="min-h-screen flex flex-col items-center justify-center p-4">
    <h1 class="text-3xl font-bold text-primary mb-4">Welcome to 0x1</h1>
    <p class="text-xl mb-6">The ultra-minimal TypeScript framework</p>
    
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md w-full">
      <h2 class="text-2xl font-semibold mb-4">Counter Demo</h2>
      <div class="flex items-center justify-between">
        <span class="text-4xl font-bold" id="counter-value">0</span>
        <button id="increment-btn" class="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded">
          Increment
        </button>
      </div>
    </div>
    
    <div class="mt-8 text-center">
      <button id="theme-toggle" class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 py-2 px-4 rounded">
        Toggle Dark Mode
      </button>
    </div>
  </div>
  <script type="module" src="/app.${ext}"></script>
</body>
</html>`
    );
  } else {
    // For minimal and standard templates, use a simpler HTML structure
    await Bun.write(
      join(projectPath, indexPath),
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 App</title>
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/app.${ext}"></script>
</body>
</html>`
    );
  }
  
  // Create app.ts or app.js at root level
  await Bun.write(
    join(projectPath, `app.${ext}`),
    useTypescript
      ? `/**
 * 0x1 Application Entry Point
 */

// DOM ready function
function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Initialize the app
ready(() => {
  console.log('0x1 app started!');
  
  // Check for dark mode preference or saved preference
  const savedTheme = localStorage.getItem('0x1-dark-mode');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set initial dark mode state based on saved preference or system preference
  if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  }
  
  // Set up theme toggle if it exists
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    // Update toggle button text based on current theme
    updateThemeToggleText();
    
    themeToggle.addEventListener('click', () => {
      // Toggle dark class on the html element
      document.documentElement.classList.toggle('dark');
      
      // Update button text
      updateThemeToggleText();
      
      // Save preference to localStorage
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('0x1-dark-mode', isDark ? 'dark' : 'light');
    });
  }
  
  // Helper function to update theme toggle button text
  function updateThemeToggleText() {
    if (themeToggle) {
      const isDark = document.documentElement.classList.contains('dark');
      themeToggle.textContent = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }
  
  // Set up counter demo if elements exist
  const counterEl = document.getElementById('counter-value');
  const incrementBtn = document.getElementById('increment-btn');
  
  if (counterEl && incrementBtn) {
    let count = 0;
    
    // Display initial value
    counterEl.textContent = count.toString();
    
    // Set up click handler
    incrementBtn.addEventListener('click', () => {
      count++;
      counterEl.textContent = count.toString();
    });
  }
});`
      : `/**
 * 0x1 Application Entry Point
 */

// DOM ready function
function ready(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Initialize the app
ready(() => {
  console.log('0x1 app started!');
  
  // Set up theme toggle if it exists
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });
  
  // Set up counter demo if elements exist
  const counterEl = document.getElementById('counter-value');
  const incrementBtn = document.getElementById('increment-btn');
  
  if (counterEl && incrementBtn) {
    let count = 0;
    
    // Display initial value
    counterEl.textContent = count.toString();
    
    // Set up click handler
    incrementBtn.addEventListener('click', () => {
      count++;
      counterEl.textContent = count.toString();
    });
  }
});`
  );
  
  // Create styles directory if it doesn't exist
  await mkdir(join(projectPath, 'styles'), { recursive: true });

  // Create styles/main.css with Tailwind directives
  await Bun.write(
    join(projectPath, 'styles/main.css'),
    `/* Tailwind CSS directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles and utility classes */
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.bg-gray-100 {
  background-color: #f3f4f6;
}

.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.font-bold {
  font-weight: 700;
}

.text-gray-900 {
  color: #111827;
}

.mb-4 {
  margin-bottom: 1rem;
}

.text-gray-600 {
  color: #4b5563;
}

@media (prefers-color-scheme: dark) {
  .dark\\:bg-gray-900 {
    background-color: #111827;
  }
  
  .dark\\:text-white {
    color: #ffffff;
  }
  
  .dark\\:text-gray-300 {
    color: #d1d5db;
  }
}`
  );
  
  // Create public/favicon.svg
  await Bun.write(
    join(projectPath, 'public/favicon.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#0077cc"/>
  <path d="M30 30h40v10H30z" fill="white"/>
  <path d="M50 40v30" stroke="white" stroke-width="10"/>
  <path d="M30 70h40" stroke="white" stroke-width="10"/>
</svg>`
  );
}

/**
 * Create configuration files
 */
async function createConfigFiles(
  projectPath: string,
  options: {
    useTailwind: boolean;
    useTypescript: boolean;
    useStateManagement?: boolean;
    complexity: 'minimal' | 'standard' | 'full';
  }
): Promise<void> {
  const { useTailwind, useTypescript, complexity } = options;
  
  // Create 0x1.config.ts or 0x1.config.js
  const ext = useTypescript ? 'ts' : 'js';
  await Bun.write(
    join(projectPath, `0x1.config.${ext}`),
    useTypescript
      ? `import { _0x1Config } from '0x1';

const config: _0x1Config = {
  app: {
    name: '${projectPath.split('/').pop()}',
    title: '0x1 App',
    description: 'Built with the 0x1 framework'
  },
  server: {
    port: 3000,
    host: 'localhost',
    basePath: '/'
  },
  routes: {
    '/': './pages/home'
  },
  styling: {
    tailwind: ${useTailwind},
    darkMode: 'media'
  },
  build: {
    outDir: 'dist',
    minify: true,
    precomputeTemplates: true,
    prefetchLinks: true
  },
  deployment: {
    provider: 'vercel',
    edge: true
  }
};

export default config;`
      : `/** @type {import('0x1')._0x1Config} */
export default {
  app: {
    name: '${projectPath.split('/').pop()}',
    title: '0x1 App',
    description: 'Built with the 0x1 framework'
  },
  server: {
    port: 3000,
    host: 'localhost',
    basePath: '/'
  },
  routes: {
    '/': './pages/home'
  },
  styling: {
    tailwind: ${useTailwind},
    darkMode: 'media'
  },
  build: {
    outDir: 'dist',
    minify: true,
    precomputeTemplates: true,
    prefetchLinks: true
  },
  deployment: {
    provider: 'vercel',
    edge: true
  }
};`
  );
  
  // Create tailwind.config.js if needed
  if (useTailwind) {
    // Define content patterns based on template complexity
    // Be specific to avoid accidentally matching node_modules
    let contentPatterns;
    if (complexity === 'minimal') {
      contentPatterns = [
        "./index.html", 
        "./app.{js,ts}", 
        "./components/**/*.{js,ts,jsx,tsx}", 
        "./pages/**/*.{js,ts,jsx,tsx}", 
        "./lib/**/*.{js,ts}"
      ];
    } else {
      contentPatterns = [
        "./index.html", 
        "./src/**/*.{html,js,ts,jsx,tsx}", 
        "./app.{js,ts}"
      ];
    }
      
    await Bun.write(
      join(projectPath, 'tailwind.config.js'),
      `/** @type {import('tailwindcss').Config} */
export default {
  content: ${JSON.stringify(contentPatterns, null, 2)},
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0077cc',
          dark: '#005fa3',
          light: '#3399dd'
        }
      }
    },
  },
  plugins: [],
}`
    );
    
    // Create postcss.config.js
    await Bun.write(
      join(projectPath, 'postcss.config.js'),
      `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
    );
  }
  
  // Create tsconfig.json if needed
  if (useTypescript) {
    await Bun.write(
      join(projectPath, 'tsconfig.json'),
      `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}`
    );
  }
  
  // Create README.md
  await Bun.write(
    join(projectPath, 'README.md'),
    `# ${projectPath.split('/').pop()}

This project was created with [0x1](https://github.com/Triex/0x1) - the ultra-minimal TypeScript framework.

## Getting Started

First, run the development server:

\`\`\`bash
0x1 dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about 0x1, check out the following resources:

- [0x1 Documentation](https://github.com/Triex/0x1) - learn about 0x1 features and API.
- [0x1 Framework Code](https://github.com/Triex/0x1) - explore the 0x1 framework source code.

## Deploy

The easiest way to deploy your 0x1 app is to use the [Vercel Platform](https://vercel.com)
`
  );
  
  // Create .gitignore
  await Bun.write(
    join(projectPath, '.gitignore'),
    `# Dependencies
node_modules/
.pnp/
.pnp.js

# Build outputs
dist/
build/
.next/
out/
.cache/

# Bun
bun.lockb

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.DS_Store
`
  );
}
