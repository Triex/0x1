/**
 * 0x1 CLI - New Project Command
 * Creates a new 0x1 project with the specified template
 */

import chalk from 'chalk';
import { existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import prompts from 'prompts';
import { logger } from '../utils/logger.js';
import { addMITLicense, addNoLicense, addTDLLicense } from './license-utils.js';

/**
 * Install project dependencies with Bun as the preferred package manager
 * @param projectPath - Path to the project directory
 */
async function installDependencies(projectPath: string): Promise<void> {
  let spinner = logger.spinner('Installing dependencies');
  const originalDir = process.cwd();
  
  try {
    // Change to project directory
    process.chdir(projectPath);
    
    // Always try Bun first
    try {
      const bunProcess = Bun.spawn(['bun', 'install'], {
        cwd: projectPath,
        stderr: 'pipe',
        stdout: 'pipe'
      });
      
      const bunExit = await bunProcess.exited;
      
      if (bunExit === 0) {
        spinner.stop('success', 'Dependencies installed with Bun ⚡');
        return;
      }
      
      spinner.stop('warn', 'Trying alternative package manager...');
    } catch (e) {
      spinner.stop('warn', 'Bun not detected, trying npm...');
      // Restart spinner for npm installation
      spinner = logger.spinner('Installing with npm');
    }
    
    // Fallback to npm if Bun isn't available or fails
    const npmProcess = Bun.spawn(['npm', 'install'], {
      cwd: projectPath,
      stderr: 'pipe',
      stdout: 'pipe'
    });
    
    const npmExit = await npmProcess.exited;
    
    if (npmExit === 0) {
      spinner.stop('success', 'Dependencies installed with npm');
    } else {
      const stderr = await new Response(npmProcess.stderr).text();
      throw new Error(`Package installation failed: ${stderr}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    spinner.stop('error', 'Failed to install dependencies');
    logger.error(errorMsg);
  } finally {
    // Always return to original directory
    try {
      process.chdir(originalDir);
    } catch (e) {
      // Non-critical error, just log it
      logger.debug(`Could not return to original directory: ${e}`);
    }
  }
}

/**
 * Options for creating a new 0x1 project
 */
interface NewProjectOptions {
  // Project fundamentals
  template?: 'minimal' | 'standard' | 'full'; // Template type/complexity level
  tailwind?: boolean;                       // Include Tailwind CSS  
  stateManagement?: boolean;                // Include state management
  licenseType?: 'tdl' | 'mit' | 'none';     // License type
  overwrite?: boolean;                       // Overwrite existing files
  force?: boolean;                           // Force operation
  
  // UI and styling related
  themeMode?: 'light' | 'dark' | 'system';   // Light/dark mode preference
  
  // PWA related properties
  pwa?: boolean;                             // Include PWA features
  pwaTheme?: string;                         // PWA color theme name
  themeColor?: string;                       // Primary PWA color
  secondaryColor?: string;                   // Secondary PWA color
  statusBarStyle?: 'black-translucent' | 'default' | 'black'; // PWA status bar style
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
  // Set and normalize template type
  const validTemplates = ['minimal', 'standard', 'full'];

  // Handle --minimal flag as a direct shorthand
  if (process.argv.includes('--minimal')) {
    options.template = 'minimal';
  } 
  // Normalize template if provided
  else if (options.template) {
    const templateValue = String(options.template).toLowerCase();
    
    // Extract template type if path format is provided (e.g., 'minimal/custom')
    const templateType = templateValue.includes('/') 
      ? templateValue.split('/')[0]
      : templateValue;
    
    // Validate template type
    options.template = validTemplates.includes(templateType)
      ? templateType as 'minimal' | 'standard' | 'full'
      : 'standard'; // Default to standard if invalid
  }
  // Default to standard template if nothing specified
  else {
    options.template = 'standard';
  }

  // Process CLI flags for consistency before passing to prompts
  // TypeScript is always enabled in current versionmake sure pwa  // Detect if PWA option is manually disabled via CLI flags
  if (options.pwa === false) {
    logger.debug('PWA features explicitly disabled via CLI flags');
  }
  
  // Debug logs for processed options
  logger.debug(`Template: ${options.template}, PWA: ${options.pwa}`);
  
  // Determine whether to use CLI options directly or prompt interactively
  const nonInteractiveMode = !process.stdout.isTTY;
  // Only skip prompts if we're in non-interactive mode OR if --template was explicitly provided as CLI arg
  const templateProvidedAsCLIArg = process.argv.some(arg => arg.startsWith('--template=') || arg === '--template');
  const skipPrompts = nonInteractiveMode || (templateProvidedAsCLIArg && options.template);
  
  // Define default options for consistency
  const defaultOptions = {
    template: options.template || 'standard',
    tailwind: typeof options.tailwind === 'boolean' ? options.tailwind : false,
    stateManagement: typeof options.stateManagement === 'boolean' ? options.stateManagement : false,
    licenseType: options.licenseType || 'mit',
    themeMode: options.themeMode || 'dark',
    pwa: options.pwa === true, // Explicit boolean check
    themeColor: options.themeColor || '#0077cc',
    secondaryColor: options.secondaryColor || '#005fa3',
    pwaTheme: options.pwaTheme || 'classic',
    statusBarStyle: options.statusBarStyle || 'black-translucent'
  };
  
  // Get final project options - either from defaults or interactive prompts
  const projectOptions = skipPrompts
    ? defaultOptions
    : await promptProjectOptions(defaultOptions);

  // Modern app directory structure by default
  const projectStructure = 'app';
  
  logger.debug(`Creating project with template: ${projectOptions.template}`);

  // Extract key options for easier access
  const templateType = projectOptions.template;
  const useTailwind = projectOptions.tailwind;
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
        licenseContent = await Bun.file(licensePath).text();
        logger.info('Found existing LICENSE file. This file will be preserved.');
      }
      
      // Copy template files
      await copyTemplate(
        templateType, 
        projectPath, 
        {
          useTailwind,
          useStateManagement,
          themeMode: projectOptions.themeMode
        }
      );
      
      // Custom template handling is available via the _createBasicSourceFiles function
      // but not currently used in the main flow
      

      
      // Restore README if it existed
      if (hasReadme) {
        await Bun.write(join(projectPath, 'README.md'), readmeContent);
        logger.info('Restored original README.md file.');
      }
      
      spin.stop('success', `Project structure created at ${name}`);
      
      // Stage 3: Set up icons and PWA if requested
      // Generate basic project info for icon generation
      // Use the name parameter directly since it's already available
      const projectName = name || projectPath.split('/').pop() || '';
      
      // Handle license based on user preference
      if (projectOptions.licenseType === 'tdl') {
        await addTDLLicense(projectPath);
      } else if (projectOptions.licenseType === 'mit') {
        await addMITLicense(projectPath, projectName);
      } else if (projectOptions.licenseType === 'none') {
        await addNoLicense(projectPath);
      } else if (hasLicense) {
        // Restore original license
        await Bun.write(join(projectPath, 'LICENSE'), licenseContent);
        logger.info('Restored original LICENSE file.');
      }
      
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
          // Dynamically import PWA setup module
          const { addPWA } = await import('./pwa.js');
          
          // Configure PWA with project settings
          const pwaResult = await addPWA({
            skipPrompts: true,
            name: projectName, 
            shortName,
            themeColor: projectOptions.themeColor,
            backgroundColor: projectOptions.secondaryColor,
            statusBarStyle: projectOptions.statusBarStyle,
            theme: projectOptions.pwaTheme,
            icons: true,
            offline: true
          }, projectPath); // Pass project path as separate argument
          
          pwaSpin.stop(pwaResult ? 'success' : 'warn', 
            `PWA configuration ${pwaResult ? 'completed successfully' : 'completed with warnings'}`);
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
            theme: projectOptions.pwaTheme as string,
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
interface ProjectPromptOptions {
  // Project fundamentals
  template?: 'minimal' | 'standard' | 'full'; // Template type/complexity level
  tailwind?: boolean;                       // Include Tailwind CSS  
  stateManagement?: boolean;                // Include state management
  licenseType?: 'tdl' | 'mit' | 'none';     // License type
  
  // UI and styling related
  themeMode?: 'light' | 'dark' | 'system';   // Light/dark mode preference
  
  // PWA related properties
  pwa?: boolean;                             // Include PWA features
  pwaTheme?: string;                         // PWA color theme name
  themeColor?: string;                       // Primary PWA color
  secondaryColor?: string;                   // Secondary PWA color
  
  // For all other arbitrary options that might be passed
  [key: string]: any;
}

async function promptProjectOptions(defaultOptions: ProjectPromptOptions): Promise<{
  // Project fundamentals
  template: 'standard' | 'minimal' | 'full'; // The selected template type
  tailwind: boolean;
  stateManagement: boolean;
  licenseType: 'tdl' | 'mit' | 'none';
  
  // UI and styling
  themeMode: 'light' | 'dark' | 'system';
  
  // PWA related properties
  pwa: boolean;
  pwaTheme: string; // PWA color theme name
  themeColor: string; // Primary color
  secondaryColor: string; // Secondary color
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

  // Template selection - this is the only template prompt we'll show
  const templateResponse = await promptWithCancel({
    type: "select",
    name: "template",
    message: "Select a template complexity level:",
    choices: [
      { title: "Minimal", value: "minimal", description: "Basic setup with minimal dependencies" },
      { title: "Standard", value: "standard", description: "Common libraries and project structure" },
      { title: "Full", value: "full", description: "Complete setup with all recommended features" },
    ],
    initial: 0 // Default to Minimal
  });

  // Ask about state management using select instead of confirm for consistency
  const stateResponse = await promptWithCancel({
    type: "select",
    name: "stateManagement",
    message: "Would you like to include state management?",
    choices: [
      { title: "Yes", value: true, description: "Include 0x1 state management" },
      { title: "No", value: false, description: "Skip state management" }
    ],
    initial: 0
  });

  // Ask about Tailwind CSS
  const tailwindResponse = await promptWithCancel({
    type: "select",
    name: "tailwind",
    message: "Would you like to include Tailwind CSS?",
    choices: [
      { title: "Yes", value: true, description: "Add Tailwind CSS for styling" },
      { title: "No", value: false, description: "Skip Tailwind CSS" }
    ],
    initial: 0 // Default to Yes
  });

  // Ask about license type
  const licenseResponse = await promptWithCancel({
    type: "select",
    name: "licenseType",
    message: "Select a license type:",
    choices: [
      { title: "MIT License", value: "mit", description: "Standard MIT open source license" },
      { title: "TDL License", value: "tdl", description: "0x1 Default License" },
      { title: "No License", value: "none", description: "Skip license creation" }
    ],
    initial: 1
  });

  // UI design style selection
  const uiDesignResponse = await promptWithCancel({
    type: 'select',
    name: 'uiDesign',
    message: '🎨 Choose a UI design style:',
    choices: [
      { title: 'Classic', value: 'classic', description: 'Traditional modern UI design' },
      { title: 'Minimalist', value: 'minimalist', description: 'Clean, distraction-free design' },
      { title: 'Bold', value: 'bold', description: 'High-contrast, striking visuals' }
    ],
    initial: 0
  });

  logger.spacer();

  // PWA color theme selection
  const pwaThemeResponse = await promptWithCancel({
    type: 'select',
    name: 'pwaTheme',
    message: '🎨 Choose a PWA color theme:',
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
  
  const pwaResponse = templateResponse.template !== 'minimal' ? await promptWithCancel({
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
  
  // Get colors based on selected PWA theme
  const pwaThemeKey = pwaThemeResponse.pwaTheme as string;
  const selectedThemeColors = themeColorMap[pwaThemeKey] || themeColorMap['classic'];
  
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

  // No need for intermediary variables - use prompt responses directly
  
  // Return the complete options object with properly typed template
  return {
    template: templateResponse.template,
    stateManagement: stateResponse.stateManagement,
    tailwind: tailwindResponse.tailwind, // Use the response from the Tailwind prompt
    licenseType: defaultOptions.licenseType || 'mit', // Default to MIT if undefined
    
    // UI and styling
    themeMode: themeModeResponse.themeMode,
    
    // PWA properties
    pwa: pwaResponse.pwa,
    pwaTheme: pwaThemeResponse.pwaTheme, // PWA color theme
    themeColor: pwaThemeColor,
    secondaryColor: pwaSecondaryColor,
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
    useStateManagement?: boolean;
    themeMode?: 'light' | 'dark' | 'system';
  }
): Promise<void> {
  try {
    // Extract and normalize options
    const { useTailwind, useStateManagement = false, themeMode = 'dark' } = options;
    const templateType = template as 'minimal' | 'standard' | 'full';
    
    // Get the current file's directory
    const currentDir = import.meta.dirname || '';
    
    // Use prioritized template path search strategy
    const templatePaths = [
      join(currentDir, '../../../templates', templateType), // Dev environment path
      join(currentDir, '../templates', templateType),       // Local install path
      join(process.cwd(), 'templates', templateType),       // Current directory path
      join(currentDir, '../../templates', templateType),    // Global install path
    ];
    
    // Create project directory if needed
    if (!existsSync(projectPath)) {
      await mkdir(projectPath, { recursive: true });
    }
    
    // Find first valid template path
    const sourcePath = templatePaths.find(path => existsSync(path));
    if (!sourcePath) {
      throw new Error(`Template '${templateType}' not found. Tried: ${templatePaths.length} locations.`);
    }

    // Copy template files from source to project directory
    logger.debug(`Copying template from ${sourcePath} to ${projectPath}`);
    await copyTemplateFiles(sourcePath, projectPath, {
      useTailwind,
      complexity: templateType,
      useStateManagement,
      themeMode,
      isMinimalStructure: templateType === 'minimal',
      projectStructure: 'app'
    });
    
    // Update package.json from the template instead of creating a new one
    const packageJsonPath = join(projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      logger.debug(`Updating package.json at ${packageJsonPath}`);
      
      try {
        // Read the template-copied package.json
        const packageJsonContent = await Bun.file(packageJsonPath).text();
        const packageJson = JSON.parse(packageJsonContent);
        
        // Update the project name from the project path
        const projectName = projectPath.split('/').pop() || '';
        packageJson.name = projectName.toLowerCase().replace(/\s+/g, '-');
        
        // Determine if we should use local framework path (for development)
        // Only use local framework path if explicitly set by environment variable
        const useLocalFramework = process.env.OX1_DEV === 'true';
        
        // Update 0x1 dependency if needed (for local development)
        if (useLocalFramework) {
          logger.debug('Using local 0x1 framework path for development');
          packageJson.dependencies['0x1'] = 'file:../';
          
          // Update scripts to use local path
          if (packageJson.scripts) {
            Object.keys(packageJson.scripts).forEach(scriptName => {
              if (typeof packageJson.scripts[scriptName] === 'string') {
                packageJson.scripts[scriptName] = packageJson.scripts[scriptName]
                  .replace(/\b0x1\b/g, '../bin/0x1');
              }
            });
          }
        }
        
        // Remove Tailwind-related dependencies if not using Tailwind
        if (!useTailwind) {
          if (packageJson.devDependencies) {
            ['tailwindcss', '@tailwindcss/postcss', 'autoprefixer', 'postcss'].forEach(dep => {
              delete packageJson.devDependencies[dep];
            });
          }
          
          // Remove Tailwind-related scripts
          if (packageJson.scripts) {
            ['build-css', 'watch-css'].forEach(script => {
              delete packageJson.scripts[script];
            });
            
            // Update dev script to not run Tailwind
            if (packageJson.scripts.dev && packageJson.scripts.dev.includes('tailwindcss')) {
              packageJson.scripts.dev = '0x1 dev';
              if (useLocalFramework) {
                packageJson.scripts.dev = '../bin/0x1 dev';
              }
            }
          }
        }
        
        // Write the updated package.json
        await Bun.write(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
        logger.success('Updated package.json with project-specific settings');
      } catch (err) {
        logger.error(`Error updating package.json: ${err instanceof Error ? err.message : String(err)}`);
        // Continue with the process even if package.json update fails
      }
    } else {
      logger.warn('No package.json found in template. This is unusual and might cause issues.');
    }

    logger.success(`Template files copied successfully to ${projectPath}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to copy template: ${errorMessage}`);
    throw error;
  }
}

/**
 * Enhanced recursive file copy utilizing Bun's optimized file operations
 * @param src Source directory or file path
 * @param dest Destination directory or file path
 */
async function copyRecursive(src: string, dest: string): Promise<void> {
  try {
    // Quickly check if source exists
    if (!existsSync(src)) {
      throw new Error(`Source path ${src} doesn't exist`);
    }

    const stats = statSync(src);
    
    if (stats.isDirectory()) {
      // Create destination directory if needed
      if (!existsSync(dest)) {
        await mkdir(dest, { recursive: true });
      }
      
      // Get directory contents
      const entries = readdirSync(src);
      
      // Filter out system files and process each entry
      const validEntries = entries.filter(entry => ![
        'node_modules', '.git', 'dist', '.cache',
        'bun.lockb', '.DS_Store', '.next'
      ].includes(entry));
      
      // Process each entry
      for (const entry of validEntries) {
        const srcPath = join(src, entry);
        const destPath = join(dest, entry);
        await copyRecursive(srcPath, destPath);
      }
    } else {
      // Ensure parent directory exists
      const destDir = dirname(dest);
      if (!existsSync(destDir)) {
        await mkdir(destDir, { recursive: true });
      }
      
      // Use Bun's optimized file operations
      const fileContent = await Bun.file(src).arrayBuffer();
      await Bun.write(dest, fileContent);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Copy failed: ${src} → ${dest}: ${message}`);
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
    themeMode?: string;
    projectStructure?: 'app' | 'minimal' | 'root' | 'src'; 
    isMinimalStructure?: boolean;
  }
): Promise<void> {
  // Ensure options are properly set with defaults
  const { 
    projectStructure = 'app', 
    isMinimalStructure = false, 
    useStateManagement = false,
    themeMode = 'dark'
  } = options;
  
  logger.info(`💠 Copying template files from ${sourcePath} to ${destPath}`);
  
  try {
    // Make sure destination directory exists
    if (!existsSync(destPath)) {
      await mkdir(destPath, { recursive: true });
    }
    
    // Ensure we follow Next.js app directory structure conventions
    // For modern templates, we use app/page.tsx, app/layout.tsx, app/globals.css
    // and don't require index.html or index.tsx at the root
    
    // Use Bun's spawn to use native cp command for reliable directory copying
    logger.debug(`Using native system command for directory copying`);
    
    try {
      // First, create a list of all files and folders that need to be copied
      // but explicitly exclude node_modules and other unwanted directories
      const entries = readdirSync(sourcePath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip node_modules, dist, .git and other unwanted directories
        if (['node_modules', 'dist', '.git', '.cache'].includes(entry.name)) {
          continue;
        }
        
        const srcPath = join(sourcePath, entry.name);
        const destEntryPath = join(destPath, entry.name);
        
        // Use cp command for each entry instead of copying everything at once
        logger.debug(`Copying ${srcPath} to ${destEntryPath}`);
        const result = await Bun.spawn(['cp', '-r', srcPath, destEntryPath], {
          stdout: 'inherit',
          stderr: 'pipe'
        });
        
        const error = await new Response(result.stderr).text();
        if (result.exitCode !== 0 && error.trim().length > 0) {
          throw new Error(`Error copying ${srcPath} to ${destEntryPath}: ${error}`);
        }
      }
      
      logger.debug('Successfully copied template files');
      
      // Post-processing: Handle ThemeToggle component and theme mode
      await handleThemeOptions(destPath, { useStateManagement, themeMode });
      
    } catch (error) {
      logger.error(`Error copying template: ${error}`);
      throw error;
    }
  } catch (error) {
    logger.error(`Error copying template files: ${error}`);
    throw new Error(`Error copying template: ${error}`);
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
 * Handle theme-related post-processing for template
 * - Selects appropriate ThemeToggle component based on state management
 * - Sets initial theme mode in both components and config
 */
async function handleThemeOptions(
  projectPath: string, 
  options: {
    useStateManagement?: boolean;
    themeMode?: string;
  }
): Promise<void> {
  const { useStateManagement = false, themeMode = 'dark' } = options;
  
  try {
    // Components directory path
    const componentsDir = join(projectPath, 'components');
    
    // Check if we have special ThemeToggle variants available
    const themeToggleNoStatePath = join(componentsDir, 'ThemeToggle_nostate.tsx');
    const themeToggleStatePath = join(componentsDir, 'ThemeToggle_state.tsx');
    const themeTogglePath = join(componentsDir, 'ThemeToggle.tsx');
    
    // If we have variant components, use the appropriate one
    if (existsSync(themeToggleNoStatePath) && existsSync(themeToggleStatePath)) {
      logger.debug(`Found ThemeToggle variants. Using ${useStateManagement ? 'state' : 'nostate'} version`);
      
      const sourceFile = useStateManagement ? themeToggleStatePath : themeToggleNoStatePath;
      
      // Read the source file content
      const themeToggleContent = await Bun.file(sourceFile).text();
      
      // Write the content to the main ThemeToggle file
      await Bun.write(themeTogglePath, themeToggleContent);
      
      // Remove the variant files
      try {
        unlinkSync(themeToggleNoStatePath);
        unlinkSync(themeToggleStatePath);
        logger.debug('Removed ThemeToggle variant files');
      } catch (e) {
        logger.warn(`Could not remove ThemeToggle variant files: ${e}`);
      }
    } else {
      logger.debug('No ThemeToggle variants found, using default');
    }
    
    // Update the theme mode in the HTML file if needed
    if (themeMode !== 'dark') {
      // In a modern app structure, we update the theme init script in layout.tsx
      const layoutPath = join(projectPath, 'app', 'layout.tsx');
      
      if (existsSync(layoutPath)) {
        let layoutContent = await Bun.file(layoutPath).text();
        
        // Replace dark theme mode with user preference in initialization script
        if (themeMode === 'light') {
          // In light mode, we remove dark class by default
          layoutContent = layoutContent.replace(
            "document.documentElement.classList.add('dark');",
            "document.documentElement.classList.remove('dark');"
          );
        } else if (themeMode === 'system') {
          // In system mode, we keep the system preference detection but remove explicit adds
          layoutContent = layoutContent.replace(
            "document.documentElement.classList.add('dark');",
            "// Using system preference for initial theme"
          );
        }
        
        await Bun.write(layoutPath, layoutContent);
        logger.debug(`Updated layout.tsx with ${themeMode} theme mode`);
      }
    }
    
  } catch (error) {
    logger.warn(`Error handling theme options: ${error}`);
    // Non-critical error, continue with the process
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
  
  // Modern package.json structure
  const packageJson = {
    name: projectPath.split('/').pop(),
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: '0x1 dev',
      build: '0x1 build',
      start: '0x1 start',
      preview: '0x1 preview'
    },
    dependencies: {
      "0x1": '^0.0.175' // Use current version with caret for compatibility
    },
    devDependencies: {
      typescript: '^5.4.5'
    } as Record<string, string>,
    // Use Bun as the preferred package manager
    packageManager: 'bun@1.2.13'
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
 * @private
 * Create basic source files for template customization
 * @internal This function is not currently used in the main flow
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
  const ext = 'ts';
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
  
  // Create app.ts at root level
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
 * @private
 * Create configuration files for template customization
 * @internal This function is not currently used in the main flow
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
  
  // Create TypeScript configuration
  const ext = 'ts';
  // List of config files to create
  const configFiles = [
    'tsconfig.json', // Always include TypeScript config
    useTailwind ? 'tailwind.config.js' : null,
    useTailwind ? 'postcss.config.js' : null,
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
      // Patterns for modern app directory structure
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
  const includePattern = ["app/**/*.{ts,tsx}", "**/*.ts", "**/*.tsx"];
  
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
