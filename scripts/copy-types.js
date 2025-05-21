import { copyFile, mkdir, readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile() && (entry.name.endsWith('.d.ts') || entry.name === 'package.json')) {
      await copyFile(srcPath, destPath);
      console.log(`Copied ${srcPath} to ${destPath}`);
    }
  }
}

async function main() {
  const srcDir = join(__dirname, '../types');
  const destDir = join(__dirname, '../dist/types');
  
  try {
    console.log('Copying type definitions...');
    await copyDir(srcDir, destDir);
    console.log('Type definitions copied successfully!');
  } catch (error) {
    console.error('Error copying type definitions:', error);
    process.exit(1);
  }
}

main();
