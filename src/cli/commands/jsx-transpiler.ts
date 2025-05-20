/**
 * JSX Transpiler - Uses Bun build command to transform JSX code
 */
import { join, dirname, basename } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as fs from 'fs';
import Bun from 'bun';
import { logger } from '../utils/logger';
// Use Bun's native APIs instead of Node.js ones
import crypto from 'crypto';

/**
 * Process import statements in source code to handle JSX imports
 */
async function processImports(sourceCode: string): Promise<string> {
  // Handle import statements for JSX
  let processedSource = sourceCode;

  // Handle @tailwind directives by adding CSS comment markers to make them pass through JSX compilation
  // This prevents Bun from treating them as invalid CSS in JSX files
  processedSource = processedSource.replace(
    /(@tailwind[\s\w:;]+)/g,
    "/* CSS-DIRECTIVE-START */$1/* CSS-DIRECTIVE-END */"
  );
  
  // Also make sure to handle any CSS @import directives, which can also cause issues
  processedSource = processedSource.replace(
    /(@import[^;]+;)/g,
    "/* CSS-IMPORT-START */$1/* CSS-IMPORT-END */"
  );

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
    
    // Create a truly unique filename with no chance of collision by using nano timestamp and random values
    // Format: componentName-timestamp-randomPart.js
    const timestamp = Date.now();
    const randomHex = Buffer.from(crypto.getRandomValues(new Uint8Array(8))).toString('hex');
    const uniqueId = `${timestamp}-${randomHex}-${process.pid}`;
    
    // Use a completely unique filename for each transpiled component
    const outputFileName = `${componentName}.${uniqueId}.js`;
    
    // Create the full output path - putting everything in the main output directory
    const outputFile = join(outputDir, outputFileName);
    
    // Make sure the output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Log the path for debugging
    logger.debug(`Generated unique output file: ${outputFile}`);

    // Get project path for correct working directory in Bun build
    const projectPath = projectRoot || dirname(entryFile);

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
      // This approach uses Bun's native APIs for better performance and reliability
      // We'll use --outfile with our guaranteed unique filename
      const bunArgs = [
        'build', tempFile,
        '--outfile', outputFile,
        ...(minify ? ['--minify'] : []),
        '--jsx=automatic',
        '--jsx-import-source=0x1',
        '--jsx-factory=createElement',
        '--jsx-fragment=Fragment',
        '--define:process.env.NODE_ENV="production"',
        '--external:@tailwind*',
        '--external:tailwindcss',
        '--external:postcss*',
        '--external:*.css',
        '--no-bundle-nodejs-globals'
      ];
      
      // Log the command for debugging
      logger.info(`Executing: bun ${bunArgs.join(' ')}`);
      
      let stdout = '';
      let stderr = '';
      let exitCode = 0;
      
      // Use Bun's native spawn for better performance
      try {
        // Execute the command using Bun's native APIs
        const proc = Bun.spawn(['bun', ...bunArgs], {
          cwd: projectPath,
          env: { ...process.env, NODE_ENV: 'production' }
        });
        
        // Get the output and exit code
        const output = await new Response(proc.stdout).text();
        const error = await new Response(proc.stderr).text();
        exitCode = await proc.exited;
        
        stdout = output;
        stderr = error;
      } catch (error: any) {
        // Handle command execution errors
        exitCode = error.status || 1;
        stderr = error.stderr?.toString() || error.message;
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
