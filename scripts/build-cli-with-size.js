#!/usr/bin/env bun

import { spawn } from "bun";
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

// Run the build process
console.log("⚙️  Building CLI...");
const buildResult = await spawn([
  "bun", "build", "./src/cli/index.ts", "--outdir=dist/cli", "--target=bun", "--minify"
]);
const output = await new Response(buildResult.stdout).text();
console.log(output);

// Get file size information
const mainBundlePath = resolve(process.cwd(), "dist/cli/index.js");
const stats = fs.statSync(mainBundlePath);
const uncompressedSize = stats.size;

// Generate gzipped version to show compressed size
const gzipResult = await spawn(["sh", "-c", `gzip -c ${mainBundlePath} | wc -c`]);
const gzipOutput = await new Response(gzipResult.stdout).text();
const compressedSize = parseInt(gzipOutput.trim(), 10);
const ratioInverse = uncompressedSize / compressedSize;
const ratioString = `${ratioInverse.toFixed(1)}`;

// Display nice output
console.log("\n📦 Bundle information:");
console.log(`  • Main bundle: ${formatSize(uncompressedSize)} (${uncompressedSize.toLocaleString()} bytes)`);
console.log(`  • Compressed: ${formatSize(compressedSize)} (${compressedSize.toLocaleString()} bytes)`);
console.log(`  • Ratio: ${(compressedSize / uncompressedSize * 100).toFixed(1)}% (${ratioString}x reduction)`);

console.log("\n🎉 Build completed successfully!\n");
