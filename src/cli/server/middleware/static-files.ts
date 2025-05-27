/**
 * 0x1 Framework - Static Files Middleware
 * Handles serving static files with proper MIME types and caching
 */

import { existsSync } from 'fs';
import { extname, join, resolve } from 'path';
import { logger } from '../../utils/logger';
import { notFoundHandler } from './error-boundary';

// MIME type mapping for common file extensions
const MIME_TYPES: Record<string, string> = {
  // Text
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  
  // Images
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  
  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  
  // Other
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.zip': 'application/zip',
  '.wasm': 'application/wasm'
};

// Default mime type for unknown extensions
const DEFAULT_MIME_TYPE = 'application/octet-stream';

// Default cache control header for static files
const DEFAULT_CACHE_CONTROL = 'public, max-age=3600';

// Cache control header for static files based on extension
const CACHE_CONTROL: Record<string, string> = {
  // Cache images and fonts for longer periods
  '.ico': 'public, max-age=86400',
  '.png': 'public, max-age=86400',
  '.jpg': 'public, max-age=86400',
  '.jpeg': 'public, max-age=86400',
  '.gif': 'public, max-age=86400',
  '.svg': 'public, max-age=86400',
  '.webp': 'public, max-age=86400',
  '.woff': 'public, max-age=604800',
  '.woff2': 'public, max-age=604800',
  '.ttf': 'public, max-age=604800',
  '.otf': 'public, max-age=604800',
  '.eot': 'public, max-age=604800',
  
  // Don't cache HTML by default
  '.html': 'no-cache',
  
  // Cache JS and CSS for a short time in development
  '.js': 'public, max-age=60',
  '.mjs': 'public, max-age=60',
  '.css': 'public, max-age=60'
};

/**
 * Get MIME type for file based on extension
 */
export function getMimeType(path: string): string {
  const ext = extname(path).toLowerCase();
  return MIME_TYPES[ext] || DEFAULT_MIME_TYPE;
}

/**
 * Get cache control header for file based on extension
 */
export function getCacheControl(path: string): string {
  const ext = extname(path).toLowerCase();
  return CACHE_CONTROL[ext] || DEFAULT_CACHE_CONTROL;
}

/**
 * Static files middleware
 */
export async function serveStaticFile(
  req: Request, 
  projectPath: string, 
  options: { 
    basePath?: string; 
    fallbackToIndex?: boolean;
    isDev?: boolean;
  } = {}
): Promise<Response | null> {
  const { 
    basePath = '', 
    fallbackToIndex = false,
    isDev = process.env.NODE_ENV !== 'production'
  } = options;
  
  // Parse the URL and get the pathname
  const url = new URL(req.url);
  let pathname = url.pathname;
  
  // Remove any trailing slash
  if (pathname.endsWith('/') && pathname !== '/') {
    pathname = pathname.slice(0, -1);
  }
  
  // If path is empty or just '/', serve index.html
  if (pathname === '' || pathname === '/') {
    pathname = '/index.html';
  }
  
  // Get the absolute file path
  const relativePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const filePath = resolve(projectPath, basePath, relativePath);
  
  try {
    // Check if the file exists
    if (!existsSync(filePath)) {
      // Try with .html extension if the file doesn't exist
      const htmlPath = `${filePath}.html`;
      if (existsSync(htmlPath)) {
        return serveFile(htmlPath, isDev);
      }
      
      // Try serving index.html from the directory if fallbackToIndex is true
      if (fallbackToIndex) {
        const indexPath = join(filePath, 'index.html');
        if (existsSync(indexPath)) {
          return serveFile(indexPath, isDev);
        }
      }
      
      // File not found
      return null;
    }
    
    // Serve the file
    return serveFile(filePath, isDev);
  } catch (error) {
    logger.error(`Error serving static file ${filePath}: ${error}`);
    return null;
  }
}

/**
 * Serve a file with proper MIME type and caching
 */
async function serveFile(filePath: string, isDev: boolean): Promise<Response> {
  // Get the file extension
  const ext = extname(filePath).toLowerCase();
  
  // Get the appropriate MIME type and cache control
  const contentType = getMimeType(filePath);
  const cacheControl = isDev ? 'no-cache' : getCacheControl(filePath);
  
  // Read the file using Bun's optimized file API
  const file = Bun.file(filePath);
  
  // Return the response with appropriate headers
  return new Response(file, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl
    }
  });
}
