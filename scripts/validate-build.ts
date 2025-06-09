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
  
  // JSX runtime files (essential for framework)
  'dist/jsx-runtime.js',
  'dist/jsx-dev-runtime.js',
  
  // Essential core module files (now in /dist/ not /dist/core/)
  'dist/hooks.js',
  'dist/component.js',
  'dist/navigation.js',
  'dist/error-boundary.js',
  
  // Metadata and head management system
  'dist/metadata.js',
  'dist/head.js',
  
  // Client/server directives system
  'dist/directives.js',
  
  // PWA system
  'dist/pwa.js',
  
  // 0x1 router (built from 0x1-router package - still in core)
  'dist/core/router.js',
  
  // 0x1 store (built from 0x1-store package - still in core)
  'dist/core/store.js',
  
  // Essential type definitions only
  'dist/types/index.d.ts',
  'dist/types/jsx.d.ts',
  'dist/types/jsx-runtime.d.ts',
  'dist/types/link.d.ts',
];

const optionalFiles = [
  // These files may or may not exist depending on build configuration
  'dist/types/0x1.d.ts',
  'dist/link.js', // Link component
  'dist/core/tailwind-handler.js', // TailwindHandler (built from experimental package)
];

// Files that should NOT exist in optimized build
const forbiddenFiles = [
  'dist/templates/',
  'dist/node_modules/',
  'dist/0x1/',
  'dist/browser/',
  'dist/react-shim.js',
  'dist/core/suspense.js',
  'dist/core/env.js',
  'dist/core/jsx-types.js',
  'dist/jsx-templates.js', // Should not be in dist
  'dist/cli/', // CLI should not be in framework dist
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

  // // Validate 0x1-templates package build
  // console.log('🔍 Validating 0x1-templates package...');
  // const templatesFiles = [
  //   '0x1-templates/dist/index.js',
  //   '0x1-templates/package.json',
  //   '0x1-templates/minimal/',
  //   '0x1-templates/standard/',
  // ];
  
  // const missingTemplateFiles: string[] = [];
  // for (const file of templatesFiles) {
  //   if (!existsSync(file)) {
  //     missingTemplateFiles.push(file);
  //   }
  // }
  
  // if (missingTemplateFiles.length > 0) {
  //   console.error('❌ 0x1-templates package validation failed! Missing files:');
  //   missingTemplateFiles.forEach(file => console.error(`  - ${file}`));
  //   process.exit(1);
  // }
  
  // // Check if heavy templates exist (optional)
  // const heavyTemplates = ['0x1-templates/full/', '0x1-templates/crypto-dash/'];
  // const existingHeavyTemplates = heavyTemplates.filter(existsSync);
  
  // if (existingHeavyTemplates.length > 0) {
  //   console.log(`📦 Heavy templates available: ${existingHeavyTemplates.map(t => t.split('/')[1]).join(', ')}`);
  // }
  
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
  try {
    const distPackageJson = JSON.parse(await Bun.file('dist/package.json').text());
    const mainFile = distPackageJson.main;
    
    if (!existsSync(join('dist', mainFile))) {
      console.error(`❌ Main file ${mainFile} not found!`);
      process.exit(1);
    }
    
    // Validate JSX runtime exports
    const jsxRuntimeExport = distPackageJson.exports?.['./jsx-runtime']?.import;
    if (jsxRuntimeExport && !existsSync(join('dist', jsxRuntimeExport))) {
      console.error(`❌ JSX runtime export ${jsxRuntimeExport} not found!`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to validate package.json:', error);
    process.exit(1);
  }
  
  // Calculate and report bundle sizes
  try {
    // Helper function to get actual file size (handles redirects to hashed files)
    const getFileSize = async (filePath: string): Promise<number> => {
      if (!existsSync(filePath)) return 0;
      
      try {
        const content = await Bun.file(filePath).text();
        
        // Check if it's a redirect file (small and contains export from hashed file)
        if (content.length < 200 && content.includes('export') && content.includes('from')) {
          // Look for hashed file reference
          if (filePath.includes('index.js')) {
            const hashMatch = content.match(/index-([a-f0-9]+)\.js/);
            if (hashMatch) {
              const hashedPath = join('dist', `index-${hashMatch[1]}.js`);
              if (existsSync(hashedPath)) {
                const hashedContent = await Bun.file(hashedPath).text();
                return Buffer.byteLength(hashedContent, 'utf8');
              }
            }
          } else if (filePath.includes('jsx-runtime.js')) {
            const hashMatch = content.match(/jsx-runtime-([a-f0-9]+)\.js/);
            if (hashMatch) {
              const hashedPath = join('dist', `jsx-runtime-${hashMatch[1]}.js`);
              if (existsSync(hashedPath)) {
                const hashedContent = await Bun.file(hashedPath).text();
                return Buffer.byteLength(hashedContent, 'utf8');
              }
            }
          }
        }
        
        // Not a redirect file, return actual size
        return Buffer.byteLength(content, 'utf8');
      } catch {
        return 0;
      }
    };
    
    const indexSize = await getFileSize('dist/index.js');
    const jsxRuntimeSize = await getFileSize('dist/jsx-runtime.js');
    const jsxDevRuntimeSize = await getFileSize('dist/jsx-dev-runtime.js');
    
    console.log('✅ Build validation passed!');
    console.log(`📦 Optimized framework built successfully:`);
    console.log(`  • Required files: ${requiredFiles.length - missingFiles.length}/${requiredFiles.length}`);
    console.log(`  • Main bundle: ${(indexSize / 1024).toFixed(1)} KB`);
    console.log(`  • JSX runtime: ${(jsxRuntimeSize / 1024).toFixed(1)} KB`);
    console.log(`  • JSX dev runtime: ${(jsxDevRuntimeSize / 1024).toFixed(1)} KB`);
    console.log(`  • Total core size: ${((indexSize + jsxRuntimeSize + jsxDevRuntimeSize) / 1024).toFixed(1)} KB`);
    // console.log(`  • 0x1-templates: ${templatesFiles.length - missingTemplateFiles.length}/${templatesFiles.length} essential files`);
    
    if (unexpectedFiles.length === 0) {
      console.log('🎯 Build is fully optimized - no unnecessary files found');
    }
    
    console.log('✅ All packages validated successfully!');
  } catch (error) {
    console.error('❌ Failed to calculate bundle sizes:', error);
    process.exit(1);
  }
}

validateBuild().catch(err => {
  console.error('💥 Build validation error:', err);
  process.exit(1);
}); 