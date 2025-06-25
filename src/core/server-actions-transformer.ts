/**
 * 0x1 Framework - Server Actions Transformer
 * Automatically transforms server action calls to RPC calls (Next.js style)
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

export interface ServerActionTransformOptions {
  sourceFilePath: string;
  projectPath: string;
  mode: 'development' | 'production';
  debug?: boolean;
}

export interface ServerActionInfo {
  functionName: string;
  importPath: string;
  resolvedPath: string;
  isNamedImport: boolean;
}

export class ServerActionsTransformer {
  /**
   * Transform server action imports and calls to RPC
   */
  static transformServerActions(content: string, options: ServerActionTransformOptions): string {
    // 1. Find all imports that might be server actions
    const serverActionImports = ServerActionsTransformer.findServerActionImports(content, options);
    
    if (serverActionImports.length === 0) {
      return content; // No server actions, return as-is
    }

    // 2. Transform imports to include RPC wrapper
    let transformedContent = content;
    
    for (const actionInfo of serverActionImports) {
      transformedContent = ServerActionsTransformer.transformServerActionImport(
        transformedContent, 
        actionInfo, 
        options
      );
    }

    // 3. Add RPC helper functions at the top
    transformedContent = ServerActionsTransformer.addRPCHelpers(transformedContent, options);

    return transformedContent;
  }

  /**
   * Find imports that reference server action files
   */
  private static findServerActionImports(content: string, options: ServerActionTransformOptions): ServerActionInfo[] {
    const imports: ServerActionInfo[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Match import statements
      const importMatch = line.match(/import\s+(.+?)\s+from\s+['"](.+?)['"];?/);
      if (!importMatch) continue;
      
      const [, importClause, importPath] = importMatch;
      
      // Skip if it's not a relative import (server actions are typically local)
      if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
        continue;
      }
      
      // Resolve the import path
      const resolvedPath = ServerActionsTransformer.resolveImportPath(importPath, options);
      if (!resolvedPath) continue;
      
      // Check if the file has "use server" directive
      if (!ServerActionsTransformer.hasUseServerDirective(resolvedPath)) {
        continue;
      }
      
      // Parse the import clause to extract function names
      const functions = ServerActionsTransformer.parseImportClause(importClause);
      
      for (const func of functions) {
        imports.push({
          functionName: func.name,
          importPath,
          resolvedPath,
          isNamedImport: func.isNamed
        });
      }
    }
    
    return imports;
  }

  /**
   * Resolve import path to absolute file path
   */
  private static resolveImportPath(importPath: string, options: ServerActionTransformOptions): string | null {
    try {
      const sourceDir = dirname(options.sourceFilePath);
      const basePath = resolve(sourceDir, importPath);
      
      // Try different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      
      for (const ext of extensions) {
        const fullPath = basePath + ext;
        if (existsSync(fullPath)) {
          return fullPath;
        }
      }
      
      // Try index files
      for (const ext of extensions) {
        const indexPath = resolve(basePath, `index${ext}`);
        if (existsSync(indexPath)) {
          return indexPath;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if file has "use server" directive
   */
  private static hasUseServerDirective(filePath: string): boolean {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const firstLines = content.split('\n').slice(0, 5).join('\n');
      return firstLines.includes('"use server"') || firstLines.includes("'use server'");
    } catch {
      return false;
    }
  }

  /**
   * Parse import clause to extract function names (filter out types)
   */
  private static parseImportClause(importClause: string): Array<{ name: string; isNamed: boolean }> {
    const functions: Array<{ name: string; isNamed: boolean }> = [];
    
    // Handle default import: import defaultFunc from "./actions"
    const defaultMatch = importClause.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:,|$)/);
    if (defaultMatch) {
      functions.push({ name: defaultMatch[1], isNamed: false });
    }
    
    // Handle named imports: import { func1, func2 } from "./actions"
    const namedMatch = importClause.match(/\{\s*([^}]+)\s*\}/);
    if (namedMatch) {
      const namedImports = namedMatch[1].split(',').map(s => s.trim());
      for (const namedImport of namedImports) {
        // Skip type imports
        if (namedImport.includes(' as ')) {
          const asMatch = namedImport.match(/^(.+?)\s+as\s+(.+)$/);
          if (asMatch) {
            const originalName = asMatch[1].trim();
            const aliasName = asMatch[2].trim();
            
            // CRITICAL: Both original name AND alias must be functions, not types
            if (ServerActionsTransformer.isTypeImport(originalName) || 
                ServerActionsTransformer.isTypeImport(aliasName)) {
              continue;
            }
            
            functions.push({ name: aliasName, isNamed: true });
          }
        } else {
          // Skip if it's a type import
          if (ServerActionsTransformer.isTypeImport(namedImport)) {
            continue;
          }
          
          functions.push({ name: namedImport.trim(), isNamed: true });
        }
      }
    }
    
    return functions;
  }

  /**
   * Check if an import is a type import
   */
  private static isTypeImport(importName: string, alias?: string): boolean {
    // Common type patterns
    const typePatterns = [
      /^[A-Z][a-zA-Z]*Type$/,  // MessageType, UserType
      /^[A-Z][a-zA-Z]*Interface$/,  // MessageInterface
      /^I[A-Z][a-zA-Z]*$/,     // IMessage
      /^[A-Z][a-zA-Z]*Props$/,  // MessageProps
      /^[A-Z][a-zA-Z]*$(?!.*[a-z].*[A-Z])/ // Simple PascalCase that might be types
    ];
    
    // Check the import name
    for (const pattern of typePatterns) {
      if (pattern.test(importName)) {
        return true;
      }
    }
    
    // Check the alias if provided
    if (alias) {
      for (const pattern of typePatterns) {
        if (pattern.test(alias)) {
          return true;
        }
      }
    }
    
    // Common type names
    const commonTypes = ['Message', 'User', 'Response', 'Request', 'Config', 'Options', 'Props', 'State'];
    if (commonTypes.includes(importName) || (alias && commonTypes.includes(alias))) {
      return true;
    }
    
    return false;
  }

  /**
   * Transform a server action import to include RPC wrapper
   */
  private static transformServerActionImport(
    content: string, 
    actionInfo: ServerActionInfo, 
    options: ServerActionTransformOptions
  ): string {
    // Remove the original import
    const importRegex = new RegExp(
      `import\\s+.+?\\s+from\\s+['"]${actionInfo.importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?\\s*`,
      'gm'
    );
    
    const transformed = content.replace(importRegex, '');
    
    // Add RPC wrapper function
    const relativePath = relative(options.projectPath, actionInfo.resolvedPath);
    const rpcWrapper = `
// Server Action RPC Wrapper for ${actionInfo.functionName}
const ${actionInfo.functionName} = async (...args) => {
  const response = await fetch('/__0x1_server_action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      functionName: '${actionInfo.functionName}',
      args,
      __filePath: '${actionInfo.resolvedPath}'
    })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Server action failed' }));
    throw new Error(error.error || 'Server action failed');
  }
  
  // Handle streaming responses (like chat completions)
  if (response.headers.get('content-type')?.includes('text/event-stream') || 
      response.headers.get('content-type')?.includes('application/octet-stream')) {
    return response;
  }
  
  return await response.json();
};
`;

    // Add the wrapper at the top (after imports)
    const lines = transformed.split('\n');
    let insertIndex = 0;
    
    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        insertIndex = i + 1;
      }
    }
    
    lines.splice(insertIndex, 0, rpcWrapper);
    
    return lines.join('\n');
  }

  /**
   * Add RPC helper functions
   */
  private static addRPCHelpers(content: string, options: ServerActionTransformOptions): string {
    // Check if helpers are already added
    if (content.includes('__0x1_serverActionHelpers')) {
      return content;
    }

    const helpers = `
// 0x1 Server Action RPC Helpers
const __0x1_serverActionHelpers = {
  initialized: true
};
`;

    // Add helpers at the very top
    return helpers + '\n' + content;
  }
}

/**
 * Convenience function for the DevOrchestrator
 */
export function transformServerActions(
  content: string, 
  sourceFilePath: string, 
  projectPath: string, 
  mode: 'development' | 'production' = 'development'
): string {
  return ServerActionsTransformer.transformServerActions(content, {
    sourceFilePath,
    projectPath,
    mode
  });
} 