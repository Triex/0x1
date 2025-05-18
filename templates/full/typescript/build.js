#!/usr/bin/env bun
/* global Bun */

import fs from 'fs';
import path from 'path';

/**
 * Build script that transpiles TypeScript to browser-compatible JavaScript
 */
async function main() {
  console.log('🔨 Building application with browser-compatible output...');
  
  try {
    // First transpile TypeScript files
    console.log('📦 Compiling TypeScript files...');
    
    const tsFiles = [
      './app.ts',
      './sw-register.ts'
    ];
    
    // Initialize Bun's transpiler once for all files
    const transpiler = new Bun.Transpiler({
      loader: 'ts',
      target: 'browser',
      minify: false
    });
    
    for (const tsFile of tsFiles) {
      try {
        // Check if file exists
        if (!fs.existsSync(tsFile)) {
          console.log(`⚠️ File ${tsFile} not found, skipping`);
          continue;
        }
        
        const outputFile = tsFile.replace('.ts', '.js');
        console.log(`Compiling ${tsFile} to ${outputFile}`);
        
        // Read the source file
        const source = await Bun.file(tsFile).text();
        
        // Use Bun's built-in transpiler
        const result = transpiler.transformSync(source);
        
        // Convert ES modules to regular browser JS by removing import/export statements
        const browserJS = result.code
          .replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '// ES module imports removed for browser compatibility\n')
          .replace(/export\s+/g, '');
        
        // Write the output
        fs.writeFileSync(outputFile, browserJS);
        console.log(`✅ Successfully compiled ${tsFile}`);
      } catch (error) {
        console.error(`❌ Error compiling ${tsFile}:`, error);
      }
    }
    
    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

main();
