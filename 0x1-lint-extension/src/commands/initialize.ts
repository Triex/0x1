/**
 * Initialize Project Command
 * This command allows users to manually initialize a 0x1 project with the correct settings
 */

import * as vscode from 'vscode';
import { ConfigManager } from '../config-manager';

/**
 * Initialize a 0x1 project with proper TypeScript configuration
 * @param configManager The configuration manager instance
 */
export async function initializeProject(configManager: ConfigManager): Promise<void> {
  // Get all workspace folders
  const workspaceFolders = vscode.workspace.workspaceFolders;
  
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder is open. Please open a folder first.');
    return;
  }
  
  // If there's only one workspace folder, use it directly
  if (workspaceFolders.length === 1) {
    const folder = workspaceFolders[0];
    await setupProject(folder.uri.fsPath, configManager);
    return;
  }
  
  // If there are multiple workspace folders, ask the user to select one
  const folderItems = workspaceFolders.map(folder => ({
    label: folder.name,
    description: folder.uri.fsPath,
    folder
  }));
  
  const selectedFolder = await vscode.window.showQuickPick(folderItems, {
    placeHolder: 'Select a workspace folder to initialize as a 0x1 project'
  });
  
  if (selectedFolder) {
    await setupProject(selectedFolder.folder.uri.fsPath, configManager);
  }
}

/**
 * Setup a project folder with 0x1 configuration
 * @param projectPath The path to the project
 * @param configManager The configuration manager instance
 */
async function setupProject(projectPath: string, configManager: ConfigManager): Promise<void> {
  try {
    // Show progress indicator
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Initializing 0x1 project',
      cancellable: false
    }, async (progress) => {
      // Update progress
      progress.report({ message: 'Configuring TypeScript settings...' });
      
      // Configure the project
      await configManager.configureProject(projectPath);
      
      // Update progress
      progress.report({ message: 'Configuration complete' });
    });
    
    // Show success message
    vscode.window.showInformationMessage('0x1 project successfully initialized! TypeScript configuration has been updated.');
  } catch (error) {
    // Show error message
    vscode.window.showErrorMessage(`Failed to initialize 0x1 project: ${error instanceof Error ? error.message : String(error)}`);
  }
}
