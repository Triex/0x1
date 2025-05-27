/**
 * Development Server Utilities
 * Provides helper functions for the development server
 */

import { existsSync } from "fs";
import os from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

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
 * Find Tailwind CSS input file in the project (v4 compatible)
 */
export async function findTailwindCssInput(projectPath: string): Promise<string | null> {
  // Extended list prioritizing v4 conventions
  const possibleInputs = [
    // v4 convention (prioritized)
    join(projectPath, 'input.css'),
    join(projectPath, 'src', 'input.css'),
    
    // App directory (Next.js-like projects)
    join(projectPath, 'app', 'globals.css'),
    join(projectPath, 'app', 'global.css'),
    join(projectPath, 'app', 'styles.css'),
    
    // Traditional locations
    join(projectPath, 'src', 'styles', 'globals.css'),
    join(projectPath, 'src', 'styles', 'main.css'),
    join(projectPath, 'styles', 'globals.css'),
    join(projectPath, 'globals.css'),
    join(projectPath, 'src', 'app.css')
  ];

  for (const input of possibleInputs) {
    if (existsSync(input)) {
      // For v4, prefer files with @import "tailwindcss"
      try {
        const content = await Bun.file(input).text();
        if (content.includes('@import "tailwindcss"')) {
          console.log(`Found Tailwind v4 input file: ${input}`);
          return input;
        }
      } catch {
        // If we can't read, still consider it valid
        console.log(`Found Tailwind CSS input file: ${input}`);
        return input;
      }
    }
  }

  // Create default v4 input file
  const defaultPath = join(projectPath, 'input.css');
  
  try {
    const defaultContent = `@import "tailwindcss";

@theme {
  --font-sans: system-ui, -apple-system, sans-serif;
  --color-primary-500: oklch(0.6 0.15 240);
  --spacing: 0.25rem;
}

@layer base {
  body {
    @apply font-sans antialiased bg-background text-foreground;
  }
}`;
    
    Bun.write(defaultPath, defaultContent);
    console.log(`Created default Tailwind v4 input file: ${defaultPath}`);
    return defaultPath;
  } catch (error) {
    console.error(`Failed to create default Tailwind v4 input file: ${error}`);
  }
  
  return null;
}
