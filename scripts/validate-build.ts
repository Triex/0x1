/**
 * Build Validation Script - Optimized
 * Ensures only essential framework files exist after optimized build
 */

import { existsSync } from 'fs';
import { join } from 'path';

const requiredFiles = [
  // Core framework files
  'dist/index.js',
  'dist/package.json',
  
  // JSX runtime files
  'dist/jsx-runtime.js',
  'dist/jsx-dev-runtime.js',
  
  // Essential core module files only
  'dist/core/hooks.js',
  'dist/core/component.js',
  'dist/core/navigation.js',
  'dist/core/error-boundary.js',
  
  // 0x1 router
  'dist/core/router.js',
  
  // 0x1 store
  'dist/core/store.js',
  
  // Essential type definitions only
  'dist/types/index.d.ts',
  'dist/types/jsx.d.ts',
  'dist/types/jsx-runtime.d.ts',
];

const optionalFiles = [
  // These files may or may not exist depending on build configuration
  'dist/types/0x1.d.ts',
];

// Files that should NOT exist in optimized build
const forbiddenFiles = [
  'dist/templates/',
  'dist/node_modules/',
  'dist/0x1/',
  'dist/browser/',
  'dist/error-boundary.js', // Should only be in core/
  'dist/react-shim.js',
  'dist/core/suspense.js',
  'dist/core/pwa.js',
  'dist/core/env.js',
  'dist/core/jsx-types.js',
];

async function validateBuild() {
  console.log('🔍 Validating optimized build output...');
  
  const missingFiles: string[] = [];
  const missingOptional: string[] = [];
  const unexpectedFiles: string[] = [];
  
  // Check required files
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      missingFiles.push(file);
    }
  }
  
  // Check optional files
  for (const file of optionalFiles) {
    if (!existsSync(file)) {
      missingOptional.push(file);
    }
  }
  
  // Check for forbidden files/directories
  for (const file of forbiddenFiles) {
    if (existsSync(file)) {
      unexpectedFiles.push(file);
    }
  }
  
  // Report results
  if (missingFiles.length > 0) {
    console.error('❌ Build validation failed! Missing required files:');
    missingFiles.forEach(file => console.error(`  - ${file}`));
    process.exit(1);
  }
  
  if (unexpectedFiles.length > 0) {
    console.warn('⚠️ Unexpected files found (build not optimized):');
    unexpectedFiles.forEach(file => console.warn(`  - ${file}`));
  }
  
  if (missingOptional.length > 0) {
    console.warn('⚠️ Missing optional files:');
    missingOptional.forEach(file => console.warn(`  - ${file}`));
  }
  
  // Validate package.json exports
  const distPackageJson = JSON.parse(await Bun.file('dist/package.json').text());
  const mainFile = distPackageJson.main;
  
  if (!existsSync(join('dist', mainFile))) {
    console.error(`❌ Main file ${mainFile} not found!`);
    process.exit(1);
  }
  
  // Calculate and report bundle sizes
  const indexSize = (await Bun.file('dist/index.js').arrayBuffer()).byteLength;
  const jsxRuntimeSize = (await Bun.file('dist/jsx-runtime.js').arrayBuffer()).byteLength;
  
  console.log('✅ Build validation passed!');
  console.log(`📦 Optimized framework built successfully:`);
  console.log(`  • Required files: ${requiredFiles.length - missingFiles.length}/${requiredFiles.length}`);
  console.log(`  • Main bundle: ${(indexSize / 1024).toFixed(1)} KB`);
  console.log(`  • JSX runtime: ${(jsxRuntimeSize / 1024).toFixed(1)} KB`);
  
  if (unexpectedFiles.length === 0) {
    console.log('🎯 Build is fully optimized - no unnecessary files found');
  }
}

validateBuild().catch(err => {
  console.error('💥 Build validation error:', err);
  process.exit(1);
}); 