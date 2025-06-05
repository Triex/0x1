#!/usr/bin/env bun
/**
 * 0x1 JSX Transpiler CLI
 * 
 * Standalone command line interface for the 0x1 JSX transpiler.
 * This tool can be used to convert JSX files to JavaScript with 0x1 compatible output.
 */

import fs from 'fs';
import path from 'path';
import { JSXTranspiler } from './jsx-transpiler.js';

// ANSI color codes for pretty terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Title banner
console.log(`${colors.cyan}${colors.bright}🔥 0x1 JSX Transpiler${colors.reset}`);
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

// Parse command line arguments
const args = process.argv.slice(2);

// Show usage if no arguments provided
if (args.length === 0) {
  console.log(`
${colors.bright}Usage:${colors.reset} bun cli.js <jsx-file> [output-file]

${colors.bright}Example JSX to test:${colors.reset}
<div className="container">
  <h1>Hello 0x1!</h1>
  <Button onClick={handleClick}>Click me</Button>
</div>

${colors.bright}Options:${colors.reset}
  --watch, -w    Watch for changes and re-transpile
  --help, -h     Show this help message
`);
  process.exit(0);
}

// Check for help flag
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${colors.bright}Usage:${colors.reset} bun cli.js <jsx-file> [output-file]

${colors.bright}Options:${colors.reset}
  --watch, -w    Watch for changes and re-transpile
  --help, -h     Show this help message
`);
  process.exit(0);
}

// Extract file paths
let inputFile = null;
let outputFile = null;
let watchMode = false;

// Process command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--watch' || args[i] === '-w') {
    watchMode = true;
  } else if (!inputFile) {
    inputFile = args[i];
  } else if (!outputFile) {
    outputFile = args[i];
  }
}

// Check if input file exists
if (!inputFile || !fs.existsSync(inputFile)) {
  console.error(`${colors.red}❌ Error: Input file not found${colors.reset}`);
  process.exit(1);
}

// Default output file name
if (!outputFile) {
  const inputExt = path.extname(inputFile);
  outputFile = inputFile.replace(inputExt, '.js');
}

// Function to transpile the file
function transpileFile() {
  try {
    console.log(`${colors.blue}📄 Input file:${colors.reset} ${inputFile}`);
    
    // Read the JSX file
    const jsxContent = fs.readFileSync(inputFile, 'utf8');
    
    // Create transpiler and process the JSX
    const transpiler = new JSXTranspiler(jsxContent);
    const result = transpiler.transpile();
    
    // Write the output to a file
    fs.writeFileSync(outputFile, result);
    
    console.log(`${colors.green}✨ Transpiled output:${colors.reset} ${outputFile}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}🚀 Transpilation completed!${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Transpilation error:${colors.reset} ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Initial transpilation
transpileFile();

// Watch mode
if (watchMode) {
  console.log(`\n${colors.yellow}👀 Watching for changes...${colors.reset}`);
  
  fs.watch(inputFile, (eventType) => {
    if (eventType === 'change') {
      console.log(`\n${colors.yellow}🔄 File changed, re-transpiling...${colors.reset}`);
      transpileFile();
    }
  });
}
