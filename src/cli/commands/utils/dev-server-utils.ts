/**
 * Development Server Utilities
 * Provides helper functions for the development server
 */

import { existsSync } from "fs";
import os from "os";
import { join, resolve } from "path";
import { logger } from "../../utils/logger.js";

/**
 * Transform code content to handle 0x1 bare imports
 * This converts imports like: import { Router } from '0x1' or import { Router } from '0x1/router'
 * to browser-compatible: import { Router } from '/node_modules/0x1' or import { Router } from '/node_modules/0x1/router'
 */
export function transformBareImports(content: string): string {
  // First replace exact '0x1' imports
  let transformed = content.replace(
    /from\s+['"]0x1['"]|import\s+['"]0x1['"]|import\(['"]0x1['"]\)/g,
    (match) => {
      return match.replace(/['"]0x1['"]/, '"/node_modules/0x1/index.js"');
    }
  );

  // Then handle subpath imports like '0x1/router'
  transformed = transformed.replace(
    /from\s+['"]0x1\/[\w-]+['"]|import\s+['"]0x1\/[\w-]+['"]|import\(['"]0x1\/[\w-]+['"]\)/g,
    (match, subpath1, subpath2, subpath3) => {
      const subpath = subpath1 || subpath2 || subpath3;
      return match.replace(
        /['"](0x1)\/[\w-]+['"]/,
        `"/node_modules/0x1${subpath}.js"`
      );
    }
  );

  return transformed;
}

/**
 * Open browser at the given URL
 */
export async function openBrowser(url: string): Promise<void> {
  // Use Bun's native capabilities instead of external dependencies
  const openUrl = (url: string) => {
    return Bun.spawn(["open", url], {
      stdout: "inherit",
      stderr: "inherit",
    });
  };
  await openUrl(url);
}

/**
 * Get the local IP address for network access
 */
export function getLocalIP(): string {
  try {
    const nets = os.networkInterfaces();

    for (const name of Object.keys(nets)) {
      const interfaces = nets[name];
      if (!interfaces) continue;

      for (const net of interfaces) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
    return "localhost"; // Fallback
  } catch (err) {
    return "localhost";
  }
}

/**
 * Get the current Bun version
 * Currently unused but kept for potential future diagnostics
 */
export function getBunVersion(): string {
  return `v${Bun.version}`;
}

/**
 * Get possible framework root directories
 */
export function getPossibleFrameworkRoots(): string[] {
  const currentFilePath = import.meta.url;
  let frameworkPath: string;
  
  // Support both file:// URLs and regular paths
  if (currentFilePath.startsWith('file://')) {
    const { fileURLToPath } = require('url');
    const { dirname } = require('path');
    frameworkPath = resolve(dirname(fileURLToPath(currentFilePath)), '../../..');
  } else {
    frameworkPath = resolve(__dirname, '../../..');
  }

  return [
    frameworkPath,
    resolve(frameworkPath, 'dist'),
    resolve(process.cwd(), 'node_modules/0x1'),
    // Add more potential locations if needed
  ];
}

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  try {
    // Quick way to check if a port is in use by attempting to connect to it
    await fetch(`http://localhost:${port}`, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(100)  // Use small timeout to avoid blocking
    });
    // If successful, port is in use
    return false;
  } catch (error) {
    // If connection fails, port is likely available
    return true;
  }
}

/**
 * Find Tailwind CSS input file
 */
export async function findTailwindCssInput(
  projectPath: string
): Promise<string | null> {
  // Modern Next.js app directory structure locations (prioritized)
  const nextJsAppDirLocations = [
    join(projectPath, "app", "globals.css"),    // Next.js standard
    join(projectPath, "app", "global.css"),     // Alternative naming
    join(projectPath, "src", "app", "globals.css"), // src/app structure
    join(projectPath, "app", "tailwind.css"),   // Alternative naming
  ];
  
  // Check Next.js app directory locations first (preferred modern structure)
  for (const location of nextJsAppDirLocations) {
    if (existsSync(location)) {
      logger.info(`💠 Found Tailwind CSS input in app directory at ${location}`);
      return location;
    }
  }

  // If no app directory CSS file found, check for tailwind.config.js/mjs for hints
  const tailwindConfigPaths = [
    join(projectPath, "tailwind.config.js"),
    join(projectPath, "tailwind.config.mjs"),
    join(projectPath, "tailwind.config.ts")
  ].filter(existsSync);
  
  if (tailwindConfigPaths.length > 0) {
    try {
      // Read tailwind config to look for stylesheet hints
      const configContent = await Bun.file(tailwindConfigPaths[0]).text();
      // Look for content or stylesheet references
      const cssPathMatches = configContent.match(/['"](.+?\.css)['"]/);
      if (cssPathMatches && cssPathMatches[1]) {
        const cssPath = cssPathMatches[1];
        // Convert relative path to absolute
        const absoluteCssPath = cssPath.startsWith('./') || cssPath.startsWith('../') 
          ? join(projectPath, cssPath)
          : join(projectPath, cssPath.startsWith('/') ? cssPath.slice(1) : cssPath);
          
        if (existsSync(absoluteCssPath)) {
          logger.info(`💠 Found Tailwind CSS input from config at ${absoluteCssPath}`);
          return absoluteCssPath;
        }
      }
    } catch (error) {
      // Silently continue if we can't parse the config
    }
  }

  // Fall back to common locations if app directory structures don't exist
  const legacyLocations = [
    // Legacy/alternative locations
    join(projectPath, "styles", "main.css"),
    join(projectPath, "src", "styles", "main.css"),
    join(projectPath, "styles", "globals.css"),
    join(projectPath, "styles", "global.css"),
    join(projectPath, "src", "styles", "globals.css"),
    join(projectPath, "css", "main.css"),
    join(projectPath, "assets", "css", "main.css"),
  ];

  // Check legacy locations as a last resort
  for (const location of legacyLocations) {
    if (existsSync(location)) {
      logger.info(`💠 Found Tailwind CSS input at legacy location ${location}`);
      return location;
    }
  }

  return null;
}
