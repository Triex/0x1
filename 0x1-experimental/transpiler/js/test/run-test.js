#!/usr/bin/env bun
/**
 * Test script for the 0x1 JSX transpiler
 * 
 * This script demonstrates the transpiler by processing the demo.jsx file
 * and showing the output.
 */

import fs from 'fs';
import path from 'path';
import { JSXTranspiler } from '../jsx-transpiler.js';

// ANSI color codes for pretty output
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

console.log(`${colors.cyan}${colors.bright}🔥 0x1 JSX Transpiler Test${colors.reset}`);
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

// Path to the demo JSX file
const demoFilePath = path.join(__dirname, 'demo.jsx');

// Read the demo file
console.log(`${colors.blue}📄 Reading input file:${colors.reset} ${demoFilePath}`);
const jsxContent = fs.readFileSync(demoFilePath, 'utf8');

// Show the input JSX
console.log(`\n${colors.yellow}📝 Input JSX:${colors.reset}`);
console.log(`${colors.cyan}${'━'.repeat(40)}${colors.reset}`);
console.log(jsxContent);
console.log(`${colors.cyan}${'━'.repeat(40)}${colors.reset}`);

try {
  // Create transpiler instance
  const transpiler = new JSXTranspiler(jsxContent);
  
  // Transpile the JSX to JavaScript
  console.log(`\n${colors.yellow}🔄 Transpiling...${colors.reset}`);
  const startTime = performance.now();
  const jsOutput = transpiler.transpile();
  const endTime = performance.now();
  
  // Calculate execution time
  const executionTime = (endTime - startTime).toFixed(2);
  
  // Show the output JavaScript
  console.log(`\n${colors.green}✅ Transpilation completed in ${executionTime}ms${colors.reset}`);
  console.log(`${colors.yellow}📝 Output JavaScript:${colors.reset}`);
  console.log(`${colors.cyan}${'━'.repeat(40)}${colors.reset}`);
  console.log(jsOutput);
  console.log(`${colors.cyan}${'━'.repeat(40)}${colors.reset}`);
  
  // Save the output to a file
  const outputFilePath = path.join(__dirname, 'demo.output.js');
  fs.writeFileSync(outputFilePath, jsOutput);
  console.log(`\n${colors.green}💾 Output saved to:${colors.reset} ${outputFilePath}`);
  
} catch (error) {
  console.error(`\n${colors.red}❌ Transpilation error:${colors.reset}`);
  console.error(error);
}

console.log(`\n${colors.cyan}${colors.bright}🚀 Test completed${colors.reset}`);
