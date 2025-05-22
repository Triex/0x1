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

import { existsSync } from 'fs'; // Keep for compatibility
import { join, resolve } from 'path';

// Get the project root directory
const ROOT_DIR = resolve(import.meta.dir, '..');

// Get or update the main package.json version
async function getMainVersion(newVersion?: string): Promise<string> {
  const packageJsonPath = join(ROOT_DIR, 'package.json');
  // Use Bun's native file API for better performance
  const packageJson = JSON.parse(await Bun.file(packageJsonPath).text());
  
  // If a new version is provided, update the main package.json
  if (newVersion) {
    console.log(`📦 Updating main package.json from ${packageJson.version} to ${newVersion}`);
    packageJson.version = newVersion;
    // Use Bun's native file API for better performance
    await Bun.write(
      packageJsonPath, 
      JSON.stringify(packageJson, null, 2) + '\n'
    );
  }
  
  return packageJson.version;
}

// Update all template package.json files
async function updateTemplateVersions(version: string): Promise<void> {
  const templatesDir = join(ROOT_DIR, 'templates');
  const templateTypes = ['minimal', 'standard', 'full'];
  const languageTypes = ['typescript', 'javascript'];
  
  // Update all template package.json files
  for (const type of templateTypes) {
    // For each template type (minimal, standard, full), check for package.json
    const directTemplatePath = join(templatesDir, type);
    const directPackageJsonPath = join(directTemplatePath, 'package.json');
    
    // Check for direct package.json in the template directory
    if (existsSync(directPackageJsonPath)) {
      console.log(`Updating ${type}/package.json (minimal structure)`);
      await updatePackageJsonDependencies(directPackageJsonPath, version);
    } else {
      console.log(`Warning: No package.json found at ${directPackageJsonPath}`);
    }
    
    // For backwards compatibility, also check legacy nested structure
    // but log it so we're aware of old structures that might need updating
    for (const language of languageTypes) {
      const nestedTemplatePath = join(templatesDir, type, language);
      
      if (existsSync(nestedTemplatePath)) {
        const packageJsonPath = join(nestedTemplatePath, 'package.json');
        
        if (existsSync(packageJsonPath)) {
          console.log(`Updating ${type}/${language}/package.json (legacy structure)`);
          await updatePackageJsonDependencies(packageJsonPath, version);
        }
      }
    }
  }
}

// Helper function to update package.json dependencies
async function updatePackageJsonDependencies(packageJsonPath: string, version: string): Promise<void> {
  // Read and parse package.json
  // Use Bun's native file API for better performance
  const packageJsonContent = await Bun.file(packageJsonPath).text();
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
  // Use Bun's native file API for better performance
  await Bun.write(
    packageJsonPath, 
    JSON.stringify(packageJson, null, 2) + '\n'
  );
}

// Update hardcoded version references in the CLI code
async function updateCliVersions(version: string): Promise<void> {
  const cliNewCommandPath = join(ROOT_DIR, 'src/cli/commands/new.ts');
  const cliIndexPath = join(ROOT_DIR, 'src/cli/index.ts');
  const jsxTranspilerPath = join(ROOT_DIR, 'src/cli/commands/jsx-transpiler.ts');
  
  // Update new.ts file
  if (existsSync(cliNewCommandPath)) {
    console.log('Updating CLI version references in new.ts');
    
    // Read the file content
    // Use Bun's native file API for better performance
    let cliContent = await Bun.file(cliNewCommandPath).text();
    
    // Simplify to direct replacement for the specific pattern in new.ts
    cliContent = cliContent.replace(
      /"0x1":\s*['"](\^|\*)[0-9.]+['"].*$/m,
      `"0x1": '^${version}' // Use current version with caret for compatibility`
    );
    
    // Backup approach - try exact string replacement if needed
    const exactPattern = `"0x1": '^0.0.40'`;
    if (cliContent.includes(exactPattern)) {
      cliContent = cliContent.replace(
        exactPattern,
        `"0x1": '^${version}'`
      );
    }
    
    // Replace 0x1-store version
    cliContent = cliContent.replace(
      /'0x1-store': '\^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?'/g,
      `'0x1-store': '^${version}'`
    );
    
    // Write the updated content
    // Use Bun's native file API for better performance
    await Bun.write(cliNewCommandPath, cliContent);
  }
  
  // Update index.ts file to update the CLI banner version
  if (existsSync(cliIndexPath)) {
    console.log('Updating CLI banner version in index.ts');
    
    // Read the file content
    // Use Bun's native file API for better performance
    let indexContent = await Bun.file(cliIndexPath).text();
    
    // Replace version in banner message and in the fallback value
    // First, check if we're using dynamic version
    if (indexContent.includes('process.env.npm_package_version || ')) {
      // Replace the fallback version in the dynamic version code
      indexContent = indexContent.replace(
        /const packageVersion = process\.env\.npm_package_version \|\| '[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?';/g,
        `const packageVersion = process.env.npm_package_version || '${version}';`
      );
    } else {
      // Handle legacy hardcoded version format
      indexContent = indexContent.replace(
        /logger\.info\(`Running 0x1 CLI v[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)? - The ultra-minimal TypeScript framework`\);/g,
        `logger.info(\`Running 0x1 CLI v${version} - The ultra-minimal TypeScript framework\`);`
      );
    }
    
    // Write the updated content
    // Use Bun's native file API for better performance
    await Bun.write(cliIndexPath, indexContent);
  }
  
  // Update JSX transpiler version reference
  if (existsSync(jsxTranspilerPath)) {
    console.log('Updating JSX transpiler version reference');
    
    // Read the file content
    let transpilerContent = await Bun.file(jsxTranspilerPath).text();
    
    // Replace version in the JSX runtime header
    transpilerContent = transpilerContent.replace(
      /0x1 Framework - JSX Runtime \(v[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?\)/g,
      `0x1 Framework - JSX Runtime (v${version})`
    );
    
    // Write the updated content
    await Bun.write(jsxTranspilerPath, transpilerContent);
  }
}

// Update version in README.md file
async function updateReadmeVersion(version: string): Promise<void> {
  const readmePath = join(ROOT_DIR, 'README.md');
  
  if (existsSync(readmePath)) {
    console.log('Updating version in README.md');
    
    // Read the README content
    let readmeContent = await Bun.file(readmePath).text();
    
    // Replace version in README.md
    readmeContent = readmeContent.replace(
      /Current version: \*\*[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?\*\*/g,
      `Current version: **${version}**`
    );
    
    // Write updated content
    // Use Bun's native file API for better performance
    await Bun.write(readmePath, readmeContent);
  }
}

// Main function
async function main(): Promise<void> {
  try {
    console.log('🔄 Syncing versions across the codebase...');
    
    // Check if a version argument is provided
    const newVersion = process.argv[2];
    
    // Get or update the version in main package.json
    const version = await getMainVersion(newVersion);
    console.log(`📦 Current version: ${version}`);
    
    // Update all template versions
    await updateTemplateVersions(version);
    
    // Update CLI code references
    await updateCliVersions(version);
    
    // Update README.md version
    await updateReadmeVersion(version);
    
    console.log('✅ Version update complete!');
    console.log('⚠️  Don\'t forget to rebuild the framework with: bun run build');
  } catch (error) {
    console.error('❌ Error updating versions:', error);
    process.exit(1);
  }
}

// Run the script
main();
