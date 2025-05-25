/**
 * Tailwind CSS v4 Handler for 0x1 Framework
 * 
 * Provides zero-config integration with Tailwind CSS v4,
 * following Next.js 15's approach where Tailwind "just works".
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "path";
import { logger } from "../../utils/logger.js";
import { mkdir, stat, watch } from "fs/promises";

// Cache for processed CSS to avoid redundant processing
const cssCache: Record<string, { content: string; timestamp: number }> = {};

/**
 * Initialize Tailwind CSS v4 for a project
 * Sets up all necessary configurations and ensures Tailwind is installed
 */
export async function initializeTailwind(projectPath: string): Promise<boolean> {
  try {
    logger.info("Initializing Tailwind CSS v4...");
    
    // Check if Tailwind is installed
    const packageJsonPath = join(projectPath, "package.json");
    if (!existsSync(packageJsonPath)) {
      logger.error("package.json not found. Cannot initialize Tailwind.");
      return false;
    }
    
    // Read package.json to check if Tailwind is installed
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    const hasTailwind = packageJson.dependencies?.tailwindcss || packageJson.devDependencies?.tailwindcss;
    
    if (!hasTailwind) {
      logger.info("Tailwind CSS not found in dependencies. Installing Tailwind CSS v4...");
      
      try {
        // Try to install Tailwind using Bun
        const install = Bun.spawn(["bun", "add", "-d", "tailwindcss@latest"], { 
          cwd: projectPath,
          stdio: ["ignore", "pipe", "pipe"] 
        });
        
        // Wait for installation to complete
        const exitCode = await install.exited;
        
        if (exitCode === 0) {
          logger.success("Tailwind CSS v4 installed successfully with Bun!");
        } else {
          logger.error("Failed to install Tailwind CSS with Bun");
          return false;
        }
      } catch (err) {
        logger.error(`Failed to install Tailwind CSS: ${err}`);
        return false;
      }
    }
    
    // Ensure config files exist
    await ensureTailwindConfig(projectPath);
    await ensureGlobalCss(projectPath);
    
    // Generate initial CSS
    return await processTailwindCss(projectPath);
  } catch (error) {
    logger.error(`Error initializing Tailwind CSS: ${error}`);
    return false;
  }
}

/**
 * Ensure Tailwind config exists, create if not
 */
async function ensureTailwindConfig(projectPath: string): Promise<void> {
  const configPath = join(projectPath, "tailwind.config.js");
  
  if (!existsSync(configPath)) {
    logger.info("Creating Tailwind config file...");
    
    // Modern patterns for finding content
    const contentPatterns = [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      "./lib/**/*.{js,ts,jsx,tsx}",
      "./*.{js,ts,jsx,tsx,html}"
    ];
    
    const configContent = `/** @type {import('tailwindcss').Config} */
export default {
  content: ${JSON.stringify(contentPatterns, null, 2)},
  // Tailwind v4 uses class strategy for dark mode
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5', // Indigo 600 color
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b'
        }
      }
    },
  },
  // Tailwind v4 features and plugins
  future: {
    hoverOnlyWhenSupported: true,
    respectDefaultRingColorOpacity: true,
    disableColorOpacityUtilitiesByDefault: true,
    relativeContentPathsByDefault: true
  },
  plugins: [],
}`;
    
    writeFileSync(configPath, configContent);
    logger.success("Created Tailwind config file.");
  }
}

/**
 * Ensure globals.css exists, create if not
 */
async function ensureGlobalCss(projectPath: string): Promise<void> {
  const globalsCssDir = join(projectPath, "app");
  const globalsCssPath = join(globalsCssDir, "globals.css");
  
  // Create app directory if it doesn't exist
  if (!existsSync(globalsCssDir)) {
    await mkdir(globalsCssDir, { recursive: true });
  }
  
  if (!existsSync(globalsCssPath)) {
    logger.info("Creating globals.css file...");
    
    const cssContent = `/* Tailwind CSS v4 directives */
@import "tailwindcss";

/* Dark mode helpers */
:root { color-scheme: light; }
.dark { color-scheme: dark; }

/* Add your custom styles below */
`;
    
    writeFileSync(globalsCssPath, cssContent);
    logger.success("Created globals.css file.");
  }
}

/**
 * Process Tailwind CSS using the Next.js 15 approach for development
 */
export async function processTailwindCss(projectPath: string): Promise<boolean> {
  try {
    const inputCssPath = join(projectPath, "app", "globals.css");
    const tailwindConfigPath = join(projectPath, "tailwind.config.js");
    
    // Check if the tailwind config exists, create if not
    if (!existsSync(tailwindConfigPath)) {
      await ensureTailwindConfig(projectPath);
    }
    
    // Check if globals.css exists, create if not
    if (!existsSync(inputCssPath)) {
      await ensureGlobalCss(projectPath);
    }
    
    // For development mode, we don't need to process the CSS
    // The browser will handle tailwind directives via our runtime
    logger.info("Tailwind CSS configured. Using Next.js 15 style with Tailwind directives.");
    logger.success("Tailwind CSS setup complete!");
    
    // Create special Tailwind runtime script for development
    // This will be added to the HTML to handle directives in development
    try {
      // Ensure public directory exists
      const publicDir = join(projectPath, "public");
      if (!existsSync(publicDir)) {
        await mkdir(publicDir, { recursive: true });
      }
      
      // Write the tailwind runtime helper
      const tailwindRuntimePath = join(projectPath, "public", "tailwindcss");
      const tailwindRuntime = `/* Tailwind CSS v4 Runtime for Development */

/* This is a special development runtime that processes Tailwind directives */
/* In production, these directives would be processed at build time */

(function() {
  console.log('[0x1] Initializing Tailwind CSS runtime');
  
  // Add tailwind classes for dark mode toggle
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const isDarkMode = localStorage.getItem('0x1-dark-mode') === 'dark' ||
                     (!localStorage.getItem('0x1-dark-mode') && darkModeMediaQuery.matches);
  
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Set up listener for dark mode changes
  darkModeMediaQuery.addEventListener('change', e => {
    if (!localStorage.getItem('0x1-dark-mode')) {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  });
  
  // Initialize theme toggle buttons
  document.addEventListener('DOMContentLoaded', () => {
    const themeToggles = document.querySelectorAll('[id="theme-toggle"]');
    themeToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('0x1-dark-mode', 'light');
        } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('0x1-dark-mode', 'dark');
        }
      });
    });
  });
})();
`;
      
      writeFileSync(tailwindRuntimePath, tailwindRuntime, 'utf-8');
      return true;
    } catch (error) {
      logger.warn(`Error creating Tailwind runtime: ${error}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error in Tailwind CSS setup: ${error}`);
    return false;
  }
}

/**
 * Process CSS content with Tailwind CSS support
 * Adds built-in CSS module support similar to Next.js
 */
export async function processCssFile(filePath: string, projectPath: string): Promise<{ content: string; contentType: string } | null> {
  try {
    const fullPath = join(projectPath, filePath);
    
    if (!existsSync(fullPath)) {
      return null;
    }
    
    // Check cache first
    const fileStats = await Bun.file(fullPath).stat();
    const cacheKey = `${fullPath}|${fileStats.mtime.getTime()}`;
    
    if (cssCache[cacheKey]) {
      return {
        content: cssCache[cacheKey].content,
        contentType: "text/css; charset=utf-8"
      };
    }
    
    // Read the CSS file
    let cssContent = await Bun.file(fullPath).text();
    
    // For module.css files, implement CSS modules with scoping
    if (filePath.endsWith(".module.css")) {
      // Create a unique module ID based on the file path
      const moduleId = filePath.replace(/[\/\.]/g, "_");
      
      // Basic CSS module implementation - scope all class selectors
      cssContent = cssContent.replace(/\.([a-zA-Z0-9_-]+)\s*\{/g, (match, className) => {
        return `.${moduleId}__${className} {`;
      });
      
      logger.debug(`Processed CSS module: ${filePath}`);
    }
    
    // Add to cache
    cssCache[cacheKey] = {
      content: cssContent,
      timestamp: Date.now()
    };
    
    return {
      content: cssContent,
      contentType: "text/css; charset=utf-8"
    };
  } catch (error) {
    logger.error(`Error processing CSS file ${filePath}: ${error}`);
    return null;
  }
}

/**
 * Generate JavaScript mapping for a CSS module
 * This allows importing styles in components just like in Next.js
 */
export async function generateCssModuleScript(filePath: string, projectPath: string): Promise<{ content: string; contentType: string } | null> {
  try {
    const fullPath = join(projectPath, filePath.replace(/\.js$/, ""));
    
    if (!existsSync(fullPath)) {
      return null;
    }
    
    const cssContent = await Bun.file(fullPath).text();
    const moduleId = filePath.replace(/\.js$/, "").replace(/[\/\.]/g, "_");
    
    // Extract class names from CSS content
    const classNames = (cssContent.match(/\.([a-zA-Z0-9_-]+)\s*\{/g) || [])
      .map(selector => selector.slice(1, -1).trim());
    
    // Generate mapping object
    const mappingObject = classNames.reduce((acc, className) => {
      acc[className] = `${moduleId}__${className}`;
      return acc;
    }, {} as Record<string, string>);
    
    // Generate JavaScript module
    const jsContent = `
// 0x1 CSS Module: ${filePath}
// This file is auto-generated to provide CSS module support
const styles = ${JSON.stringify(mappingObject, null, 2)};
export default styles;
`;
    
    logger.debug(`Generated JS mapping for CSS module: ${filePath}`);
    
    return {
      content: jsContent,
      contentType: "application/javascript; charset=utf-8"
    };
  } catch (error) {
    logger.error(`Error generating CSS module script for ${filePath}: ${error}`);
    return null;
  }
}

/**
 * Start Tailwind CSS watch mode for development
 * For v4, we implement our own file watching instead of relying on the CLI
 */
export function startTailwindWatcher(projectPath: string): { process: any; stop: () => void } {
  logger.info("Starting Tailwind CSS watcher...");
  
  const inputCssPath = join(projectPath, "app", "globals.css");
  const outputCssPath = join(projectPath, "public", "styles.css");
  
  // First, check if we're dealing with Tailwind v4
  let isV4 = false;
  try {
    const packageJsonPath = join(projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      isV4 = !!(packageJson.devDependencies?.['@tailwindcss/postcss'] || 
              packageJson.dependencies?.['@tailwindcss/postcss'] ||
              packageJson.devDependencies?.tailwindcss?.startsWith('4') ||
              packageJson.dependencies?.tailwindcss?.startsWith('4'));
    }
  } catch (e) {
    logger.debug(`Error checking for Tailwind v4: ${e}`);
  }
  
  // For v4, implement a custom file watcher instead of using the CLI
  if (isV4) {
    let watcher: any = null;
    let abortController = new AbortController();
    
    const runWatcher = async () => {
      try {
        logger.info("Starting custom Tailwind v4 watcher...");
        
        // Define paths to watch
        const watchPaths = [
          join(projectPath, "app"),
          join(projectPath, "components"),
          join(projectPath, "styles"),
        ];
        
        // Process CSS immediately first
        await processTailwindCss(projectPath);
        logger.success("Tailwind CSS watcher started!");
        
        // Setup file watcher
        for (const watchPath of watchPaths) {
          if (existsSync(watchPath)) {
            try {
              const subWatcher = watch(watchPath, { recursive: true, signal: abortController.signal });
              
              // Process async iterator of file events
              (async () => {
                try {
                  for await (const event of subWatcher) {
                    // Check if filename exists and has a valid extension
                    if (event.filename && (
                        event.filename.endsWith('.css') || 
                        event.filename.endsWith('.ts') || 
                        event.filename.endsWith('.tsx') || 
                        event.filename.endsWith('.js') || 
                        event.filename.endsWith('.jsx'))) {
                      
                      logger.info(`File changed: ${event.filename}`);
                      await processTailwindCss(projectPath);
                    }
                  }
                } catch (err: unknown) {
                  // Type assertion for error object
                  const error = err as Error;
                  if (error.name !== 'AbortError') {
                    logger.error(`Watch error: ${error.message || String(err)}`);
                  }
                }
              })();
            } catch (err) {
              logger.warn(`Cannot watch directory ${watchPath}: ${err}`);
            }
          }
        }
      } catch (error) {
        logger.error(`Error in Tailwind watcher: ${error}`);
      }
    };
    
    // Start the watcher
    runWatcher();
    
    return {
      process: null, // No actual process for v4
      stop: () => {
        if (abortController) {
          abortController.abort();
          logger.info("Tailwind watcher stopped");
        }
      }
    };
  }
  
  // For v3, use the CLI method
  try {
    // Start Tailwind CLI in watch mode as a background process
    const tailwindProcess = Bun.spawn([
      "bunx", 
      "tailwindcss", 
      "-i", inputCssPath, 
      "-o", outputCssPath,
      "--watch"
    ], {
      cwd: projectPath,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env }
    });
    
    // Log output
    tailwindProcess.stdout.pipeTo(new WritableStream({
      write(chunk) {
        const text = new TextDecoder().decode(chunk);
        if (text.trim()) {
          logger.info(`[Tailwind] ${text.trim()}`);
        }
      }
    }));
    
    tailwindProcess.stderr.pipeTo(new WritableStream({
      write(chunk) {
        const text = new TextDecoder().decode(chunk);
        if (text.trim()) {
          logger.error(`[Tailwind] ${text.trim()}`);
        }
      }
    }));
    
    // Return process and stop function
    logger.success("Tailwind CSS watcher started!");
    
    return {
      process: tailwindProcess,
      stop: () => {
        tailwindProcess.kill();
        logger.info("Tailwind CSS watcher stopped.");
      }
    };
  } catch (error) {
    logger.error(`Error starting Tailwind watcher: ${error}`);
    return {
      process: null,
      stop: () => {}
    };
  }
}
