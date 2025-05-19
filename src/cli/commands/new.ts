/**
 * 0x1 CLI - New Project Command
 * Creates a new 0x1 project with the specified template
 */

import chalk from 'chalk';
import { existsSync, readdirSync } from 'fs';
import { mkdir } from 'fs/promises'; // Keep mkdir for directory creation compatibility
import { join, resolve } from 'path';
import prompts from 'prompts';
import { logger } from '../utils/logger.js';
import { addMITLicense, addNoLicense, addTDLLicense } from './license-utils.js';
// Add execa type definition - keeping for backward compatibility
type ExecaModule = { execa: (command: string, args: string[], options?: any) => Promise<{stdout: string; stderr: string}> };

/**
 * Install project dependencies using Bun's native package manager
 * @param projectPath - Path to the project directory
 */
async function installDependencies(projectPath: string): Promise<void> {
  const spinnerText = 'Installing dependencies';
  const spinner = logger.spinner(spinnerText);
  
  try {
    // Use Bun's native package manager for optimized installations
    // This is significantly faster than npm or yarn
    const result = Bun.spawnSync(['bun', 'install'], {
      cwd: projectPath,
      stdout: 'pipe',
      stderr: 'pipe',
      env: process.env
    });
    
    if (result.exitCode === 0) {
      spinner.stop('success', 'Dependencies installed successfully using Bun');
    } else {
      const error = new TextDecoder().decode(result.stderr);
      throw new Error(`Bun install failed: ${error}`);
    }
  } catch (error) {
    // Fall back to npm if Bun install fails
    logger.warn(`Bun install failed, falling back to npm: ${error}`);
    
    try {
      // Use Bun's spawn for better performance instead of execa
      const result = Bun.spawnSync(['npm', 'install'], {
        cwd: projectPath,
        stdout: 'pipe',
        stderr: 'pipe',
        env: process.env
      });
      
      if (result.exitCode === 0) {
        spinner.stop('success', 'Dependencies installed successfully with npm');
      } else {
        const error = new TextDecoder().decode(result.stderr);
        throw new Error(`npm install failed: ${error}`);
      }
    } catch (fallbackError) {
      spinner.stop('error', 'Failed to install dependencies');
      logger.error(`Error installing dependencies: ${fallbackError}`);
      logger.info('You may need to run "bun install" or "npm install" manually');
    }
  }
}

interface NewProjectOptions {
  template?: string;
  tailwind?: boolean;
  // TypeScript is now the only option, no longer optional
  typescript?: boolean; // Keep for backwards compatibility but it's always true now
  javascript?: boolean; // Keep for backwards compatibility but it's always false now
  minimal?: boolean;
  force?: boolean;
  stateManagement?: boolean;
  licenseType?: 'tdl' | 'mit' | 'none'; // New license type property
  overwrite?: boolean;
  complexity?: 'minimal' | 'standard' | 'full';
  pwa?: boolean;
  'no-pwa'?: boolean; // Add explicit no-pwa flag
  themeMode?: 'light' | 'dark' | 'system'; // Theme mode selection
  // Project structure support
  useNextStyle?: boolean; // Use Next.js 15-style app directory structure (default true)
  projectStructure?: 'minimal' | 'app' | 'root' | 'src';
  
  // PWA related properties
  themeColor?: string;
  secondaryColor?: string;
  theme?: string;
  statusBarStyle?: 'black-translucent' | 'default' | 'black';
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
    logger.error(`Invalid project name: ${name}. Use only lowercase letters, numbers, and hyphens.`);
    process.exit(1);
  }
  
  // Check if directory already exists
  const projectPath = resolve(process.cwd(), name);
  if (existsSync(projectPath)) {
    if (options.force) {
      logger.warn(`Project directory already exists. Using --force flag to overwrite.`);
    } else {
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
  let defaultComplexity: 'minimal' | 'standard' | 'full' = 'standard';
  
  if (options.complexity === 'minimal') {
    defaultComplexity = 'minimal';
  } else if (options.complexity === 'standard' || options.complexity === 'full') {
    defaultComplexity = options.complexity;
  } 
  // If --minimal flag is provided, set to minimal
  else if (options.minimal) {
    defaultComplexity = 'minimal';
  } 
  // If --template is provided, extract complexity from template path
  else if (options.template) {
    // Template format should be complexity/language (e.g., minimal/typescript)
    const parts = options.template.split('/');
    if (parts.length >= 1) {
      if (parts[0] === 'minimal' || parts[0] === 'standard' || parts[0] === 'full') {
        defaultComplexity = parts[0];
      }
      // else: defaultComplexity remains 'standard' from initialization
    }
  }
  // Default is already set to 'standard' in the initialization

  // Process CLI flags for consistency before passing to prompts
  // TypeScript is now the only option, but we keep this for compatibility
  options.typescript = true;
  
  // If --no-pwa is passed, make sure pwa is explicitly set to false
  if (options['no-pwa'] === true) {
    options.pwa = false;
  }
  
  // Debug log to show processed CLI options
  logger.debug(`Processed CLI options: pwa=${options.pwa}`);  

  // Retrieve project options either from CLI args or interactive prompt
  const projectOptions = options.minimal
    ? {
        template: 'custom', // Using custom for simplicity
        tailwind: false,
        typescript: true, // TypeScript is now the only option
        stateManagement: false,
        licenseType: options.licenseType || 'tdl',
        pwa: false,
        complexity: options.complexity || 'minimal',
        themeMode: options.themeMode || 'system',
        projectStructure: 'app', // Next.js 15 style app directory
        useNextStyle: true,
        // Default theme colors for PWA support
        themeColor: '#0077cc',
        secondaryColor: '#005fa3',
        theme: 'light',
        statusBarStyle: 'black-translucent'
      }
    : await promptProjectOptions(options);

  // Always use app directory structure for Next.js 15 compatibility
  const projectStructure = 'app';
  logger.info('💡 Using modern app directory structure for Next.js 15 compatibility');
  
  logger.debug(`Using template complexity: ${projectOptions.complexity}`);

  // Store project options for use throughout the function
  // These variables are kept for documentation clarity but prefixed with _ to satisfy linting
  const _template = projectOptions.template;
  const _useTailwind = projectOptions.tailwind;
  // TypeScript is now the only option - removed the _useTypescript variable
  const _useStateManagement = projectOptions.stateManagement || false;
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
        licenseContent = await Bun.file(licensePath).text();
        logger.info('Found existing LICENSE file. This file will be preserved.');
      }
      
      // Copy template files
      await copyTemplate(
        projectOptions.template, 
        projectPath, 
        {
          useTailwind: projectOptions.tailwind,
          complexity: projectOptions.complexity
        }
      );
      
      // Create basic source files if needed
  // No longer using this for templates since we're using pre-built templates
  // But keeping for reference and potential future use
  if (projectOptions.template === 'custom') {
    const useStateManagement = !!projectOptions.stateManagement;
    await _createBasicSourceFiles(projectPath, {
      useTailwind: projectOptions.tailwind || false,
      useStateManagement,
      complexity: projectOptions.complexity as ('minimal' | 'standard' | 'full'),
      projectStructure
    });
  }
      
      // Handle license based on user preference
      if (projectOptions.licenseType === 'tdl') {
        // Add TDL license
        await addTDLLicense(projectPath);
      } else if (projectOptions.licenseType === 'mit') {
        // Add standard MIT license
        await addMITLicense(projectPath, name);
      } else if (projectOptions.licenseType === 'none') {
        // Add NO LICENSE file
        await addNoLicense(projectPath);
      } else if (hasLicense) {
        // Restore original license
        await Bun.write(join(projectPath, 'LICENSE'), licenseContent);
        logger.info('Restored original LICENSE file.');
      }
      
      // Restore README if it existed
      if (hasReadme) {
        await Bun.write(join(projectPath, 'README.md'), readmeContent);
        logger.info('Restored original README.md file.');
      }
      
      spin.stop('success', `Project structure created at ${name}`);
      
      // Stage 3: Set up icons and PWA if requested
      // Generate basic project info for icon generation
      const projectName = options.name || projectPath.split('/').pop() || '';
      
      // Generate logo text based on project name
      // - For multi-word names: use first letters as acronym
      // - For single word names: use up to 3 characters
      let logoText = '';
      
      // Split projectName by non-alphanumeric characters
      const words = projectName.split(/[^a-zA-Z0-9]/).filter(Boolean);
      
      if (words.length > 1) {
        // For multi-word names, create an acronym (first letter of each word)
        logoText = words.slice(0, 3).map((word: string) => word.charAt(0).toUpperCase()).join('');
      } else {
        // For single word, use first 3 letters
        logoText = projectName.substring(0, Math.min(3, projectName.length)).toUpperCase();
      }
      
      // Derive short name - use acronym for multi-word names or full name for short names
      const shortName = words.length > 1 ? 
        words.map((word: string) => word.charAt(0).toUpperCase()).join('') : // acronym for multi-word names
        projectName.length > 10 ? logoText : projectName; // full name or acronym for short names

      // For full PWA setup
      if (usePwa) {
        logger.section('Setting up PWA');
        const pwaSpin = logger.spinner('Configuring Progressive Web App');
        
        try {
          // Import PWA setup utilities here to avoid circular dependencies
          const { addPWA } = await import('./pwa.js');
          
          // Setup PWA with automatic configuration based on project name and user-selected theme
          const pwaSetupSuccess = await addPWA({
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
          
          if (!pwaSetupSuccess) {
            pwaSpin.stop('error', 'Failed to set up PWA');
            throw new Error('Error setting up PWA. Project creation aborted.');
          }
          
          pwaSpin.stop('success', 'PWA functionality added');
        } catch (error) {
          pwaSpin.stop('error', 'Failed to set up PWA');
          logger.error(`Error setting up PWA: ${error}`);
          throw error;
        }
      } 
      // For non-PWA projects, just generate basic icons
      else {
        logger.section('Creating basic assets');
        const iconSpin = logger.spinner('Generating project icons');
        
        try {
          // Import icon generator utility
          const { generateBasicIcons } = await import('../../utils/icon-generator.js');
          
          // Generate basic favicon and app icon
          await generateBasicIcons(projectPath, {
            name: projectName,
            logoText: logoText,
            themeColor: projectOptions.themeColor,
            backgroundColor: projectOptions.secondaryColor,
            theme: projectOptions.theme as string,
            projectStructure: projectStructure as 'root' | 'src' | 'app'
          });
          
          iconSpin.stop('success', 'Basic project icons created');
        } catch (error) {
          iconSpin.stop('error', 'Failed to generate project icons');
          logger.error(`Error generating icons: ${error}`);
          // Don't throw - icon generation failing shouldn't stop the whole project creation
          logger.info('Continuing project creation without custom icons');
        }
      }
      
      // Stage 4: Install dependencies
      logger.section('Installing dependencies');
      
      try {
        await installDependencies(projectPath);
        
        // Show success message
        logger.spacer();
        logger.box(`
🎉 Successfully created project ${name}!

Next steps:
  cd ${name} && bun dev
To build for production:
  bun build
`);
        logger.command(`cd ${name} && bun install`);
      } catch (depError) {
        logger.error(`Failed to install dependencies: ${depError}`);
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
  javascript?: boolean; // Add explicit JavaScript flag
  stateManagement?: boolean;
  tdlLicense?: boolean; // Legacy support
  licenseType?: 'tdl' | 'mit' | 'none'; // New license type property
  pwa?: boolean;
  'no-pwa'?: boolean; // Add explicit no-pwa flag
  themeColor?: string;
  secondaryColor?: string;
  textColor?: string;
  theme?: string;
  themeMode?: 'light' | 'dark' | 'system'; // Add theme mode selection
  complexity?: 'minimal' | 'standard' | 'full';
  [key: string]: any;
}

async function promptProjectOptions(defaultOptions: NewProjectOptions): Promise<{
  template: string;
  tailwind: boolean;
  typescript: boolean; // Always true but kept for compatibility
  stateManagement: boolean;
  licenseType: 'tdl' | 'mit' | 'none';
  complexity: 'minimal' | 'standard' | 'full';
  pwa: boolean;
  themeMode: 'light' | 'dark' | 'system';
  projectStructure: 'app'; // Only app directory structure is supported now
  useNextStyle: boolean; // Always true
  // PWA related properties
  themeColor: string;
  secondaryColor: string;
  theme: string;
  statusBarStyle: 'black-translucent' | 'default' | 'black';
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
  // Debug log to track flag values
  logger.debug(`CLI flags - javascript: ${defaultOptions.javascript}, typescript: ${defaultOptions.typescript}`);  

  logger.info(chalk.bold('\nLanguage: TypeScript'));
  logger.info('0x1 now uses TypeScript exclusively for type-safe modern development');

  // Prompt for other project settings
  const complexityResponse = await promptWithCancel({
    type: "select",
    name: "complexity",
    message: "Select a template complexity level (or press Enter for standard):",
    choices: [
      { value: "minimal", label: "Minimal - Basic setup with minimal dependencies" },
      { value: "standard", label: "Standard - Common libraries and project structure" },
      { value: "full", label: "Full - Complete setup with all recommended features" },
    ],
    initial: 1
  });

  // Ask about state management
  const stateResponse = await promptWithCancel({
    type: "confirm",
    name: "stateManagement",
    message: "Would you like to include state management?",
    initial: false
  });

  // Ask about license type
  const licenseResponse = await promptWithCancel({
    type: "select",
    name: "licenseType",
    message: "Select a license type:",
    choices: [
      { value: "mit", label: "MIT License" },
      { value: "tdl", label: "TDL License (0x1 Default)" },
      { value: "none", label: "No License" }
    ],
    initial: 1
  });

  // Template complexity choice
  const templatePrompt = await promptWithCancel({
    type: 'select',
    name: 'template',
    message: 'Which template would you like to use?',
    choices: [
      { title: 'Default [Recommended]', value: 'default', description: 'Fully featured web application template' },
      { title: 'Minimal', value: 'minimal', description: 'Bare-bones template with minimal features' },
      { title: 'Full', value: 'full', description: 'Complete application with all features' },
      { title: 'Next.js Style', value: 'next', description: 'App router pattern inspired by Next.js 15' }
    ],
    initial: defaultOptions.template === 'next' ? 3 : defaultOptions.template === 'full' ? 2 : defaultOptions.template === 'minimal' ? 1 : 0
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

  // Ask about theme mode preference
  const themeModeDefault = defaultOptions.themeMode === 'light' ? 0 : 
                          defaultOptions.themeMode === 'system' ? 2 : 1; // Default to dark if not specified

  const themeModeResponse = await promptWithCancel({
    type: 'select',
    name: 'themeMode',
    message: '🌓 Choose theme mode:',
    choices: [
      {
        title: 'Light', 
        value: 'light',
        description: 'Light theme mode'
      },
      {
        title: 'Dark',
        value: 'dark',
        description: 'Dark theme mode (recommended)'
      },
      {
        title: 'System',
        value: 'system',
        description: 'Follow system preference'
      }
    ],
    initial: themeModeDefault
  });
  
  logger.spacer();

  // Using standardized app directory structure for all projects
  logger.info('💡 Using modern app directory structure for Next.js 15 compatibility');
  const projectStructure = 'app';
  
  // Define default PWA theme values - these will be used if user doesn't set specific flags
  const defaultPwaThemeColor = '#0077cc';
  const defaultPwaSecondaryColor = '#005fa3';
  const defaultPwaTheme = { theme: 'light' };
  const defaultPwaStatusBarStyle: 'black-translucent' | 'default' | 'black' = 'black-translucent';

  // Ask about PWA support (not needed for minimal templates)
  // Define a proper PWA default: If pwa flag is explicitly true, use Yes, if explicitly false (or --no-pwa), use No
  // If not specified, default to No
  const pwaDefault = defaultOptions.pwa === true ? 0 : 1;
  
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
    initial: pwaDefault
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
  let pwaThemeColor = selectedThemeColors.primary;
  const pwaSecondaryColor = selectedThemeColors.secondary;
  const pwaTextColor = selectedThemeColors.text;
  
  // Ask for PWA options if PWA is enabled
  // Default to 'default' status bar style
  let pwaStatusBarStyle: 'default' | 'black-translucent' | 'black' = 'default';
  
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
    
    pwaStatusBarStyle = statusBarResponse.statusBarStyle;
    
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
      
      pwaThemeColor = customColorResponse.themeColor;
      
      // Ask for custom color if selected
      if (pwaThemeColor === 'custom') {
        const hexColorResponse = await promptWithCancel({
          type: 'text',
          name: 'customColor',
          message: '🎨 Enter a custom hex color (e.g. #ff5500):',
          validate: (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value) ? true : 'Please enter a valid hex color (e.g. #ff5500)'
        });
        pwaThemeColor = hexColorResponse.customColor;
      }
    }
  }

  // State management is included by default in full template or can be specified
  const useStateManagement = defaultOptions.stateManagement ?? 
                             (complexityResponse.complexity === 'full');

  // Tailwind is enabled by default now
  const useTailwind = defaultOptions.tailwind ?? true;
  
  // Construct the template path - Use the complexity to determine the template path - TypeScript is the only option now
  const templatePath = `${complexityResponse.complexity}/typescript`;

  // Determine appropriate values based on selected options
  const tailwindOption = useTailwind;
  const stateManagementOption = useStateManagement;
  const useNextStyleOption = templatePrompt.template === 'next';
  
  // Set project structure to 'app' if Next.js template is selected
  const actualProjectStructure = templatePrompt.template === 'next' ? 'app' : projectStructure;
  // Return the complete options object
  return {
    template: templatePrompt.template,
    tailwind: tailwindOption,
    typescript: true, // TypeScript is now the only option
    stateManagement: stateManagementOption,
    licenseType: defaultOptions.licenseType || 'mit', // Default to MIT if undefined
    complexity: complexityResponse.complexity,
    pwa: pwaResponse.pwa,
    themeMode: themeModeResponse.themeMode,
    projectStructure: 'app', // Fixed project structure for Next.js 15
    useNextStyle: true, // Always use Next.js style app directory structure
    themeColor: pwaThemeColor,
    secondaryColor: pwaSecondaryColor,
    theme: defaultPwaTheme.theme,
    statusBarStyle: pwaStatusBarStyle
  };
};

/**
 * Copy template files to project directory
 */
async function copyTemplate(
  template: string,
  projectPath: string,
  options: {
    useTailwind: boolean;
    complexity: 'minimal' | 'standard' | 'full';
    useStateManagement?: boolean;
    themeMode?: 'light' | 'dark' | 'system';
    projectStructure?: 'app' | 'minimal' | 'root' | 'src';
  }
): Promise<void> {
  const { useTailwind, complexity, themeMode = 'dark', projectStructure = 'minimal' } = options;
  
  // Get the current file's directory to use as base
  const currentDir = import.meta.dirname || '';
  logger.debug(`Current directory: ${currentDir}`);
  
  // Define possible template paths for the minimal structure
  const minimalPaths = [
    // Development path from source directory
    join(currentDir, '../../../templates', complexity),
    // Global installation path
    join(currentDir, '../templates', complexity),
    // Direct path from execution directory
    join(process.cwd(), 'templates', complexity),
    // Absolute path for global installation
    join(currentDir, '../../templates', complexity),
    // One level deeper for node_modules scenarios
    join(currentDir, '../../../../templates', complexity)
  ];
  
  // Define possible template paths for the legacy structure (templates/complexity/typescript)
  const legacyPaths = minimalPaths.map(path => join(path, 'typescript'));
  
  logger.debug(`Checking template paths:\n${minimalPaths.join('\n')}`);
  
  // Find the first valid template path, preferring minimal structure
  let templatePath = '';
  let isMinimalStructure = false;
  
  // First try the minimal structure
  for (const path of minimalPaths) {
    if (existsSync(path)) {
      templatePath = path;
      isMinimalStructure = true;
      logger.debug(`Using minimal template structure: ${templatePath}`);
      break;
    }
  }
  
  // If minimal structure not found, try legacy structure
  if (!templatePath) {
    for (const path of legacyPaths) {
      if (existsSync(path)) {
        templatePath = path;
        logger.debug(`Using legacy template structure: ${templatePath}`);
        break;
      }
    }
  }
  
  // If no template path exists, throw an error
  if (!templatePath) {
    throw new Error(`Template path does not exist. Tried:\n${minimalPaths.join('\n')}`);
  }
  
  // Copy template files from the detected template directory to project directory
  await copyTemplateFiles(templatePath, projectPath, {
    useTailwind,
    complexity,
    useStateManagement: options.useStateManagement,
    themeMode,
    projectStructure,
    isMinimalStructure
  });
  
  // Create package.json (only if not using minimal structure or package.json doesn't exist)
  const projectPackageJsonPath = join(projectPath, 'package.json');
  if (!isMinimalStructure || !existsSync(projectPackageJsonPath)) {
    await createPackageJson(projectPath, {
      useTailwind,
      useStateManagement: options.useStateManagement,
      minimal: complexity === 'minimal',
      projectStructure
    });
  }
}

/**
 * Optimized recursive copy function for copying directory contents
 * @param src Source directory or file path
 * @param dest Destination directory or file path
 */
async function copyRecursive(src: string, dest: string): Promise<void> {
  try {
    const stats = Bun.file(src).size !== null ? { isDirectory: () => false } : { isDirectory: () => true };
    const isDirectory = stats.isDirectory();
    
    if (isDirectory) {
      // Create destination directory if it doesn't exist
      if (!existsSync(dest)) {
        await mkdir(dest, { recursive: true });
      }
      
      // Read all entries in the source directory
      const entries = readdirSync(src);
      
      // Use Promise.all for concurrent processing
      await Promise.all(
        entries
          .filter(entry => !['node_modules', '.git', 'dist', 'bun.lockb', '.DS_Store'].includes(entry))
          .map(async entry => {
            const srcPath = join(src, entry);
            const destPath = join(dest, entry);
            return copyRecursive(srcPath, destPath);
          })
      );
    } else {
      // Create parent directory if it doesn't exist
      const destDir = dest.split('/').slice(0, -1).join('/');
      if (destDir && !existsSync(destDir)) {
        await mkdir(destDir, { recursive: true });
      }
      
      // Directly copy file using Bun APIs for better performance
      const sourceFile = Bun.file(src);
      await Bun.write(dest, sourceFile);
    }
  } catch (error) {
    logger.error(`Error copying ${src} to ${dest}: ${error}`);
    throw error;
  }
}

/**
 * Copy template files recursively
 */
async function copyTemplateFiles(
  sourcePath: string,
  destPath: string,
  options: {
    useTailwind: boolean;
    complexity: 'minimal' | 'standard' | 'full';
    useStateManagement?: boolean;
    themeMode?: 'light' | 'dark' | 'system';
    projectStructure?: 'root' | 'src' | 'app' | 'minimal';
    isMinimalStructure?: boolean;
  }
): Promise<void> {
  // The sourceType should already include the language folder (typescript/javascript)
  logger.info(`Copying template files from ${sourcePath} to ${destPath}`);
  
  // Create the destination directory if it doesn't exist
  await mkdir(destPath, { recursive: true });
  
  const { projectStructure = 'minimal', isMinimalStructure = false } = options;
  
  try {
    if (projectStructure === 'app') {
      // For app directory structure (Next.js 15 style)
      const appDir = join(destPath, 'app');
      if (!existsSync(appDir)) {
        await mkdir(appDir, { recursive: true });
      }
      
      // Copy files to the app directory structure
      await copyRecursive(sourcePath, appDir);
        
      // Move specific files back to root that shouldn't be in app directory
      const rootFiles = [
        '.gitignore',
        'README.md',
        'package.json',
        'tsconfig.json',
        'postcss.config.js',
        'tailwind.config.js',
        '0x1.config.js',
        '0x1.config.ts'
      ];
      
      for (const file of rootFiles) {
        const appFilePath = join(appDir, file);
        if (existsSync(appFilePath)) {
          const rootFilePath = join(destPath, file);
          await Bun.write(rootFilePath, Bun.file(appFilePath));
          // Remove the file from app directory
          try {
            Bun.spawnSync(['rm', appFilePath], { cwd: destPath });
          } catch (e) {
            // Ignore errors, file may not exist
          }
        }
      }
    } else {
      // For minimal structure, copy files directly to destination
      await copyRecursive(sourcePath, destPath);
    }
  } catch (error) {
    logger.error(`Error copying template: ${error}`);
    throw error;
  }
  
  // Create package.json with appropriate dependencies if it doesn't exist after copying
  try {
    // This ensures we don't overwrite a custom package.json
    if (!existsSync(join(destPath, 'package.json'))) {
      await createPackageJson(destPath, options);
    }
  } catch (error) {
    logger.error(`Error creating package.json: ${error}`);
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
    useStateManagement?: boolean;
    minimal?: boolean;
    projectStructure?: 'root' | 'src' | 'app' | 'minimal';
  }
): Promise<void> {
  const { useTailwind, useStateManagement, minimal, projectStructure } = options;
  const _minimal = minimal;
  
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
      "0x1": '^0.0.56' // Use current version with caret for compatibility
    },
    devDependencies: {
      // TypeScript is always included as 0x1 is TypeScript-only
      typescript: '^5.3.3'
    } as Record<string, string>
  };
  
  // Add Tailwind processing scripts if needed
  if (useTailwind) {
    // Set up CSS processing paths based on project structure
    const stylesDir = projectStructure === 'src' ? 'src/styles' : 'styles';
    const inputCssPath = `${stylesDir}/main.css`;
    const publicStylesDir = 'public/styles';
    const outputCssPath = `${publicStylesDir}/tailwind.css`;
    
    // Add Tailwind dependencies
    Object.assign(packageJson.devDependencies, {
      tailwindcss: '^3.4.1',
      autoprefixer: '^10.4.17',
      postcss: '^8.4.35'
    });
    
    // Type-safe way of adding scripts to package.json without replacing the original object
    // Add build-css script
    (packageJson.scripts as Record<string, string>)['build-css'] = 
      `npx tailwindcss -i ${inputCssPath} -o ${outputCssPath}`;
    
    // Update dev script to run Tailwind in watch mode alongside dev server
    (packageJson.scripts as Record<string, string>)['dev'] = 
      `npx tailwindcss -i ${inputCssPath} -o ${outputCssPath} --watch & 0x1 dev`;
    
    // Ensure required directories exist
    await mkdir(join(projectPath, publicStylesDir), { recursive: true });
    await mkdir(join(projectPath, stylesDir), { recursive: true });
    
    // Create a basic main.css file if it doesn't exist
    const mainCssPath = join(projectPath, inputCssPath);
    if (!existsSync(mainCssPath)) {
      await Bun.write(mainCssPath, `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n/* Custom styles */\n`);
    }
  }
  
  // Write package.json file
  await Bun.write(
    join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

/**
 * Create basic source files
 * Currently unused but kept for future template customization
 */
async function _createBasicSourceFiles(
  projectPath: string,
  options: {
    useTailwind: boolean;
    useStateManagement?: boolean;
    complexity: 'minimal' | 'standard' | 'full';
    projectStructure?: 'app' | 'root' | 'src';
  }
): Promise<void> {
  const { complexity } = options;
  const ext = 'ts'; // TypeScript is now the only option
  const indexPath = 'index.html'; // Define indexPath variable
  
  if (complexity === 'full') {
    // Create index.html at the root level with full template
    await Bun.write(
      join(projectPath, indexPath),
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 Full App</title>
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
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
  
  // Create app.ts at root level - TypeScript is now the only option
  let appTsContent = "";
  
  if (complexity === 'full') {
    appTsContent = `/**
 * 0x1 Application Entry Point
 */

import { createApp } from '0x1';

const app = createApp();

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
`;
  } else {
    appTsContent = `/**
 * 0x1 Application Entry Point
 */

// DOM ready function
function ready(callback: () => void) {
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
});
`;
  }
  
  await Bun.write(join(projectPath, `app.${ext}`), appTsContent);
  
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
  
  // Create public directory if it doesn't exist
  await mkdir(join(projectPath, 'public'), { recursive: true });

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
 * Currently unused but kept for future template customization
 */
async function _createConfigFiles(
  projectPath: string,
  options: {
    name: string;
    template: 'standard' | 'minimal' | 'full' | 'next';
    useTailwind?: boolean;
    complexity?: 'minimal' | 'standard' | 'full';
    eslint?: boolean;
    prettier?: boolean;
    themeMode?: 'light' | 'dark' | 'system';
    projectStructure: 'app';
    pwa?: boolean;
    license?: 'mit' | 'tdl' | 'none';
  }
): Promise<void> {
  const { name, template, useTailwind, complexity, themeMode = 'dark', projectStructure } = options;
  
  logger.debug(`Creating config files for template type: ${template}`);
  
  // TypeScript is now the only option
  const ext = 'ts';
  
  let configFiles = [
    'tsconfig.json', // Always include TypeScript config
    useTailwind && 'tailwind.config.js',
    useTailwind && 'postcss.config.js',
    '.gitignore'
  ].filter(Boolean);

  // Create 0x1.config.ts
  const configContent = `import { _0x1Config } from '0x1';

const config: _0x1Config = {
  app: {
    name: "${name || 'my-0x1-app'}",
    metadata: {
      description: "A modern TypeScript web application",
      themeColor: "#0077cc"
    }
  },
  build: {
    target: "browser",
    minify: true,
    sourcemap: process.env.NODE_ENV === 'development',
    outDir: "dist"
  },
  server: {
    port: 3000,
    host: "localhost"
  },
  styling: {
    tailwind: ${useTailwind},
    darkMode: "${themeMode}"
  }
};

export default config;`;

  // Write the config file using Bun
  await Bun.write(join(projectPath, `0x1.config.${ext}`), configContent);
  
  // Create tailwind.config.js if needed
  if (useTailwind) {
    // Define content patterns based on template complexity and project structure
    // Be specific to avoid accidentally matching node_modules
    let contentPatterns = [];
    
    // if (projectStructure === 'src') {
    //   // Patterns for src directory structure
    //   contentPatterns = [
    //     "./index.html",
    //     "./src/**/*.{html,js,ts,jsx,tsx}",
    //     "./app.{js,ts}"
    //   ];
    // } else if (projectStructure === 'app') {
      // Patterns for Next.js style app directory structure
      contentPatterns = [
        "./index.html",
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./lib/**/*.{js,ts,jsx,tsx}",
        "./app.{js,ts,jsx,tsx}"
      ];
    // } else {
    //   // Patterns for root-level structure
    //   if (complexity === 'minimal') {
    //     contentPatterns = [
    //       "./index.html", 
    //       "./app.{js,ts}", 
    //       "./components/**/*.{js,ts,jsx,tsx}", 
    //       "./pages/**/*.{js,ts,jsx,tsx}", 
    //       "./lib/**/*.{js,ts}"
    //     ];
    //   } else {
    //     contentPatterns = [
    //       "./index.html", 
    //       "./**/*.{html,js,ts,jsx,tsx}",
    //       "!./node_modules/**",
    //       "!./dist/**"
    //     ];
    //   }
    // }
      
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
  
  // Create TypeScript files (always)
  // Set include pattern based on project structure
  let includePattern = ["app/**/*.{ts,tsx}", "**/*.ts", "**/*.tsx"];
  
  // Create tsconfig.json
  await Bun.write(
    join(projectPath, 'tsconfig.json'),
    JSON.stringify({
      "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "node",
        "jsx": "preserve",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
      },
      "include": includePattern,
      "exclude": ["node_modules", "dist"]
    }, null, 2)
  );
  
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
