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
      // Execute TypeScript compiler using bun directly with proper JSX settings
      const tsResult = Bun.spawnSync([
        'bun', 'tsc',
        '--project', 'tsconfig.json',
        '--jsx', 'react-jsx',
        '--jsxImportSource', '0x1',
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
    
    // First, copy all core modules to ensure they're available individually
    const coreDir = join(srcDir, 'core');
    const coreDistDir = join(distDir, 'core');
    
    // Create core directory in dist if it doesn't exist
    if (!(await Bun.file(coreDistDir).exists())) {
      Bun.spawnSync(['mkdir', '-p', coreDistDir]);
    }
    
    // Copy critical files from core to dist directly to ensure they're available
    const coreFiesList = [
      'router.js',
      'navigation.js',
      'component.js',
      'hooks.js',
      'store.js'
    ];
    
    // Also ensure the 0x1 directory exists for public module exports
    const frameworkDistDir = join(distDir, '0x1');
    if (!(await Bun.file(frameworkDistDir).exists())) {
      Bun.spawnSync(['mkdir', '-p', frameworkDistDir]);
    }
    
    for (const fileName of coreFiesList) {
      const sourceFile = join(coreDir, fileName);
      const destFile = join(coreDistDir, fileName);
      // Also define the destination in the 0x1 directory for public exports
      const destFile0x1 = join(frameworkDistDir, fileName);
      
      if (await Bun.file(sourceFile).exists()) {
        // Use a typed approach to get the content and write it
        const content = await Bun.file(sourceFile).text();
        await Bun.write(destFile, content);
        
        // Create a symlink in the 0x1 directory pointing to the core file
        // First, remove the file if it already exists
        if (await Bun.file(destFile0x1).exists()) {
          Bun.spawnSync(['rm', destFile0x1]);
        }
        
        // Create a relative symlink
        Bun.spawnSync(['ln', '-s', `../core/${fileName}`, destFile0x1]);
        
        console.log(`Transpiled and copied ${fileName} to dist/core/`);
        console.log(`Created symlink in dist/0x1/ -> ../core/${fileName}`);
      } else {
        // Try to look for the TypeScript version and transpile it
        const tsFile = sourceFile.replace(/\.js$/, '.ts');
        if (await Bun.file(tsFile).exists()) {
          console.log(`Transpiling ${fileName.replace(/\.js$/, '.ts')} to JS...`);
          const tempOut = join(srcDir, `.temp-${fileName}`);
          
          try {
            // Use Bun's build API directly with proper TypeScript transpilation
            const { success, logs } = await Bun.build({
              entrypoints: [tsFile],
              outdir: srcDir + '/temp',
              target: 'browser',
              format: 'esm',
              minify: false,
              sourcemap: 'none',
              define: {
                'process.env.NODE_ENV': '"production"'
              },
              // This is the key to ensuring TypeScript types are properly stripped
              loader: {
                '.ts': 'ts',
                '.tsx': 'tsx'
              }
            });
            
            if (success) {
              // Get the filename without path
              const baseName = tsFile.split('/').pop()?.replace('.ts', '.js') || '';
              const tempJsFile = join(srcDir, 'temp', baseName);
              
              // Read the transpiled content
              const jsContent = await Bun.file(tempJsFile).text();
              
              // Write directly to the destination
              await Bun.write(destFile, jsContent);
              
              // Clean up temp files
              Bun.spawnSync(['rm', '-rf', join(srcDir, 'temp')]);
            } else {
              console.warn(`Failed to build ${fileName.replace(/\.js$/, '.ts')}:`, logs.join('\n'));
              // Skip this file and continue with others
              continue;
            }
          } catch (error) {
            console.warn(`Error building ${fileName.replace(/\.js$/, '.ts')}:`, error);
            continue;
          }
        
          // File is already written directly, just create the symlink
          // Create a symlink in the 0x1 directory pointing to the core file
          // First, remove the file if it already exists
          if (await Bun.file(destFile0x1).exists()) {
            Bun.spawnSync(['rm', destFile0x1]);
          }
          
          // Create a relative symlink
          Bun.spawnSync(['ln', '-s', `../core/${fileName}`, destFile0x1]);
          
          console.log(`Transpiled and copied ${fileName} to dist/core/`);
          console.log(`Created symlink in dist/0x1/ -> ../core/${fileName}`);
        } else {
          console.warn(`⚠️ Failed to transpile ${fileName.replace(/\.js$/, '.ts')}`);
        }
      }
    }
    
    // Create 0x1 subdirectory in dist for compatibility
    const dist0x1Dir = join(distDir, '0x1');
    if (!(await Bun.file(dist0x1Dir).exists())) {
      Bun.spawnSync(['mkdir', '-p', dist0x1Dir]);
    }
    
    // Copy the router and navigation to 0x1/ directory for direct imports
    for (const fileName of ['router.js', 'navigation.js']) {
      const sourceFile = join(coreDistDir, fileName);
      const destFile = join(dist0x1Dir, fileName);
      
      if (await Bun.file(sourceFile).exists()) {
        const content = await Bun.file(sourceFile).text();
        await Bun.write(destFile, content);
        console.log(`Copied ${fileName} to dist/0x1/`);
      } else {
        console.warn(`⚠️ Cannot copy ${fileName} to 0x1/ - source file not found`);
      }
    }
    
    // Now build the main bundle as before
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
      
      try {
        // First, compile the main bundle with Bun's bundler
        console.log('📦 Bundling with Bun...');
        await Bun.build({
          entrypoints: [join(srcDir, 'index.ts')],
          outdir: distDir,
          format: 'esm',
          target: 'browser',
          minify: true,
          sourcemap: 'external',
          external: ['bun:ffi', 'bun:sqlite'],
        });
        
        // Then run TypeScript type checking and emit declarations
        console.log('📦 Compiling TypeScript with JSX support...');
        const tsResult = await Bun.spawn({
          cmd: ['bun', 'x', 'tsc', 
            '--project', 'tsconfig.json',
            '--jsx', 'react-jsx',
            '--jsxImportSource', '0x1',
            '--outDir', distDir,
            '--declaration',
            '--emitDeclarationOnly',
            '--noEmit', 'false'
          ],
          cwd: rootDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            NODE_ENV: 'production',
            FORCE_COLOR: '1'
          }
        });
        
        // Pipe the output to the current process
        const stdout = await new Response(tsResult.stdout).text();
        const stderr = await new Response(tsResult.stderr).text();
        
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        
        // Wait for the process to complete and get the exit code
        const exitCode = await tsResult.exited;
        
        if (exitCode !== 0) {
          console.error(`❌ TypeScript compilation failed with exit code ${exitCode}`);
          process.exit(exitCode);
        }
      } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
      }
      
      console.log('✅ TypeScript compilation successful!');
      
      // Copy type definitions after successful build
      console.log('📦 Copying type definitions...');
      const copyResult = await Bun.spawn({
        cmd: ['bun', 'run', '--bun', './scripts/copy-types.js'],
        cwd: rootDir,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      const copyStdout = await new Response(copyResult.stdout).text();
      const copyStderr = await new Response(copyResult.stderr).text();
      
      if (copyStdout) console.log(copyStdout);
      if (copyStderr) console.error(copyStderr);
      
      const copyExitCode = await copyResult.exited;
      
      if (copyExitCode === 0) {
        console.log('✅ Type definitions copied successfully!');
      } else {
        console.error(`❌ Failed to copy type definitions with exit code ${copyExitCode}`);
        process.exit(copyExitCode);
      }
    } else {
      console.error('❌ TypeScript build failed');
      process.exit(1);
    }
    
    // Copy type definitions
    console.log('📄 Copying type definitions...');
    // Use Bun's file APIs for copying from the new consolidated types directory
    const typesDir = join(rootDir, 'types');
    
    // Check if the types directory exists
    if (await Bun.file(typesDir).exists()) {
      // Copy the entire types directory to dist
      Bun.spawnSync(['mkdir', '-p', join(distDir, 'types')]);
      Bun.spawnSync(['cp', '-r', join(typesDir, '*'), join(distDir, 'types')]);
      
      // Also copy the main declaration file to the dist root for backward compatibility
      const mainTypeDefSource = join(typesDir, '0x1.d.ts');
      if (await Bun.file(mainTypeDefSource).exists()) {
        await Bun.write(join(distDir, '0x1.d.ts'), await Bun.file(mainTypeDefSource).text());
      }
    } else {
      console.warn('⚠️  Types directory not found at', typesDir);
    }
    
    // Copy template files
    console.log('🧩 Copying templates...');
    const templatesDir = join(rootDir, 'templates');
    const templatesDirFile = Bun.file(templatesDir);
    if (await templatesDirFile.exists()) {
      // Use Bun's spawn for recursive directory copy
      Bun.spawnSync(['cp', '-r', templatesDir, join(distDir, 'templates')]);
    }
    
    // Handle JSX runtime files - prioritize TypeScript version and build it
    console.log('📄 Generating JSX runtime files...');
    
    // Define JSX runtime file paths - both regular and dev versions
    const jsxRuntimeTS = join(srcDir, 'jsx-runtime.ts');
    const jsxRuntimeJS = join(srcDir, 'jsx-runtime.js');
    const jsxDevRuntimeTS = join(srcDir, 'jsx-dev-runtime.ts');
    const jsxDevRuntimeJS = join(srcDir, 'jsx-dev-runtime.js');
    
    // Set up distribution paths for both files
    const jsxRuntimeFileDist = join(distDir, 'jsx-runtime.js');
    const jsxDevRuntimeFileDist = join(distDir, 'jsx-dev-runtime.js');
    
    const jsxRuntimeDir0x1 = join(distDir, '0x1');
    const jsxRuntimeFile0x1 = join(jsxRuntimeDir0x1, 'jsx-runtime.js');
    const jsxDevRuntimeFile0x1 = join(jsxRuntimeDir0x1, 'jsx-dev-runtime.js');
    
    // Create 0x1 directory for imports from '0x1' package
    Bun.spawnSync(['mkdir', '-p', jsxRuntimeDir0x1]);
    
    let jsxRuntimeContent = '';
    
    // Try TypeScript version first (preferred - has proper typing)
    if (await Bun.file(jsxRuntimeTS).exists()) {
      try {
        // Transpile TS to JS using Bun directly
        console.log('Found TypeScript JSX runtime, transpiling it...');
        
        // Use direct output to the target destination to avoid temporary files
        const targetCliJsxRuntime = join(srcDir, 'cli', 'commands', 'utils', 'jsx-runtime.js');
        
        // Use Bun to build the TS file to JS with proper type stripping
        // Use Bun's build API directly with proper TypeScript transpilation
        try {
          // Use Bun's build function to transpile TypeScript directly to JS
          const { success, logs } = await Bun.build({
            entrypoints: [jsxRuntimeTS],
            outdir: srcDir + '/temp',
            target: 'browser',
            format: 'esm',
            minify: false,
            sourcemap: 'none',
            define: {
              'process.env.NODE_ENV': '"production"'
            },
            // This is the key part that ensures TypeScript types are properly stripped
            loader: {
              '.ts': 'ts',
              '.tsx': 'tsx'
            }
          });
          
          if (!success) {
            console.error('Failed to build JSX runtime:', logs.join('\n'));
            throw new Error('Failed to build JSX runtime');
          }
          
          // Read the transpiled JS content
          const tempJsxFile = join(srcDir, 'temp', 'jsx-runtime.js');
          jsxRuntimeContent = await Bun.file(tempJsxFile).text();
          
          // Write it to the target location
          await Bun.write(targetCliJsxRuntime, jsxRuntimeContent);
          
          // Clean up temp files
          Bun.spawnSync(['rm', '-rf', join(srcDir, 'temp')]);
          
          console.log('✅ JSX runtime file generated and saved to cli/commands/utils/');
        } catch (error) {
          console.error('Error building JSX runtime:', error);
          throw new Error('Failed to build JSX runtime');
        }
        
        // JSX runtime content is already set if successful
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ Error transpiling TypeScript JSX runtime:', errorMessage);
      }
    }
    
    // Fallback to JavaScript version if TypeScript transpilation failed
    if (!jsxRuntimeContent && await Bun.file(jsxRuntimeJS).exists()) {
      console.log('Using JavaScript JSX runtime');
      jsxRuntimeContent = await Bun.file(jsxRuntimeJS).text();
    }
    
    // If we have JSX runtime content, write it to the distribution files
    if (jsxRuntimeContent) {
      // Copy to root dist
      await Bun.write(jsxRuntimeFileDist, jsxRuntimeContent);
      
      // Copy to 0x1 subdirectory too
      await Bun.write(jsxRuntimeFile0x1, jsxRuntimeContent);
      
      console.log('✅ JSX runtime generated and copied to dist and dist/0x1');
    } else {
      console.error('❌ No JSX runtime found - neither TypeScript nor JavaScript version exists');
      throw new Error('Missing JSX runtime files');
    }
    
    // Now handle the JSX dev runtime file using a similar approach
    let jsxDevRuntimeContent = '';
    
    // Try TypeScript version of the JSX dev runtime
    if (await Bun.file(jsxDevRuntimeTS).exists()) {
      try {
        console.log('Found TypeScript JSX dev runtime, transpiling it...');
        
        // Use direct output to the target destination to avoid temporary files
        const targetCliJsxDevRuntime = join(srcDir, 'cli', 'commands', 'utils', 'jsx-dev-runtime.js');
        
        // Use Bun's build API directly with proper TypeScript transpilation
        try {
          // Use Bun's build function to transpile TypeScript directly to JS
          const { success, logs } = await Bun.build({
            entrypoints: [jsxDevRuntimeTS],
            outdir: srcDir + '/temp',
            target: 'browser',
            format: 'esm',
            minify: false,
            sourcemap: 'none',
            define: {
              'process.env.NODE_ENV': '"production"'
            },
            // This is the key part that ensures TypeScript types are properly stripped
            loader: {
              '.ts': 'ts',
              '.tsx': 'tsx'
            }
          });
          
          if (success) {
            // Read the transpiled JS content
            const tempJsxDevFile = join(srcDir, 'temp', 'jsx-dev-runtime.js');
            jsxDevRuntimeContent = await Bun.file(tempJsxDevFile).text();
            
            // Write it to the target location
            await Bun.write(targetCliJsxDevRuntime, jsxDevRuntimeContent);
            
            // Clean up temp files
            Bun.spawnSync(['rm', '-rf', join(srcDir, 'temp')]);
            
            console.log('✅ JSX dev runtime file generated and saved to cli/commands/utils/');
          } else {
            console.warn('Failed to build JSX dev runtime:', logs.join('\n'));
          }
        } catch (error) {
          console.warn('Error building JSX dev runtime:', error);
        }
        
        // jsxDevRuntimeContent is already set if successful, no need to read again
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ Error transpiling TypeScript JSX dev runtime:', errorMessage);
      }
    }
    
    // Fallback to JavaScript version if TypeScript transpilation failed
    if (!jsxDevRuntimeContent && await Bun.file(jsxDevRuntimeJS).exists()) {
      console.log('Using JavaScript JSX dev runtime');
      jsxDevRuntimeContent = await Bun.file(jsxDevRuntimeJS).text();
    }
    
    // If we have JSX dev runtime content, write it to the distribution files
    if (jsxDevRuntimeContent) {
      // Copy to root dist
      await Bun.write(jsxDevRuntimeFileDist, jsxDevRuntimeContent);
      
      // Copy to 0x1 subdirectory too
      await Bun.write(jsxDevRuntimeFile0x1, jsxDevRuntimeContent);
      
      console.log('✅ JSX dev runtime generated and copied to dist and dist/0x1');
    } else {
      // Just warn but don't fail the build if the dev runtime is missing
      console.warn('⚠️ No JSX dev runtime found - will use regular JSX runtime');
    }
    
    // Handle browser utilities such as live-reload script
    console.log('📄 Copying browser utilities (live-reload, etc.)');
    
    // Ensure browser directory exists in dist
    const distBrowserDir = join(distDir, 'browser');
    if (!(await Bun.file(distBrowserDir).exists())) {
      Bun.spawnSync(['mkdir', '-p', distBrowserDir]);
    }
    
    // Copy live-reload.js script
    const liveReloadSrcPath = join(srcDir, 'browser', 'live-reload.js');
    const liveReloadDestPath = join(distBrowserDir, 'live-reload.js');
    
    if (await Bun.file(liveReloadSrcPath).exists()) {
      await Bun.write(liveReloadDestPath, await Bun.file(liveReloadSrcPath).text());
      console.log('✅ Live-reload script copied to dist/browser/');
    } else {
      console.warn('⚠️ Live-reload script not found at', liveReloadSrcPath);
      
      // Create a minimal fallback version to prevent errors
      const minimalLiveReload = `/**
 * 0x1 Live Reload Script (Minimal Fallback)
 */
(function() {
  console.log('[0x1] Running in development mode ' + window.location.hostname);
})();`;
      await Bun.write(liveReloadDestPath, minimalLiveReload);
      console.log('✅ Created minimal fallback live-reload script');
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
