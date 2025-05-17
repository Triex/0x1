#!/usr/bin/env node

/**
 * 0x1 CLI Direct Executor
 * 
 * Directly executes the 0x1 CLI by using the absolute path to the binary
 * This solves PATH issues by providing a direct reference
 */

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

const homeDir = os.homedir();
const binaryPath = path.join(homeDir, '.bun/bin/0x1');

// Simply execute the binary with all arguments
const args = process.argv.slice(2);
const child = spawn(binaryPath, args, { 
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: `${homeDir}/.bun/bin:${process.env.PATH}`
  }
});

// Handle process exit
child.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle errors
child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('\n🔴 Could not find 0x1 binary at expected path.');
    console.error(`Path checked: ${binaryPath}`);
    
    // Try using bunx as a fallback
    console.error('\n🟢 Attempting to use bunx as fallback...');
    const bunx = spawn('bunx', ['0x1', ...args], { stdio: 'inherit' });
    bunx.on('error', () => {
      console.error('\n🔴 Failed to use bunx fallback. Please ensure bun is installed.');
      process.exit(1);
    });
  } else {
    console.error(`\n🔴 Error executing 0x1: ${err.message}`);
    process.exit(1);
  }
});
