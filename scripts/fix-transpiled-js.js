#!/usr/bin/env bun

/**
 * This script fixes JavaScript files output by TypeScript transpilation
 * to ensure no TypeScript syntax (especially type annotations) remains
 * 
 * It uses a series of regex replacements to clean up common TypeScript artifacts
 * that might be leaking into the JavaScript output
 */

import { join, resolve } from 'path';
import fs from 'fs';
// Import Bun explicitly to fix no-undef errors
import { write, file } from 'bun';

// Recursively find all JavaScript files in a directory
async function findJsFiles(directory) {
  const files = [];
  
  // Get all entries in the directory
  const entries = await fs.promises.readdir(directory, { withFileTypes: true });
  
  // Process each entry
  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively process subdirectories
      const subDirFiles = await findJsFiles(entryPath);
      files.push(...subDirFiles);
    } else if (entry.name.endsWith('.js')) {
      // Add JavaScript files to the list
      files.push(entryPath);
    }
  }
  
  return files;
}

// Fix TypeScript artifacts in a file
async function fixTypeScriptArtifacts(filePath) {
  try {
    // Read the file content
    let content = await file(filePath).text();
    const originalSize = content.length;
    
    // Array of fixes to apply
    const fixes = [
      // Remove type annotations (Property: Type)
      { pattern: /(\w+)\s*:\s*([\w\[\]<>|&'"{}]+);/g, replacement: "$1;" },
      
      // Remove interface definitions
      { pattern: /interface\s+\w+\s*\{[^}]*\}/g, replacement: "" },
      
      // Remove type declarations
      { pattern: /type\s+\w+\s*=\s*[^;]+;/g, replacement: "" },
      
      // Remove generics
      { pattern: /<[\w\s,[\]<>|&'"{}]+>/g, replacement: "" },
      
      // Fix function parameters with type annotations
      { pattern: /function\s+(\w+)\s*\(([^)]*)\)\s*:\s*[\w\[\]<>|&'"{}]+/g, replacement: "function $1($2)" },
      
      // Fix arrow functions with type annotations
      { pattern: /(\([^)]*\))\s*:\s*[\w\[\]<>|&'"{}]+\s*=>/g, replacement: "$1 =>" },
      
      // Remove parameter type annotations
      { pattern: /(\w+)\s*:\s*([\w[\]<>|&'"{}]+)(?=[,)])/g, replacement: "$1" },
      
      // Remove return type annotations from methods
      { pattern: /(\w+\s*\([^)]*\))\s*:\s*([\w\[\]<>|&'"{}]+)\s*\{/g, replacement: "$1 {" },
      
      // Remove 'as' type assertions
      { pattern: /\s+as\s+[\w\[\]<>|&'"{}]+/g, replacement: "" },
      
      // Remove namespaces
      { pattern: /namespace\s+\w+\s*\{/g, replacement: "{" },
      
      // Remove extends with generics
      { pattern: /extends\s+\w+<[\w\s,[\]<>|&'"{}]+>/g, replacement: "extends Object" },
      
      // Remove standalone type annotations (variable: Type)
      { pattern: /:\s*([\w\[\]<>|&'"{}]+)(?=\s*[=,);])/g, replacement: "" },
      
      // Clean up any resulting double semicolons
      { pattern: /;;/g, replacement: ";" },
      
      // Clean up empty blocks
      { pattern: /\{\s*\}/g, replacement: "{}" },
      
      // Clean up multiple consecutive empty lines
      { pattern: /\n\s*\n\s*\n/g, replacement: "\n\n" }
    ];
    
    // Apply each fix
    for (const fix of fixes) {
      content = content.replace(fix.pattern, fix.replacement);
    }
    
    // Write the fixed content back to the file
    await write(filePath, content);
    
    const newSize = content.length;
    const diff = originalSize - newSize;
    
    return {
      path: filePath,
      originalSize,
      newSize,
      diff,
      fixed: diff > 0
    };
  } catch (error) {
    console.error(`Error fixing file ${filePath}:`, error);
    return {
      path: filePath,
      error: String(error),
      fixed: false
    };
  }
}

async function main() {
  // Get the dist directory path
  const scriptDir = import.meta.dir;
  const rootDir = resolve(scriptDir, '..');
  const distDir = join(rootDir, 'dist');
  
  console.log(`🧹 Scanning for JavaScript files in ${distDir}...`);
  
  // Find all JavaScript files
  const jsFiles = await findJsFiles(distDir);
  console.log(`Found ${jsFiles.length} JavaScript files`);
  
  // Process each file
  let fixedCount = 0;
  let totalTypescriptArtifactsRemoved = 0;
  
  for (const file of jsFiles) {
    const result = await fixTypeScriptArtifacts(file);
    
    if (result.fixed) {
      fixedCount++;
      totalTypescriptArtifactsRemoved += result.diff;
      console.log(`✅ Fixed ${file.replace(distDir, '')} (removed ${result.diff} bytes of TypeScript artifacts)`);
    }
  }
  
  console.log(`\n🎉 Finished processing ${jsFiles.length} files`);
  console.log(`✅ Fixed ${fixedCount} files with TypeScript artifacts`);
  console.log(`🧹 Removed ${totalTypescriptArtifactsRemoved} bytes of TypeScript syntax`);
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
