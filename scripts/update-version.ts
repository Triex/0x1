#!/usr/bin/env bun
/**
 * Version Synchronization Script for 0x1 Framework
 * 
 * This script updates the version number in all template package.json files
 * and any hardcoded version references in the codebase to match the main package.json.
 * 
 * Usage:
 *   bun run scripts/update-version.ts
 */

import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';

// Get the project root directory
const ROOT_DIR = resolve(import.meta.dir, '..');

// Read the main package.json to get the current version
async function getMainVersion(): Promise<string> {
  const packageJsonPath = join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

// Update all template package.json files
async function updateTemplateVersions(version: string): Promise<void> {
  const templatesDir = join(ROOT_DIR, 'templates');
  const templateTypes = ['minimal', 'standard', 'full'];
  const languageTypes = ['typescript', 'javascript'];
  
  // Template folders follow the pattern templates/{type}/{language}
  for (const type of templateTypes) {
    for (const language of languageTypes) {
      const templatePath = join(templatesDir, type, language);
      
      if (existsSync(templatePath)) {
        const packageJsonPath = join(templatePath, 'package.json');
        
        if (existsSync(packageJsonPath)) {
          console.log(`Updating ${type}/${language}/package.json`);
          
          // Read and parse package.json
          const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
          const packageJson = JSON.parse(packageJsonContent);
          
          // Update 0x1 dependency version
          if (packageJson.dependencies && packageJson.dependencies['0x1']) {
            packageJson.dependencies['0x1'] = `^${version}`;
          }
          
          // Update 0x1-store dependency version (if it exists)
          if (packageJson.dependencies && packageJson.dependencies['0x1-store']) {
            packageJson.dependencies['0x1-store'] = `^${version}`;
          }
          
          // Write updated package.json
          await writeFile(
            packageJsonPath, 
            JSON.stringify(packageJson, null, 2) + '\n', 
            'utf-8'
          );
        }
      }
    }
  }
}

// Update hardcoded version references in the CLI code
async function updateCliVersions(version: string): Promise<void> {
  const cliNewCommandPath = join(ROOT_DIR, 'src/cli/commands/new.ts');
  const cliIndexPath = join(ROOT_DIR, 'src/cli/index.ts');
  
  // Update new.ts file
  if (existsSync(cliNewCommandPath)) {
    console.log('Updating CLI version references in new.ts');
    
    // Read the file content
    let cliContent = await readFile(cliNewCommandPath, 'utf-8');
    
    // Replace 0x1 version
    cliContent = cliContent.replace(
      /dependencies: \{\s*0x1: '\^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?'\s*\}/g,
      `dependencies: {\n      0x1: '^${version}'\n    }`
    );
    
    // Replace 0x1-store version
    cliContent = cliContent.replace(
      /'0x1-store': '\^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?'/g,
      `'0x1-store': '^${version}'`
    );
    
    // Write updated content
    await writeFile(cliNewCommandPath, cliContent, 'utf-8');
  }
  
  // Update index.ts file to update the CLI banner version
  if (existsSync(cliIndexPath)) {
    console.log('Updating CLI banner version in index.ts');
    
    // Read the file content
    let indexContent = await readFile(cliIndexPath, 'utf-8');
    
    // Replace version in banner message
    indexContent = indexContent.replace(
      /logger\.info\(`v[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)? - The ultra-minimal TypeScript framework`\);/g,
      `logger.info(\`v${version} - The ultra-minimal TypeScript framework\`);`
    );
    
    // Write updated content
    await writeFile(cliIndexPath, indexContent, 'utf-8');
  }
}

// Main function
async function main(): Promise<void> {
  try {
    console.log('🔄 Syncing versions across the codebase...');
    
    // Get the current version from main package.json
    const version = await getMainVersion();
    console.log(`📦 Current version: ${version}`);
    
    // Update all template versions
    await updateTemplateVersions(version);
    
    // Update CLI code references
    await updateCliVersions(version);
    
    console.log('✅ Version update complete!');
    console.log('⚠️  Don\'t forget to rebuild the framework with: bun run build');
  } catch (error) {
    console.error('❌ Error updating versions:', error);
    process.exit(1);
  }
}

// Run the script
main();
