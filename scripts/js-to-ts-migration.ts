#!/usr/bin/env bun
/**
 * 0x1 Framework - JavaScript to TypeScript Migration Script
 * 
 * This script helps migrate the codebase from JavaScript adapter files to a pure TypeScript setup.
 * It standardizes import patterns and removes unnecessary JavaScript adapter files.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, dirname, basename, extname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightGreen: '\x1b[92m',
  brightRed: '\x1b[91m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
};

// Logging utilities
const log = {
  info: (message: string) => console.log(`${colors.blue}ℹ️ ${message}${colors.reset}`),
  success: (message: string) => console.log(`${colors.brightGreen}✅ ${message}${colors.reset}`),
  warning: (message: string) => console.log(`${colors.brightYellow}⚠️ ${message}${colors.reset}`),
  error: (message: string) => console.log(`${colors.brightRed}❌ ${message}${colors.reset}`),
  section: (title: string) => console.log(`\n${colors.magenta}=== ${title} ===${colors.reset}\n`),
};

// Paths
const ROOT_DIR = process.cwd();
const SRC_DIR = join(ROOT_DIR, 'src');
const CLI_DIR = join(SRC_DIR, 'cli');
const COMMANDS_DIR = join(CLI_DIR, 'commands');

// Find all JavaScript adapter files
function findJsAdapterFiles(dir: string): string[] {
  const jsFiles: string[] = [];
  
  function searchDir(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      
      if (entry.isDirectory() && 
          entry.name !== 'node_modules' && 
          entry.name !== 'dist' &&
          entry.name !== '.git') {
        searchDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        // Check if there's a corresponding .ts file
        const tsFilePath = fullPath.replace(/\.js$/, '.ts');
        if (existsSync(tsFilePath)) {
          // Check if it's an adapter (imports from .ts file)
          const content = readFileSync(fullPath, 'utf8');
          if (content.includes('import') && content.includes('.ts')) {
            jsFiles.push(fullPath);
          }
        }
      }
    }
  }
  
  searchDir(dir);
  return jsFiles;
}

// Standardize import patterns in a file
function standardizeImports(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace imports with .js extension
    const jsImportPattern = /from\s+['"]([^'"]+)\.js['"]/g;
    const jsImportReplaced = content.replace(jsImportPattern, 'from "$1"');
    if (jsImportReplaced !== content) {
      content = jsImportReplaced;
      modified = true;
    }
    
    // Replace imports with .ts extension
    const tsImportPattern = /from\s+['"]([^'"]+)\.ts['"]/g;
    const tsImportReplaced = content.replace(tsImportPattern, 'from "$1"');
    if (tsImportReplaced !== content) {
      content = tsImportReplaced;
      modified = true;
    }
    
    if (modified) {
      writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    log.error(`Error standardizing imports in ${filePath}: ${error}`);
    return false;
  }
}

// Update index.ts to import from TypeScript files directly
function updateIndexFile(indexPath: string): boolean {
  try {
    if (!existsSync(indexPath)) {
      log.warning(`Index file ${indexPath} not found.`);
      return false;
    }
    
    let content = readFileSync(indexPath, 'utf8');
    let modified = false;
    
    // Replace imports from .js files to their .ts counterparts
    const jsCommandImportPattern = /import\s+\{([^}]+)\}\s+from\s+['"]\.\/commands\/([^'"]+)\.js['"]/g;
    const jsCommandImportReplaced = content.replace(jsCommandImportPattern, 'import {$1} from "./commands/$2"');
    
    if (jsCommandImportReplaced !== content) {
      content = jsCommandImportReplaced;
      modified = true;
    }
    
    if (modified) {
      writeFileSync(indexPath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    log.error(`Error updating index file ${indexPath}: ${error}`);
    return false;
  }
}

// Main migration function
async function migrateToTypeScript() {
  log.section('0x1 Framework - JavaScript to TypeScript Migration');
  
  // Step 1: Find all JavaScript adapter files
  log.info('Finding JavaScript adapter files...');
  const jsAdapterFiles = findJsAdapterFiles(SRC_DIR);
  log.success(`Found ${jsAdapterFiles.length} JavaScript adapter files.`);
  
  // Step 2: Standardize import patterns in TypeScript files
  log.info('Standardizing import patterns in TypeScript files...');
  let modifiedFiles = 0;
  
  function processDirectory(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory() && 
          entry.name !== 'node_modules' && 
          entry.name !== 'dist' &&
          entry.name !== '.git') {
        processDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const modified = standardizeImports(fullPath);
        if (modified) {
          modifiedFiles++;
          log.info(`Standardized imports in ${relative(ROOT_DIR, fullPath)}`);
        }
      }
    }
  }
  
  processDirectory(SRC_DIR);
  log.success(`Standardized import patterns in ${modifiedFiles} files.`);
  
  // Step 3: Update index.ts to import from TypeScript files directly
  log.info('Updating index files...');
  const indexPath = join(CLI_DIR, 'index.ts');
  if (updateIndexFile(indexPath)) {
    log.success(`Updated index file at ${relative(ROOT_DIR, indexPath)}`);
  } else {
    log.warning(`No changes needed in index file at ${relative(ROOT_DIR, indexPath)}`);
  }
  
  // Step 4: Remove JavaScript adapter files
  log.info('Removing JavaScript adapter files...');
  for (const adapterFile of jsAdapterFiles) {
    try {
      log.info(`Removing ${relative(ROOT_DIR, adapterFile)}`);
      unlinkSync(adapterFile);
    } catch (error) {
      log.error(`Failed to remove ${adapterFile}: ${error}`);
    }
  }
  log.success(`Removed ${jsAdapterFiles.length} JavaScript adapter files.`);
  
  // Step 5: Install missing type definitions
  log.info('Installing missing type definitions...');
  const typesResult = spawnSync('bun', ['add', '-d', '@types/glob'], {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
  
  if (typesResult.status === 0) {
    log.success('Installed missing type definitions.');
  } else {
    log.error('Failed to install missing type definitions.');
  }
  
  log.section('Migration Complete');
  log.info('The 0x1 framework codebase has been migrated to a cleaner TypeScript structure.');
  log.info('You can now build the project with:');
  log.info('  bun run build');
}

// Run the migration
migrateToTypeScript().catch(error => {
  log.error(`Migration failed: ${error}`);
  process.exit(1);
});
