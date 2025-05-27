/**
 * CSS Module Handler for 0x1 Framework
 * 
 * This provides Next.js-like CSS module support, automatically handling CSS imports
 * and generating scoped class names similar to how Next.js implements CSS modules.
 */

import { existsSync, readFileSync } from "node:fs";
import { logger } from "../../utils/logger";

/**
 * Process CSS content based on file path and type
 * Automatically handles CSS modules (.module.css) files
 */
// export function processCssFile(filePath: string, projectPath: string): { content: string; contentType: string } | null {
//   const fullPath = join(projectPath, filePath);
  
//   if (!existsSync(fullPath)) {
//     return null;
//   }
  
//   logger.info(`Processing CSS file: ${filePath}`);
//   const cssContent = readFileSync(fullPath, "utf-8");
  
//   // Process CSS content
//   let processedCss = cssContent;
  
//   // For module.css files, implement CSS modules with scoping
//   if (filePath.endsWith(".module.css")) {
//     // Create a unique module ID based on the file path
//     const moduleId = filePath.replace(/[\/\.]/g, "_");
    
//     // Basic CSS module implementation - scope all class selectors
//     processedCss = processedCss.replace(/\.([a-zA-Z0-9_-]+)\s*\{/g, (match, className) => {
//       return `.${moduleId}__${className} {`;
//     });
    
//     logger.debug(`Processed CSS module: ${filePath}`);
//   }
  
//   return {
//     content: processedCss,
//     contentType: "text/css; charset=utf-8"
//   };
// }

// /**
//  * Generate JavaScript mapping for a CSS module
//  * This allows importing styles in components just like in Next.js
//  */
// export function generateCssModuleScript(filePath: string, projectPath: string): { content: string; contentType: string } | null {
//   const fullPath = join(projectPath, filePath.replace(/\.js$/, ".module.css"));
  
//   if (!existsSync(fullPath)) {
//     return null;
//   }
  
//   const cssContent = readFileSync(fullPath, "utf-8");
//   const moduleId = filePath.replace(/\.js$/, "").replace(/[\/\.]/g, "_");
  
//   // Extract class names from CSS content
//   const classNames = (cssContent.match(/\.([a-zA-Z0-9_-]+)\s*\{/g) || [])
//     .map(selector => selector.slice(1, -1).trim());
  
//   // Generate mapping object
//   const mappingObject = classNames.reduce((acc, className) => {
//     acc[className] = `${moduleId}__${className}`;
//     return acc;
//   }, {} as Record<string, string>);
  
//   // Generate JavaScript module
//   const jsContent = `
// // 0x1 CSS Module: ${filePath}
// // This file is auto-generated to provide CSS module support
// const styles = ${JSON.stringify(mappingObject, null, 2)};
// export default styles;
// `;
  
//   logger.debug(`Generated JS mapping for CSS module: ${filePath}`);
  
//   return {
//     content: jsContent,
//     contentType: "application/javascript; charset=utf-8"
//   };
// }

// /**
//  * Check if a request is for a CSS module JS mapping
//  */
// export function isCssModuleJsRequest(path: string): boolean {
//   return path.endsWith(".module.css.js") || 
//          (path.endsWith(".js") && path.includes(".module.css"));
// }

/**
 * Returns the modified path for the actual CSS file from a JS mapping request
 */
export function getCssPathFromJsRequest(path: string): string {
  return path.replace(/\.js$/, "");
}

/**
 * Generate CSS module script for dynamic imports
 */
export function generateCssModuleScript(cssPath: string): string {
  return `
// CSS Module Script for ${cssPath}
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '${cssPath}';
document.head.appendChild(link);
`;
}

/**
 * Check if request is for CSS module JS
 */
export function isCssModuleJsRequest(path: string): boolean {
  return path.endsWith('.css.js') || path.includes('?css-module');
}

/**
 * Process CSS file and return content with type
 */
export async function processCssFile(filePath: string): Promise<{ content: string; contentType: string } | null> {
  try {
    if (!existsSync(filePath)) {
      return null;
    }

    const content = readFileSync(filePath, 'utf-8');
    return {
      content,
      contentType: 'text/css'
    };
  } catch (error) {
    logger.error(`Error processing CSS file ${filePath}: ${error}`);
    return null;
  }
}


// /**
//  * 0x1 Framework - CSS Handler
//  * Handles CSS processing, CSS modules, and delivery for the development server
//  */

// import { existsSync, readFileSync } from 'fs';
// import { dirname, extname, join, relative } from 'path';
// import { logger } from '../../utils/logger';

// // Cache for processed CSS to avoid redundant processing
// const cssCache = new Map<string, { content: string; timestamp: number }>();

// /**
//  * Process a CSS file for delivery
//  */
// export async function processCssFile(filePath: string, projectPath: string): Promise<string> {
//   try {
//     // Check cache first
//     const stats = await Bun.file(filePath).size();
//     const cachedResult = cssCache.get(filePath);
    
//     // Use cached version if file hasn't changed
//     if (cachedResult && stats !== null) {
//       return cachedResult.content;
//     }
    
//     // Read the CSS file
//     const cssContent = await Bun.file(filePath).text();
    
//     // Process the CSS (in a real implementation, you might use PostCSS, lightningcss, etc.)
//     let processedCss = cssContent;
    
//     // Simple processing: add source file comment for debugging
//     const relativePath = relative(projectPath, filePath);
//     processedCss = `/* 0x1 Framework - Processed CSS: ${relativePath} */\n${processedCss}`;
    
//     // Cache the processed CSS
//     cssCache.set(filePath, {
//       content: processedCss,
//       timestamp: Date.now()
//     });
    
//     return processedCss;
//   } catch (error) {
//     logger.error(`Failed to process CSS file ${filePath}: ${error}`);
//     return `/* Error processing CSS file ${filePath} */`;
//   }
// }

// /**
//  * Check if a request is for a CSS module JS file
//  */
// export function isCssModuleJsRequest(path: string): boolean {
//   return path.endsWith('.module.css.js');
// }

// /**
//  * Generate JS for a CSS module
//  */
// export async function generateCssModuleScript(filePath: string, projectPath: string): Promise<string> {
//   try {
//     // Extract the CSS module path from the request path
//     const cssFilePath = filePath.replace('.js', '');
    
//     if (!existsSync(cssFilePath)) {
//       throw new Error(`CSS module file not found: ${cssFilePath}`);
//     }
    
//     // Read the CSS file
//     const cssContent = await Bun.file(cssFilePath).text();
    
//     // Process the CSS and extract class names
//     // In a real implementation, you'd use a proper CSS modules processor
//     // This is a simplified version that extracts class names from the CSS
//     const classNames = extractClassNames(cssContent);
    
//     // Generate JavaScript that exports the class names
//     const jsContent = `
// // Generated by 0x1 Framework CSS Modules
// const styles = ${JSON.stringify(classNames, null, 2)};
// export default styles;
// `;
    
//     return jsContent;
//   } catch (error) {
//     logger.error(`Failed to generate CSS module script for ${filePath}: ${error}`);
//     return `
// // Error generating CSS module
// export default {};
// `;
//   }
// }

// /**
//  * Extract class names from CSS content (simplified example)
//  */
// function extractClassNames(cssContent: string): Record<string, string> {
//   const classNames: Record<string, string> = {};
  
//   // Simple regex to extract class names from CSS
//   // In a real implementation, you'd use a proper CSS parser
//   const classRegex = /\.([a-zA-Z0-9_-]+)[\s{]/g;
//   let match;
  
//   while ((match = classRegex.exec(cssContent)) !== null) {
//     const className = match[1];
//     // Generate a unique hash for the class name to avoid collisions
//     const hash = generateHash(className);
//     classNames[className] = `${className}_${hash}`;
//   }
  
//   return classNames;
// }

// /**
//  * Generate a simple hash for CSS module class names
//  */
// function generateHash(input: string): string {
//   // Simple hash function for demonstration
//   // In a real implementation, you'd use a more robust hash function
//   let hash = 0;
//   for (let i = 0; i < input.length; i++) {
//     hash = ((hash << 5) - hash) + input.charCodeAt(i);
//     hash |= 0; // Convert to 32-bit integer
//   }
  
//   // Convert to alphanumeric string (base 36)
//   return Math.abs(hash).toString(36).substring(0, 5);
// }


