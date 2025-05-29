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
  const templateTypes = ['minimal', 'standard', 'full', 'crypto-dash'];
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
  // const jsxTranspilerPath = join(ROOT_DIR, 'src/cli/commands/jsx-transpiler.ts');
  
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
    
    // Replace version in CLI_VERSION constant
    indexContent = indexContent.replace(
      /const CLI_VERSION = process\.env\.npm_package_version \|\| '[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?';/g,
      `const CLI_VERSION = process.env.npm_package_version || '${version}';`
    );
    
    // Replace version in banner message if not using the CLI_VERSION variable
    if (!indexContent.includes('logger.info(`Running 0x1 CLI v${CLI_VERSION}')) {
      indexContent = indexContent.replace(
        /logger\.info\(`Running 0x1 CLI v[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)? - The ultra-minimal TypeScript framework`\);/g,
        `logger.info(\`Running 0x1 CLI v${version} - The ultra-minimal TypeScript framework\`);`
      );
    }
    
    // Write the updated content
    // Use Bun's native file API for better performance
    await Bun.write(cliIndexPath, indexContent);
  }
  
  // // Update JSX transpiler version reference
  // if (existsSync(jsxTranspilerPath)) {
  //   console.log('Updating JSX transpiler version reference');
    
  //   // Read the file content
  //   let transpilerContent = await Bun.file(jsxTranspilerPath).text();
    
  //   // Replace version in the JSX runtime header
  //   transpilerContent = transpilerContent.replace(
  //     /0x1 Framework - JSX Runtime \(v[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?\)/g,
  //     `0x1 Framework - JSX Runtime (v${version})`
  //   );
    
  //   // Write the updated content
  //   await Bun.write(jsxTranspilerPath, transpilerContent);
  // }
}

// Update version in README.md file
async function updateReadmeVersion(version: string): Promise<void> {
  // Debug helper function to show exact string content for debugging
  function showExactString(str: string): string {
    return JSON.stringify(str);
  }
  const readmePath = join(ROOT_DIR, 'README.md');
  
  if (existsSync(readmePath)) {
    console.log('Updating version in README.md');
    
    // Read the README content
    let readmeContent = await Bun.file(readmePath).text();
    const originalContent = readmeContent; // Store original for comparison
    let updatedCount = 0;
    
    // Define all version patterns with descriptive names
    const patterns = [
      {
        name: "Current State Headers",
        // This matches headers like: ### Current State (v0.0.176)
        regex: /(### Current State \(v)[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?(\))/g,
        replacement: `$1${version}$2`
      },
      {
        name: "Current State Headers Exact",
        // Exact match for the specific header in README.md
        regex: /### Current State \(v0\.0\.176\)/g,
        replacement: `### Current State (v${version})`
      },
      {
        name: "Legacy Current Version",
        // This matches explicit version references like: Current version: **0.0.176**
        regex: /Current version: \*\*[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?\*\*/g,
        replacement: `Current version: **${version}**`
      },
      {
        name: "Bun Add Commands",
        // This matches commands like: bun add 0x1@0.0.176
        regex: /bun add 0x1@[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?/g,
        replacement: `bun add 0x1@${version}`
      },
      {
        name: "NPM Install Commands",
        // This matches commands like: npm install 0x1@0.0.176
        regex: /npm install 0x1@[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?/g,
        replacement: `npm install 0x1@${version}`
      },
      {
        name: "NPX Commands",
        // This matches commands like: npx 0x1@0.0.176
        regex: /npx 0x1@[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?/g,
        replacement: `npx 0x1@${version}`
      },
      {
        name: "Single Quote Dependencies",
        // This matches code like: '0x1': '^0.0.176'
        regex: /'0x1':\s*'\^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?'/g,
        replacement: `'0x1': '^${version}'`
      },
      {
        name: "Double Quote Dependencies",
        // This matches code like: "0x1": "^0.0.176"
        regex: /"0x1":\s*"\^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?"\s*/g,
        replacement: `"0x1": "^${version}"`
      },
      {
        name: "Config Version Examples",
        // This matches config like: version: '0.0.176',
        regex: /version:\s*['"][0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?['"]\s*,/g,
        replacement: `version: '${version}',`
      },
      {
        name: "JSX Runtime Header",
        // This matches comments like: 0x1 Framework - JSX Runtime (v0.0.176)
        regex: /(0x1 Framework - JSX Runtime \(v)[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?(\))/g,
        replacement: `$1${version}$2`
      },
      {
        name: "Any Other Version",
        // Generic catch-all for any other version mentions like v0.0.176 or 0.0.176
        regex: /\bv?[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?\b/g,
        replacement: function(match: string): string {
          // Only replace if it's a complete version number (not part of something else)
          // and doesn't have context we want to preserve
          if (match.startsWith('v')) {
            return `v${version}`;
          }
          return version;
        },
        // This pattern is dangerous as it might replace versions we don't want to replace
        // Only apply it to specific contexts
        contexts: [
          '0x1 version',
          'framework version',
          'current release',
          'latest version'
        ]
      }
    ];
    
    // Process each pattern
    for (const pattern of patterns) {
      // Skip the catch-all pattern for now (we'll handle it separately)
      if (pattern.name === "Any Other Version") continue;
      
      // Check if the pattern exists in the content
      if (readmeContent.match(pattern.regex)) {
        // Store the original for comparison
        const beforeReplace = readmeContent;
        
        // Apply the replacement
        if (typeof pattern.replacement === 'function') {
          readmeContent = readmeContent.replace(pattern.regex, pattern.replacement as (substring: string, ...args: any[]) => string);
        } else {
          readmeContent = readmeContent.replace(pattern.regex, pattern.replacement as string);
        }
        
        // Count how many replacements were made
        const replacementCount = (beforeReplace.match(pattern.regex) || []).length;
        
        if (beforeReplace !== readmeContent) {
          updatedCount += replacementCount;
          console.log(`  - Updated ${replacementCount} ${pattern.name} to use version ${version}`);
        }
      }
    }
    
    // Handle the catch-all pattern carefully if we didn't find any other patterns
    if (updatedCount === 0) {
      const catchAllPattern = patterns.find(p => p.name === "Any Other Version");
      if (catchAllPattern && catchAllPattern.contexts) {
        for (const context of catchAllPattern.contexts) {
          // Create a regex that looks for the context and a version number nearby
          const contextRegex = new RegExp(`${context}[^\n]*?\b(v?[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?)\b`, 'gi');
          
          // Find and replace within this context
          readmeContent = readmeContent.replace(contextRegex, function(match: string, versionMatch: string) {
            updatedCount++;
            console.log(`  - Updated version in context "${context}" from ${versionMatch} to ${version}`);
            return match.replace(versionMatch, versionMatch.startsWith('v') ? `v${version}` : version);
          });
        }
      }
    }
    
    // Try direct string replacement as a fallback for specific patterns
    // This is a more targeted approach for known patterns that might be hard to match with regex
    if (updatedCount === 0) {
      console.log('Attempting direct string replacement for known patterns...');
      
      // Look for the Current State header specifically
      const currentStateStr = "### Current State (v0.0.176)";
      if (readmeContent.includes(currentStateStr)) {
        const newCurrentStateStr = `### Current State (v${version})`;
        readmeContent = readmeContent.replace(currentStateStr, newCurrentStateStr);
        updatedCount++;
        console.log(`  - Updated Current State header from ${currentStateStr} to ${newCurrentStateStr}`);
      }
    }
    
    // Debug version patterns if nothing was updated after direct replacement attempts
    if (updatedCount === 0) {
      console.log('\n\u26a0\ufe0f Unable to find version patterns. Debug information:');
      
      // Check for and log any version-like patterns in the README
      const versionPatternDebug = /\b(v?[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+\.[0-9]+)?)\b/g;
      let match: RegExpExecArray | null;
      
      // Define our match info type
      interface VersionMatch {
        version: string;
        context: string;
        position: number;
      }
      
      const versionMatches: VersionMatch[] = [];
      
      while ((match = versionPatternDebug.exec(readmeContent)) !== null) {
        // Get some context around the match for better debugging
        const start = Math.max(0, match.index - 30);
        const end = Math.min(readmeContent.length, match.index + match[0].length + 30);
        const context = readmeContent.substring(start, end).replace(/\n/g, ' ');
        
        versionMatches.push({
          version: match[1],
          context: `...${context}...`,
          position: match.index
        });
      }
      
      if (versionMatches.length > 0) {
        console.log('  Found these version-like patterns in README.md:');
        versionMatches.forEach((v, i) => {
          if (i < 10) { // Limit to 10 examples to avoid cluttering the output
            console.log(`  ${i+1}. ${v.version} in context: ${v.context}`);
          }
        });
        
        if (versionMatches.length > 10) {
          console.log(`  ...and ${versionMatches.length - 10} more`);
        }
        
        console.log('\n  Consider updating the patterns in the script to match these specific occurrences.');
      } else {
        console.log('  No version-like patterns found in README.md. Please verify the file content.');
      }
    }
    
    // Check if content was actually modified
    if (originalContent !== readmeContent) {
      // Write updated content only if changes were made
      await Bun.write(readmePath, readmeContent);
      
      if (updatedCount > 0) {
        console.log(`\u2705 README.md version references updated to ${version} (${updatedCount} instances)`);
      }
    } else {
      console.log(`\u26a0\ufe0f No changes made to README.md`);
    }
  } else {
    console.log(`\u26a0\ufe0f README.md not found at ${readmePath}`);
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
