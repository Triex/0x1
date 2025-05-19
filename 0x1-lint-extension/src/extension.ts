/**
 * 0x1 Lint Extension
 * Main extension file that activates when a 0x1 project is detected
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigManager } from './config-manager';
import { initializeProject } from './commands/initialize';

// Logging helper with prefix
function log(message: string): void {
  console.log(`[0x1 Lint] ${message}`);
}

// Activation context for the extension
export function activate(context: vscode.ExtensionContext) {
  log('Extension is now active');
  
  // Initialize configuration manager
  const configManager = new ConfigManager(context);
  
  // Register commands
  const initializeCommand = vscode.commands.registerCommand(
    '0x1.initializeProject', 
    () => initializeProject(configManager)
  );
  
  // Add the command to the extension context
  context.subscriptions.push(initializeCommand);
  
  // Auto-detect 0x1 projects and configure them
  autoDetectAndConfigure(configManager);
  
  // Watch for workspace changes
  const watcher = vscode.workspace.createFileSystemWatcher('**/package.json');
  
  watcher.onDidChange(() => autoDetectAndConfigure(configManager));
  watcher.onDidCreate(() => autoDetectAndConfigure(configManager));
  
  context.subscriptions.push(watcher);
}

// Auto-detect 0x1 projects in the workspace and configure them
async function autoDetectAndConfigure(configManager: ConfigManager): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  
  if (!workspaceFolders) return;
  
  for (const folder of workspaceFolders) {
    const packageJsonPath = path.join(folder.uri.fsPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Check if this is a 0x1 project by looking for dependencies or devDependencies
        const is0x1Project = (
          (packageJson.dependencies && packageJson.dependencies['0x1']) ||
          (packageJson.devDependencies && packageJson.devDependencies['0x1']) ||
          // Also check for local path or workspace reference
          folder.uri.fsPath.includes('/0x1/')
        );
        
        if (is0x1Project) {
          log(`0x1 project detected in ${folder.name}`);
          
          // Configure the project
          await configManager.configureProject(folder.uri.fsPath);
          
          // Find TSX files and validate they have imports
          await validateTsxFiles(folder.uri.fsPath);
          
          // Show a notification
          vscode.window.showInformationMessage(
            `0x1 project detected in ${folder.name}. TypeScript configuration has been updated.`
          );
        }
      } catch (error) {
        console.error('Error parsing package.json:', error);
      }
    }
  }
}

// Validate TSX files to ensure they have necessary imports
async function validateTsxFiles(projectPath: string): Promise<void> {
  // Find all TSX files
  const tsxFiles = await findTsxFiles(projectPath);
  
  for (const file of tsxFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file needs to import 0x1
      if (content.includes('<') && content.includes('>') && !content.includes("from '0x1'")) {
        log(`TSX file missing 0x1 import: ${file}`);
        
        // We could add automatic fixing here if desired
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
}

// Find all TSX files in the project
async function findTsxFiles(projectPath: string): Promise<string[]> {
  // Simple implementation - could be improved with proper glob support
  const result: string[] = [];
  
  function scanDir(dirPath: string) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
        scanDir(filePath);
      } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.jsx'))) {
        result.push(filePath);
      }
    }
  }
  
  scanDir(projectPath);
  return result;
}

// Deactivation handler
export function deactivate() {
  log('Extension is now deactivated');
}
