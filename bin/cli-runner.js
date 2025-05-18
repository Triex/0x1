#!/usr/bin/env node

/**
 * 0x1 CLI Direct Runner
 * 
 * This script handles the global CLI execution with maximum reliability
 * by directly referencing the global package and handling PATH issues.
 * Works across all platforms (macOS, Linux, Windows/WSL).
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

// ESM compatibility for __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const homeDir = os.homedir();
const args = process.argv.slice(2);
const isWindows = process.platform === 'win32';
const isWSL = !isWindows && os.release().toLowerCase().includes('microsoft');

// IMPORTANT: Run the actual binary directly rather than depending on PATH
(async () => {
  try {
    // Determine platform-specific paths and separators
    const pathSeparator = isWindows ? ';' : ':';
    
    // Normalize paths for different platforms
    const bunBasePath = path.join(homeDir, '.bun');
    const bunBinPath = path.join(bunBasePath, 'bin');
    
    // Windows may have different path structure under WSL
    const enhancedEnv = {
      ...process.env,
      PATH: `${bunBinPath}${pathSeparator}${process.env.PATH || ''}`,
      BUN_INSTALL: bunBasePath
    };

    // Check for Windows/WSL special case
    if (isWindows || isWSL) {
      // On Windows/WSL, we need a different approach
      const execOptions = { 
        stdio: 'inherit',
        env: enhancedEnv,
        shell: isWindows
      };
      
      try {
        // Try bunx as the primary approach on Windows
        const result = spawnSync('bunx', ['0x1', ...args], execOptions);
        if (result.status === 0 || result.status === null) {
          process.exit(result.status || 0);
        }
        
        // If bunx fails but bun is available, try using it directly
        const bunResult = spawnSync('bun', ['x', '0x1', ...args], execOptions);
        process.exit(bunResult.status || 0);
      } catch (e) {
        // Continue to general approach
      }
    }
    
    // On Unix systems, check if the binary exists directly
    const executableName = isWindows ? '0x1.cmd' : '0x1';
    const directBinPath = path.join(bunBinPath, executableName);
    
    if (fs.existsSync(directBinPath)) {
      // Best case: Run the binary directly with enhanced PATH
      const result = spawnSync(directBinPath, args, {
        stdio: 'inherit',
        env: enhancedEnv
      });
      process.exit(result.status || 0);
    }

    // If direct execution fails, try finding bun and using it
    const bunCommands = [
      path.join(bunBinPath, isWindows ? 'bun.cmd' : 'bun'),
      'bun'
    ];
    
    let bunPath;
    for (const cmd of bunCommands) {
      try {
        const result = spawnSync(cmd, ['--version'], { 
          stdio: 'pipe',
          shell: isWindows 
        });
        if (result.status === 0) {
          bunPath = cmd;
          break;
        }
      } catch (e) {
        // Try next command
      }
    }

    if (bunPath) {
      // Use bun directly to execute the CLI
      const result = spawnSync(bunPath, ['x', '0x1', ...args], { 
        stdio: 'inherit',
        env: enhancedEnv,
        shell: isWindows
      });
      process.exit(result.status || 0);
    }

    // Last resort - try running node with the main CLI file
    try {
      const cliMainFile = path.join(homeDir, '.bun/install/global/node_modules/0x1/dist/cli/index.js');
      if (fs.existsSync(cliMainFile)) {
        const result = spawnSync('node', [cliMainFile, ...args], {
          stdio: 'inherit',
          env: enhancedEnv
        });
        process.exit(result.status || 0);
      }
    } catch (e) {
      // Continue to error handling
    }

    // If all attempts fail, suggest fixes
    throw new Error('Could not execute 0x1. Try the fixes below.');

  } catch (error) {
    console.error('\n\x1b[31mError executing 0x1 CLI:\x1b[0m', error.message);
    
    // Platform-specific guidance
    if (isWindows) {
      console.error('\n\x1b[33mWindows Setup:\x1b[0m');
      console.error('   1. Make sure Bun is properly installed via WSL2');
      console.error('   2. Add %USERPROFILE%\.bun\bin to your PATH');
    } else if (isWSL) {
      console.error('\n\x1b[33mWSL Setup:\x1b[0m');
      console.error('   echo \'export BUN_INSTALL="$HOME/.bun"\' >> ~/.bashrc');
      console.error('   echo \'export PATH="$BUN_INSTALL/bin:$PATH"\' >> ~/.bashrc');
      console.error('   source ~/.bashrc');
    } else {
      // macOS/Linux
      const shellType = process.env.SHELL || '';
      const isZsh = shellType.includes('zsh');
      const configFile = isZsh ? '~/.zshrc' : '~/.bashrc';
      
      console.error(`\n\x1b[33m${isZsh ? 'macOS' : 'Linux'} Setup:\x1b[0m Add Bun to your PATH:`);
      console.error(`   echo 'export BUN_INSTALL="$HOME/.bun"' >> ${configFile}`);
      console.error(`   echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ${configFile}`);
      console.error(`   source ${configFile}`);
    }
    
    // Universal workaround
    console.error('\n\x1b[32mImmediate Workaround:\x1b[0m');
    console.error(`   bunx 0x1 ${args.join(' ')}`);
    
    process.exit(1);
  }
})();
