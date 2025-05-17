#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';

/**
 * Build script for the 0x1 Minimal JavaScript template
 */
async function main() {
  console.log('🔨 Building application...');
  
  try {
    // Copy JavaScript files to the correct location
    console.log('📦 Processing JavaScript files...');
    
    const jsFiles = [
      './src/app.js'
    ];
    
    for (const jsFile of jsFiles) {
      try {
        // Check if file exists
        if (!fs.existsSync(jsFile)) {
          console.log(`⚠️ File ${jsFile} not found, skipping`);
          continue;
        }
        
        const outputFile = jsFile.replace('./src/', './');
        console.log(`Copying ${jsFile} to ${outputFile}`);
        
        // Read the source file
        const source = await Bun.file(jsFile).text();
        
        // Ensure the output directory exists
        const outputDir = path.dirname(outputFile);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write the output
        fs.writeFileSync(outputFile, source);
        console.log(`✅ Successfully processed ${jsFile}`);
      } catch (error) {
        console.error(`❌ Error processing ${jsFile}:`, error);
      }
    }
    
    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

main();
