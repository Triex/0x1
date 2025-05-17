#!/usr/bin/env node

/**
 * 0x1 Direct Launcher
 * 
 * This is a standalone launcher script that will be used 
 * as the primary entry point for the 0x1 CLI.
 * 
 * It's designed to work reliably across all environments
 * by using direct file paths rather than relying on PATH.
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Get args and home directory
const args = process.argv.slice(2);
const homeDir = os.homedir();

// Banner function is intentionally empty since the CLI will show it
function showBanner() {
  // Banner is now shown by the CLI itself
  // We've removed the duplicate banner from the launcher
}

// Direct execution without depending on PATH
async function directExecute(execArgs = args) {
  // Enhanced environment with bun bin in PATH
  const enhancedEnv = {
    ...process.env,
    PATH: `${homeDir}/.bun/bin:${process.env.PATH || ''}`
  };
  
  // Possible bun locations (in order of preference)
  const bunLocations = [
    'bun',
    path.join(homeDir, '.bun/bin/bun'),
    '/usr/local/bin/bun',
    '/opt/homebrew/bin/bun',
    '/usr/bin/bun',
  ];

  // Try to find a working bun executable
  let bunPath = null;
  for (const loc of bunLocations) {
    try {
      execSync(`${loc} --version`, { stdio: 'ignore' });
      bunPath = loc;
      break;
    } catch (e) {
      // Try next location
    }
  }

  // Possible script locations
  const scriptLocations = [
    // Global install locations
    path.join(homeDir, '.bun/install/global/node_modules/0x1/dist/cli/index.js'),
    // Dev locations
    path.join(__dirname, '../dist/cli/index.js'),
  ];
  
  // Find script path
  let scriptPath = null;
  for (const loc of scriptLocations) {
    if (fs.existsSync(loc)) {
      scriptPath = loc;
      break;
    }
  }

  // Execution strategy
  if (bunPath && scriptPath) {
    // Best case: we found both bun and the script
    return spawnSync(bunPath, [scriptPath, ...execArgs], { 
      stdio: 'inherit',
      env: enhancedEnv
    });
  } else if (bunPath) {
    // We have bun but couldn't find the script, use bunx
    return spawnSync(bunPath, ['x', '0x1', ...execArgs], { 
      stdio: 'inherit',
      env: enhancedEnv
    });
  } else {
    // Try bunx directly
    try {
      return spawnSync('bunx', ['0x1', ...execArgs], { 
        stdio: 'inherit',
        env: enhancedEnv
      });
    } catch (e) {
      // Fall back to direct node execution of index.js if we can find it
      if (scriptPath) {
        return spawnSync('node', [scriptPath, ...args], { 
          stdio: 'inherit',
          env: enhancedEnv
        });
      } else {
        throw new Error('Could not find any way to execute 0x1. Please ensure Bun is installed.');
      }
    }
  }
}

// Main execution
(async () => {
  try {
    // Only show banner if not requesting help and no banner flag
    const shouldShowBanner = !args.includes('--no-banner') && 
                             !args.includes('-h') && 
                             !args.includes('--help');
    
    if (shouldShowBanner) {
      showBanner();
    }
    
    // Add --no-banner flag to prevent the CLI from showing its banner again
    const modifiedArgs = shouldShowBanner ? [...args, '--no-banner'] : args;
    
    // Pass the modified args to the executor
    const result = await directExecute(modifiedArgs);
    process.exit(result.status || 0);
  } catch (error) {
    console.error('\n\x1b[31mError executing 0x1 CLI:\x1b[0m', error.message);
    
    // Show helpful instructions
    console.error('\n\x1b[33mTry these solutions:\x1b[0m');
    console.error('\n1. Add Bun to your PATH:');
    console.error('   export BUN_INSTALL="$HOME/.bun"');
    console.error('   export PATH="$BUN_INSTALL/bin:$PATH"');
    
    console.error('\n2. Use bunx directly:');
    console.error(`   bunx 0x1 ${args.join(' ')}`);
    
    console.error('\n3. Reinstall 0x1:');
    console.error('   bun install -g 0x1@latest');
    
    process.exit(1);
  }
})();
