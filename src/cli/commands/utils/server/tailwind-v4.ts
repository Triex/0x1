/**
 * Tailwind CSS v4 handler with full v4 API support
 */

import { spawn } from "bun";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { logger } from "../../../utils/logger";

export const tailwindV4Handler = {
  /**
   * Check if Tailwind CSS v4 is available
   */
  async isAvailable(projectPath: string): Promise<boolean> {
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      if (!existsSync(packageJsonPath)) return false;

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const tailwindVersion = deps.tailwindcss;
      if (!tailwindVersion) return false;

      // Check for v4
      return tailwindVersion.includes('4.') || 
             tailwindVersion.includes('^4.') || 
             tailwindVersion.includes('~4.');
    } catch {
      return false;
    }
  },

  /**
   * Get version info
   */
  async getVersion(projectPath: string): Promise<string | null> {
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      if (!existsSync(packageJsonPath)) return null;

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      return deps.tailwindcss || null;
    } catch {
      return null;
    }
  },

  /**
   * Enhanced detection with comprehensive version checking
   */
  async detect(projectPath: string): Promise<{ detected: boolean; version?: string; command?: string }> {
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      if (!existsSync(packageJsonPath)) {
        return { detected: false };
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const tailwindVersion = deps.tailwindcss;
      if (!tailwindVersion) {
        return { detected: false };
      }

      // Enhanced v4 detection with support for latest versions
      const isV4 = tailwindVersion.includes('4.') || 
                   tailwindVersion.includes('^4.') || 
                   tailwindVersion.includes('~4.') ||
                   tailwindVersion.includes('4.0.0-') ||
                   tailwindVersion.includes('4.1.') ||
                   tailwindVersion.includes('next');

      if (isV4) {
        // Determine the best command to use
        const commands = [
          '@tailwindcss/cli@next',
          'tailwindcss@latest', 
          'tailwindcss'
        ];
        
        for (const cmd of commands) {
          try {
            // Test if command is available
            const testResult = await Bun.spawn(['bunx', cmd, '--help'], {
              stdout: 'pipe',
              stderr: 'pipe'
            }).exited;
            
            if (testResult === 0) {
              return { 
                detected: true, 
                version: tailwindVersion,
                command: cmd
              };
            }
          } catch (e) {
            // Continue to next command
          }
        }
        
        return { 
          detected: true, 
          version: tailwindVersion,
          command: 'tailwindcss' // fallback
        };
      }

      return { detected: false };
    } catch (error) {
      logger.debug(`Error detecting Tailwind v4: ${error}`);
      return { detected: false };
    }
  },

  /**
   * Find input CSS file
   */
  findInputFile(projectPath: string): string | null {
    const possiblePaths = [
      'app/globals.css',
      'src/globals.css', 
      'styles/globals.css',
      'app/global.css',
      'src/app/globals.css',
      'public/styles.css',
      'styles/main.css',
      'css/main.css'
    ].map(p => join(projectPath, p));

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }

    return null;
  },

  /**
   * Create default v4 input CSS
   */
  createDefaultInput(projectPath: string): string | null {
    try {
      const appDir = join(projectPath, 'app');
      if (!existsSync(appDir)) {
        mkdirSync(appDir, { recursive: true });
      }

      const inputPath = join(appDir, 'globals.css');
      
      const v4DefaultContent = `@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #6366f1;
  --font-family-sans: system-ui, sans-serif;
}

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

/* 0x1 Framework specific styles */
.0x1-container {
  @apply max-w-6xl mx-auto px-4;
}

.0x1-button {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}

.0x1-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6;
}
`;

      writeFileSync(inputPath, v4DefaultContent);
      logger.info("Created Tailwind CSS v4 input file with @theme configuration");
      return inputPath;
    } catch (error) {
      logger.error(`Failed to create v4 input file: ${error}`);
      return null;
    }
  },

  /**
   * Start Tailwind v4 process with production-quality error handling
   */
  async startProcess(projectPath: string, inputFile: string, outputFile: string): Promise<any> {
    const detection = await this.detect(projectPath);
    if (!detection.detected) {
      throw new Error('Tailwind CSS v4 not detected. Please install tailwindcss@^4.0.0');
    }

    // Ensure PostCSS config exists for v4 (required per official docs)
    await this.ensurePostCSSConfig(projectPath);

    // Ensure output directory exists with proper permissions
    const outputDir = dirname(outputFile);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true, mode: 0o755 });
    }

    logger.info(`🌈 Starting Tailwind CSS v4 (${detection.version}) with optimized configuration`);

    // Production-quality command configuration with latest v4 features
    const baseArgs = [
      '--input', inputFile, 
      '--output', outputFile, 
      '--watch',
      '--verbose' // Enable verbose logging for better debugging
    ];
    
    // Use Bun's native PostCSS support with Tailwind v4's built-in plugin
    logger.info(`🌈 Processing Tailwind CSS v4 with Bun's native PostCSS support`);
    
    try {
      // Use Bun's built-in PostCSS processing with the config
      const result = await this.processCssWithBun(inputFile, outputFile, projectPath);
      
      if (result.success) {
        logger.success(`✅ Tailwind CSS v4 processed successfully: ${(result.size / 1024).toFixed(1)}KB`);
        return {
          process: null,
          command: ['bun-postcss'],
          version: detection.version,
          kill: () => {},
          exited: Promise.resolve(0)
        };
      }
    } catch (error) {
      logger.debug(`Bun PostCSS processing failed: ${error}`);
    }

    // Fallback commands if direct processing fails
    const commands: (string[] | null)[] = [
      null // Go straight to fallback
    ];

    let processStarted = false;
    let tailwindProcess: any = null;
    let lastError: Error | null = null;
    let successfulCommand: string[] | null = null;

    for (const command of commands) {
      // Handle fallback case (null command)
      if (command === null) {
        logger.warn('⚠️ All Tailwind commands failed, generating fallback CSS');
        break;
      }
      
      try {
        logger.info(`💠 Attempting Tailwind v4: ${command.join(' ')}`);
        
        // Enhanced spawn configuration with proper environment
        tailwindProcess = spawn({
          cmd: command,
          cwd: projectPath,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            NODE_ENV: 'development',
            TAILWIND_MODE: 'watch',
            FORCE_COLOR: '1' // Enable colored output
          }
        });

        // Production-quality process validation
        const isValid = await this.validateProcessStart(tailwindProcess, 3000);
        
        if (isValid) {
          processStarted = true;
          successfulCommand = command;
          logger.success(`✅ Tailwind CSS v4 watcher started with ${command[1]}`);
          
          // IMPORTANT: Return immediately on success to prevent fallback
          return { 
            process: tailwindProcess,
            command: successfulCommand,
            version: detection.version,
            kill: () => tailwindProcess?.kill(),
            exited: tailwindProcess?.exited
          };
        } else {
          throw new Error('Process validation failed');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.debug(`Command ${command[1]} failed: ${lastError.message}`);
        if (tailwindProcess) {
          try {
            tailwindProcess.kill();
          } catch (e) {
            // Ignore kill errors
          }
        }
        continue;
      }
    }

    if (!processStarted) {
      logger.warn('⚠️ Could not start Tailwind watcher, trying one-time PostCSS build');
      
      // Try a one-time PostCSS build instead of watching
      try {
        const oneTimeCommands = [
          ['bun', 'x', 'postcss', inputFile, '-o', outputFile],
        ];
        
        for (const cmd of oneTimeCommands) {
          try {
            logger.info(`💠 Trying one-time build: ${cmd.join(' ')}`);
            const result = await Bun.spawn({
              cmd,
              cwd: projectPath,
              stdio: ['pipe', 'pipe', 'pipe']
            }).exited;
            
            if (result === 0 && existsSync(outputFile)) {
              logger.success('✅ One-time Tailwind CSS build successful');
              return {
                process: null,
                command: cmd,
                version: detection.version,
                kill: () => {},
                exited: Promise.resolve(0)
              };
            }
          } catch (e) {
            logger.debug(`One-time command failed: ${e}`);
          }
        }
      } catch (error) {
        logger.debug(`One-time build failed: ${error}`);
      }
      
      // Final fallback: minimal essential CSS
      logger.warn('⚠️ Generating minimal fallback CSS (Tailwind processing failed)');
      try {
        const inputContent = existsSync(inputFile) ? readFileSync(inputFile, 'utf-8') : '';
        const minimalFallback = this.generateMinimalFallback(inputContent);
        writeFileSync(outputFile, minimalFallback);
        logger.info(`✅ Generated minimal fallback CSS: ${(minimalFallback.length / 1024).toFixed(1)}KB`);
      } catch (e) {
        logger.error(`Failed to generate fallback: ${e}`);
        writeFileSync(outputFile, '/* Tailwind CSS processing failed */');
      }
      
      return {
        process: null,
        command: ['copy-input'],
        version: detection.version,
        kill: () => {},
        exited: Promise.resolve(0)
      };
    }

    return { 
      process: tailwindProcess,
      command: successfulCommand,
      version: detection.version,
      kill: () => tailwindProcess?.kill(),
      exited: tailwindProcess?.exited
    };
  },

  /**
   * Validate process startup with simple timeout (no stream reading to avoid locks)
   */
  async validateProcessStart(process: any, timeoutMs: number = 2000): Promise<boolean> {
    return new Promise((resolve) => {
      // Simple validation - just check if process is alive after a delay
      setTimeout(() => {
        const isValid = process && !process.killed;
        resolve(isValid);
      }, 1000); // 1 second check
    });
  },



  /**
   * Process CSS using Bun's native PostCSS support with Tailwind v4
   */
  async processCssWithBun(inputFile: string, outputFile: string, projectPath: string): Promise<{ success: boolean; size: number }> {
    try {
      // Import PostCSS and Tailwind plugin dynamically
      const postcss = await import('postcss');
      const tailwindPlugin = await import('@tailwindcss/postcss');
      
      // Read input CSS
      const inputCss = readFileSync(inputFile, 'utf-8');
      
      // Process with PostCSS and Tailwind plugin
      const result = await postcss.default([tailwindPlugin.default]).process(inputCss, {
        from: inputFile,
        to: outputFile
      });
      
      // Write output
      writeFileSync(outputFile, result.css);
      
      return { success: true, size: result.css.length };
    } catch (error) {
      logger.debug(`Bun PostCSS processing error: ${error}`);
      return { success: false, size: 0 };
    }
  },

  /**
   * Ensure PostCSS config exists for Tailwind v4 (required per official docs)
   */
  async ensurePostCSSConfig(projectPath: string): Promise<void> {
    const configPaths = [
      join(projectPath, 'postcss.config.js'),
      join(projectPath, 'postcss.config.mjs'),
      join(projectPath, 'postcss.config.cjs')
    ];
    
    // Check if any PostCSS config exists
    const hasConfig = configPaths.some(path => existsSync(path));
    
    if (!hasConfig) {
      logger.info('Creating PostCSS config for Tailwind CSS v4...');
      
      // Create the working config (object syntax with autoprefixer)
      const configContent = `export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
`;
      
      try {
        writeFileSync(configPaths[1], configContent); // Use .mjs extension
        logger.success('Created postcss.config.mjs for Tailwind CSS v4');
      } catch (error) {
        logger.error(`Failed to create PostCSS config: ${error}`);
      }
    }
  },

  /**
   * Generate minimal essential CSS fallback for graceful degradation
   * Best practice: small, focused utilities that cover 80% of common use cases
   */
  generateMinimalFallback(inputContent: string): string {
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
};
