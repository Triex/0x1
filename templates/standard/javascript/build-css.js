// Custom Tailwind CSS build script for 0x1 Standard Template
// This ensures styles properly load in both dev and production environments
// #bun

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
  fs.writeFileSync(inputCssPath, `/* Tailwind CSS for 0x1 Standard */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
@layer base {
  html {
    scroll-behavior: smooth;
  }
  
  body {
    @apply antialiased min-h-screen;
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded transition-colors;
  }
  
  .btn-primary {
    @apply bg-primary hover:bg-primary-dark text-white;
  }
  
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden;
  }
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
`);
}

const outputCssPath = path.join(publicStylesDir, 'tailwind.css');

console.log('🎨 Processing Tailwind CSS...');
console.log(`Input: ${inputCssPath}`);
console.log(`Output: ${outputCssPath}`);

// Run Tailwind CSS using bunx which will find the binary correctly
const result = Bun.spawnSync([
  'bunx',
  'tailwindcss',
  '-i', inputCssPath,
  '-o', outputCssPath,
  '--config', path.join(process.cwd(), 'tailwind.config.js')
], {
  stdout: 'inherit',
  stderr: 'inherit'
});

if (result.exitCode === 0) {
  console.log('✅ Tailwind CSS processing complete');
  
  // Also copy to styles/tailwind.css for the dev server
  const stylesOutputPath = path.join(process.cwd(), 'styles', 'tailwind.css');
  fs.copyFileSync(outputCssPath, stylesOutputPath);
  console.log(`📋 Copied CSS to ${stylesOutputPath} for dev server`);
} else {
  console.error(`❌ Tailwind CSS processing failed with code ${result.exitCode}`);
  process.exit(1);
}
