/**
 * JSX Transpiler - Uses Bun build command to transform JSX code
 */
import { join, dirname, basename } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as fs from 'fs';
import Bun from 'bun';
import { logger } from '../utils/logger';
// Use Bun's native APIs instead of Node.js ones

/**
 * Process import statements in source code to handle JSX imports
 */
async function processImports(sourceCode: string): Promise<string> {
  // Handle import statements for JSX
  let processedSource = sourceCode;

  // First check if the file contains CSS Tailwind directives
  const hasTailwind = processedSource.includes('@tailwind');
  
  if (hasTailwind) {
    // Fully extract any CSS-related content into special script blocks
    // This ensures they're completely ignored during JSX processing
    
    // Start by handling @tailwind directives - wrap them completely in special block comments
    processedSource = processedSource.replace(
      /(@tailwind[\s\w:;]+)/g,
      "/*! TAILWIND_DIRECTIVE \n$1\n*/"
    );
    
    // Handle any @import directives for CSS
    processedSource = processedSource.replace(
      /(@import[^;]+;)/g,
      "/*! CSS_IMPORT \n$1\n*/"
    );
    
    // Handle any other CSS @ rules that might cause parser issues
    processedSource = processedSource.replace(
      /(@layer[^{]*{[^}]*})/g,
      "/*! CSS_LAYER \n$1\n*/"
    );
    
    // Handle any @apply directives
    processedSource = processedSource.replace(
      /(@apply[^;]*;)/g,
      "/*! CSS_APPLY \n$1\n*/"
    );
    
    // Add a note that all CSS was extracted
    logger.debug("Extracted CSS directives from file to prevent JSX parsing issues");
  }

  // Replace React imports with our custom JSX runtime
  processedSource = processedSource.replace(
    /import React(, { .+? })? from ["'](react|0x1)["'];?/g,
    "// React import handled by transpiler"
  );

  // Replace direct imports of createElement and Fragment
  processedSource = processedSource.replace(
    /import { (createElement|Fragment|jsx|jsxs|jsxDEV)(?:, )?(.+?)?} from ["'](react|0x1)["'];?/g,
    (match, imp1, imp2, source) => {
      // Keep other imports if there were any
      if (
        imp2 &&
        imp2.trim() &&
        !imp2.includes("createElement") &&
        !imp2.includes("Fragment")
      ) {
        return `import { ${imp2.trim()} } from "${source}";`;
      }
      return "// JSX imports handled by transpiler";
    }
  );
  
  // Handle imports from react JSX runtime modules that Bun tries to resolve
  processedSource = processedSource.replace(
    /import .+ from ["'](react\/jsx-(?:dev-)?runtime)["'];?/g,
    "// JSX runtime imports handled by transpiler"
  );
  
  // Add direct import of our JSX runtime at the top of the file
  processedSource = `// Auto-injected JSX runtime imports
import { jsx, jsxs, Fragment, createElement } from "0x1/jsx-runtime.js";

${processedSource}`;

  return processedSource;
}

/**
 * Handle transpilation of a JSX file
 * @param entryFile - Path to the source JSX/TSX file
 * @param outputDir - Directory where the output should be placed
 * @param minify - Whether to minify the code
 * @param projectRoot - Root directory of the project (for relative paths)
 * @returns Promise<boolean> - Success status
 */
export async function transpileJSX(
  entryFile: string,
  outputDir: string,
  minify = false,
  projectRoot?: string
): Promise<boolean> {
  try {
    // Read the source file
    logger.info(`Transpiling JSX: ${basename(entryFile)}`);
    const sourceCode = await Bun.file(entryFile).text();

    // Calculate output file path with truly unique naming to avoid conflicts
    const fileName = basename(entryFile);
    const componentName = fileName.replace(/\.(jsx|tsx)$/, '');
    
    // Create a component-specific subdirectory to guarantee no path collisions
    const safeComponentDir = join(outputDir, componentName);
    if (!existsSync(safeComponentDir)) {
      mkdirSync(safeComponentDir, { recursive: true });
    }

    // Use a very simple output file name within the component's own directory 
    // No need for complex randomization since each component has its own directory
    const outputFile = join(safeComponentDir, 'index.js');
    
    // Log the path for debugging
    logger.debug(`Using component directory for output: ${outputFile}`);

    // We'll use project root or file directory for context
    const _projectPath = projectRoot || dirname(entryFile);

    // Process imports using the utility function
    const processedSource = await processImports(sourceCode);

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Write processed source to a temporary file
    const tempFile = join(dirname(entryFile), `.temp-${basename(entryFile)}`);
    await Bun.write(tempFile, processedSource);

    try {
      // Use Bun.build directly rather than spawning a process for better reliability
      // This is a cleaner approach with no process spawning or string parsing required
      logger.info(`Transpiling JSX with Bun.build API directly`); 
      
      // Variables for error handling and output capture
      let exitCode = 0;
      let stdout = '';
      let stderr = '';
      
      try {
        // First try to use Bun.build API directly which is faster
        try {
          logger.debug('Transpiling JSX with Bun.build API directly');
          
          // Direct API approach (works in newer Bun versions)
          // Using type assertion because TypeScript definitions might not include all Bun build options
          const result = await Bun.build({
            entrypoints: [tempFile],
            outdir: dirname(outputFile),
            naming: {
              entry: basename(outputFile)
            },
            minify: minify,
            external: ['*.css', 'tailwind*', 'postcss*', '@tailwind*'],
            define: {
              'process.env.NODE_ENV': JSON.stringify('production')
            },
            target: 'browser',
            // TypeScript doesn't recognize these JSX config in type definitions
            // but they work at runtime in Bun
          } as any);
          
          // Check if build succeeded
          if (!result.success) {
            throw new Error(`Bun build failed: ${result.logs?.join('\n') || 'Unknown error'}`);
          }
          
          // Successful build
          logger.debug('JSX transpilation completed with Bun.build API');
          return true;
        } catch (buildError) {
          // If direct API fails, fall back to spawn method as a backup
          logger.debug(`Falling back to spawn method for JSX transpilation: ${buildError}`);
          
          // Enhanced command with better handling of CSS files
          // Explicitly ignore all CSS content and add extra flags
          // Create a temporary config file for Bun build with all options
          const configContent = JSON.stringify({
            entrypoints: [tempFile],
            outfile: outputFile,
            minify: minify,
            external: ['*.css', 'tailwind*', 'postcss*', '@tailwind*'],
            target: 'browser',
            jsx: 'automatic',
            jsxImportSource: '0x1',
            jsxFactory: 'createElement',
            jsxFragment: 'Fragment',
            define: {
              'process.env.NODE_ENV': JSON.stringify('production')
            }
          }, null, 2);
          
          // Write config to temp file
          const configPath = join(dirname(tempFile), '.bun-build-config.json');
          await Bun.write(configPath, configContent);
          
          // Use more stable command format
          const bunBuildProcess = Bun.spawn([
            'bun', 'build', tempFile,
            '--outfile', outputFile,
            '--config', configPath
          ], {
            cwd: dirname(tempFile),
            stdout: 'pipe',
            stderr: 'pipe'
          });
          
          // Wait for the process to complete and get output
          exitCode = await bunBuildProcess.exited;
          stdout = await new Response(bunBuildProcess.stdout).text();
          stderr = await new Response(bunBuildProcess.stderr).text();
          
          if (exitCode !== 0) {
            throw new Error(`Bun build failed with exit code ${exitCode}`);
          }
          
          logger.debug('JSX transpilation completed successfully with fallback method');
        }
      } catch (error: any) {
        // Handle any errors during the build process
        exitCode = error.code || error.status || 1;
        stderr = error.stderr || error.message || String(error);
      }
      if (exitCode !== 0) {
        // Save debug file for inspection
        const debugFile = join(
          dirname(entryFile),
          `.debug-${basename(entryFile)}`
        );
        await Bun.write(debugFile, processedSource);

        logger.error(`JSX transpilation failed for ${basename(entryFile)}:`);
        logger.error(`Command exit code: ${exitCode}`);
        logger.error(`Standard output:`);
        logger.error(stdout || "(none)");
        logger.error(`Error output:`);
        logger.error(stderr || "(none)");
        logger.error(`\nProcessed source saved to: ${debugFile}`);
        
        // Despite the error, if the output file exists, we might still be able to use it
        if (existsSync(outputFile)) {
          logger.warn(`Output file exists despite error, attempting to continue...`);
          return true;
        }

        throw new Error(
          `JSX transpilation failed for ${basename(entryFile)} - Check debug file for details`
        );
      }

      logger.info(`JSX transpilation successful for ${basename(entryFile)}`);
      return true;
    } finally {
      // Clean up the temporary file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        /* ignore */
      }
    }
  } catch (error) {
    return Promise.reject(error);
  }
}
