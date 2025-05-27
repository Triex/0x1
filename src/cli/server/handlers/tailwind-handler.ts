/**
 * 0x1 Framework - Tailwind CSS Handler
 * Provides utilities for processing Tailwind CSS in development
 */

import { type Subprocess } from "bun";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { logger } from "../../utils/logger";

let processedTailwindCss: string | null = null;
let processingTailwind = false;
let tailwindProcess: Subprocess | null = null;
let tailwindProcessStarted = false;

// Global flag to prevent any duplicate processing across the entire system
let globalTailwindLock = false;

/**
 * Get the processed Tailwind CSS
 */
export function getProcessedTailwindCss(): string | null {
  return processedTailwindCss;
}

/**
 * Check if Tailwind is currently processing
 */
export function isTailwindProcessing(): boolean {
  return processingTailwind;
}

/**
 * Stop the current Tailwind process
 */
export async function stopTailwindProcess(): Promise<void> {
  if (tailwindProcess) {
    logger.debug("Stopping Tailwind process...");
    tailwindProcess.kill();
    tailwindProcess = null;
  }
}

/**
 * Check if Tailwind v4 is installed and get version
 */
async function checkTailwindV4Installation(projectPath: string): Promise<{ isV4: boolean; version?: string }> {
  try {
    const packageJsonPath = join(projectPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return { isV4: false };
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const tailwindVersion = deps.tailwindcss;
    if (!tailwindVersion) {
      return { isV4: false };
    }

    // Check if it's v4
    const isV4 = tailwindVersion.includes('4.') || tailwindVersion.includes('^4.') || tailwindVersion.includes('~4.');
    
    return { isV4, version: tailwindVersion };
  } catch (error) {
    logger.debug(`Error checking Tailwind installation: ${error}`);
    return { isV4: false };
  }
}

/**
 * Find Tailwind CSS input file for v4
 */
function findTailwindCssInput(projectPath: string): string | null {
  const possiblePaths = [
    join(projectPath, 'app/globals.css'),
    join(projectPath, 'src/globals.css'),
    join(projectPath, 'styles/globals.css'),
    join(projectPath, 'app/global.css'),
    join(projectPath, 'src/app/globals.css'),
    join(projectPath, 'public/styles.css'),
    join(projectPath, 'styles/main.css'),
    join(projectPath, 'css/main.css')
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Create default Tailwind CSS v4 input file
 */
function createDefaultTailwindInput(projectPath: string): string | null {
  try {
    const appDir = join(projectPath, 'app');
    if (!existsSync(appDir)) {
      mkdirSync(appDir, { recursive: true });
    }

    const inputPath = join(appDir, 'globals.css');
    
    const defaultContent = `@import "tailwindcss";

/* Your custom styles here */
:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
`;

    writeFileSync(inputPath, defaultContent);
    logger.info("Created default Tailwind CSS input file at app/globals.css");
    return inputPath;
  } catch (error) {
    logger.error(`Failed to create default Tailwind input: ${error}`);
    return null;
  }
}

/**
 * Process Tailwind CSS v4 from the project using the enhanced v4 handler
 */
export async function processTailwindCss(projectPath: string, forceProcess = false): Promise<boolean> {
  // PRODUCTION FIX: Completely prevent multiple calls - this handler should only run once
  if (globalTailwindLock && !forceProcess) {
    logger.debug("Tailwind CSS already initialized, skipping duplicate request");
    return true;
  }

  // Set global lock immediately to prevent any other calls
  globalTailwindLock = true;
  processingTailwind = true;

  try {
    // Import the v4 handler
    const { tailwindV4Handler } = await import('../../commands/utils/server/tailwind-v4.js');
    
    // Check if v4 is available
    const isV4Available = await tailwindV4Handler.isAvailable(projectPath);
    
    if (!isV4Available) {
      logger.warn("Tailwind CSS v4 not detected. Skipping CSS processing.");
      processingTailwind = false;
      return false;
    }

    const version = await tailwindV4Handler.getVersion(projectPath);
    logger.info(`🌈 Detected Tailwind CSS v4 (${version})`);

    // Find or create input file
    let inputFile = tailwindV4Handler.findInputFile(projectPath);
    if (!inputFile) {
      inputFile = tailwindV4Handler.createDefaultInput(projectPath);
      if (!inputFile) {
        processingTailwind = false;
        return false;
      }
    }

    logger.info(`Found Tailwind v4 input file: ${inputFile}`);

    // Create output directory
    const outputDir = join(projectPath, '.0x1/public');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = join(outputDir, 'styles.css');

    // Use the enhanced v4 handler for processing
    logger.info("🌟 Using modern Tailwind CSS v4 with built-in PostCSS");
    
    try {
      const result = await tailwindV4Handler.startProcess(projectPath, inputFile, outputFile);
      
      if (result && (result.process || result.command)) {
        // Mark as successfully started to prevent duplicates
        tailwindProcessStarted = true;
        processingTailwind = false; // Reset processing flag
        // Keep globalTailwindLock = true to prevent any future duplicate calls
        
        if (result.process) {
          tailwindProcess = result.process;
          logger.success(`✅ Tailwind CSS v4 watcher started with ${result.command.join(' ')}`);
        } else {
          logger.success(`✅ Tailwind CSS v4 processed successfully with ${result.command.join(' ')}`);
        }
        
        // Wait for CSS file and cache it (production-level file monitoring)
        setTimeout(async () => {
          for (let i = 0; i < 20; i++) { // Increased attempts for reliability
            if (existsSync(outputFile)) {
              try {
                const cssContent = readFileSync(outputFile, 'utf-8');
                // Cache the CSS content (it's valid Tailwind v4 CSS)
                processedTailwindCss = cssContent;
                logger.success(`✅ Tailwind CSS v4 ready: ${(cssContent.length / 1024).toFixed(1)}KB`);
                return;
              } catch (e) {
                // File might be being written, continue waiting
              }
            }
            await new Promise(resolve => setTimeout(resolve, 250)); // Faster polling
          }
          logger.warn("⚠️ Tailwind CSS file not generated within expected time");
        }, 500); // Start checking sooner
        
        return true; // SUCCESS - exit immediately
      } else {
        logger.error("Tailwind v4 handler returned invalid result");
        globalTailwindLock = false; // Reset lock on failure
        processingTailwind = false;
        return false;
      }
    } catch (error) {
      logger.error(`Failed to start Tailwind v4 process: ${error}`);
      globalTailwindLock = false; // Reset lock on failure
      processingTailwind = false;
      return false;
    }

  } catch (error) {
    logger.error(`Failed to process Tailwind CSS: ${error}`);
    processingTailwind = false;
    globalTailwindLock = false; // Reset on error to allow retry
    return false;
  }
}

/**
 * Get the Tailwind runtime script for client-side dark mode toggling
 */
export function getTailwindRuntime(): { content: string; contentType: string } {
  const tailwindRuntime = `
// 0x1 Framework - Tailwind CSS Runtime
  (function() {
  'use strict';
  
  // Dark mode toggle functionality
  function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
        } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }
  
  // Initialize theme on page load
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  }
  
  // Expose to global scope
  window.toggleDarkMode = toggleDarkMode;
  window.initTheme = initTheme;
  
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
`;

  return {
    content: tailwindRuntime,
    contentType: 'application/javascript'
  };
}

/**
 * Generate minimal essential CSS fallback for graceful degradation
 */
function generateMinimalFallbackCss(inputContent: string): string {
  // Remove @import "tailwindcss" to avoid errors
  const cleanInput = inputContent.replace(/@import\s+["']tailwindcss["'];?\s*/g, '');
  
  return `/* 0x1 Framework - Minimal Tailwind Fallback */
/* Essential utilities for graceful degradation (~3KB) */

/* Reset & Base */
*, ::before, ::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; line-height: 1.5; }

/* Layout Essentials */
.container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.grid { display: grid; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }

/* Spacing (most common) */
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mx-auto { margin-left: auto; margin-right: auto; }

/* Typography */
.text-center { text-align: center; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-5xl { font-size: 3rem; }
.font-bold { font-weight: 700; }
.font-medium { font-weight: 500; }

/* Colors */
.text-white { color: white; }
.bg-white { background-color: white; }

/* Borders & Shapes */
.rounded-lg { border-radius: 0.5rem; }
.border { border: 1px solid #e5e7eb; }

/* Responsive Grid */
@media (min-width: 768px) {
  .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

/* Component Patterns */
.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.gradient-text {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  body { background: #0f0f23; color: #f0f0ff; }
  .card { background: #1a1a2e; border-color: #2a2a4a; }
}

.dark body { background: #0f0f23; color: #f0f0ff; }
.dark .card { background: #1a1a2e; border-color: #2a2a4a; }

/* User's Custom Styles */
${cleanInput}
`;
}

/**
 * Handle Tailwind CSS requests in the web server
 */
export async function handleTailwindRequest(req: Request, projectPath: string): Promise<Response> {
  const url = new URL(req.url);
  
  if (url.pathname === '/tailwind-runtime.js') {
    const runtime = getTailwindRuntime();
    return new Response(runtime.content, {
      headers: {
        'Content-Type': runtime.contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
  
  // Handle CSS file requests
  if (url.pathname === '/styles.css') {
    const cssPath = join(projectPath, '.0x1/public/styles.css');
    
    if (existsSync(cssPath)) {
      const css = readFileSync(cssPath, 'utf-8');
      return new Response(css, {
        headers: {
          'Content-Type': 'text/css',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
  }
  
  return new Response('Not Found', { status: 404 });
}
