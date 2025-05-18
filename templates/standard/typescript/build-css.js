// Custom Tailwind CSS build script for 0x1 Standard Template
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

// If no existing CSS file is found, create one with Tailwind directives
if (!inputCssPath) {
  console.log('⚠️ No CSS file found, creating default Tailwind CSS file');
  
  const stylesDir = path.join(process.cwd(), 'styles');
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir, { recursive: true });
  }
  
  inputCssPath = path.join(stylesDir, 'main.css');
  fs.writeFileSync(inputCssPath, `/* Tailwind CSS for 0x1 Standard Template */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component styles */
@layer components {
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600;
  }
  
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden;
  }
}

/* Custom dark mode utilities */
.dark .dark-invert {
  filter: invert(1);
}
`);
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
