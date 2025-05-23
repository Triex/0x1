/**
 * CSS Module Handler for 0x1 Framework
 * 
 * This provides Next.js-like CSS module support, automatically handling CSS imports
 * and generating scoped class names similar to how Next.js implements CSS modules.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "path";
import { logger } from "../../utils/logger.js";

/**
 * Process CSS content based on file path and type
 * Automatically handles CSS modules (.module.css) files
 */
export function processCssFile(filePath: string, projectPath: string): { content: string; contentType: string } | null {
  const fullPath = join(projectPath, filePath);
  
  if (!existsSync(fullPath)) {
    return null;
  }
  
  logger.info(`Processing CSS file: ${filePath}`);
  const cssContent = readFileSync(fullPath, "utf-8");
  
  // Process CSS content
  let processedCss = cssContent;
  
  // For module.css files, implement CSS modules with scoping
  if (filePath.endsWith(".module.css")) {
    // Create a unique module ID based on the file path
    const moduleId = filePath.replace(/[\/\.]/g, "_");
    
    // Basic CSS module implementation - scope all class selectors
    processedCss = processedCss.replace(/\.([a-zA-Z0-9_-]+)\s*\{/g, (match, className) => {
      return `.${moduleId}__${className} {`;
    });
    
    logger.debug(`Processed CSS module: ${filePath}`);
  }
  
  return {
    content: processedCss,
    contentType: "text/css; charset=utf-8"
  };
}

/**
 * Generate JavaScript mapping for a CSS module
 * This allows importing styles in components just like in Next.js
 */
export function generateCssModuleScript(filePath: string, projectPath: string): { content: string; contentType: string } | null {
  const fullPath = join(projectPath, filePath.replace(/\.js$/, ".module.css"));
  
  if (!existsSync(fullPath)) {
    return null;
  }
  
  const cssContent = readFileSync(fullPath, "utf-8");
  const moduleId = filePath.replace(/\.js$/, "").replace(/[\/\.]/g, "_");
  
  // Extract class names from CSS content
  const classNames = (cssContent.match(/\.([a-zA-Z0-9_-]+)\s*\{/g) || [])
    .map(selector => selector.slice(1, -1).trim());
  
  // Generate mapping object
  const mappingObject = classNames.reduce((acc, className) => {
    acc[className] = `${moduleId}__${className}`;
    return acc;
  }, {} as Record<string, string>);
  
  // Generate JavaScript module
  const jsContent = `
// 0x1 CSS Module: ${filePath}
// This file is auto-generated to provide CSS module support
const styles = ${JSON.stringify(mappingObject, null, 2)};
export default styles;
`;
  
  logger.debug(`Generated JS mapping for CSS module: ${filePath}`);
  
  return {
    content: jsContent,
    contentType: "application/javascript; charset=utf-8"
  };
}

/**
 * Check if a request is for a CSS module JS mapping
 */
export function isCssModuleJsRequest(path: string): boolean {
  return path.endsWith(".module.css.js") || 
         (path.endsWith(".js") && path.includes(".module.css"));
}

/**
 * Returns the modified path for the actual CSS file from a JS mapping request
 */
export function getCssPathFromJsRequest(path: string): string {
  return path.replace(/\.js$/, "");
}
