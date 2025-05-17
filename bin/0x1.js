#!/usr/bin/env node

// This is a JavaScript wrapper for the 0x1 CLI that works with both Node.js and Bun
// It will try to use Bun if available, otherwise fall back to Node.js

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function findBunPath() {
  try {
    return execSync('which bun', { encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

function findCliScript() {
  // Try to find the CLI script in various locations
  const possibleLocations = [
    path.join(__dirname, '../dist/cli/index.js'),
    path.join(__dirname, '../node_modules/0x1/dist/cli/index.js'),
    path.join(process.env.HOME || '', '.bun/install/global/node_modules/0x1/dist/cli/index.js'),
    '/usr/local/lib/node_modules/0x1/dist/cli/index.js',
  ];

  for (const location of possibleLocations) {
    try {
      if (fs.existsSync(location)) {
        return location;
      }
    } catch (error) {
      // Ignore errors, just try the next location
    }
  }

  return null;
}

// Try to find Bun
const bunPath = findBunPath();
const cliScriptPath = findCliScript();

if (!cliScriptPath) {
  console.error('Error: Could not find 0x1 CLI script');
  console.error('Please reinstall 0x1 using: bun install -g 0x1');
  process.exit(1);
}

// Execute using Bun if available, otherwise use Node.js
if (bunPath) {
  const result = spawnSync(bunPath, [cliScriptPath, ...process.argv.slice(2)], { 
    stdio: 'inherit',
    env: process.env
  });
  process.exit(result.status || 0);
} else {
  // Fallback to running with Node directly
  require(cliScriptPath);
}
