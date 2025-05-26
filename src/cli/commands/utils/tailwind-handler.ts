/**
 * Tailwind CSS v4 Handler for 0x1 Framework
 * 
 * Provides zero-config integration with Tailwind CSS v4,
 * following Next.js 15's approach where Tailwind "just works".
 */

import { unlinkSync } from "fs";
import { mkdir, stat } from "fs/promises";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, sep } from "path";
import { logger } from "../../utils/logger.js";

// Cache for processed CSS to avoid redundant processing
const cssCache: Record<string, { content: string; timestamp: number; contentType: string }> = {};

// Store in-memory cache of processed CSS
let processedTailwindCss: string | null = null;
let lastProcessedTime = 0;

// Debounce control variables for Tailwind processing
let processingTailwind = false;
let processingQueued = false;
let lastLogTime = 0; // Last time we logged a Tailwind processing message
const LOG_THROTTLE_MS = 5000; // Only log every 5 seconds to reduce log spam

// Keep track of temp files to ensure cleanup
const tempFiles: string[] = [];

/**
 * Serve processed Tailwind CSS
 */
export function getProcessedTailwindCss(): { content: string; contentType: string } {
  return {
    content: processedTailwindCss || '/* Tailwind CSS processing pending */',
    contentType: 'text/css'
  };
}

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
        const install = Bun.spawn(["bun", "add", "-d", "tailwindcss", "@tailwindcss/postcss", "postcss"], { 
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
      "./src/**/*.{js,ts,jsx,tsx,html}"
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
        },
        secondary: {
          DEFAULT: '#10b981', // Emerald 500 color
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22'
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
  // Skip CSS creation for the framework root directory
  if (projectPath.includes('/0x1') && !projectPath.includes('/templates/')) {
    return;
  }
  
  // Check for Next.js style app directory first (modern approach)
  const appDir = join(projectPath, "app");
  const appGlobalsCssPath = join(appDir, "globals.css");
  
  // Fallback to src directory (traditional approach)
  const srcDir = join(projectPath, "src");
  const srcAppCssPath = join(srcDir, "app.css");
  
  // Prepare Tailwind CSS content
  const tailwindCssContent = `@import "tailwindcss";

/* Custom styles go here */
:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
`;
  
  // Check for Next.js app directory structure first
  if (existsSync(appDir)) {
    if (!existsSync(appGlobalsCssPath)) {
      logger.info("Creating globals.css file in app directory...");
      writeFileSync(appGlobalsCssPath, tailwindCssContent);
      logger.success("Created globals.css file in app directory.");
    } else {
      // Update existing globals.css to include Tailwind import if needed
      const content = readFileSync(appGlobalsCssPath, 'utf-8');
      if (!content.includes('@import "tailwindcss"') && !content.includes('@tailwind')) {
        logger.info("Updating globals.css with Tailwind import...");
        writeFileSync(appGlobalsCssPath, `@import "tailwindcss";

${content}`);
        logger.success("Updated globals.css with Tailwind import.");
      }
    }
    return;
  }
  
  // Fallback to src directory structure (only for actual projects, not the framework itself)
  if (!existsSync(srcDir)) {
    await mkdir(srcDir, { recursive: true });
  }
  
  if (!existsSync(srcAppCssPath)) {
    logger.info("Creating app.css file in src directory...");
    writeFileSync(srcAppCssPath, tailwindCssContent);
    logger.success("Created app.css file in src directory.");
  }
}

/**
 * Process Tailwind CSS using direct module imports
 * Using the proper Tailwind CSS v4 approach with PostCSS
 */
/**
 * Start a watcher for Tailwind CSS files to automatically rebuild when changes are detected
 * Improved with proper cleanup and debouncing
 */
export function startTailwindWatcher(projectPath: string): { close: () => void } {
  // Ensure Tailwind is initialized first
  initializeTailwind(projectPath);
  
  // Process immediately on startup (but only once)
  processTailwindCss(projectPath);
  
  // Create a more efficient polling mechanism with exponential backoff
  // Start with 2 second interval, but reduce frequency if no changes are detected
  let pollingInterval = 2000; // milliseconds
  const maxPollingInterval = 10000; // max 10 seconds between checks
  const intervalStep = 1000; // increase by 1 second each time
  
  // Track last change time to adjust polling frequency
  let lastChangeTime = Date.now();
  
  // Create the polling interval
  const interval = setInterval(async () => {
    // Only process if not already processing
    if (!processingTailwind && !processingQueued) {
      await processTailwindCss(projectPath);
      
      // Adjust polling frequency based on activity
      const timeSinceLastChange = Date.now() - lastChangeTime;
      if (timeSinceLastChange > 30000) { // 30 seconds with no changes
        // Gradually increase polling interval
        pollingInterval = Math.min(pollingInterval + intervalStep, maxPollingInterval);
        
        // Restart the interval with new timing
        clearInterval(interval);
        startPolling();
      }
    }
  }, pollingInterval);
  
  // Function to restart polling with current interval
  function startPolling() {
    setInterval(async () => {
      if (!processingTailwind && !processingQueued) {
        await processTailwindCss(projectPath);
      }
    }, pollingInterval);
  }
  
  // Create a cleanup function that ensures all temp files are deleted
  function cleanupTempFiles() {
    // Clean up any temporary files that might still exist
    if (tempFiles.length > 0) {
      logger.info(`Cleaning up ${tempFiles.length} temporary Tailwind processor files...`);
      
      for (const tempFile of tempFiles) {
        try {
          if (existsSync(tempFile)) {
            unlinkSync(tempFile);
            logger.debug(`Cleaned up temporary file: ${tempFile}`);
          }
        } catch (error) {
          logger.debug(`Failed to clean up temporary file ${tempFile}: ${error}`);
        }
      }
      
      // Clear the array
      tempFiles.length = 0;
    }
    
    // Also check for any remaining processor files in the .0x1 directory
    const tempDir = join(projectPath, '.0x1');
    if (existsSync(tempDir)) {
      try {
        // Use Bun.spawnSync to list files in the directory (more reliable than Bun.file)
        const { stdout } = Bun.spawnSync(['ls', '-la', tempDir], {
          cwd: projectPath,
          stderr: 'pipe',
          stdout: 'pipe'
        });
        
        const output = new TextDecoder().decode(stdout);
        const lines = output.split('\n');
        
        // Process each line to find tailwind processor files
        for (const line of lines) {
          const match = line.match(/\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+(\.tailwind-processor-.*\.mjs)/);
          if (match && match[1]) {
            const fileName = match[1];
            try {
              const filePath = join(tempDir, fileName);
              if (existsSync(filePath)) {
                unlinkSync(filePath);
                logger.debug(`Cleaned up leftover processor file: ${fileName}`);
              }
            } catch (e) {
              // Ignore errors during cleanup
            }
          }
        }
      } catch (error) {
        // Ignore errors reading directory
      }
    }
  }
  
  // Return a cleanup function with enhanced error handling
  return {
    close() {
      try {
        if (interval) {
          clearInterval(interval);
        }
        
        // Clean up all temporary files
        cleanupTempFiles();
        
        logger.info("Stopping Tailwind CSS watcher");
      } catch (error) {
        logger.error(`Error shutting down Tailwind watcher: ${error}`);
      }
    }
  };
}

/**
 * Get processed Tailwind CSS content
 * This is used by the server to serve the CSS without writing to disk
 */
// This function is replaced with the detailed version below
// export function getProcessedTailwindCss(): string {
//   return processedTailwindCss || '/* Tailwind CSS processing pending */'; 
// }

/**
 * Process Tailwind CSS in memory without generating unnecessary files
 * With improved debouncing to prevent excessive processing and log spam
 */
export async function processTailwindCss(projectPath: string): Promise<boolean> {
  // Implement debouncing for frequent calls
  if (processingTailwind) {
    // If already processing, queue up and return immediately
    processingQueued = true;
    return true;
  }
  
  // Implement log throttling to reduce console spam
  const shouldLog = Date.now() - lastLogTime > LOG_THROTTLE_MS;
  if (shouldLog) {
    logger.info("Processing Tailwind CSS...");
    lastLogTime = Date.now();
  }
  
  // Set processing flag
  processingTailwind = true;
  
  try {
    // Define paths for input and output CSS files
    // Check for Next.js style app directory first
    const appGlobalsCssPath = join(projectPath, "app", "globals.css");
    const srcAppCssPath = join(projectPath, "src", "app.css");
    
    // Determine which input CSS file to use
    let inputCssPath: string;
    
    if (existsSync(appGlobalsCssPath)) {
      inputCssPath = appGlobalsCssPath;
    } else if (existsSync(srcAppCssPath)) {
      inputCssPath = srcAppCssPath;
    } else {
      logger.error(`No Tailwind CSS file found in app/globals.css or src/app.css`);
      // Create one in the app directory if it exists
      if (existsSync(join(projectPath, "app"))) {
        await ensureGlobalCss(projectPath);
        inputCssPath = appGlobalsCssPath;
      } else {
        await ensureGlobalCss(projectPath);
        inputCssPath = srcAppCssPath;
      }
      
      // Check again after creation
      if (!existsSync(inputCssPath)) {
        logger.error(`Failed to create Tailwind CSS file at ${inputCssPath}`);
        processingTailwind = false;
        return false;
      }
    }
    
    // Read the input CSS file
    const cssContent = readFileSync(inputCssPath, 'utf-8');
    
    // Ensure necessary dependencies are installed
    const dependencies = [
      { name: 'tailwindcss', path: join(projectPath, 'node_modules', 'tailwindcss') },
      { name: '@tailwindcss/postcss', path: join(projectPath, 'node_modules', '@tailwindcss', 'postcss') },
      { name: 'postcss', path: join(projectPath, 'node_modules', 'postcss') }
    ];
    
    // If we're in the main 0x1 repo, use the parent's node_modules
    if (projectPath.includes('/testapp')) {
      const parentDir = join(projectPath, '..');
      dependencies.forEach(dep => {
        if (!existsSync(dep.path)) {
          dep.path = join(parentDir, 'node_modules', dep.name.replace('/', sep));
        }
      });
    }
    
    const missingDeps = dependencies.filter(dep => !existsSync(dep.path));
    
    if (missingDeps.length > 0) {
      logger.warn(`Missing dependencies: ${missingDeps.map(d => d.name).join(', ')}`);
      logger.info('Installing required dependencies with bun...');
      
      // Install missing dependencies with bun
      const installProcess = Bun.spawn(['bun', 'install', ...missingDeps.map(d => d.name)], {
        cwd: projectPath,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      const exitCode = await installProcess.exited;
      
      if (exitCode !== 0) {
        const stderr = await new Response(installProcess.stderr).text();
        logger.error(`Error installing dependencies: ${stderr}`);
        processingTailwind = false;
        return false;
      }
      
      logger.success('Dependencies installed successfully!');
    }
    
    // Create a temporary processor script in memory and only write to disk when executing
    // Modern ESM script to process Tailwind CSS using v4 API directly
    const processorScript = `
import { readFileSync } from 'fs';
import { join } from 'path';
import postcss from 'postcss';
import tailwindcssPostcss from '@tailwindcss/postcss';

// Define paths
const inputPath = '${inputCssPath.replace(/\\/g, '\\')}';

// Read input CSS
const css = readFileSync(inputPath, 'utf8');

// Process with PostCSS and Tailwind
async function processCss() {
  try {
    const result = await postcss([
      tailwindcssPostcss({
        content: [
          join('${projectPath.replace(/\\/g, '\\')}', '**', '*.{js,jsx,ts,tsx}'),
          join('${projectPath.replace(/\\/g, '\\')}', 'app', '**', '*.{js,jsx,ts,tsx}'),
          join('${projectPath.replace(/\\/g, '\\')}', 'components', '**', '*.{js,jsx,ts,tsx}'),
          join('${projectPath.replace(/\\/g, '\\')}', 'src', '**', '*.{js,jsx,ts,tsx}'),
          join('${projectPath.replace(/\\/g, '\\')}', 'index.html')
        ],
        darkMode: 'class',
      })
    ]).process(css, {
      from: inputPath
    });

    // Output the CSS to stdout for the parent process to capture
    console.log(result.css);
    // Signal successful completion
    process.exit(0);
  } catch (error) {
    console.error('Error processing Tailwind CSS:', error);
    process.exit(1);
  }
}

processCss();
`;
    
    // Use temp file with unique name for the processor script
    const tempDir = join(projectPath, '.0x1');
    const tempFilePath = join(tempDir, `.tailwind-processor-${Date.now()}.mjs`);
    
    // Add to list of temp files to ensure cleanup
    tempFiles.push(tempFilePath);
    
    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }
    
    try {
      // Write the temporary processor script
      writeFileSync(tempFilePath, processorScript, 'utf-8');
      
      // Execute the processor script with bun
      if (shouldLog) {
        logger.info('Processing CSS with Tailwind...');
      }
      
      const processResult = Bun.spawn(['bun', 'run', tempFilePath], {
        cwd: projectPath,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      const exitCode = await processResult.exited;
      
      // Clean up temp file if it exists
      if (tempFilePath && existsSync(tempFilePath)) {
        try {
          unlinkSync(tempFilePath);
          // Remove from temp files list
          const index = tempFiles.indexOf(tempFilePath);
          if (index > -1) {
            tempFiles.splice(index, 1);
          }
        } catch (error) {
          // Only log clean-up errors if they're not due to file not existing
          if ((error as any).code !== 'ENOENT') {
            logger.warn(`Failed to clean up temporary file: ${tempFilePath}`);
          }
        }
      }
      
      const cssError = await new Response(processResult.stderr).text();
      if (cssError) {
        logger.error(`Error processing Tailwind CSS: ${cssError}`);
        processingTailwind = false;
        return false;
      }
      
      // Store the processed CSS in memory
      const cssOutput = await new Response(processResult.stdout).text();
      if (cssOutput) {
        // Only log success message if we're not throttling logs
        const shouldLogSuccess = Date.now() - lastLogTime > LOG_THROTTLE_MS;
        if (shouldLogSuccess) {
          logger.success("Tailwind CSS processing complete!");
          lastLogTime = Date.now();
        }
      }
      processedTailwindCss = cssOutput;
      lastProcessedTime = Date.now();
    } catch (error) {
      logger.error(`Error executing Tailwind processor: ${error}`);
      processingTailwind = false;
      return false;
    }
    
    // Success notification, but throttle logging
    if (shouldLog) {
      logger.success('Tailwind CSS processing complete!');
    }
    
    // Finish processing and check if another process is queued
    processingTailwind = false;
    
    // If another process was queued during this one, process it immediately
    if (processingQueued) {
      processingQueued = false;
      // Use setTimeout to avoid stack overflow from recursion
      setTimeout(() => processTailwindCss(projectPath), 0);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error processing Tailwind CSS: ${error}`);
    processingTailwind = false;
    return false;
  }
}

/**
 * Get the Tailwind runtime script for client-side dark mode toggling
 */
export function getTailwindRuntime(): { content: string; contentType: string } {
  const tailwindRuntime = `/* Tailwind CSS v4 Runtime */
  (function() {
    console.log('[0x1] Initializing Tailwind CSS runtime');
    
    // Add debug info to help troubleshoot
    console.log('[0x1] Tailwind runtime script loaded from:', document.currentScript?.src || 'inline');
    
    // Monitor dark mode preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      const darkModeOn = e.matches;
      const userPreference = localStorage.getItem('darkMode');
      console.log('[0x1] Dark mode preference changed:', darkModeOn ? 'dark' : 'light');
      
      // Only update if user hasn't explicitly set a preference
      if (userPreference === null) {
        if (darkModeOn) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
    
    // Function to toggle dark mode
    window.toggleDarkMode = function() {
      const isDark = document.documentElement.classList.contains('dark');
      console.log('[0x1] Toggling dark mode from', isDark ? 'dark' : 'light', 'to', !isDark ? 'dark' : 'light');
      
      if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'light');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'dark');
      }
    };
  })();`;
  
  return { content: tailwindRuntime, contentType: 'application/javascript' };
}

/**
 * Process CSS content with Tailwind CSS support
 */
export async function processCssFile(filePath: string, projectPath: string): Promise<{ content: string; contentType: string } | null> {
  try {
    // Check cache first
    const stats = await stat(filePath);
    const cacheKey = `${filePath}:${stats.mtime.getTime()}`;
    
    if (cssCache[cacheKey]) {
      return { content: cssCache[cacheKey].content, contentType: cssCache[cacheKey].contentType };
    }
    
    // Get file content
    const content = readFileSync(filePath, 'utf-8');
    const isTailwindCSS = content.includes('@import "tailwindcss"') || content.includes('@tailwind');
    
    if (isTailwindCSS) {
      // Ensure CSS is processed
      await processTailwindCss(projectPath);
      
      // For now, just return the content since we process it in a separate step
      const contentType = 'text/css';
      cssCache[cacheKey] = { content, contentType, timestamp: Date.now() };
      return { content, contentType };
    }
    
    // If not Tailwind CSS, just return the content
    const contentType = 'text/css';
    cssCache[cacheKey] = { content, contentType, timestamp: Date.now() };
    return { content, contentType };
  } catch (error) {
    logger.error(`Error processing CSS file ${filePath}: ${error}`);
    return null;
  }
}

/**
 * Generate CSS module script for client-side components
 */
export async function generateCssModuleScript(filePath: string, projectPath: string): Promise<{ content: string; contentType: string } | null> {
  try {
    // Check if file exists
    if (!existsSync(filePath)) {
      return null;
    }
    
    // Get file content
    const cssContent = readFileSync(filePath, 'utf-8');
    
    // Generate a cache key
    const stats = await stat(filePath);
    const cacheKey = `${filePath}:${stats.mtime.getTime()}:module`;
    
    // Generate the JS module
    return await generateCssModuleJs(filePath, cssContent, projectPath, cacheKey);
  } catch (error) {
    logger.error(`Error generating CSS module script for ${filePath}: ${error}`);
    return null;
  }
}

/**
 * Generate JavaScript mapping for a CSS module
 */
async function generateCssModuleJs(
  filePath: string,
  cssContent: string,
  projectPath: string,
  cacheKey: string
): Promise<{ content: string; contentType: string } | null> {
  try {
    // Check cache
    if (cssCache[cacheKey]) {
      return { content: cssCache[cacheKey].content, contentType: cssCache[cacheKey].contentType };
    }
    
    // Simple CSS module implementation
    // In a real implementation, we would parse the CSS and extract the class names
    // For now, we'll just return an empty object
    const jsContent = `
/* CSS Module for ${filePath.split('/').pop()} */
export default {};
`;
    
    const contentType = 'application/javascript';
    cssCache[cacheKey] = { content: jsContent, contentType, timestamp: Date.now() };
    return { content: jsContent, contentType };
  } catch (error) {
    logger.error(`Error generating CSS module JS for ${filePath}: ${error}`);
    return null;
  }
}
