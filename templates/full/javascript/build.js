#!/usr/bin/env bun
/* global Bun */

import fs from 'fs';
import path from 'path';

/**
 * Build script for the 0x1 Full JavaScript template
 */
async function main() {
  console.log('🔨 Building full JavaScript application...');
  
  try {
    // Process JavaScript files
    console.log('📦 Processing JavaScript files...');
    
    // Run CSS build script first
    console.log('🎨 Running CSS build script...');
    await Bun.spawn(['bun', 'run', 'build-css.js'], {
      stdout: 'inherit',
      stderr: 'inherit'
    });
    
    // List of files to copy/process
    const jsFiles = [
      './app.js',
      './lib/*.js',
      './components/*.js',
      './pages/*.js',
      './store/*.js'
    ];
    
    // Copy all JS files to dist directory
    const distDir = path.join(process.cwd(), 'dist');
    
    // Create dist directory if it doesn't exist
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Copy index.html
    if (fs.existsSync('index.html')) {
      fs.copyFileSync('index.html', path.join(distDir, 'index.html'));
      console.log('✅ Copied index.html to dist/');
    }
    
    // Copy public directory
    if (fs.existsSync('public')) {
      const publicDist = path.join(distDir, 'public');
      if (!fs.existsSync(publicDist)) {
        fs.mkdirSync(publicDist, { recursive: true });
      }
      copyDirSync('public', publicDist);
      console.log('✅ Copied public/ directory to dist/public/');
    }
    
    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Helper function to copy directories recursively
function copyDirSync(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

main();
