/**
 * Component utilities for the 0x1 CLI
 */

import { glob } from 'glob';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { transpileJsx } from './transpilation';

/**
 * Find component files in a directory
 */
export async function findComponentFiles(directory: string): Promise<string[]> {
  try {
    if (!directory || !existsSync(directory)) {
      return [];
    }

    // Find all .jsx and .tsx files
    try {
      const componentFiles = await glob('**/*.{jsx,tsx}', {
        cwd: directory,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.0x1-temp/**']
      });
      
      // Ensure we always return an array, even if glob returns undefined
      return Array.isArray(componentFiles) ? componentFiles : [];
    } catch (globError) {
      console.error(`Error finding component files: ${globError}`);
      return [];
    }
  } catch (error) {
    console.error(`Unexpected error in findComponentFiles: ${error}`);
    return [];
  }
}

/**
 * Process a JSX/TSX file for component extraction
 */
export async function processJsxFile(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return false;
  }

  try {
    const fileContent = readFileSync(filePath, 'utf8');
    // Transpile JSX to JS
    const { code, metadata } = await transpileJsx(fileContent, { filename: filePath });
    
    // If the file has components, write the transformed code back
    if (metadata.hasComponents) {
      writeFileSync(filePath.replace(/\.(jsx|tsx)$/, '.js'), code);
      console.log(`✅ Processed ${basename(filePath)}: found ${metadata.components.length} components`);
      return true;
    }
    
    return false;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to process ${basename(filePath)}: ${errorMessage}`);
    return false;
  }
}

/**
 * Clean up temporary files
 */
export async function cleanupTempFiles(projectPath: string): Promise<void> {
  const tempDir = join(projectPath, '.0x1-temp');
  
  if (existsSync(tempDir)) {
    try {
      // Clear temp directory but don't delete it
      const files = readdirSync(tempDir);
      for (const file of files) {
        const filePath = join(tempDir, file);
        const stat = statSync(filePath);
        
        if (stat.isFile()) {
          // Delete the file
          Bun.write(filePath, ''); // Overwrite with empty content
        }
      }
      console.log('🧹 Cleaned up temporary files');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Failed to clean up temp files: ${errorMessage}`);
    }
  }
}
