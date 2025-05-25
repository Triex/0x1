import { existsSync, readFileSync } from 'node:fs';
import { join } from 'path';
import { logger } from '../../utils/logger.js';

/**
 * Handles component requests and transpilation
 */
export function handleComponentRequest(
  reqPath: string, 
  projectPath: string,
  componentBasePath: string
): Response | null {
  // Check for the component in various formats (.tsx, .jsx, .ts, .js)
  const possibleComponentPaths = [
    join(projectPath, `${componentBasePath}.tsx`),
    join(projectPath, `${componentBasePath}.jsx`),
    join(projectPath, `${componentBasePath}.ts`),
    join(projectPath, `${componentBasePath}.js`)
  ];
  
  // Find the first matching component path
  const componentPath = possibleComponentPaths.find(path => existsSync(path));
  
  if (!componentPath) return null;
  
  try {
    logger.info(`✅ 200 OK: ${reqPath} (Component from ${componentPath.replace(projectPath, '')})`);
    
    // Extract component name for easier reference
    const componentName = componentPath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'UnknownComponent';
    
    // Read the source code
    const sourceCode = readFileSync(componentPath, 'utf-8');
    
    // Determine if this is a JSX/TSX file
    const extension = componentPath.split('.').pop() || 'js';
    const isJSX = extension === 'tsx' || extension === 'jsx';
    
    // If this is a JSX/TSX file, transpile it with Bun
    if (isJSX) {
      try {
        logger.debug(`Transpiling ${componentPath} using Bun.Transpiler`);
        
        // Simple, clean transpiler configuration that works without type errors
        const transpiler = new Bun.Transpiler({
          loader: extension === 'tsx' ? 'tsx' : 'jsx',
          target: 'browser',
          define: {
            'process.env.NODE_ENV': '"development"',
            'React.createElement': 'createElement',
            'React.Fragment': 'Fragment',
            // Use normal function names that will be available in runtime
            'jsx': 'jsx',
            'jsxs': 'jsxs',
            'jsxDEV': 'jsxDEV'
          }
        });
        
        // Extract CSS imports before transpilation for separate handling
        const cssImports: string[] = [];
        sourceCode.replace(/import\s+["'](.+?\.css)["'];?/g, (match, path) => {
          cssImports.push(path);
          return match; // Don't modify original code yet
        });
        
        // Replace CSS imports with empty statements to avoid browser resolution errors
        let modifiedSource = sourceCode.replace(/import\s+["'].+?\.css["'];?/g, '// CSS import removed during transpilation');
        
        // Transpile the modified source code
        const transpiledCode = transpiler.transformSync(modifiedSource);
        
        // No need for local JSX utils, we'll use the global window functions instead
        const jsxUtilsImport = `
// Use global window utility functions for JSX handling
// These are already defined in the browser environment in server-templates.ts
`;

        // Process the transpiled code to fix import paths but preserve Next.js 15-style layouts with full HTML structure
        // We no longer strip HTML structure, since Next.js 15 uses it in layouts
        let processedCode = transpiledCode
          .replace(/from\s+["']react["']/g, 'from "0x1"')
          .replace(/from\s+["']react\/jsx-runtime["']/g, 'from "0x1/jsx-runtime"')
          .replace(/from\s+["']react\/jsx-dev-runtime["']/g, 'from "0x1/jsx-dev-runtime"');
        
        // Add CSS loading code for extracted imports
        if (cssImports.length > 0) {
          let cssLoadingCode = '\n// Load extracted CSS imports\n';
          cssLoadingCode += '(function() {\n';
          cssLoadingCode += '  const loadCSS = async (path) => {\n';
          cssLoadingCode += '    try {\n';
          cssLoadingCode += '      let resolvedPath = path;\n';
          
          // Logic for path resolution based on component path
          cssLoadingCode += '      if (path.startsWith("./")) {\n';
          cssLoadingCode += '        if (path === "./globals.css") resolvedPath = "/globals.css";\n';
          cssLoadingCode += '        else if ("' + componentPath + '".includes("/app/")) {\n';
          cssLoadingCode += '          resolvedPath = "/app/" + path.substring(2);\n';
          cssLoadingCode += '        }\n';
          cssLoadingCode += '      }\n';
          
          cssLoadingCode += '      const response = await fetch(resolvedPath);\n';
          cssLoadingCode += '      if (!response.ok) throw new Error(`Failed to load CSS: ${resolvedPath}`);\n';
          cssLoadingCode += '      const css = await response.text();\n';
          cssLoadingCode += '      const style = document.createElement("style");\n';
          cssLoadingCode += '      style.textContent = css;\n';
          cssLoadingCode += '      document.head.appendChild(style);\n';
          cssLoadingCode += '      console.log(`[0x1] Loaded CSS: ${resolvedPath}`);\n';
          cssLoadingCode += '    } catch (err) {\n';
          cssLoadingCode += '      console.error(`[0x1] Error loading CSS: ${path}`, err);\n';
          cssLoadingCode += '    }\n';
          cssLoadingCode += '  };\n';
          
          // Add each CSS file to be loaded
          cssImports.forEach(path => {
            cssLoadingCode += `  loadCSS("${path}");\n`;
          });
          
          cssLoadingCode += '})();\n';
          
          // Prepend CSS loading code to the processed code
          processedCode = cssLoadingCode + processedCode;
        }
        
        // Fix relative imports - IMPORTANT: Don't add extra components/ prefix
        processedCode = processedCode
          .replace(/from\s+["']\.\.\/components\/(.*?)["']/g, 'from "components/$1"')
          .replace(/from\s+["']\.\.\/(.+?)["']/g, 'from "$1"')
          .replace(/from\s+["']\.\/(.*?)["']/g, 'from "components/$1"')
          
          // Fix dynamic imports
          .replace(/import\(["']\.\.\/components\/(.*?)["']\)/g, 'import("components/$1")')
          .replace(/import\(["']\.\.\/(.+?)["']\)/g, 'import("$1")')
          .replace(/import\(["']\.\/(.*?)["']\)/g, 'import("components/$1")');
        
        // Process imports for better compatibility
        const importRegex = /import\s+.*?['"]([^'"]+)['"]/g;
        let importMatches;
        let importLines = '';
        
        while ((importMatches = importRegex.exec(sourceCode)) !== null) {
          // Only process external or relative imports, not importing from React/JSX runtime
          if (!importMatches[1].includes('react') && !importMatches[1].includes('jsx-runtime')) {
            importLines += `// Original import: ${importMatches[0]}\n`;
          }
        }
        
        // Combine the boolean filter code with the processed code
        const enhancedCode = processedCode;
        
        // Determine the component type from the path
        const componentType = componentPath.toLowerCase().includes('/layout.') ? 'layout' : 'page';
        
        // Generate the full component code with the enhanced options
        const fullComponentCode = generateComponentCode(componentPath, enhancedCode);
        
        return new Response(fullComponentCode, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      } catch (error: unknown) {
        const transpileError = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to transpile ${componentPath}: ${transpileError}`);
        // Instead of returning nothing, return a basic fallback component
        const fallbackCode = generateComponentCode(componentPath, `export default function ErrorComponent() { return { type: 'div', props: { className: 'error-component' }, children: ['Failed to transpile: ${transpileError}'] }; }`);
        return new Response(fallbackCode, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
    } else {
      // For non-JSX files, just return the content
      return new Response(sourceCode, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate" 
        }
      });
    }
  } catch (error) {
    logger.error(`Failed to process component ${componentPath}: ${error}`);
    return null;
  }
}

/**
 * Generate the component code with proper error handling and exports
 */
export function generateComponentCode(componentPath: string, sourceCode: string): string {
  // Determine original and relative paths
  const originalPath = componentPath;
  const relativePath = originalPath.replace(/^\/?app\//, '');
  
  // Extract component name from path
  const componentName = originalPath.split('/').pop()?.replace(/\.(tsx|jsx|js|ts)$/, '') || 'Component';
  
  // Determine component type (layout or page)
  const componentType = componentPath.toLowerCase().includes('/layout.') ? 'layout' : 'page';
  
  // Return simple component handler code with no extra wrapping
  return sourceCode;
}

/**
 * Generate a fallback component for error cases
 */
export function generateFallbackComponent(componentName: string, errorMessage: string): string {
  return `
// 0x1 fallback component for ${componentName}
export default function ${componentName}(props) {
  const container = document.createElement('div');
  container.className = 'fallback-component p-4 border border-yellow-300 bg-yellow-50 rounded';
  container.innerHTML = '<p>Component not found: ${componentName}</p>';
  
  // Render any children if provided
  if (props && props.children) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'mt-4 p-2 border-t border-yellow-300';
    
    const allChildren = props.children;
    allChildren.forEach(child => {
      if (child === null || child === undefined || typeof child === 'boolean') {
        // Skip null, undefined, and boolean values entirely
        return;
      } else if (child instanceof Node) {
        childrenContainer.appendChild(child);
      } else if (Array.isArray(child)) {
        child.forEach(nestedChild => {
          if (nestedChild instanceof Node) {
            childrenContainer.appendChild(nestedChild);
          } else if (nestedChild !== null && nestedChild !== undefined && typeof nestedChild !== 'boolean') {
            // Only append non-null, non-undefined, non-boolean values
            childrenContainer.appendChild(document.createTextNode(String(nestedChild)));
          }
        });
      } else {
        // Only append non-boolean primitive values
        childrenContainer.appendChild(document.createTextNode(String(child)));
      }
    });
    
    container.appendChild(childrenContainer);
  }
  
  return container;
}
`;
}