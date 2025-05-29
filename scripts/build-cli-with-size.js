#!/usr/bin/env bun

import fs from "node:fs";
import { resolve } from "path";

// Simple function to format file sizes
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Ensure dist/cli directory exists
const cliDistDir = resolve(process.cwd(), "dist/cli");
if (!fs.existsSync(cliDistDir)) {
  fs.mkdirSync(cliDistDir, { recursive: true });
}

// Use Bun.build with external dependencies for better optimization
console.log("⚙️  Building optimized CLI...");

try {
  const result = await globalThis.Bun.build({
    entrypoints: ["./src/cli/index.ts"],
    outdir: "dist/cli",
    target: "bun",
    format: "esm",
    minify: true,
    splitting: false,
    external: [
      // Mark heavy dev server dependencies as external
      "./commands/dev",
      "./server/dev-server", 
      "./server/handlers/*",
      "./commands/utils/server/*",
      
      // External heavy dependencies
      "tailwindcss",
      "@tailwindcss/postcss",
      "postcss", 
      "autoprefixer",
      "esbuild",
      "typescript",
      "lightningcss",
      "sass"
      
      // FIXME: Add crypto-dash template dependencies as external when implemented
      // This should include:
      // - Wallet connection libraries
      // - DeFi protocol SDKs
      // - Crypto price feed APIs
      // - NFT metadata services
      // Note: crypto-dash template exists but not production-ready
    ],
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.CLI_BUILD": '"true"'
    }
  });

  if (!result.success) {
    console.error("❌ CLI build failed:", result.logs);
    process.exit(1);
  }

  console.log("✅ CLI built to dist/cli/index.js (launcher will find it)");

  // Get file size information
  const mainBundlePath = resolve(process.cwd(), "dist/cli/index.js");
  
  if (!fs.existsSync(mainBundlePath)) {
    console.error("❌ CLI bundle file not found at", mainBundlePath);
    process.exit(1);
  }

  const stats = fs.statSync(mainBundlePath);
  const uncompressedSize = stats.size;

  // Generate gzipped version to show compressed size
  let compressedSize, ratioInverse, ratioString;

  try {
    const gzipResult = await globalThis.Bun.spawn(["sh", "-c", `gzip -c "${mainBundlePath}" | wc -c`]);
    const gzipOutput = await new Response(gzipResult.stdout).text();
    compressedSize = parseInt(gzipOutput.trim(), 10) || 0;
    
    if (isNaN(compressedSize) || compressedSize <= 0) {
      compressedSize = Math.round(uncompressedSize * 0.3);
      console.warn('Warning: Could not determine compressed size, using estimate');
    }
    
    ratioInverse = compressedSize > 0 ? (uncompressedSize / compressedSize) : 1;
    ratioString = `${ratioInverse.toFixed(1)}`;
  } catch (error) {
    console.warn(`Warning: Error calculating compressed size: ${error.message}`);
    compressedSize = Math.round(uncompressedSize * 0.3);
    ratioInverse = 3.3;
    ratioString = '3.3';
  }

  // Display results
  console.log("\n📦 Optimized bundle information:");
  console.log(`  • Main bundle: ${formatSize(uncompressedSize)} (${uncompressedSize.toLocaleString()} bytes)`);
  console.log(`  • Compressed: ${formatSize(compressedSize)} (${compressedSize.toLocaleString()} bytes)`);
  console.log(`  • Ratio: ${(compressedSize / uncompressedSize * 100).toFixed(1)}% (${ratioString}x reduction)`);
  console.log(`  • External deps: ${result.external?.length || 0} packages excluded`);

  console.log("\n🎉 Optimized CLI build completed successfully!\n");

} catch (error) {
  console.error("❌ CLI build error:", error);
  process.exit(1);
}
