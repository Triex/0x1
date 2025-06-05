/**
 * 0x1 CLI - Preview Command
 * Serves the production build for local preview
 */

import { serve } from 'bun';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { logger } from '../utils/logger.js';

export interface PreviewOptions {
  port?: number;
  host?: string;
  open?: boolean;
  https?: boolean;
  dir?: string;
}

/**
 * Serve the production build for preview
 */
export async function previewBuild(options: PreviewOptions = {}): Promise<void> {
  // Set default options
  const port = options.port || 3000;
  const host = options.host || 'localhost';
  const open = options.open ?? false;
  const dir = options.dir || 'dist';
  
  // Get the absolute path to the build directory
  const buildPath = resolve(process.cwd(), dir);
  
  // Check if the build directory exists
  if (!existsSync(buildPath)) {
    logger.error(`Build directory not found: ${buildPath}`);
    logger.info('Run "0x1 build" first to create a production build.');
    process.exit(1);
  }
  
  logger.section('Starting preview server');
  
  const spin = logger.spinner(`Starting server at http${options.https ? 's' : ''}://${host}:${port}`);
  
  try {
    // Start the server
    // Server instance stored with underscore prefix as it might be needed in future for cleanup
    const _server = serve({
      port,
      hostname: host,
      fetch(req) {
        // Get the URL path
        const url = new URL(req.url);
        const path = url.pathname === '/' ? '/index.html' : url.pathname;
        
        // Determine the file path
        const filePath = resolve(buildPath, path.slice(1));
        
        // Check if the file exists first
        if (existsSync(filePath)) {
          const file = Bun.file(filePath);
          const contentType = getContentType(filePath);
          
          return new Response(file, {
            headers: {
              'Content-Type': contentType,
            }
          });
        }
        
        // If the path doesn't have an extension, try common extensions
        if (!path.includes('.')) {
          // Try .js extension first (for jsx-runtime, etc.)
          const jsPath = resolve(buildPath, path.slice(1) + '.js');
          if (existsSync(jsPath)) {
            const file = Bun.file(jsPath);
            return new Response(file, {
              headers: {
                'Content-Type': 'application/javascript'
              }
            });
          }
          
          // Try .html extension
          const htmlPath = resolve(buildPath, path.slice(1) + '.html');
          if (existsSync(htmlPath)) {
            const file = Bun.file(htmlPath);
            return new Response(file, {
              headers: {
                'Content-Type': 'text/html'
              }
            });
          }
          
          // Finally, try to serve index.html for SPA routing
          const indexPath = resolve(buildPath, 'index.html');
          if (existsSync(indexPath)) {
            const file = Bun.file(indexPath);
            return new Response(file, {
              headers: {
                'Content-Type': 'text/html'
              }
            });
          }
        }
        
        // If file doesn't exist and has no extension, serve index.html (for SPA routing)
        if (!path.includes('.') && existsSync(resolve(buildPath, 'index.html'))) {
          const file = Bun.file(resolve(buildPath, 'index.html'));
          return new Response(file, {
            headers: {
              'Content-Type': 'text/html'
            }
          });
        }
        
        // If the file doesn't exist, return 404
        return new Response('Not found', { status: 404 });
      }
    });
    
    spin.stop('success', `Preview server running at ${logger.highlight(`http${options.https ? 's' : ''}://${host}:${port}`)}`);
    logger.info('Press Ctrl+C to stop the server');
    
    // Open the browser if requested
    if (open) {
      // Use Bun's native shell execution instead of opener
      const url = `http${options.https ? 's' : ''}://${host}:${port}`;
      if (process.platform === 'darwin') {
        Bun.spawn(['open', url]);
      } else if (process.platform === 'win32') {
        Bun.spawn(['cmd', '/c', 'start', url]);
      } else {
        // Linux and others
        Bun.spawn(['xdg-open', url]);
      }
    }
    
  } catch (error) {
    spin.stop('error', 'Failed to start preview server');
    logger.error(`${error}`);
    
    // Check if the port is already in use
    if ((error as Error).message.includes('EADDRINUSE')) {
      logger.info(`Port ${port} is already in use. Try using a different port with --port option.`);
    }
    
    process.exit(1);
  }
}

/**
 * Get the content type based on file extension
 */
function getContentType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'html': return 'text/html';
    case 'css': return 'text/css';
    case 'js': return 'application/javascript';
    case 'json': return 'application/json';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'webp': return 'image/webp';
    case 'ico': return 'image/x-icon';
    case 'txt': return 'text/plain';
    case 'pdf': return 'application/pdf';
    case 'woff': return 'font/woff';
    case 'woff2': return 'font/woff2';
    case 'ttf': return 'font/ttf';
    case 'otf': return 'font/otf';
    case 'eot': return 'application/vnd.ms-fontobject';
    default: return 'application/octet-stream';
  }
}
