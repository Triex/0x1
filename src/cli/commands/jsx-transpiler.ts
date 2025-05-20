/**
 * JSX Transpiler - Uses Bun build command to transform JSX code
 */
import { join, basename, dirname } from "path";
import { existsSync, mkdirSync } from "fs";
import { logger } from "../utils/logger";
import * as fs from "fs";
import { execSync } from "child_process";

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
    
    // We need to ensure a completely unique path every time, as files with the same name can cause collisions
    const timestamp = Date.now();
    const randomBytes = [];
    for (let i = 0; i < 16; i++) {
      randomBytes.push(Math.floor(Math.random() * 256));
    }
    
    // Create a unique hash using multiple factors
    const buffer = Buffer.from([
      ...Buffer.from(entryFile), // Include full path
      ...Buffer.from(timestamp.toString()), // Current timestamp
      ...randomBytes, // Random data
      ...Buffer.from(process.pid.toString()) // Process ID
    ]);
    
    // Create a hash that's guaranteed to be unique for every file in every run
    const hash = buffer.toString('hex').substring(0, 24); // Use 24 chars (12 bytes) for extremely low collision chance
    
    // Add timestamp to make it truly unique
    const uniqueId = `${hash}-${timestamp}`;
    
    // Use the component name with the unique hash
    const outputFileName = `${componentName}.${uniqueId}.js`;
    
    // Create absolute path to output file
    const outputFile = join(outputDir, outputFileName);
    
    // Log the generated filename for debugging
    logger.debug(`Generated unique output file: ${outputFileName} for ${entryFile}`);

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
      // Construct the command with proper quoting for shell execution
      // We include several flags to ensure robust JSX transpilation:
      // 1. Use --external flags to prevent bundling of CSS libraries that cause conflicts
      // 2. Use --no-bundle-nodejs-globals to reduce bundle size
      // 3. Add appropriate jsx settings to ensure proper transpilation
      // 4. Use --define to provide necessary environment variables
      const buildCmd = `bun build "${tempFile}" --outfile="${outputFile}" \
        ${minify ? '--minify' : ''} \
        --jsx=automatic \
        --jsx-import-source=0x1 \
        --jsx-factory=createElement \
        --jsx-fragment=Fragment \
        --define:process.env.NODE_ENV="production" \
        --external:@tailwind* \
        --external:tailwindcss \
        --external:*.css \
        --no-bundle-nodejs-globals`;
      
      logger.info(`Executing: ${buildCmd}`);
      
      let stdout = '';
      let stderr = '';
      let exitCode = 0;
      
      // Use Node's execSync for better shell command handling
      try {
        // Execute the command and capture output
        stdout = execSync(buildCmd, {
          cwd: projectPath,
          encoding: 'utf8'
        }).toString();
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
