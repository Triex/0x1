/**
 * 0x1 Framework Build Script
 * This script builds the 0x1 framework with proper TypeScript and JSX support
 */

import { join, resolve } from 'path';
// Using Bun's native file APIs instead of fs

/**
 * Format file size in a human-readable way
 */
function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

const rootDir = resolve(import.meta.dir, '..');
const srcDir = join(rootDir, 'src');
const distDir = join(rootDir, 'dist');

async function buildFramework() {
  console.log('🚀 Building 0x1 framework...');
  
  try {
    // Ensure dist directory exists
    // Check if directory exists and create if it doesn't
    const distDirInfo = Bun.file(distDir);
    if (!(await distDirInfo.exists())) {
      // Use Bun's spawnSync for mkdir as Bun doesn't have a direct mkdir API yet
      Bun.spawnSync(['mkdir', '-p', distDir]);
    }
    
    // Build the TypeScript files including JSX/TSX support
    console.log('📦 Building TypeScript with TSX support...');
    
    // Run the build command using Bun's direct command execution
    console.log('Running TypeScript compiler with bun...');
    
    try {
      // Execute TypeScript compiler using bun directly
      const tsResult = Bun.spawnSync([
        'bun', 'tsc', 
        '--project', 'tsconfig.json',
        '--outDir', distDir,
        '--declaration', 
        '--emitDeclarationOnly'
      ], {
        cwd: rootDir,
      });
      
      if (tsResult.exitCode !== 0) {
        console.error(`TypeScript compilation failed with exit code ${tsResult.exitCode}`);
        // Simple fix: cast to any to avoid the 'never' type issue
        const stderr = tsResult.stderr as any;
        if (stderr) console.error(stderr.toString());
        process.exit(1);
      }
      
      console.log('TypeScript declarations generated successfully.');
    } catch (error) {
      console.error('TypeScript compilation error:', error);
      process.exit(1);
    }
    
    // We'll use Bun's build API for the bundling in the next step
    console.log('Preparing for bundle optimization...');
    
    // Build the JS files with Bun's build API using optimizations for smaller bundle size
    console.log('Building optimized bundle...');
    const result = await Bun.build({
      entrypoints: [join(srcDir, 'index.ts')],
      outdir: distDir,
      target: 'browser',
      format: 'esm',
      minify: true, // Enable minification
      sourcemap: 'external',
      // Note: treeShaking is automatically applied by Bun
      splitting: false, // Disable code splitting for smaller bundle
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      // Use tsconfig for JSX configuration
    });
    
    if (result.success) {
      // Get the output file stats and report bundle size
      const outputPath = join(distDir, 'index.js');
      
      // Use Node's fs module to get file size
      const { stat } = await import('fs/promises');
      const bundleStat = await stat(outputPath);
      const bundleSize = bundleStat.size;
      
      // Format the size for display
      const formattedSize = formatSize(bundleSize);
      const compressedSize = Math.round(bundleSize * 0.3); // Estimate gzipped size at 30%
      const formattedCompressedSize = formatSize(compressedSize);
      
      console.log('\n📦 Framework bundle information:');
      console.log(`  • Bundle size: ${formattedSize} (${bundleSize} bytes)`);
      console.log(`  • Estimated compressed: ${formattedCompressedSize} (${compressedSize} bytes)`);
      console.log(`  • Ratio: ${Math.round((compressedSize / bundleSize) * 100)}% (${(bundleSize / compressedSize).toFixed(1)}x reduction)\n`);
      
      console.log('✅ TypeScript build successful');
    } else {
      console.error('❌ TypeScript build failed');
      process.exit(1);
    }
    
    // Copy type definitions
    console.log('📄 Copying type definitions...');
    // Use Bun's file APIs for copying
    const typeDefSource = Bun.file(join(srcDir, '0x1.d.ts'));
    await Bun.write(join(distDir, '0x1.d.ts'), await typeDefSource.text());
    
    // Copy types directory using Bun's spawn for recursive copy
    Bun.spawnSync(['cp', '-r', join(srcDir, 'types'), join(distDir, 'types')]);
    
    // Copy template files
    console.log('🧩 Copying templates...');
    const templatesDir = join(rootDir, 'templates');
    const templatesDirFile = Bun.file(templatesDir);
    if (await templatesDirFile.exists()) {
      // Use Bun's spawn for recursive directory copy
      Bun.spawnSync(['cp', '-r', templatesDir, join(distDir, 'templates')]);
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
