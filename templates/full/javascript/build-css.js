// Custom Tailwind CSS build script for 0x1
// This ensures styles properly load in both src-based and root-based structures

// Using Bun's native spawn for better performance
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

// Run Tailwind CSS using Bun's native spawn
const result = Bun.spawnSync([
  'bunx', 'tailwindcss', '-i', inputCssPath, '-o', outputCssPath
], {
  stdout: 'inherit',
  stderr: 'inherit'
});

if (result.exitCode === 0) {
  console.log('✅ Tailwind CSS processing complete');
} else {
  console.error(`❌ Tailwind CSS processing failed with code ${result.exitCode}`);
  process.exit(1);
}
