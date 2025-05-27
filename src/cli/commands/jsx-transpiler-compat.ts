/**
 * 0x1 Framework - JSX Transpiler Compatibility Layer
 * 
 * This file provides backwards compatibility for existing code 
 * that still references the old jsx-transpiler.ts file.
 * It re-exports functionality from the new unified transpilation system.
 */

import { logger } from '../utils/logger';
import {
  minifyCode,
  processJsxFile,
  transpileJsx
} from '../utils/transpilation';

// Local file utilities since they no longer exist in the refactored transpilation module
const fileUtils = {
  normalizePath: (path: string): string => {
    // Normalize path separators
    return path.replace(/\\/g, '/');
  },
  baseName: (path: string): string => {
    // Extract the base name from a path
    return path.split('/').pop() || '';
  }
};

// Add a deprecation warning when this module is imported
logger.debug('jsx-transpiler.ts is deprecated. Use the new transpilation system from "../utils/transpilation" instead.');

/**
 * Legacy transpileJSX function (backwards compatibility)
 */
export async function transpileJSX(
  entryFile: string,
  outputDir: string,
  minify = false,
  projectRoot?: string
): Promise<boolean> {
  try {
    // Read the file content
    const fileResult = await Bun.file(entryFile).text();
    
    // Use the new transpilation system
    const result = await transpileJsx(fileResult, { 
      filename: entryFile,
      minify
      // projectRoot is no longer part of TranspileOptions
    });
    
    // Pass project root through a different mechanism if needed
    
    // Ensure output directory exists
    const outputFile = fileUtils.normalizePath(
      outputDir + '/' + fileUtils.baseName(entryFile).replace(/\.(jsx|tsx)$/, '.js')
    );
    
    // Write the result
    await Bun.write(outputFile, result.code);
    
    return result.metadata.success;
  } catch (error) {
    logger.error(`JSX transpilation error: ${error}`);
    return false;
  }
}

// Export other transpilation utilities for backwards compatibility
export {
  minifyCode,
  processJsxFile,
  transpileJsx
};
