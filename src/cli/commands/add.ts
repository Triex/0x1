/**
 * 0x1 Framework - Add Component Command
 * Add pre-built components to your 0x1 project
 */

import fs, { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { logger } from '../utils/logger';

// Default paths and configuration
const DEFAULT_TARGET_DIR = 'src/components';
const COMPONENT_CATEGORIES = ['ui', 'layout', 'data', 'feedback', 'form'];
const COMPONENTS_PACKAGE = '@0x1js/components';

// Path resolvers for components
function getBundledComponentsPath(): string {
  return join(__dirname, '../../../0x1-components');
}

function getNodeModulesComponentsPath(projectRoot: string): string {
  return join(projectRoot, 'node_modules', COMPONENTS_PACKAGE);
}

/**
 * Structure of a component in the library
 */
interface ComponentInfo {
  name: string;
  path: string;
  category?: string;
  files?: string[];
}

/**
 * Options for the add command
 */
export interface AddOptions {
  target?: string;
  withDemo?: boolean;
  withDocs?: boolean;
  force?: boolean;
  verbose?: boolean;
  noCss?: boolean;
}

/**
 * Check if the current directory is a valid 0x1 project
 * @param projectRoot Path to the project root
 * @returns Whether the directory is a valid 0x1 project
 */
async function isValidProject(projectRoot: string): Promise<boolean> {
  const packageJsonPath = join(projectRoot, 'package.json');
  const zeroConfigPath = join(projectRoot, '0x1.config.js');
  const zeroConfigTsPath = join(projectRoot, '0x1.config.ts');
  
  if (!existsSync(packageJsonPath)) {
    logger.error('Not a valid project: package.json not found');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const hasZeroConfig = existsSync(zeroConfigPath) || existsSync(zeroConfigTsPath);
    
    if (packageJson.dependencies?.['0x1'] || packageJson.devDependencies?.['0x1'] || hasZeroConfig) {
      return true;
    } else {
      logger.error('Not a 0x1 project: 0x1 dependency or config not found');
      return false;
    }
  } catch (error) {
    logger.error(`Failed to validate project: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Check if @0x1js/components package is installed in the project
 * @param projectRoot Path to the project root
 * @returns Whether the package is installed
 */
async function isComponentsPackageInstalled(projectRoot: string): Promise<boolean> {
  const packagePath = getNodeModulesComponentsPath(projectRoot);
  return existsSync(packagePath);
}

/**
 * Find a component in the component library
 * @param componentName Name of the component to find
 * @param projectRoot Path to the project root
 * @returns Information about the found component, or null if not found
 */
async function findComponent(componentName: string, projectRoot: string): Promise<ComponentInfo | null> {
  // Normalize component name (PascalCase)
  const normalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
  
  // First check in node_modules if the package is installed
  if (await isComponentsPackageInstalled(projectRoot)) {
    const packagePath = getNodeModulesComponentsPath(projectRoot);
    
    // Search in all categories within the installed package
    for (const category of COMPONENT_CATEGORIES) {
      const componentPath = join(packagePath, category, normalizedName);
      
      if (existsSync(componentPath)) {
        return {
          name: normalizedName,
          path: componentPath,
          category,
          files: existsSync(componentPath) ? 
            fs.readdirSync(componentPath) : []
        };
      }
    }
    
    // Check if it's directly in the components package root
    const directPath = join(packagePath, normalizedName);
    if (existsSync(directPath)) {
      return {
        name: normalizedName,
        path: directPath,
        files: existsSync(directPath) ? 
          fs.readdirSync(directPath) : []
      };
    }
  }
  
  // Fall back to bundled components if available
  const bundledPath = getBundledComponentsPath();
  
  // Only check bundled if it exists
  if (existsSync(bundledPath)) {
    // Search in all categories
    for (const category of COMPONENT_CATEGORIES) {
      const componentPath = join(bundledPath, category, normalizedName);
      
      if (existsSync(componentPath)) {
        return {
          name: normalizedName,
          path: componentPath,
          category,
          files: existsSync(componentPath) ? 
            fs.readdirSync(componentPath) : []
        };
      }
    }
    
    // If not found in categories, check if it's directly in the components dir
    const directPath = join(bundledPath, normalizedName);
    if (existsSync(directPath)) {
      return {
        name: normalizedName,
        path: directPath,
        files: existsSync(directPath) ? 
          fs.readdirSync(directPath) : []
      };
    }
  }
  
  return null;
}

/**
 * Process imports in component files to adjust paths
 * @param content File content
 * @param componentName Component name
 * @returns Processed content
 */
function processImports(content: string, componentName: string): string {
  // Simple import processing - can be expanded based on the project structure
  // Replace relative imports to other components with proper paths
  return content.replace(
    /from\s+["']\.\.?\/([A-Z][^"']*)["']|from\s+["']\.\.?\/components\/([A-Z][^"']*)["']|from\s+["']components\/([A-Z][^"']*)["']|from\s+["']\.\.?\/([A-Z][^"']*)\/([^"']*)["']|from\s+["']\.\.?\/\.\.?\/([A-Z][^"']*)\/([^"']*)["']|import\s+["']\.\.?\/([A-Z][^"']*)\/([^"']*)["']/g, 
    (match, p1, p2, p3, p4, p5, p6, p7, p8, p9) => {
      const importedComponent = p1 || p2 || p3 || p4 || p6 || p8;
      const subPath = p5 || p7 || p9;
      
      if (!importedComponent) {
        return match;
      }
      
      if (subPath) {
        return `from "../${importedComponent}/${subPath}"`;
      }
      
      return `from "../${importedComponent}"`;
    }
  );
}

/**
 * Copy a component from the library to the project
 * @param component Component information
 * @param targetDir Target directory in the project
 * @param options Copy options
 * @returns Whether the component was successfully copied
 */
async function copyComponent(
  component: ComponentInfo,
  targetDir: string,
  options: {
    projectRoot: string;
    withDemo?: boolean;
    withDocs?: boolean;
    force?: boolean;
    verbose?: boolean;
    noCss?: boolean;
  }
): Promise<boolean> {
  const { projectRoot, withDemo, withDocs, force, verbose, noCss } = options;
  
  // Create component directory
  const componentTargetDir = join(projectRoot, targetDir, component.name);
  
  if (existsSync(componentTargetDir) && !force) {
    logger.warn(`Component ${component.name} already exists. Use --force to overwrite.`);
    return false;
  }
  
  try {
    // Create directory if it doesn't exist
    if (!existsSync(componentTargetDir)) {
      mkdirSync(componentTargetDir, { recursive: true });
    }
    
    if (verbose) {
      logger.info(`Copying ${component.name} component to ${relative(projectRoot, componentTargetDir)}`);
    }
    
    // Get all files in component directory
    const files = component.files || [];
    let filesCopied = 0;
    
    for (const file of files) {
      const sourcePath = join(component.path, file);
      const targetPath = join(componentTargetDir, file);
      
      // Skip demo files if not requested
      if (!withDemo && file.toLowerCase().includes('demo')) {
        continue;
      }
      
      // Skip documentation files if not requested
      if (!withDocs && file.toLowerCase().endsWith('.md')) {
        continue;
      }
      
      // Skip CSS files if noCss option is set
      if (noCss && file.toLowerCase().endsWith('.css')) {
        continue;
      }
      
      // Create directory for the file if needed
      const targetFileDir = dirname(targetPath);
      if (!existsSync(targetFileDir)) {
        mkdirSync(targetFileDir, { recursive: true });
      }
      
      // Copy and process the file
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        // Read the file content
        const content = readFileSync(sourcePath, 'utf-8');
        
        // Process imports (adjust paths if needed)
        const processedContent = processImports(content, component.name);
        
        // Write the processed content
        writeFileSync(targetPath, processedContent);
        filesCopied++;
        
        if (verbose) {
          logger.info(`  Processed ${file}`);
        }
      } else {
        // Copy the file directly
        copyFileSync(sourcePath, targetPath);
        filesCopied++;
        
        if (verbose) {
          logger.info(`  Copied ${file}`);
        }
      }
    }
    
    if (filesCopied === 0) {
      logger.warn(`No files were copied for component ${component.name}`);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error(`Failed to copy component ${component.name}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Install @0x1js/components package using bun or npm
 * @param projectRoot Path to the project root
 * @returns Whether the installation was successful
 */
async function installComponentsPackage(projectRoot: string): Promise<boolean> {
  // Check if bun is available
  const useBun = existsSync('/usr/local/bin/bun') || existsSync('/usr/bin/bun') || existsSync(join(process.env.HOME || '', '.bun/bin/bun'));
  
  const installCmd = useBun ? 'bun add' : 'npm install';
  
  const spinner = logger.spinner(`Installing ${COMPONENTS_PACKAGE} using ${useBun ? 'bun' : 'npm'}...`);
  
  try {
    // Use child_process.execSync for simplicity - we could use Bun.spawn in the future
    const { execSync } = require('child_process');
    execSync(`${installCmd} ${COMPONENTS_PACKAGE}`, { 
      cwd: projectRoot, 
      stdio: 'pipe' // Capture output to avoid cluttering the console
    });
    
    spinner.stop('success', `Installed ${COMPONENTS_PACKAGE} successfully`);
    return true;
  } catch (error) {
    spinner.stop('error', `Failed to install ${COMPONENTS_PACKAGE}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Add pre-built components to a 0x1 project
 * @param components Space-separated list of component names to add
 * @param options Configuration options
 */
export async function run(
  components: string = '',
  options: AddOptions = {}
): Promise<void> {
  // Set defaults
  const targetDir = options.target || DEFAULT_TARGET_DIR;
  const withDemo = options.withDemo || false;
  const withDocs = options.withDocs !== false; // Default to true
  const force = options.force || false;
  const verbose = options.verbose || false;
  const noCss = options.noCss || false;
  
  const projectRoot = process.cwd();
  const componentsAdded: string[] = [];
  
  // Parse components to add
  const componentsList = components.split(' ').filter(Boolean);
  
  if (!componentsList.length) {
    logger.error('Please specify at least one component to add');
    logger.info('Usage: 0x1 add <component-name> [options]');
    return;
  }
  
  // Verify we're in a 0x1 project
  if (!await isValidProject(projectRoot)) {
    logger.error('Not a valid 0x1 project directory');
    logger.info('Run this command in a 0x1 project directory');
    process.exit(1);
    return;
  }

  // Check if @0x1js/components package is installed
  const hasComponentsPackage = await isComponentsPackageInstalled(projectRoot);
  
  // If package isn't installed, prompt to install it
  if (!hasComponentsPackage) {
    logger.info(`The ${COMPONENTS_PACKAGE} package is required but not installed.`);
    
    // Ask if the user wants to install it
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>(resolve => {
      readline.question(`Would you like to install ${COMPONENTS_PACKAGE} now? (y/N): `, resolve);
    });
    
    readline.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      const installed = await installComponentsPackage(projectRoot);
      if (!installed) {
        logger.error(`Could not install ${COMPONENTS_PACKAGE}. Please install it manually and try again.`);
        logger.info(`Run: bun add ${COMPONENTS_PACKAGE} # or npm install ${COMPONENTS_PACKAGE}`);
        process.exit(1);
        return;
      }
    } else {
      logger.warn(`Aborted. Please install ${COMPONENTS_PACKAGE} manually to use the add command.`);
      logger.info(`Run: bun add ${COMPONENTS_PACKAGE} # or npm install ${COMPONENTS_PACKAGE}`);
      process.exit(1);
      return;
    }
  }

  // Create a spinner for the overall process
  const spinner = logger.spinner('Finding components...');

  try {
    // Find and copy each component
    for (const componentName of componentsList) {
      // Find the component
      const component = await findComponent(componentName, projectRoot);
      
      if (!component) {
        spinner.stop('warn', `Component ${componentName} not found`);
        continue;
      }

      // Update status for current component
      spinner.stop('success');
      const addingSpinner = logger.spinner(`Adding ${component.name} component...`);
      
      // Create component directory structure if needed
      const componentDir = join(projectRoot, targetDir);
      if (!existsSync(componentDir)) {
        mkdirSync(componentDir, { recursive: true });
      }
      
      // Copy the component
      const success = await copyComponent(
        component,
        targetDir,
        {
          projectRoot,
          withDocs,
          withDemo,
          force,
          verbose,
          noCss
        }
      );
      
      if (success) {
        addingSpinner.stop('success', `Added ${component.name}`);
        componentsAdded.push(component.name);
      } else {
        addingSpinner.stop('warn', `Skipped ${component.name}`);
      }
    }

    // Report results
    if (!componentsAdded.length) {
      logger.error('No components were added');
      return;
    } 
    
    if (componentsAdded.length === componentsList.length) {
      logger.success(`Added ${componentsAdded.length} component(s): ${componentsAdded.join(', ')}`);
    } else {
      logger.warn(`Added ${componentsAdded.length}/${componentsList.length} component(s): ${componentsAdded.join(', ')}`);
    }
    
    // Show usage example for the added components
    logger.info('\nUsage examples:');
    componentsAdded.forEach(componentName => {
      logger.info(`import { ${componentName} } from '${targetDir.replace(/^src\//, '@/')}/${componentName}/${componentName}';`);
    });
  } catch (error) {
    spinner.stop('error', `Error adding components: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);  }
}
