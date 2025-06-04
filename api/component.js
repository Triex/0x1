/**
 * Vercel API function for component transpilation
 * Enhanced with better import handling while keeping it simple for Vercel
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  const { path } = req.query;
  
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }
  
  try {
    // Resolve the component file path
    const componentPath = join(process.cwd(), path);
    
    if (!existsSync(componentPath)) {
      return res.status(404).json({ error: `Component not found: ${path}` });
    }
    
    // Read the component source
    const sourceCode = readFileSync(componentPath, 'utf-8');
    
    // Enhanced JSX transformation for browser compatibility
    const transformedCode = sourceCode
      // Remove CSS imports that cause MIME type errors
      .replace(/import\s*['"'][^'"]*\.css['"];?/g, '// CSS import removed for browser compatibility')
      .replace(/import\s*['"'][^'"]*\.scss['"];?/g, '// SCSS import removed for browser compatibility')
      
      // Transform 0x1 hook imports to use window.React (same as component-handler.ts approach)
      .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]0x1['"];?/g, (match, imports) => {
        const hookNames = imports.split(',').map(s => s.trim());
        const hookAssignments = hookNames.map(hookName => {
          const cleanName = hookName.trim();
          if (['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef'].includes(cleanName)) {
            return `const ${cleanName} = window.React?.${cleanName} || (() => { throw new Error('[0x1] ${cleanName} not available'); });`;
          }
          return `// Skipped non-hook import: ${cleanName}`;
        });
        return `// Hook imports transformed to direct window.React access\n${hookAssignments.join('\n')}`;
      })
      
      // Convert other 0x1 imports to browser paths
      .replace(/from\s*["']0x1\/jsx-dev-runtime["']/g, 'from "/0x1/jsx-dev-runtime.js"')
      .replace(/from\s*["']0x1\/router["']/g, 'from "/0x1/router.js"')
      .replace(/from\s*["']0x1["']/g, 'from "/0x1/index.js"')
      
      // Transform relative imports to absolute paths
      .replace(/from\s*["']\.\.\/([^"']+)["']/g, (match, relativePath) => {
        return `from "/${relativePath.replace(/\.(tsx|ts)$/, '.js')}"`;
      })
      .replace(/from\s*["']\.\/([^"']+)["']/g, (match, relativePath) => {
        const currentDir = path.includes('/') ? path.split('/').slice(0, -1).join('/') : '';
        return `from "/${currentDir ? currentDir + '/' : ''}${relativePath.replace(/\.(tsx|ts)$/, '.js')}"`;
      })
      
      // Process directives (simple version)
      .replace(/['"]use client['"];?/g, '// Client directive processed')
      .replace(/['"]use server['"];?/g, '// Server directive processed');
    
    // Add JSX runtime and compatibility layer
    const browserCompatibleCode = `// 0x1 Framework Component - Browser Compatible
import { jsx, jsxs, jsxDEV, Fragment } from '/0x1/jsx-dev-runtime.js';

${transformedCode}`;
    
    // Set proper headers for JavaScript module
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    return res.status(200).send(browserCompatibleCode);
    
  } catch (error) {
    console.error('Component transpilation error:', error);
    
    // Return a production-quality error component
    const errorComponent = `// 0x1 Framework - Error Component
import { jsx, jsxDEV } from '/0x1/jsx-dev-runtime.js';

export default function ErrorComponent() {
  console.error('[0x1] Component error for ${path}:', '${error.message.replace(/'/g, "\\'")}');
  
  return jsxDEV('div', {
    className: 'error-boundary p-6 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg max-w-2xl mx-auto mt-8',
    children: [
      jsxDEV('h3', {
        className: 'text-lg font-medium text-red-800 mb-2',
        children: 'Component Error'
      }),
      jsxDEV('p', {
        className: 'text-sm text-red-700 mb-2 font-mono',
        children: 'File: ${path}'
      }),
      jsxDEV('p', {
        className: 'text-sm text-red-600',
        children: 'Error: ${error.message.replace(/'/g, "\\'")}'
      })
    ]
  });
}`;
    
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    return res.status(200).send(errorComponent);
  }
} 