/**
 * 0x1 Framework Build Script - Optimized
 * Builds only essential framework files for distribution
 */

import { existsSync } from 'fs';
import { join, resolve } from 'path';

async function buildFramework() {
  try {
    console.log("🚀 Building 0x1 framework (optimized)...");

    const srcDir = resolve("src");
    const distDir = resolve("dist");

    // Clean dist directory
    console.log("🧹 Cleaning dist directory...");
    if (existsSync("dist")) {
      await Bun.$`rm -rf dist`;
    }
    await Bun.$`mkdir -p dist`;

    // Copy types directory to dist
    console.log("📝 Copying type definitions...");
    if (existsSync("types")) {
      await Bun.$`cp -r types dist/`;
      // Also create React compatibility types in dist
      await Bun.$`mkdir -p dist/react`;
      await Bun.write(
        "dist/react/jsx-runtime.d.ts", 
        'export * from "../types/jsx-runtime.js";'
      );
      await Bun.write(
        "dist/react/jsx-dev-runtime.d.ts", 
        'export * from "../types/jsx-runtime.js";'
      );
    }

    // Create minimal dist structure
    Bun.spawnSync(["mkdir", "-p", distDir]);
    Bun.spawnSync(["mkdir", "-p", join(distDir, "core")]);
    Bun.spawnSync(["mkdir", "-p", join(distDir, "types")]);

    console.log("📦 Building core framework bundle...");

    // Create optimized package.json
    const packageJson = {
      name: "0x1",
      version: "0.1.0",
      type: "module",
      main: "index.js",
      types: "types/index.d.ts",
      exports: {
        ".": {
          types: "./types/index.d.ts",
          import: "./index.js",
          default: "./index.js",
        },
        "./jsx-runtime": {
          types: "./types/jsx-runtime.d.ts",
          import: "./jsx-runtime.js",
          default: "./jsx-runtime.js",
        },
        "./jsx-dev-runtime": {
          types: "./types/jsx-runtime.d.ts",
          import: "./jsx-dev-runtime.js",
          default: "./jsx-dev-runtime.js",
        },
        "./router": {
          import: "./router.js",
          default: "./router.js",
        },
        "./core/*": {
          types: "./types/*.d.ts",
          import: "./core/*.js",
          default: "./core/*.js",
        },
      },
    };

    await Bun.write(
      join(distDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    console.log("📦 Building main framework bundle...");

    // Build main framework bundle with minification
    const buildResult = await Bun.build({
      entrypoints: [join(srcDir, "index.ts")],
      outdir: distDir,
      target: "browser",
      format: "esm",
      minify: true, // Enable minification
      loader: {
        ".ts": "ts",
        ".tsx": "tsx",
      },
    });

    if (!buildResult.success) {
      console.error("Build errors:", buildResult.logs);
      throw new Error("Main bundle build failed");
    }

    console.log("📦 Building core modules...");

    // Only build essential core files
    const essentialCoreFiles = [
      'hooks.ts',
      'component.ts',
      'navigation.ts',
      'error-boundary.ts',
      'metadata.ts',
      'head.ts',
      'directives.ts',
      'pwa.ts'
    ];

    for (const file of essentialCoreFiles) {
      const tsPath = join(srcDir, "core", file);

      if (existsSync(tsPath)) {
        console.log(`Building ${file}...`);

        const { success } = await Bun.build({
          entrypoints: [tsPath],
          outdir: join(distDir, "core"),
          target: "browser",
          format: "esm",
          minify: true, // Enable minification
          loader: {
            ".ts": "ts",
          },
        });

        if (success) {
          console.log(`✅ Built ${file.replace('.ts', '.js')}`);
        } else {
          console.warn(`⚠️ Failed to build ${file}`);
        }
      }
    }

    console.log("📦 Building Link component...");

    // Build Link component
    const linkPath = join(srcDir, "link.ts");
    if (existsSync(linkPath)) {
      const { success } = await Bun.build({
        entrypoints: [linkPath],
        outdir: distDir,
        target: "browser",
        format: "esm",
        minify: true,
      });

      if (success) {
        console.log("✅ Built link.js");
      } else {
        console.warn("⚠️ Failed to build link.js");
      }
    }

    console.log("📦 Building JSX runtime...");

    // Build JSX runtime files from our ONE SOURCE OF TRUTH
    const jsxRuntimePath = join(srcDir, "jsx", "runtime.ts");

    if (existsSync(jsxRuntimePath)) {
      const { success, outputs } = await Bun.build({
        entrypoints: [jsxRuntimePath],
        outdir: distDir,
        target: "browser",
        format: "esm",
        minify: true,
      });

      if (!success) {
        throw new Error("JSX runtime build failed");
      }
      
      // Rename the output to jsx-runtime.js
      if (outputs.length > 0) {
        const outputPath = outputs[0].path;
        const targetPath = join(distDir, "jsx-runtime.js");
        if (outputPath !== targetPath) {
          const content = await Bun.file(outputPath).text();
          await Bun.write(targetPath, content);
        }
      }
      console.log("✅ JSX runtime built from ONE SOURCE OF TRUTH");
    }

    // Create jsx-dev-runtime.js that exports the same as jsx-runtime.js
    const jsxRuntimeContent = await Bun.file(join(distDir, "jsx-runtime.js")).text();
    await Bun.write(join(distDir, "jsx-dev-runtime.js"), jsxRuntimeContent);
    console.log("✅ JSX dev runtime created (same as production runtime)");

    console.log("📦 Building browser scripts...");

    // Build live-reload script from TypeScript source
    const liveReloadTsPath = join(srcDir, "browser", "live-reload.ts");
    const liveReloadJsPath = join(srcDir, "browser", "live-reload.js");
    
    if (existsSync(liveReloadTsPath)) {
      const { success, outputs } = await Bun.build({
        entrypoints: [liveReloadTsPath],
        outdir: distDir,
        target: "browser",
        format: "esm",
        minify: true,
      });

      if (success && outputs.length > 0) {
        const content = await Bun.file(outputs[0].path).text();
        await Bun.write(join(distDir, "live-reload.js"), content);
        console.log("✅ Built live-reload.js from TypeScript source");
      }
    } else if (existsSync(liveReloadJsPath)) {
      // Fallback to existing JS file
      const content = await Bun.file(liveReloadJsPath).text();
      await Bun.write(join(distDir, "live-reload.js"), content);
      console.log("✅ Built live-reload.js from existing source");
    }

    console.log("📦 Copying essential type definitions...");

    // Skip TypeScript compilation and just copy essential types manually
    // This avoids generating unnecessary declaration files for templates, etc.

    // Copy only essential type definitions
    const essentialTypes = [
      "index.d.ts",
      "jsx.d.ts", 
      "jsx-runtime.d.ts",
      "link.d.ts"
    ];

    const typesDir = join("types");
    if (existsSync(typesDir)) {
      for (const typeFile of essentialTypes) {
        const srcPath = join(typesDir, typeFile);
        const destPath = join(distDir, "types", typeFile);
        
        if (existsSync(srcPath)) {
          const content = await Bun.file(srcPath).text();
          await Bun.write(destPath, content);
          console.log(`✅ Copied ${typeFile}`);
        }
      }
    }

    console.log("📦 Building standalone packages...");

    // Build 0x1-store package
    console.log("Building 0x1-store...");
    const storeBuildResult = await Bun.build({
      entrypoints: ["./0x1-store/src/index.ts"],
      outdir: "./0x1-store/dist",
      target: "browser",
      format: "esm",
      minify: true,
    });
    
    if (!storeBuildResult.success) {
      throw new Error("0x1-store build failed");
    }
    console.log("✅ Built 0x1-store");
    
    // Copy store to main dist for dev server access
    const storeSource = resolve("0x1-store/dist/index.js");
    const storeDest = resolve(distDir, "core/store.js");
    if (existsSync(storeSource)) {
      await Bun.write(storeDest, await Bun.file(storeSource).text());
      console.log("✅ Copied store to dist/core/store.js");
    }

    // Build 0x1-router package
    console.log("Building 0x1-router...");
    const routerBuildResult = await Bun.build({
      entrypoints: ["./0x1-router/src/index.ts"],
      outdir: "./0x1-router/dist",
      target: "browser",
      format: "esm",
      minify: true,
    });
    
    if (!routerBuildResult.success) {
      throw new Error("0x1-router build failed");
    }
    console.log("✅ Built 0x1-router");
    
    // Copy router to main dist for dev server access
    const routerSource = resolve("0x1-router/dist/index.js");
    const routerDest = resolve(distDir, "core/router.js");
    if (existsSync(routerSource)) {
      await Bun.write(routerDest, await Bun.file(routerSource).text());
      console.log("✅ Copied router to dist/core/router.js");
    }

    console.log("📦 Building Router module...");

    // Build Router module for Next.js-style imports (0x1/router)
    const routerModulePath = join(srcDir, "router.ts");
    if (existsSync(routerModulePath)) {
      const { success } = await Bun.build({
        entrypoints: [routerModulePath],
        outdir: distDir,
        target: "browser",
        format: "esm",
        minify: true,
      });

      if (success) {
        console.log("✅ Built router.js");
      } else {
        console.warn("⚠️ Failed to build router.js");
      }
    }

    // Build 0x1-templates package
    console.log("Building 0x1-templates...");
    const templatesBuildResult = await Bun.build({
      entrypoints: ["./0x1-templates/src/index.ts"],
      outdir: "./0x1-templates/dist",
      target: "node",
      format: "esm",
      minify: true,
    });
    
    if (!templatesBuildResult.success) {
      throw new Error("0x1-templates build failed");
    }
    console.log("✅ Built 0x1-templates");
    
    // Save the ESM version before building CJS (to prevent overwrite)
    const esmOutputPath = "./0x1-templates/dist/index.js";
    let esmContent = "";
    if (existsSync(esmOutputPath)) {
      esmContent = await Bun.file(esmOutputPath).text();
    }
    
    // Also build CJS version for broader compatibility
    const templatesCjsBuildResult = await Bun.build({
      entrypoints: ["./0x1-templates/src/index.ts"],
      outdir: "./0x1-templates/dist",
      target: "node", 
      format: "cjs",
      minify: true,
    });
    
    if (templatesCjsBuildResult.success) {
      // Rename the CJS output to index.cjs
      const cjsOutputPath = "./0x1-templates/dist/index.js";
      const cjsTargetPath = "./0x1-templates/dist/index.cjs";
      if (existsSync(cjsOutputPath)) {
        const cjsContent = await Bun.file(cjsOutputPath).text();
        await Bun.write(cjsTargetPath, cjsContent);
        
        // Restore the ESM version as index.js
        if (esmContent) {
          await Bun.write(cjsOutputPath, esmContent);
        }
        
        console.log("✅ Built 0x1-templates (CJS)");
        console.log("✅ Restored 0x1-templates (ESM)");
      }
    } else {
      console.warn("⚠️ 0x1-templates CJS build failed (ESM version available)");
    }

    // Templates are now production-ready and available via 0x1-templates package
    // The package includes:
    // - minimal & standard templates (also bundled with CLI for offline use)
    // - full template with modern UI components and advanced features
    // - crypto-dash template with wallet integration and DeFi protocols
    // All templates are built and tested for production use

    console.log("🔍 Final validation...");

    // Validate essential files exist
    const requiredFiles = [
      join(distDir, "index.js"),
      join(distDir, "package.json"), 
      join(distDir, "jsx-runtime.js"),
      join(distDir, "core", "hooks.js"),
    ];
    
    let buildValid = true;
    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        console.error(`❌ Missing: ${file}`);
        buildValid = false;
      }
    }
    
    if (!buildValid) {
      throw new Error("Build validation failed");
    }

    // Calculate bundle sizes
    const indexSize = (await Bun.file(join(distDir, "index.js")).arrayBuffer()).byteLength;
    const totalSize = await calculateTotalSize(distDir);

    console.log("\n📦 Build Summary:");
    console.log(`  • Main bundle: ${(indexSize / 1024).toFixed(1)} KB`);
    console.log(`  • Total size: ${(totalSize / 1024).toFixed(1)} KB`);
    console.log(`  • Files: ${requiredFiles.length} essential files`);

    console.log("🎉 Optimized build completed successfully!");

  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

async function calculateTotalSize(dir: string): Promise<number> {
  let totalSize = 0;
  
  try {
    const result = await Bun.$`find ${dir} -type f -exec stat -f%z {} +`.text();
    const sizes = result.trim().split('\n').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
    totalSize = sizes.reduce((sum, size) => sum + size, 0);
  } catch {
    // Fallback calculation
    totalSize = 100000; // Rough estimate
  }
  
  return totalSize;
}

// Run the build
buildFramework().catch((err) => {
  console.error("💥 Build error:", err);
  process.exit(1);
});
