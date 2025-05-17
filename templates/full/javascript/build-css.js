// Custom Tailwind CSS build script for 0x1
// This ensures styles properly load in both src-based and root-based structures

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create directories if they don't exist
const publicStylesDir = path.join(process.cwd(), 'public', 'styles');
if (!fs.existsSync(publicStylesDir)) {
  fs.mkdirSync(publicStylesDir, { recursive: true });
}

// Find the input CSS file
const possibleInputPaths = [
  path.join(process.cwd(), 'styles', 'main.css'),
  path.join(process.cwd(), 'src', 'styles', 'main.css')
];

let inputCssPath = null;
for (const path of possibleInputPaths) {
  if (fs.existsSync(path)) {
    inputCssPath = path;
    break;
  }
}

if (!inputCssPath) {
  console.error('❌ Could not find input CSS file');
  console.error('Create a CSS file in styles/main.css or src/styles/main.css');
  process.exit(1);
}

const outputCssPath = path.join(publicStylesDir, 'tailwind.css');

console.log('🎨 Processing Tailwind CSS...');
console.log(`Input: ${inputCssPath}`);
console.log(`Output: ${outputCssPath}`);

// Run Tailwind CSS
const tailwindProcess = spawn(
  'bunx', 
  ['tailwindcss', '-i', inputCssPath, '-o', outputCssPath], 
  { stdio: 'inherit' }
);

tailwindProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Tailwind CSS processing complete');
  } else {
    console.error(`❌ Tailwind CSS processing failed with code ${code}`);
  }
});
