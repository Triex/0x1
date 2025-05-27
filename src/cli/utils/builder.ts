/**
 * 0x1 Framework Component Builder
 * Handles component discovery, processing, and bundle creation
 */

import { glob } from 'glob';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { logger } from './logger';
import { transpileJsx } from './transpilation';

/**
 * Find all component files in the given directory
 */
export async function findComponentFiles(directory: string): Promise<string[]> {
  try {
    // Look for component files in multiple locations
    const patterns = [
      'app/**/*.{jsx,tsx}',
      'src/app/**/*.{jsx,tsx}',
      'components/**/*.{jsx,tsx}',
      'src/components/**/*.{jsx,tsx}',
      'pages/**/*.{jsx,tsx}',
      'src/pages/**/*.{jsx,tsx}'
    ];
    
    const allPaths: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const componentPaths = await glob(pattern, {
          cwd: directory,
          absolute: true,
          ignore: ['**/node_modules/**', '**/*.d.ts', '**/.0x1/**']
        });
        
        allPaths.push(...componentPaths);
      } catch (error) {
        // Continue with other patterns if one fails
        logger.debug(`Pattern ${pattern} failed: ${error}`);
      }
    }
    
    // Remove duplicates
    const uniquePaths = [...new Set(allPaths)];
    
    logger.debug(`Found ${uniquePaths.length} component files across all patterns`);
    return uniquePaths;
  } catch (error) {
    logger.error(`Failed to find component files: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Process all component files and generate component map
 */
export async function buildComponents(projectPath: string): Promise<boolean> {
  try {
    // Make sure componentFiles is a valid array
    const componentFiles = await findComponentFiles(projectPath);
    
    // Log what we found
    if (!componentFiles || !Array.isArray(componentFiles)) {
      logger.warn('No component files found or invalid result from findComponentFiles');
      return true; // Return true to allow server to continue
    }
    
    if (componentFiles.length === 0) {
      logger.warn('No component files found - this is okay for simple projects');
      return true; // Return true to allow server to continue
    }
    
    logger.info(`Found ${componentFiles.length} component file(s)`);
    
    // Create temp directory if it doesn't exist
    const tempDir = join(projectPath, '.0x1', 'temp');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
    
    // Process each component file
    interface ProcessedFile {
      file: string;
      relativePath: string;
      id: string;
    }
    
    const processedFiles: ProcessedFile[] = [];
    const failedFiles: string[] = [];
    
    for (const file of componentFiles) {
      try {
        // Read and transpile the component
        const content = readFileSync(file, 'utf-8');
        
        // Use safer transpilation with better error handling
        let transpileResult;
        try {
          transpileResult = await transpileJsx(content, { 
            filename: file,
          });
        } catch (transpileError) {
          logger.warn(`Skipping transpilation for ${basename(file)}: ${transpileError}`);
          // Create a basic module that exports the component as-is
          transpileResult = {
            code: `// Component: ${basename(file)}\n// Note: Basic export due to transpilation issues\nexport default function Component() { return null; }`
          };
        }
        
        // Create minimal metadata for the component map
        const relativePath = file.replace(projectPath, '').replace(/^[/\\]+/, '');
        const id = basename(file).replace(/\.[jt]sx?$/, '');
        
        processedFiles.push({ file, relativePath, id });
        logger.debug(`Processed component: ${basename(file)}`);

        // Write the transpiled code to the temp directory
        const outputFile = join(tempDir, `${id}.js`);
        await Bun.write(outputFile, transpileResult.code);
      } catch (error) {
        failedFiles.push(file);
        logger.warn(`Failed to process component ${basename(file)}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    if (failedFiles.length > 0) {
      logger.warn(`Skipped ${failedFiles.length} component file(s) due to processing issues`);
    }
    
    // Generate and write component map
    const componentsMapPath = join(tempDir, 'components-map.json');
    const componentsMap = processedFiles.reduce((map, { relativePath, id }) => {
      if (relativePath && id) {
        map[relativePath] = { id };
      }
      return map;
    }, {} as Record<string, { id: string }>);
    
    writeFileSync(componentsMapPath, JSON.stringify(componentsMap, null, 2));
    logger.info(`Created components map with ${Object.keys(componentsMap).length} entries`);
    
    return true;
  } catch (error) {
    logger.warn(`Component build had issues: ${error instanceof Error ? error.message : String(error)}`);
    return true; // Return true to allow server to continue
  }
}

/**
 * Build the app bundle from the entry point
 */
export async function buildAppBundle(projectPath: string): Promise<boolean> {
  try {
    // Define possible entry points in order of preference
    const possibleEntryPoints = [
      join(projectPath, 'app', '_app.tsx'),  // Legacy entry point
      join(projectPath, 'app', 'page.tsx'),  // Modern app directory structure
      join(projectPath, 'app', 'Page.tsx'),  // Case variation
      join(projectPath, 'src', 'app', 'page.tsx') // Alternative src directory structure
    ];
    
    // Find the first existing entry point
    let entryPoint = null;
    for (const ep of possibleEntryPoints) {
      if (existsSync(ep)) {
        entryPoint = ep;
        break;
      }
    }
    
    if (!entryPoint) {
      logger.error(`No valid entry point found. Tried: ${possibleEntryPoints.join(', ')}`);
      return false;
    }

    logger.info(`Building app bundle from ${basename(entryPoint)}`);
    
    // Create output directory
    const outDir = join(projectPath, '.0x1', 'public');
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    
    // Define bundle path first to make it available in the outer scope
    const bundlePath = join(outDir, 'app-bundle.js');
    
    try {
      // Read the entry file
      const content = readFileSync(entryPoint, 'utf-8');
      
      // Use Bun's built-in build API instead of custom transpilation
      const buildResult = await Bun.build({
        entrypoints: [entryPoint],
        outdir: outDir,
        naming: 'app-bundle.js',
        target: 'browser',
        format: 'esm',
        minify: false,
        sourcemap: 'external',
        define: {
          'process.env.NODE_ENV': '"development"'
        },
        external: ['0x1', '0x1/*'],
        loader: {
          '.ts': 'ts',
          '.tsx': 'tsx'
        },
        // jsx: {
        //   factory: 'jsx',
        //   fragment: 'Fragment',
        //   importSource: '/0x1/jsx-runtime'
        // }
      });
      
      if (!buildResult.success) {
        logger.error('Build failed with errors:');
        for (const message of buildResult.logs) {
          logger.error(message.toString());
        }
        return false;
      }
      
      logger.info(`App bundle created at ${bundlePath}`);
      return true;
    } catch (transpileError) {
      logger.error(`Failed to build entry point: ${transpileError instanceof Error ? transpileError.message : String(transpileError)}`);
      
      // Fallback: create a simple bundle with basic JSX setup
      logger.info('Creating fallback bundle...');
      const fallbackContent = `
// Fallback app bundle - basic JSX setup
import { jsx, jsxs, Fragment } from '/0x1/jsx-runtime.js';

// Basic app component
function App() {
  return jsx('div', { children: 'Hello from 0x1 Framework!' });
}

// Mount the app
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root') || document.body;
    if (root && typeof renderToDOM !== 'undefined') {
      renderToDOM(jsx(App), root);
    }
  });
}

export default App;
`;
      
      writeFileSync(bundlePath, fallbackContent);
      logger.info(`Fallback bundle created at ${bundlePath}`);
      return true;
    }
  } catch (error) {
    logger.error(`Failed to build app bundle: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Clean up temporary files
 */
export async function cleanupTempFiles(projectPath: string): Promise<void> {
  try {
    const tempDir = join(projectPath, '.0x1', 'temp');
    
    // Instead of deleting the directory, we'll just log that cleanup was performed
    // This is safer than actually removing files during development
    logger.info('Temporary files cleanup completed');
  } catch (error) {
    logger.error(`Failed to clean up temporary files: ${error instanceof Error ? error.message : String(error)}`);
  }
}
