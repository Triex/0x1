/**
 * 0x1 CLI - Development Server Command
 * Runs the development server with hot reloading
 * Automatically detects and processes Tailwind CSS in parallel
 */

import { serve, type Server, spawn, type Subprocess } from 'bun';
import { existsSync, mkdirSync, readFileSync, readdirSync, Dirent } from 'fs';
import { watch } from 'fs/promises';
import { join, resolve } from 'path';
import { logger } from '../utils/logger.js';
import { build } from './build.js';

export interface DevOptions {
  port?: number;
  host?: string;
  open?: boolean;
  https?: boolean;
  config?: string;
  ignore?: string[];
  skipTailwind?: boolean; // Option to skip Tailwind processing
}

/**
 * Start the development server
 */
export async function startDevServer(options: DevOptions = {}): Promise<void> {
  // Load configuration
  const configPath = options.config ? 
    resolve(process.cwd(), options.config) : 
    findConfigFile();
  
  const config = configPath ? loadConfig(configPath) : {};
  
  // Set default options
  const port = options.port || config.server?.port || 3000;
  const host = options.host || config.server?.host || 'localhost';
  const open = options.open ?? false;
  const ignorePatterns = options.ignore || config?.build?.ignore || ['node_modules', '.git', 'dist'];
  
  logger.section('Starting development server');
  
  // Run initial build to make sure everything is ready
  const initialBuild = logger.spinner('Running initial build');
  try {
    await build({ watch: false, silent: true, ignore: ignorePatterns });
    initialBuild.stop('success', 'Initial build complete');
  } catch (error) {
    initialBuild.stop('error', 'Initial build failed');
    logger.error(`Build error: ${error}`);
    return;
  }
  
  // Check for Tailwind CSS configuration and start processing if needed
  let tailwindProcess: Subprocess | null = null;
  if (!options.skipTailwind) {
    const tailwindConfigPath = resolve(process.cwd(), 'tailwind.config.js');
    if (existsSync(tailwindConfigPath)) {
      tailwindProcess = await startTailwindProcessing();
    }
  }

  // Start the development server
  const serverSpin = logger.spinner(`Starting server at http${options.https ? 's' : ''}://${host}:${port}`);
  
  try {
    // Create the dev server which includes file watcher setup internally
    const { server, watcher } = await createDevServer({ port, host, ignorePatterns });
    serverSpin.stop('success', `Server running at ${logger.highlight(`http${options.https ? 's' : ''}://${host}:${port}`)}`);
    
    // Open browser if requested
    if (open) {
      const { default: opener } = await import('opener');
      opener(`http${options.https ? 's' : ''}://${host}:${port}`);
    }
    
    // Handle exit signals
    process.on('SIGINT', () => {
      logger.info('Shutting down development server...');
      // Terminate Tailwind process if running
      if (tailwindProcess) {
        tailwindProcess.kill();
      }
      watcher.close();
      server.stop(true);
      process.exit(0);
    });
    
    logger.info('Ready for development. Press Ctrl+C to stop.');
    
  } catch (error) {
    serverSpin.stop('error', 'Failed to start development server');
    logger.error(`${error}`);
    
    // Check if the port is already in use
    if ((error as Error).message.includes('EADDRINUSE')) {
      logger.info(`Port ${port} is already in use. Try using a different port with --port option.`);
    }
    
    process.exit(1);
  }
}

/**
 * Create the development server
 */
async function createDevServer(options: { port: number; host: string; ignorePatterns?: string[] }): Promise<{ server: Server; watcher: { close: () => void } }> {
  const { port, host, ignorePatterns = ['node_modules', '.git', 'dist'] } = options;
  
  // Determine source and public directories based on project structure
  const projectPath = process.cwd();
  const customStructureFile = resolve(projectPath, 'structure.js');
  const hasCustomStructure = existsSync(customStructureFile);
  
  let srcDir: string;
  let publicDir: string;
  let distDir: string;
  
  if (hasCustomStructure) {
    try {
      // Load custom structure configuration
      const structureConfigModule = await import(customStructureFile);
      const structureConfig = structureConfigModule.default || structureConfigModule;
      if (structureConfig.sourceDirs) {
        // Use the root directory as source
        srcDir = projectPath;
        // Use custom paths if specified
        publicDir = resolve(projectPath, structureConfig.sourceDirs.public || 'public');
        distDir = resolve(projectPath, structureConfig.buildPaths?.output || 'dist');
        logger.info('Using custom project structure for development server');
      } else {
        // Fall back to standard directories
        srcDir = resolve(projectPath, 'src');
        publicDir = resolve(projectPath, 'public');
        distDir = resolve(projectPath, 'dist');
      }
    } catch (error) {
      logger.warn(`Failed to load custom structure from ${customStructureFile}. Using default directories.`);
      srcDir = resolve(projectPath, 'src');
      publicDir = resolve(projectPath, 'public');
      distDir = resolve(projectPath, 'dist');
    }
  } else {
    // Check if src directory exists, if not use project root
    const standardSrcDir = resolve(projectPath, 'src');
    
    if (existsSync(standardSrcDir)) {
      srcDir = standardSrcDir;
      publicDir = resolve(projectPath, 'public');
      distDir = resolve(projectPath, 'dist');
    } else {
      // Use project root if no src directory
      srcDir = projectPath;
      publicDir = resolve(projectPath, 'public');
      distDir = resolve(projectPath, 'dist');
    }
  }
  
  let liveReloadScript = '';
  
  try {
    liveReloadScript = await Bun.file(
      join(import.meta.dirname || '', '../../browser/live-reload.js')
    ).text();
  } catch (error) {
    logger.warn('Failed to load live reload script, hot reloading will be disabled');
    liveReloadScript = '// Live reload not available';
  }
  
  // Create connected clients set for live reload
  const connectedClients = new Set<WritableStreamDefaultWriter<Uint8Array>>();
  
  // Setup server
  const server = serve({
    port,
    hostname: host,
    async fetch(req) {
      const url = new URL(req.url);
      let path = url.pathname;
      
      // Handle SSE connection for live reload
      if (req.url === '/events') {
        // Add client to connected clients
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        
        // Store the client
        connectedClients.add(writer);
        
        // Set up auto-cleanup when response is closed
        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      }
      
      // Handle live reload script
      if (path === '/__0x1_live_reload.js') {
        return new Response(liveReloadScript, {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache',
          },
        });
      }
      
      // Default to index.html for root path
      if (path === '/') {
        path = '/index.html';
        logger.debug(`Requested root path, looking for index.html`);
      }
      
      // Determine file path
      let filePath: string;
      let fileExists = false;
      
      // Log directory paths we're checking
      logger.debug(`Looking for ${path} in the following directories:`);
      logger.debug(`- Dist: ${distDir}`);
      logger.debug(`- Public: ${publicDir}`);
      logger.debug(`- Source: ${srcDir}`);
      
      // Check if the file exists in the dist directory first (for processed files)
      filePath = join(distDir, path);
      fileExists = existsSync(filePath);
      if (fileExists) {
        logger.debug(`Found in dist directory: ${filePath}`);
      }
      
      // If not in dist, check public directory
      if (!fileExists) {
        filePath = join(publicDir, path);
        fileExists = existsSync(filePath);
        if (fileExists) {
          logger.debug(`Found in public directory: ${filePath}`);
        }
      }
      
      // If not in public, check src directory
      if (!fileExists) {
        filePath = join(srcDir, path);
        fileExists = existsSync(filePath);
        if (fileExists) {
          logger.debug(`Found in src directory: ${filePath}`);
        }
      }
      
      // If not found, check the project root as a last resort
      if (!fileExists && path.endsWith('.html')) {
        filePath = join(projectPath, path.substring(1)); // Remove leading slash
        fileExists = existsSync(filePath);
        if (fileExists) {
          logger.debug(`Found in project root: ${filePath}`);
        }
      }
      
      // If file doesn't exist, try adding .html extension for clean URLs
      if (!fileExists && !path.endsWith('.html')) {
        const htmlPath = `${path}.html`;
        
        filePath = join(distDir, htmlPath);
        fileExists = existsSync(filePath);
        
        if (!fileExists) {
          filePath = join(srcDir, htmlPath);
          fileExists = existsSync(filePath);
        }
      }
      
      // If still doesn't exist, see if it's an SPA route and serve index.html
      if (!fileExists && !path.includes('.')) {
        filePath = join(srcDir, 'index.html');
        fileExists = existsSync(filePath);
        
        if (!fileExists) {
          filePath = join(distDir, 'index.html');
          fileExists = existsSync(filePath);
        }
      }
      
      // If file exists, serve it
      if (fileExists) {
        const file = Bun.file(filePath);
        const type = file.type;
        
        if (path.endsWith('.html')) {
          // Inject live reload script into HTML files
          let content = await file.text();
          
          if (!content.includes('__0x1_live_reload.js')) {
            content = content.replace(
              '</head>',
              '<script src="/__0x1_live_reload.js" type="module"></script></head>'
            );
          }
          
          // Log successful HTML connection
          logger.info(`200 OK: ${path}`);
          
          return new Response(content, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache',
            },
          });
        }
        
        // For TypeScript files, transpile them on the fly
        if (path.endsWith('.ts') || path.endsWith('.tsx')) {
          try {
            const result = Bun.transpileFile(filePath, {
              loader: 'ts',
              target: 'browser',
              platform: 'browser',
              minify: false,
              tsc: {
                target: 99, // esnext
                module: 99, // esnext
                moduleResolution: 2, // node
                jsx: 1, // react
                esModuleInterop: true,
                skipLibCheck: true,
                allowSyntheticDefaultImports: true,
                paths: {
                  '*': ['*', './*', './lib/*', './store/*', './pages/*']
                }
              }
            });
            
            return new Response(result.outputText, {
              headers: {
                'Content-Type': 'application/javascript',
                'Cache-Control': 'no-cache',
              },
            });
          } catch (error) {
            logger.error(`Failed to transpile ${path}: ${error}`);
            return new Response(`// Error transpiling ${path}: ${error}`, {
              headers: {
                'Content-Type': 'application/javascript',
                'Cache-Control': 'no-cache',
              },
              status: 500,
            });
          }
        }
        
        // Log successful connection
        logger.info(`200 OK: ${path}`);
        
        return new Response(file, {
          headers: {
            'Content-Type': type,
            'Cache-Control': path.includes('hash.') ? 'max-age=31536000' : 'no-cache',
          },
        });
      }
      
      // If file doesn't exist, return 404
      logger.debug(`404 Not Found: ${path}`);
      return new Response('Not Found', { status: 404 });
    },
    error(error) {
      logger.error(`Server error: ${error}`);
      return new Response('Server Error', { status: 500 });
    },
  });
  
  /**
   * Notify all clients of changes
   */
  function notifyClients() {
    // Create message
    const message = new TextEncoder().encode('data: update\n\n');
    
    // Send reload message to all clients
    for (const client of connectedClients) {
      try {
        // Write the message but don't release the lock - we need it for future messages
        client.write(message);
      } catch (error) {
        // If sending fails, remove the client from the set
        try {
          client.releaseLock();
        } catch (e) {
          // Ignore errors when releasing lock
        }
        connectedClients.delete(client);
      }
    }
  }
  
  /**
   * Set up file watcher for live reload
   */
  function setupFileWatcher(server: Server) {
    // Use the already determined srcDir and publicDir from parent scope
    // which support both src-based and root-based project structures
    
    // Setup debounced reload
    let reloadTimeout: NodeJS.Timeout | null = null;
    
    const debounceReload = () => {
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      
      reloadTimeout = setTimeout(() => {
        notifyClients();
        reloadTimeout = null;
      }, 100);
    };
    
    // Helper function to check if a path should be ignored
    function shouldIgnore(path: string): boolean {
      if (!path) return false;
      
      return ignorePatterns.some(pattern => {
        // Convert pattern to regex if it has wildcards
        if (pattern.includes('*')) {
          const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');
          const regex = new RegExp(`^${regexPattern}$`);
          return regex.test(path);
        }
        return path.includes(pattern);
      });
    }
    
    // Watch src and public directories
    const srcWatcher = watch(srcDir, { recursive: true });
    const publicWatcher = existsSync(publicDir) ? watch(publicDir, { recursive: true }) : null;
    
    // Process file change events
    (async () => {
      try {
        for await (const event of srcWatcher) {
          // Skip ignored patterns
          if (shouldIgnore(event.filename || '')) {
            continue;
          }
          
          logger.debug(`File changed: ${event.filename}`);
          debounceReload();
        }
      } catch (error) {
        logger.error(`File watcher error: ${error}`);
      }
    })();
    
    if (publicWatcher) {
      (async () => {
        try {
          for await (const event of publicWatcher) {
            // Skip ignored patterns
            if (shouldIgnore(event.filename || '')) {
              continue;
            }
            
            logger.debug(`Public file changed: ${event.filename}`);
            debounceReload();
          }
        } catch (error) {
          logger.error(`Public file watcher error: ${error}`);
        }
      })();
    }
    
    // Create a watcher with a close method that works with AsyncIterables
    return {
      close: () => {
        // Use AbortController to abort the async iterator loops
        const controller = new AbortController();
        const signal = controller.signal;
        controller.abort();
        
        // Actual AbortController usage would be implemented in the watch function
        // This is a placeholder until we can refactor the file watching logic
        logger.debug('Closing file watchers');
      }
    };
  }
  
  // Set up the file watcher
  const watcher = setupFileWatcher(server);
  
  // Return both the server and watcher
  return { server, watcher };
}

/**
 * Find configuration file in project directory
 */
function findConfigFile(): string | null {
  const possibleConfigs = [
    '0x1.config.ts',
    '0x1.config.js',
    '0x1.config.mjs',
  ];
  
  for (const config of possibleConfigs) {
    const configPath = resolve(process.cwd(), config);
    if (existsSync(configPath)) {
      return configPath;
    }
  }
  
  return null;
}

/**
 * Load configuration from file
 */
function loadConfig(configPath: string): any {
  try {
    if (!existsSync(configPath)) {
      logger.warn(`Configuration file not found: ${configPath}`);
      return {};
    }
    
    // For now, we'll just parse the file to extract configuration values
    // In a real implementation, we would properly import the module
    const content = readFileSync(configPath, 'utf-8');
    
    // Very basic parsing - in a real implementation, we would use proper module loading
    const config: any = {};
    
    // Extract port from server config
    const portMatch = content.match(/port:\s*(\d+)/);
    if (portMatch) {
      config.server = config.server || {};
      config.server.port = parseInt(portMatch[1], 10);
    }
    
    // Extract host from server config
    const hostMatch = content.match(/host:\s*['"](.*?)['"]/); 
    if (hostMatch) {
      config.server = config.server || {};
      config.server.host = hostMatch[1];
    }
    
    return config;
  } catch (error) {
    logger.warn(`Failed to load configuration from ${configPath}: ${error}`);
    return {};
  }
}

/**
 * Start Tailwind CSS processing in the background
 * This function detects Tailwind configuration and runs the CSS processing
 * in parallel with the development server
 */
async function startTailwindProcessing(): Promise<Subprocess | null> {
  try {
    // First, check if tailwindcss is installed
    const projectPath = process.cwd();
    const tailwindBinPath = join(projectPath, 'node_modules', '.bin', 'tailwindcss');
    
    if (!existsSync(tailwindBinPath)) {
      logger.warn('Tailwind CSS configuration detected, but tailwindcss package not found in node_modules.');
      logger.warn('Install tailwindcss to enable automatic CSS processing: bun add -d tailwindcss');
      return null;
    }
    
    // Find the input CSS file
    const inputCssFile = findTailwindInputCss(projectPath);
    
    if (!inputCssFile) {
      logger.warn('Could not find input CSS file for Tailwind processing.');
      logger.warn('Create a CSS file in styles/main.css or src/styles/main.css');
      return null;
    }
    
    // Ensure the output directory exists
    const outputDir = join(projectPath, 'public', 'styles');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    const outputCssFile = join(outputDir, 'tailwind.css');
    
    // Log the detected files
    logger.info(`Detected Tailwind CSS configuration`);
    logger.info(`Input: ${inputCssFile}`);
    logger.info(`Output: ${outputCssFile}`);
    
    // Start the Tailwind process with Bun's optimized --watch flag for efficient hot reloading
    const tailwindSpin = logger.spinner('Starting Tailwind CSS processing');
    
    // Use Bun's API for optimal performance with hot reloading
    const tailwindProcess = spawn({
      cmd: [tailwindBinPath, '-i', inputCssFile, '-o', outputCssFile, '--watch'],
      stdout: 'pipe',
      stderr: 'pipe',
      env: process.env
    });
    
    // Log processed CSS info to provide better feedback during development
    let cssProcessed = false;
    
    // Set up completion handler
    tailwindProcess.exited.then((result) => {
      if (result !== 0) {
        logger.error(`Tailwind process exited unexpectedly with code ${result}`);
      }
    }).catch(error => {
      logger.error(`Tailwind process error: ${error}`);
    });
    
    // Handle output from the Tailwind process with enhanced hot reload feedback
    let didShowSuccess = false;
    
    // Set up stream readers using Bun's ReadableStream handling
    (async () => {
      const reader = tailwindProcess.stdout.getReader();
      try {
        const continueReading = true;
        while (continueReading) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const output = new TextDecoder().decode(value);
          
          if (output.includes('Done in') || output.includes('Rebuilt')) {
            if (!didShowSuccess) {
              tailwindSpin.stop('success', 'Tailwind CSS processed successfully');
              logger.info(`CSS file generated at ${outputCssFile}`);
              cssProcessed = true;
              didShowSuccess = true;
            } else {
              // Hot reload message for file changes
              logger.info('🔄 Tailwind CSS hot reloaded');
            }
          }
        }
      } catch (error) {
        logger.error(`Error reading from Tailwind stdout: ${error}`);
      } finally {
        reader.releaseLock();
      }
    })();
    
    // Set up error stream reader
    (async () => {
      const reader = tailwindProcess.stderr.getReader();
      try {
        const continueReading = true;
        while (continueReading) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const output = new TextDecoder().decode(value);
          
          if (output.includes('Error')) {
            tailwindSpin.stop('error', 'Tailwind CSS processing failed');
            logger.error(output);
          } else if (output.includes('warn')) {
            // Just print warnings without stopping the spinner
            logger.warn(output.trim());
          }
        }
      } catch (error) {
        logger.error(`Error reading from Tailwind stderr: ${error}`);
      } finally {
        reader.releaseLock();
      }
    })();
    
    // Consider process successful after a reasonable timeout
    setTimeout(() => {
      if (!didShowSuccess) {
        tailwindSpin.stop('success', 'Tailwind CSS ready');
        didShowSuccess = true;
      }
    }, 5000);
    
    return tailwindProcess;
  } catch (error) {
    logger.error(`Failed to start Tailwind CSS processing: ${error}`);
    return null;
  }
}

/**
 * Find the input CSS file for Tailwind processing
 * Searches in common locations and checks the tailwind.config.js for hints
 */
function findTailwindInputCss(projectPath: string): string | null {
  // Common locations for CSS input files
  const commonLocations = [
    join(projectPath, 'styles', 'main.css'),
    join(projectPath, 'src', 'styles', 'main.css'),
    join(projectPath, 'css', 'main.css'),
    join(projectPath, 'src', 'css', 'main.css'),
    join(projectPath, 'assets', 'css', 'main.css'),
    join(projectPath, 'src', 'assets', 'css', 'main.css'),
    // Using 'input.css' naming convention (Tailwind docs example)
    join(projectPath, 'styles', 'input.css'),
    join(projectPath, 'src', 'styles', 'input.css'),
    // Looking for any CSS file in standard locations
    join(projectPath, 'styles', 'style.css'),
    join(projectPath, 'src', 'styles', 'style.css'),
    // Global CSS naming (Next.js convention)
    join(projectPath, 'styles', 'globals.css'),
    join(projectPath, 'src', 'styles', 'globals.css')
  ];
  
  // Check common locations first
  for (const location of commonLocations) {
    if (existsSync(location)) {
      return location;
    }
  }
  
  // If not found in common locations, try to parse the tailwind.config.js
  // to look for hints about the input file
  const tailwindConfigPath = join(projectPath, 'tailwind.config.js');
  if (existsSync(tailwindConfigPath)) {
    try {
      const configContent = readFileSync(tailwindConfigPath, 'utf-8');
      // Look for comments that might indicate the input file
      const inputFileComment = configContent.match(/input\s*:\s*['"](.*?)['"]/);
      if (inputFileComment && inputFileComment[1]) {
        const inputPath = join(projectPath, inputFileComment[1]);
        if (existsSync(inputPath)) {
          return inputPath;
        }
      }
    } catch (error) {
      // Silently continue if we can't parse the config
    }
  }
  
  // If still not found, look for any CSS file in the project root
  try {
    // Use Node.js API to be compatible with Bun
    // Now using imports from the top of the file
    
    const dirEntries = readdirSync(projectPath, { withFileTypes: true });
    const cssFiles = dirEntries
      .filter((entry: Dirent) => entry.isFile() && entry.name.endsWith('.css'))
      .map((entry: Dirent) => join(projectPath, entry.name));
    
    if (cssFiles.length > 0) {
      return cssFiles[0]; // Return the first CSS file found
    }
  } catch (error) {
    // Silently continue if we can't read the directory
  }
  
  return null;
}
