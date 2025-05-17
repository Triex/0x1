// Custom Tailwind CSS build script for 0x1 Minimal Template
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

// If no existing CSS file is found, create one with Tailwind directives
if (!inputCssPath) {
  console.log('⚠️ No CSS file found, creating default Tailwind CSS file');
  
  const stylesDir = path.join(process.cwd(), 'styles');
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir, { recursive: true });
  }
  
  inputCssPath = path.join(stylesDir, 'main.css');
  fs.writeFileSync(inputCssPath, `/* Tailwind CSS for 0x1 Minimal */\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n/* Custom styles */\n.btn {\n  @apply px-4 py-2 rounded transition-colors;\n}\n`);
}

const outputCssPath = path.join(publicStylesDir, 'tailwind.css');

// Run tailwindcss CLI
console.log(`🔄 Processing Tailwind CSS from ${inputCssPath} to ${outputCssPath}`);

const tailwind = spawn('npx', ['tailwindcss', '-i', inputCssPath, '-o', outputCssPath, '--minify']);

tailwind.stdout.on('data', (data) => {
  console.log(`${data}`);
});

tailwind.stderr.on('data', (data) => {
  console.error(`⚠️ ${data}`);
});

tailwind.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Tailwind CSS processed successfully');
  } else {
    console.error(`❌ Tailwind CSS process exited with code ${code}`);
  }
});
