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
 */
export async function handleJSXFile(
  entryFile: string,
  outputFile: string,
  projectPath: string,
  minify = false
): Promise<boolean> {
  try {
    // Read the source file
    logger.info(`Transpiling JSX: ${basename(entryFile)}`);
    const source = await Bun.file(entryFile).text();

    // Process imports
    const processedSource = await processImports(source);

    // Ensure output directory exists
    const outputDir = dirname(outputFile);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Write processed source to a temporary file
    const tempFile = join(dirname(entryFile), `.temp-${basename(entryFile)}`);
    await Bun.write(tempFile, processedSource);

    try {
      // Construct the command with proper quoting for shell execution
      // Using --jsx-import-source=0x1 to tell Bun to use our JSX runtime
      const buildCmd = `bun build "${tempFile}" --outfile="${outputFile}" ${minify ? '--minify' : ''} --jsx=automatic --jsx-import-source=0x1 --jsx-factory=createElement --jsx-fragment=Fragment`;
      
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
