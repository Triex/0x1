/**
 * Tailwind CSS utilities for development server
 * Updated for v4 compatibility with v3 fallback
 */

import type { Subprocess } from "bun";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { logger } from "../../../utils/logger";

/**
 * Detect Tailwind version
 */
export function detectTailwindVersion(projectPath: string): '3' | '4' | null {
  try {
    const packageJsonPath = join(projectPath, 'package.json');
    if (!existsSync(packageJsonPath)) return null;
    
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    // Check for v4 indicators first
    if (packageJson.dependencies?.['@tailwindcss/postcss'] || 
        packageJson.devDependencies?.['@tailwindcss/postcss']) {
      return '4';
    }
    
    // Check version number
    const tailwindVersion = packageJson.dependencies?.tailwindcss || 
                           packageJson.devDependencies?.tailwindcss;
    
    if (tailwindVersion) {
      if (tailwindVersion.includes('4')) return '4';
      if (tailwindVersion.includes('3')) return '3';
    }
    
    return null;
  } catch (error) {
    logger.debug(`Error detecting Tailwind version: ${error}`);
    return null;
  }
}

/**
 * Find Tailwind CSS input file (v4 and v3 compatible)
 */
export async function findTailwindCssInput(projectPath: string): Promise<string | null> {
  const possiblePaths = [
    // v4 convention
    "input.css",
    "src/input.css",
    
    // Common patterns for both v3 and v4
    "src/styles/globals.css",
    "src/styles/main.css", 
    "src/styles/index.css",
    "src/index.css",
    "styles/globals.css",
    "styles/main.css",
    "styles/index.css",
    "public/styles.css",
    "app/globals.css",
  ];

  for (const path of possiblePaths) {
    const fullPath = join(projectPath, path);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Start Tailwind CSS process (version-aware)
 */
export async function startTailwindProcess(
  inputPath: string,
  projectPath: string
): Promise<Subprocess> {
  const version = detectTailwindVersion(projectPath);
  const outputPath = join(projectPath, "public", "styles.css");

  if (version === '4') {
    // Use v4 CLI
    logger.info("🎨 Starting Tailwind CSS v4 process...");
    return Bun.spawn([
      "bun", "x", "tailwindcss",
      "--input", inputPath,
      "--output", outputPath,
      "--watch"
    ], {
      cwd: projectPath,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } else {
    // Fallback to v3 CLI
    logger.info("🎨 Starting Tailwind CSS v3 process...");
    return Bun.spawn([
      "bunx", "tailwindcss",
      "-i", inputPath,
      "-o", outputPath,
      "--watch"
    ], {
      cwd: projectPath,
      stdio: ["pipe", "pipe", "pipe"],
    });
  }
}

/**
 * Create appropriate CSS content based on version
 */
export function createDefaultCssContent(version: '3' | '4'): string {
  if (version === '4') {
    return `@import "tailwindcss";

@theme {
  --font-sans: system-ui, sans-serif;
  --color-primary-500: oklch(0.6 0.15 240);
  --spacing: 0.25rem;
}

@layer base {
  body {
    @apply font-sans antialiased;
  }
}`;
  } else {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;`;
  }
}
