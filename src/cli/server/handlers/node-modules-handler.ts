/**
 * Node Modules Request Handler - Real File Serving
 * Replaces polyfill system with actual file serving from node_modules
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Handle node_modules requests with real file serving (not polyfills)
 */
export async function handleNodeModulesRequest(reqPath: string, projectPath: string): Promise<Response | null> {
  // Extract the full package path from the request
  const nodeModulesPrefix = '/node_modules/';
  if (!reqPath.startsWith(nodeModulesPrefix)) {
    return null;
  }
  
  const packagePath = reqPath.substring(nodeModulesPrefix.length);
  
  // Handle scoped packages (@scope/package/...)
  let packageName: string;
  let filePath: string;
  
  if (packagePath.startsWith('@')) {
    // Scoped package: @scope/package/file/path
    const parts = packagePath.split('/');
    if (parts.length < 2) {
      return new Response('Invalid scoped package path', { status: 404 });
    }
    packageName = `${parts[0]}/${parts[1]}`; // @scope/package
    filePath = parts.slice(2).join('/'); // dist/index.js
  } else {
    // Regular package: package/file/path
    packageName = packagePath.split('/')[0];
    filePath = packagePath.substring(packageName.length + 1);
  }

  // Check if package exists first
  const packageDir = join(projectPath, 'node_modules', packageName);
  if (existsSync(packageDir)) {
    try {
      // Try to serve the exact requested file
      const requestedFilePath = join(packageDir, filePath);
      
      if (existsSync(requestedFilePath)) {
        let content = readFileSync(requestedFilePath, 'utf-8');
        
        // Handle CSS files specially
        if (requestedFilePath.endsWith('.css')) {
          // Rewrite relative CSS imports to absolute URLs
          content = content.replace(
            /@import\s+['"]\.\/([^'"]+)['"];?/g,
            (match, filename) => {
              const absoluteUrl = `/node_modules/${packageName}/dist/${filename}`;
              return `@import '${absoluteUrl}';`;
            }
          );
          
          return new Response(content, {
            headers: {
              'Content-Type': 'text/css; charset=utf-8',
              'Cache-Control': 'no-cache'
            }
          });
        }
        
        return new Response(content, {
          headers: {
            'Content-Type': requestedFilePath.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'text/plain',
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      // If exact file doesn't exist, try fallbacks
      const packageJsonPath = join(packageDir, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const mainFile = packageJson.module || packageJson.main || 'index.js';
        const mainPath = join(packageDir, mainFile);
        
        if (existsSync(mainPath)) {
          let content = readFileSync(mainPath, 'utf-8');
          
          // Handle CSS files specially
          if (mainPath.endsWith('.css')) {
            // Rewrite relative CSS imports to absolute URLs
            content = content.replace(
              /@import\s+['"]\.\/([^'"]+)['"];?/g,
              (match, filename) => {
                const absoluteUrl = `/node_modules/${packageName}/dist/${filename}`;
                return `@import '${absoluteUrl}';`;
              }
            );
            
            return new Response(content, {
              headers: {
                'Content-Type': 'text/css; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          }
          
          return new Response(content, {
            headers: {
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-cache'
            }
          });
        }
      }
    } catch (error) {
      return new Response(`Error serving ${packageName}: ${error}`, { status: 500 });
    }
  }

  // Package not found
  return new Response(`Package not found: ${packageName}`, { status: 404 });
}
