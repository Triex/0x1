/**
 * 0x1 Framework Build Script
 * This script builds the 0x1 framework with proper TypeScript and JSX support
 */

import { join, resolve } from 'path';
import fs from 'fs';

const rootDir = resolve(import.meta.dir, '..');
const srcDir = join(rootDir, 'src');
const distDir = join(rootDir, 'dist');

async function buildFramework() {
  console.log('🚀 Building 0x1 framework...');
  
  try {
    // Ensure dist directory exists
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Build the TypeScript files including JSX/TSX support
    console.log('📦 Building TypeScript with TSX support...');
    
    // Run the build command using Bun.spawn
    const build = Bun.spawn([
      'bunx', 'tsc', 
      '--project', 'tsconfig.json',
      '--outDir', distDir,
      '--declaration', 
      '--emitDeclarationOnly'
    ], {
      cwd: rootDir,
      stdio: ['inherit', 'inherit', 'inherit']
    });
    
    const buildResult = await build.exited;
    
    if (buildResult !== 0) {
      console.error('❌ TypeScript declaration build failed');
      process.exit(1);
    }
    
    // Build the JS files with Bun's build API
    const result = await Bun.build({
      entrypoints: [join(srcDir, 'index.ts')],
      outdir: distDir,
      target: 'browser',
      format: 'esm',
      minify: false,
      sourcemap: 'external',
      // Use tsconfig for JSX configuration
    });
    
    if (result.success) {
      console.log('✅ TypeScript build successful');
    } else {
      console.error('❌ TypeScript build failed');
      process.exit(1);
    }
    
    // Copy type definitions
    console.log('📄 Copying type definitions...');
    fs.cpSync(join(srcDir, '0x1.d.ts'), join(distDir, '0x1.d.ts'));
    fs.cpSync(join(srcDir, 'types'), join(distDir, 'types'), { recursive: true });
    
    // Copy template files
    console.log('🧩 Copying templates...');
    const templatesDir = join(rootDir, 'templates');
    if (fs.existsSync(templatesDir)) {
      fs.cpSync(templatesDir, join(distDir, 'templates'), { recursive: true });
    }
    
    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed with error:', error);
    process.exit(1);
  }
}

// Run the build
buildFramework().catch(err => {
  console.error('💥 Unhandled error during build:', err);
  process.exit(1);
});
