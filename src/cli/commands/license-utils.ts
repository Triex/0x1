/**
 * 0x1 Framework - License Utilities
 * Functions for handling licenses in 0x1 projects
 */

import { existsSync } from 'fs';
import { copyFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '../utils/logger.js';

/**
 * Add a TDL (TriexDev License) to the project
 */
export async function addTDLLicense(projectPath: string): Promise<void> {
  const licenseSpin = logger.spinner('Adding TriexDev License (TDL)');
  
  try {
    // First check if we have a TDL license template in our templates
    const tdlTemplatePath = join(import.meta.dirname || '', '../../../templates/licenses/TDL.txt');
    
    if (existsSync(tdlTemplatePath)) {
      // Copy from template
      await copyFile(tdlTemplatePath, join(projectPath, 'LICENSE'));
    } else {
      // Generate default TDL license content
      const tdlLicenseContent = generateTDLLicense();
      await writeFile(join(projectPath, 'LICENSE'), tdlLicenseContent);
    }
    
    licenseSpin.stop('success', 'Added TriexDev License (TDL)');
  } catch (error) {
    licenseSpin.stop('error', 'Failed to add TDL license');
    logger.error(`Error adding TDL license: ${error}`);
  }
}

/**
 * Generate a default TDL license content
 */
function generateTDLLicense(): string {
  const year = new Date().getFullYear();
  
  return `TriexDev License (TDL) v1.0

Copyright (c) ${year} TriexDev

Permission is hereby granted, free of charge, to any person or entity obtaining a copy
of this software and associated documentation files (the "Software"), to use the Software
for personal, educational, or non-commercial purposes, subject to the following conditions:

1. The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.

2. Commercial use of the Software requires explicit written permission from the copyright holder.

3. Redistribution of the Software, in whole or in part, with or without modification,
   is permitted only with explicit written permission from the copyright holder.

4. The Software is provided "as is", without warranty of any kind, express or implied,
   including but not limited to the warranties of merchantability, fitness for a particular
   purpose and noninfringement. In no event shall the authors or copyright holders be
   liable for any claim, damages or other liability, whether in an action of contract,
   tort or otherwise, arising from, out of or in connection with the Software or the use
   or other dealings in the Software.

5. Any derivative works based on this Software must be licensed under the same terms and
   conditions as this License, unless explicit permission is granted otherwise.

For licensing inquiries or commercial use permission, please contact: license@triex.dev
`;
}

/**
 * Add a standard MIT license to the project
 */
/**
 * Add a NO LICENSE file to the project
 */
export async function addNoLicense(projectPath: string): Promise<void> {
  const licenseSpin = logger.spinner('Adding NO LICENSE file');
  
  try {
    // Create a simple NO LICENSE file
    await writeFile(join(projectPath, 'LICENSE'), 'NO LICENSE\n');
    licenseSpin.stop('success', 'Added NO LICENSE file');
  } catch (error) {
    licenseSpin.stop('error', 'Failed to add NO LICENSE file');
    logger.error(`Error adding NO LICENSE file: ${error}`);
  }
}

/**
 * Add a standard MIT license to the project
 */
export async function addMITLicense(projectPath: string, projectName?: string): Promise<void> {
  const licenseSpin = logger.spinner('Adding MIT License');
  
  try {
    const year = new Date().getFullYear();
    const mitLicenseContent = `MIT License

Copyright (c) ${year} ${projectName || 'Unknown'}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
    
    await writeFile(join(projectPath, 'LICENSE'), mitLicenseContent);
    licenseSpin.stop('success', 'Added MIT License');
  } catch (error) {
    licenseSpin.stop('error', 'Failed to add MIT license');
    logger.error(`Error adding MIT license: ${error}`);
  }
}

/**
 * Copy a license file from source to destination if it exists
 */
export async function preserveLicenseFile(sourcePath: string, destPath: string): Promise<boolean> {
  if (existsSync(sourcePath)) {
    try {
      await copyFile(sourcePath, destPath);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
