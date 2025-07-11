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
  template?: 'minimal' | 'standard' | 'full' | 'crypto-dash'; // Template type/complexity level
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
  const validTemplates = ['minimal', 'standard', 'full', 'crypto-dash'];

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
      ? templateType as 'minimal' | 'standard' | 'full' | 'crypto-dash'
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
      
      // Copy template files - HTML is now generated dynamically by build system
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
  template?: 'minimal' | 'standard' | 'full' | 'crypto-dash'; // Template type/complexity level
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
  template: 'standard' | 'minimal' | 'full' | 'crypto-dash'; // The selected template type
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
      { title: "Minimal", value: "minimal", description: "Basic setup with minimal dependencies (bundled)" },
      { title: "Standard", value: "standard", description: "Common libraries and project structure (bundled)" },
      { title: "Full", value: "full", description: "Complete setup with all features (requires 0x1-templates)" },
      { title: "Crypto Dashboard", value: "crypto-dash", description: "Crypto wallet and DeFi features (requires 0x1-templates)" },
    ],
    initial: 1 // Default to Standard (recommended)
  });

  // Check if user selected a heavy template that requires downloading from GitHub
  const heavyTemplates = ['full', 'crypto-dash'];
  let selectedTemplate = templateResponse.template;
  
  if (heavyTemplates.includes(selectedTemplate)) {
    // Check if templates are available locally (for development) FIXME: remove?
    const currentDir = import.meta.dirname || '';
    const localTemplatePaths = [
      join(currentDir, '../../../0x1-templates', selectedTemplate),
      join(process.cwd(), '0x1-templates', selectedTemplate),
    ];
    
    const hasLocalTemplate = localTemplatePaths.some(path => existsSync(path));
    
    if (!hasLocalTemplate) {
      logger.info(`📦 Template '${selectedTemplate}' will be downloaded from GitHub.`);
      
      const downloadChoice = await promptWithCancel({
        type: 'select',
        name: 'downloadTemplate',
        message: '📥 Download template from GitHub?',
        choices: [
          { title: 'Yes, download template', value: 'download', description: 'Download from GitHub (recommended)' },
          { title: 'Switch to Standard template', value: 'standard', description: 'Use bundled template instead' },
          { title: 'Cancel', value: 'cancel', description: 'Cancel project creation' }
        ],
        initial: 0
      });
      
      if (downloadChoice.downloadTemplate === 'cancel') {
        logger.info('Project creation canceled.');
        process.exit(0);
      } else if (downloadChoice.downloadTemplate === 'standard') {
        logger.info('Switching to Standard template...');
        selectedTemplate = 'standard';
      }
      // If 'download' is selected, we'll handle it in copyTemplate function
    }
  }

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
  
  const pwaResponse = selectedTemplate !== 'minimal' ? await promptWithCancel({
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
    template: selectedTemplate,
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
}

/**
 * Download template from GitHub
 */
async function downloadTemplate(templateType: string, tempDir: string): Promise<string> {
  const githubUrl = 'https://github.com/Triex/0x1';
  const templatePath = `0x1-templates/${templateType}`;
  
  logger.info(`📦 Downloading ${templateType} template from GitHub...`);
  
  try {
    // Download the template directory from GitHub
    // Using GitHub's archive API to download specific directory
    const archiveUrl = `${githubUrl}/archive/refs/heads/main.tar.gz`;
    
    const response = await fetch(archiveUrl);
    if (!response.ok) {
      throw new Error(`Failed to download template: ${response.statusText}`);
    }
    
    // Create temp directory for extraction
    const extractDir = join(tempDir, 'extracted');
    await mkdir(extractDir, { recursive: true });
    
    // Download and extract using Bun's built-in tar support
    const archiveBuffer = await response.arrayBuffer();
    const archivePath = join(tempDir, 'template.tar.gz');
    await Bun.write(archivePath, archiveBuffer);
    
    // Extract the archive - don't use strip-components as it can cause structure issues
    // Instead, we'll handle path resolution after extraction
    const extractProcess = Bun.spawn(['tar', '-xzf', archivePath], {
      cwd: extractDir,
      stdout: 'pipe',
      stderr: 'pipe'
    });
    
    const exitCode = await extractProcess.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(extractProcess.stderr).text();
      throw new Error(`Extraction failed: ${stderr}`);
    }
    
    // List extracted contents to understand the structure
    let rootDir;
    try {
      const extractedItems = readdirSync(extractDir);
      if (extractedItems.length === 1 && statSync(join(extractDir, extractedItems[0])).isDirectory()) {
        // Single directory found (likely "0x1-main" or similar)
        rootDir = join(extractDir, extractedItems[0]);
        logger.debug(`Detected root directory: ${rootDir}`);
      } else {
        rootDir = extractDir;
      }
    } catch (e) {
      rootDir = extractDir;
      logger.debug(`Could not detect root directory: ${e}`);
    }
    
    // Search for template with reasonable alternatives
    // Primary expected location
    let templateDir = join(rootDir, templatePath);
    
    // Check if template exists in expected location
    if (!existsSync(templateDir)) {
      // Try alternative path structures that might exist after extraction
      const alternativePaths = [
        // Common repository structures
        join(rootDir, `0x1-templates/${templateType}`),
        join(rootDir, `templates/${templateType}`),
        join(rootDir, `${templateType}`), // Direct template folder
        
        // In case of nested repository structures
        join(rootDir, `0x1-templates-main/${templateType}`),
        join(rootDir, `0x1-templates-master/${templateType}`),
        
        // Try recursive search within extracted contents
        ...findTemplateDirRecursively(rootDir, templateType)
      ];
      
      logger.debug(`Searching for template in alternative paths...`);
      let foundPath = null;
      for (const altPath of alternativePaths) {
        if (existsSync(altPath)) {
          foundPath = altPath;
          logger.debug(`✓ Template found at: ${altPath}`);
          break;
        }
      }
      
      if (!foundPath) {
        // List contents to debug what was actually extracted
        logger.debug('Extracted contents structure:');
        try {
          // Use recursive directory listing to better understand structure
          const listDirRecursive = (dir: string, depth = 0, maxDepth = 3) => {
            if (depth > maxDepth) return;
            try {
              const contents = readdirSync(dir, { withFileTypes: true });
              contents.forEach(item => {
                const indent = '  '.repeat(depth);
                logger.debug(`${indent}${item.name}${item.isDirectory() ? '/' : ''}`);
                if (item.isDirectory()) {
                  listDirRecursive(join(dir, item.name), depth + 1, maxDepth);
                }
              });
            } catch (e) {
              // Skip inaccessible directories
            }
          };
          listDirRecursive(rootDir);
        } catch (e) {
          logger.debug(`Could not list extracted contents: ${e}`);
        }
        
        throw new Error(`Template ${templateType} not found in downloaded archive. Expected at: ${templateDir}`);
      }
      
      return foundPath;
    }
    
    return templateDir;
  } catch (error) {
    logger.error(`Failed to download template: ${error}`);
    throw error;
  }
}

/**
 * Recursively search for template directory within extracted contents
 * This handles cases where the template might be nested in unexpected locations
 */
function findTemplateDirRecursively(rootDir: string, templateType: string, maxDepth = 4): string[] {
  const results: string[] = [];
  
  const search = (dir: string, depth = 0) => {
    if (depth > maxDepth) return;
    
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = join(dir, entry.name);
        
        // Check if this is our template directory
        if (entry.isDirectory() && entry.name === templateType) {
          // Additional validation - should contain common template files
          const templateFiles = readdirSync(entryPath);
          if (templateFiles.some(file => ['package.json', 'index.html', 'app'].includes(file))) {
            results.push(entryPath);
          }
        }
        
        // Check if this might be a templates container directory
        if (entry.isDirectory() && 
            ['templates', '0x1-templates', 'template', 'templates-cli'].includes(entry.name)) {
          try {
            const templatePath = join(entryPath, templateType);
            if (existsSync(templatePath) && statSync(templatePath).isDirectory()) {
              results.push(templatePath);
            }
          } catch (e) {
            // Skip error
          }
        }
        
        // Continue recursion
        if (entry.isDirectory()) {
          search(entryPath, depth + 1);
        }
      }
    } catch (e) {
      // Skip inaccessible directories
    }
  };
  
  search(rootDir);
  return results;
}

/**
 * Copy template files to project directory
 * Production-ready approach: Download from GitHub or use local templates
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
    const templateType = template as 'minimal' | 'standard' | 'full' | 'crypto-dash';
    
    // Create project directory if needed
    if (!existsSync(projectPath)) {
      await mkdir(projectPath, { recursive: true });
    }
    
    logger.debug(`Resolving template ${templateType}...`);
    
    const currentDir = import.meta.dirname || '';
    let sourcePath: string | undefined;
    
    // For minimal/standard templates, try bundled CLI templates first
    if (templateType === 'minimal' || templateType === 'standard') {
      const bundledTemplatePaths = [
        join(currentDir, '../../../templates-cli', templateType),
        join(currentDir, '../../templates', templateType),
        join(currentDir, '../templates', templateType),
      ];
      
      sourcePath = bundledTemplatePaths.find(path => existsSync(path));
    }
    
    // For full/crypto-dash templates, or if bundled not found, try local development paths
    if (!sourcePath) {
      const localTemplatePaths = [
        join(currentDir, '../../../0x1-templates', templateType), // Dev environment
        join(process.cwd(), '0x1-templates', templateType),       // Current directory (for repo development)
      ];
      
      sourcePath = localTemplatePaths.find(path => existsSync(path));
    }
    
    // If no local template found, download from GitHub
    if (!sourcePath) {
      if (templateType === 'full' || templateType === 'crypto-dash') {
        logger.info('📦 Downloading template from GitHub...');
        
        // Create temp directory for download
        const tempDir = join(projectPath, '.temp-template');
        await mkdir(tempDir, { recursive: true });
        
        try {
          sourcePath = await downloadTemplate(templateType, tempDir);

          // Copy template files from downloaded source
          await copyTemplateFiles(sourcePath, projectPath, {
            useTailwind,
            complexity: templateType,
            useStateManagement,
            themeMode,
            isMinimalStructure: false,
            projectStructure: 'app'
          });
          
          // Clean up temp directory
          await Bun.spawn(['rm', '-rf', tempDir], { stdout: 'inherit' }).exited;
          
          logger.success('✅ Template downloaded and copied successfully');
          
        } catch (error) {
          // Clean up temp directory on error
          if (existsSync(tempDir)) {
            await Bun.spawn(['rm', '-rf', tempDir], { stdout: 'inherit' }).exited;
          }
          
          // ENHANCED FALLBACK: Use enhanced standard template if download fails
          logger.warn(`Failed to download ${templateType} template: ${error}`);
          logger.info(`⚡ Falling back to enhanced 'standard' template with additional features...`);
          
          try {
            // Try to find the standard template as fallback
            const standardTemplatePaths = [
              join(currentDir, '../../../templates-cli', 'standard'),
              join(currentDir, '../../templates', 'standard'),
              join(currentDir, '../templates', 'standard'),
              join(currentDir, '../../../0x1-templates', 'standard'),
              join(process.cwd(), '0x1-templates', 'standard'),
            ];
            
            const standardSourcePath = standardTemplatePaths.find(path => existsSync(path));
            
            if (standardSourcePath) {
              // Copy standard template with enhanced features
              await copyTemplateFiles(standardSourcePath, projectPath, {
                useTailwind: true, // Force Tailwind for enhanced template
                complexity: 'standard',
                useStateManagement: true, // Force state management for enhanced template
                themeMode,
                isMinimalStructure: false,
                projectStructure: 'app'
              });
              
              logger.success(`✅ Enhanced standard template applied successfully as fallback for ${templateType}`);
              logger.info(`💡 Tip: You can manually add ${templateType}-specific features later`);
              
              // Update package.json to indicate this was a fallback
              await updatePackageJson(projectPath, 'standard', { 
                useTailwind: true, 
                useStateManagement: true 
              });
              
              return; // Early return since we've handled everything
            } else {
              throw new Error('No fallback template found either');
            }
          } catch (fallbackError) {
            logger.error(`Fallback to standard template also failed: ${fallbackError}`);
            throw new Error(`Failed to set up ${templateType} template and fallback failed: ${error}`);
          }
        }
        
        // Early return since we've already copied the files
        await updatePackageJson(projectPath, templateType, { useTailwind, useStateManagement });
        return;
      } else {
        throw new Error(`Template '${templateType}' not found. Bundled templates may be missing from CLI installation.`);
      }
    }

    // Copy template files from local source
    logger.info(`📦 Using template from ${sourcePath.includes('0x1-templates') ? 'local development' : 'CLI bundle'}`);
    await copyTemplateFiles(sourcePath, projectPath, {
      useTailwind,
      complexity: templateType,
      useStateManagement,
      themeMode,
      isMinimalStructure: templateType === 'minimal',
      projectStructure: 'app'
    });
    
    // Update package.json from the template
    await updatePackageJson(projectPath, templateType, { useTailwind, useStateManagement });
    
    logger.success(`Template files copied successfully to ${projectPath}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to copy template: ${errorMessage}`);
    throw error;
  }
}

/**
 * Update package.json with project-specific settings
 */
async function updatePackageJson(
  projectPath: string, 
  templateType: string,
  options: { useTailwind: boolean; useStateManagement?: boolean }
): Promise<void> {
  const { useTailwind, useStateManagement } = options;
  
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
      await Bun.write(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        logger.success('Updated package.json with project-specific settings');
      } catch (err) {
        logger.error(`Error updating package.json: ${err instanceof Error ? err.message : String(err)}`);
        // Continue with the process even if package.json update fails
      }
    } else {
      logger.warn('No package.json found in template. This is unusual and might cause issues.');
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
    complexity: 'minimal' | 'standard' | 'full' | 'crypto-dash';
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
      "0x1": '^0.0.379' // Use current version with caret for compatibility
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
    template: 'standard' | 'minimal' | 'full' | 'crypto-dash';
    useTailwind?: boolean;
    complexity?: 'minimal' | 'standard' | 'full' | 'crypto-dash';
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
  
  // Create .bunfig.toml for better deployment compatibility
  await Bun.write(
    join(projectPath, '.bunfig.toml'),
    `[install]
# Allow postinstall scripts to run (fixes deployment warnings)
auto = "fallback"

[bunfig]
# Optimize for production builds
production = true

# Better compatibility with deployment platforms like Vercel
[install.scopes]
# Handle packages that might need postinstall scripts
"@tailwindcss/*" = { auto = "force" }
"sharp" = { auto = "force" }
`
  );
  
  // Create vercel.json for proper deployment routing
  await Bun.write(
    join(projectPath, 'vercel.json'),
    `{
  "buildCommand": "0x1 build",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/styles.css",
      "dest": "/styles.css"
    },
    {
      "src": "/app.js",
      "dest": "/app.js"
    },
    {
      "src": "/public/(.*)",
      "dest": "/public/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
`
  );
}

// Generate metadata configuration
async function createMetadataConfig(projectPath: string, config: {
  name: string;
  description: string;
  themeColor: string;
  pwa: boolean;
  pwaConfig: any;
}): Promise<void> {
  const metadataContent = `/**
 * Global Metadata Configuration
 * This file defines the default metadata for your application
 */

export const metadata = {
  title: {
    template: '%s | ${config.name}',
    default: '${config.name}'
  },
  description: '${config.description}',
  keywords: ['0x1', 'framework', 'typescript', 'web app'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  publisher: '${config.name}',
  
  // SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Social Media
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yoursite.com',
    title: '${config.name}',
    description: '${config.description}',
    siteName: '${config.name}',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: '${config.name}',
    description: '${config.description}',
  },
  
  // PWA & Mobile
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '${config.themeColor}',
  ${config.pwa ? `manifest: '/manifest.json',` : ''}
  
  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  
  // Verification (add your verification codes)
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  
  // Analytics (uncomment and configure as needed)
  // analytics: {
  //   googleAnalytics: 'GA_MEASUREMENT_ID',
  // },
};

/**
 * Create page-specific metadata
 * Use this helper to create metadata for individual pages
 */
export function createPageMetadata(overrides: any = {}) {
  return {
    ...metadata,
    ...overrides,
  };
}
`;

  await Bun.write(join(projectPath, 'app', 'metadata.ts'), metadataContent);
}

// Generate PWA files if requested
async function generatePWAFiles(projectPath: string, pwaConfig: any): Promise<void> {
  // Implementation of generatePWAFiles function
}
