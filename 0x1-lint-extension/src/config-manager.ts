/**
 * Configuration Manager for 0x1 Lint Extension
 * Handles updating TypeScript and VS Code configurations for 0x1 projects
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ConfigManager {
  // Simplified constructor - we don't need to store these values since they're not used
  constructor(_context: vscode.ExtensionContext) {
    // No need to store context or extensionPath as they're not used in any methods
  }
  
  /**
   * Configure a 0x1 project with the correct TypeScript settings
   * @param projectPath The path to the 0x1 project
   */
  public async configureProject(projectPath: string): Promise<void> {
    // Update tsconfig.json if it exists
    await this.updateTsConfig(projectPath);
    
    // Create reference to framework types if needed
    await this.createTypeReferences(projectPath);
  }
  
  /**
   * Update the project's tsconfig.json file to work with 0x1
   * @param projectPath The path to the 0x1 project
   */
  private async updateTsConfig(projectPath: string): Promise<void> {
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    
    // Find the location of the framework
    const frameworkPath = this.findFrameworkPath(projectPath);
    
    // Default TypeScript configuration for 0x1 projects
    const tsconfig = {
      compilerOptions: {
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "react",
        jsxFactory: "createElement",
        jsxFragmentFactory: "Fragment",
        strict: false, // Make type checking less strict for 0x1 projects
        allowJs: true,
        esModuleInterop: true,
        skipLibCheck: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        isolatedModules: true,
        baseUrl: ".",
        paths: {
          "0x1": [frameworkPath ? `${frameworkPath}` : "node_modules/0x1"],
          "0x1/*": [frameworkPath ? `${frameworkPath}/*` : "node_modules/0x1/*"]
        }
      },
      include: [
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx"
      ],
      exclude: [
        "node_modules",
        "dist",
        ".next",
        "out"
      ]
    };
    
    // If tsconfig.json already exists, merge our settings with it
    if (fs.existsSync(tsconfigPath)) {
      try {
        const existingConfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        
        // Merge compilerOptions, prioritizing our JSX settings
        tsconfig.compilerOptions = {
          ...existingConfig.compilerOptions,
          jsx: tsconfig.compilerOptions.jsx,
          jsxFactory: tsconfig.compilerOptions.jsxFactory,
          jsxFragmentFactory: tsconfig.compilerOptions.jsxFragmentFactory,
          // Ensure paths are merged properly
          paths: {
            ...existingConfig.compilerOptions?.paths,
            ...tsconfig.compilerOptions.paths
          }
        };
        
        // Merge include and exclude
        tsconfig.include = [...new Set([
          ...(existingConfig.include || []),
          ...tsconfig.include
        ])];
        
        tsconfig.exclude = [...new Set([
          ...(existingConfig.exclude || []),
          ...tsconfig.exclude
        ])];
      } catch (error) {
        console.error('Error parsing existing tsconfig.json:', error);
      }
    }
    
    // Write the updated tsconfig.json
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  }
  
  /**
   * Find the path to the 0x1 framework installation
   * @param projectPath The path to the project
   * @returns The relative path to the 0x1 framework
   */
  private findFrameworkPath(projectPath: string): string | null {
    // First check for local node_modules
    const nodeModulesPath = path.join(projectPath, 'node_modules', '0x1');
    if (fs.existsSync(nodeModulesPath)) {
      return 'node_modules/0x1';
    }
    
    // Then check for symlinked or workspace dependency
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Check for workspace dependencies
        if (packageJson.workspaces) {
          const workspaces = Array.isArray(packageJson.workspaces) 
            ? packageJson.workspaces 
            : packageJson.workspaces.packages || [];
          
          // Look for 0x1 in workspace patterns
          for (const workspace of workspaces) {
            // Basic check for exact match (not handling globs properly here)
            if (workspace === '0x1' || workspace.endsWith('/0x1')) {
              return workspace;
            }
          }
        }
      } catch (error) {
        console.error('Error parsing package.json:', error);
      }
    }
    
    // Fallback to default
    return null;
  }
  
  /**
   * Create necessary type references for the project
   * Minimal approach - rely on the framework's types instead of copying
   * @param projectPath The path to the project
   */
  private async createTypeReferences(projectPath: string): Promise<void> {
    // Create a reference file for global JSX types
    const vscodePath = path.join(projectPath, '.vscode');
    if (!fs.existsSync(vscodePath)) {
      fs.mkdirSync(vscodePath);
    }
    
    // Create settings.json for VSCode to recognize JSX without warnings
    const settingsPath = path.join(vscodePath, 'settings.json');
    const settings = {
      "typescript.tsdk": "node_modules/typescript/lib",
      "javascript.validate.enable": false,
      "typescript.validate.enable": true,
      "typescript.preferences.jsxAttributeCompletionStyle": "auto",
      "typescript.preferences.importModuleSpecifier": "non-relative",
      "typescript.preferences.useAliasesForRenames": true
    };
    
    // If settings.json exists, merge our settings with it
    if (fs.existsSync(settingsPath)) {
      try {
        const existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        Object.assign(settings, existingSettings);
      } catch (error) {
        console.error('Error parsing VSCode settings.json:', error);
      }
    }
    
    // Write settings.json
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }
}
