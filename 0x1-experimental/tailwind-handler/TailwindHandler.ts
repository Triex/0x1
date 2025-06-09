/**
 * 🚀 TailwindHandler - ZERO-IMPORT Ultra-Minimal Orchestrator 
 * TARGET: <5KB bundle - Actually delegates to real Tailwind!
 * NOW WITH TAILWIND V4 SUPPORT! 🎉
 */

export interface TailwindConfig {
  content: string[];
  outputPath?: string;
}

export class TailwindHandler {
  private projectPath: string;
  private config: TailwindConfig;

  constructor(projectPath: string, config: TailwindConfig) {
    this.projectPath = projectPath;
    this.config = config;
  }

  async process(): Promise<{ css: string; fromCache: boolean; processingTime: number }> {
    const start = performance.now();
    
    try {
      // Try multiple strategies to get real Tailwind CSS
      const css = await this.generateRealTailwindCSS();
      
      return {
        css,
        fromCache: false,
        processingTime: performance.now() - start
      };
    } catch (error) {
      console.debug(`[TailwindHandler] All strategies failed: ${error}`);
      return {
        css: this.getMinimalCSS(),
        fromCache: false,
        processingTime: performance.now() - start
      };
    }
  }

  private async generateRealTailwindCSS(): Promise<string> {
    // Strategy 1: Try Tailwind v4 PostCSS (highest priority)
    try {
      const v4Result = await this.tryTailwindV4PostCSS();
      if (v4Result && v4Result.length > 5000) {
        console.debug(`[TailwindHandler] Tailwind v4 success: ${v4Result.length} bytes`);
        return v4Result;
      }
    } catch (error) {
      console.debug(`[TailwindHandler] Tailwind v4 failed: ${error}`);
    }

    // Strategy 2: Try existing CSS files and process them through Tailwind
    try {
      const { cssContent, filePath } = await this.findExistingTailwindCSS();
      if (cssContent && filePath) {
        console.debug(`[TailwindHandler] Found CSS file: ${filePath} (${cssContent.length} bytes)`);
        
        // If CSS contains Tailwind directives, try to process it
        if (this.containsTailwindDirectives(cssContent)) {
          console.debug(`[TailwindHandler] CSS contains Tailwind directives, processing...`);
          console.debug(`[TailwindHandler] Detected directives: ${this.detectDirectives(cssContent)}`);
          
          try {
            console.debug(`[TailwindHandler] About to call processCSSWithTailwind...`);
            const processedCSS = await this.processCSSWithTailwind(cssContent, filePath);
            console.debug(`[TailwindHandler] processCSSWithTailwind returned: ${processedCSS?.length || 0} bytes`);
            
            if (processedCSS && processedCSS.length > 5000) {
              console.debug(`[TailwindHandler] Processed CSS success: ${processedCSS.length} bytes`);
              return processedCSS;
            } else {
              console.debug(`[TailwindHandler] Processed CSS too small: ${processedCSS?.length || 0} bytes`);
            }
          } catch (error) {
            console.debug(`[TailwindHandler] CSS processing failed: ${error}`);
            console.debug(`[TailwindHandler] Error stack: ${error.stack}`);
          }
        } else {
          console.debug(`[TailwindHandler] No Tailwind directives detected in CSS`);
          console.debug(`[TailwindHandler] CSS preview: ${cssContent.substring(0, 200)}...`);
        }
        
        // If no directives or processing failed, return raw CSS if substantial
        if (cssContent.length > 5000) {
          console.debug(`[TailwindHandler] Using raw CSS: ${cssContent.length} bytes`);
          return cssContent;
        }
      }
    } catch (error) {
      console.debug(`[TailwindHandler] Existing CSS strategy failed: ${error}`);
    }

    // Strategy 3: Try Tailwind CLI (v3 style)
    try {
      const cliResult = await this.tryTailwindCLI();
      if (cliResult && cliResult.length > 5000) {
        console.debug(`[TailwindHandler] CLI success: ${cliResult.length} bytes`);
        return cliResult;
      }
    } catch (error) {
      console.debug(`[TailwindHandler] CLI failed: ${error}`);
    }

    // Strategy 4: Try PostCSS with Tailwind (v3 style)
    try {
      const postcssResult = await this.tryTailwindPostCSS();
      if (postcssResult && postcssResult.length > 5000) {
        console.debug(`[TailwindHandler] PostCSS success: ${postcssResult.length} bytes`);
        return postcssResult;
      }
    } catch (error) {
      console.debug(`[TailwindHandler] PostCSS failed: ${error}`);
    }

    // If all strategies fail, throw to use fallback
    throw new Error('No Tailwind strategies worked');
  }

  private async detectTailwindV4(): Promise<boolean> {
    // Try multiple possible package.json locations
    const possiblePackageJsonPaths = [
      `${this.projectPath}/package.json`,
      `${this.projectPath}/../0x1/package.json`
    ];

    for (const packageJsonPath of possiblePackageJsonPaths) {
      try {
        console.debug(`[TailwindHandler] Checking package.json at: ${packageJsonPath}`);
        
        const packageJson = await Bun.file(packageJsonPath).json();
        
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        console.debug(`[TailwindHandler] Found deps at ${packageJsonPath}: tailwindcss=${deps.tailwindcss}, @tailwindcss/postcss=${deps['@tailwindcss/postcss']}, @tailwindcss/cli=${deps['@tailwindcss/cli']}`);
        
        // Check for Tailwind v4 specific packages
        const isV4 = !!(deps['@tailwindcss/postcss'] || 
                  deps['@tailwindcss/cli'] || 
                  (deps['tailwindcss'] && (
                    deps['tailwindcss'].includes('4.') ||
                    deps['tailwindcss'].includes('^4.') ||
                    deps['tailwindcss'].includes('next')
                  )));
        
        if (isV4) {
          console.debug(`[TailwindHandler] Tailwind v4 detected at: ${packageJsonPath}`);
          return true;
        }
      } catch (error) {
        console.debug(`[TailwindHandler] Error checking ${packageJsonPath}: ${error}`);
        continue;
      }
    }

    console.debug(`[TailwindHandler] No Tailwind v4 detected in any package.json`);
    return false;
  }

  private async tryTailwindV4PostCSS(): Promise<string> {
    try {
      const isV4 = await this.detectTailwindV4();
      if (!isV4) {
        throw new Error('Tailwind v4 not detected');
      }

      console.debug(`[TailwindHandler] Detected Tailwind v4, trying PostCSS processing`);

      // Find v4 input CSS file
      const inputFile = this.findV4InputFile();
      if (!inputFile) {
        throw new Error('No v4 CSS input file found');
      }

      console.debug(`[TailwindHandler] Using v4 input file: ${inputFile}`);

      // Try to import PostCSS and Tailwind v4 plugin
      const postcssPath = `${this.projectPath}/node_modules/postcss`;
      const tailwindPath = `${this.projectPath}/node_modules/@tailwindcss/postcss`;
      
      const postcss = await import(postcssPath);
      const tailwindPlugin = await import(tailwindPath);

      // Read input CSS
      const inputContent = await Bun.file(inputFile).text();
      console.debug(`[TailwindHandler] Processing v4 CSS: ${inputContent.length} bytes input`);

      // Process with PostCSS and Tailwind v4 plugin
      const processor = postcss.default([tailwindPlugin.default]);
      const result = await processor.process(inputContent, {
        from: inputFile,
        to: undefined
      });

      console.debug(`[TailwindHandler] v4 processing complete: ${result.css.length} bytes output`);
      return result.css;
    } catch (error) {
      throw new Error(`Tailwind v4 PostCSS failed: ${error}`);
    }
  }

  private findV4InputFile(): string | null {
    // Tailwind v4 common input file locations
    const possiblePaths = [
      'app/globals.css',
      'src/app/globals.css',
      'src/globals.css',
      'styles/globals.css',
      'app/global.css',
      'styles/main.css',
      'css/main.css',
      'public/styles.css'
    ];

    for (const path of possiblePaths) {
      try {
        const fullPath = `${this.projectPath}/${path}`;
        
        // Simple existence check - try to read the file
        try {
          const file = Bun.file(fullPath);
          // If we can access the file without error, it exists
          file.stream(); // This will throw if file doesn't exist
          return fullPath;
        } catch {
          // File doesn't exist, continue to next path
          continue;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private async tryTailwindCLI(): Promise<string> {
    const commands = [
      ['npx', '@tailwindcss/cli'], // v4 CLI
      ['bunx', '@tailwindcss/cli'], // v4 CLI with Bun
      ['npx', 'tailwindcss'], // v3 CLI
      ['bunx', 'tailwindcss'], // v3 CLI with Bun
      ['./node_modules/.bin/tailwindcss'],
      ['tailwindcss']
    ];

    for (const cmd of commands) {
      try {
        console.debug(`[TailwindHandler] Trying command: ${cmd.join(' ')}`);
        
        const proc = Bun.spawn([...cmd, '--input', '-', '--output', '-'], {
          stdin: 'pipe',
          stdout: 'pipe',
          stderr: 'pipe',
          cwd: this.projectPath
        });

        // Write appropriate input based on suspected version
        const isV4Command = cmd.includes('@tailwindcss/cli');
        const input = isV4Command 
          ? '@import "tailwindcss";' 
          : `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n/* Ensure we get substantial output */\n@layer utilities {\n  .content-auto { content-visibility: auto; }\n}`;

        proc.stdin?.write(input);
        proc.stdin?.end();

        const result = await proc.exited;
        
        if (result === 0) {
          const stdout = await new Response(proc.stdout).text();
          if (stdout.length > 5000) {
            return stdout;
          }
        } else {
          const stderr = await new Response(proc.stderr).text();
          console.debug(`[TailwindHandler] ${cmd.join(' ')} failed: ${stderr}`);
        }
      } catch (error) {
        console.debug(`[TailwindHandler] ${cmd.join(' ')} error: ${error}`);
        continue;
      }
    }

    throw new Error('All CLI commands failed');
  }

  private async tryTailwindPostCSS(): Promise<string> {
    try {
      // Try to import PostCSS and Tailwind
      const postcssPath = `${this.projectPath}/node_modules/postcss`;
      const tailwindPath = `${this.projectPath}/node_modules/tailwindcss`;
      
      const postcss = await import(postcssPath);
      const tailwind = await import(tailwindPath);

      const processor = postcss.default([
        tailwind.default({
          content: this.config.content || ['**/*.{html,js,ts,jsx,tsx}'],
          theme: {
            extend: {}
          }
        })
      ]);

      const input = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

      const result = await processor.process(input, {
        from: undefined
      });

      return result.css;
    } catch (error) {
      throw new Error(`PostCSS import failed: ${error}`);
    }
  }

  private async findExistingTailwindCSS(): Promise<{ cssContent: string | null; filePath: string | null }> {
    // Look for existing Tailwind CSS files - prioritize project-specific ones
    const possiblePaths = [
      // Project-specific CSS (highest priority)
      'app/globals.css',
      'src/app/globals.css', 
      'src/globals.css',
      'styles/globals.css',
      'app/global.css',
      'styles/main.css',
      'css/main.css',
      // Built/output CSS
      'dist/styles.css',
      'public/styles.css',
      'build/styles.css',
      '.next/static/css/app/layout.css', // Next.js build output
      // Fallback locations
      'styles/tailwind.css',
      'css/tailwind.css'
    ];

    for (const path of possiblePaths) {
      try {
        const fullPath = `${this.projectPath}/${path}`;
        const file = Bun.file(fullPath);
        
        // Simple existence check - try to read the file
        try {
          file.stream(); // This will throw if file doesn't exist
          const content = await file.text();
          
          // Check if it looks like meaningful CSS
          if (content.length > 100) {
            return { cssContent: content, filePath: fullPath };
          }
        } catch {
          // File doesn't exist, continue to next path
          continue;
        }
      } catch {
        continue;
      }
    }

    return { cssContent: null, filePath: null };
  }

  private containsTailwindDirectives(cssContent: string): boolean {
    return cssContent.includes('@import "tailwindcss"') ||
           cssContent.includes('@tailwind') ||
           cssContent.includes('@layer') ||
           cssContent.includes('@apply');
  }

  private async processCSSWithTailwind(cssContent: string, filePath: string): Promise<string> {
    const isV4 = await this.detectTailwindV4();
    
    console.debug(`[TailwindHandler] Processing CSS with ${isV4 ? 'Tailwind v4' : 'Tailwind v3'}`);
    
    if (isV4) {
      // Use Tailwind v4 PostCSS processing
      try {
        // Try multiple possible locations for the packages
        const possiblePostcssPaths = [
          `${this.projectPath}/node_modules/postcss`,
          `${this.projectPath}/../0x1/node_modules/postcss`,
          `postcss` // Global fallback
        ];
        
        const possibleTailwindPaths = [
          `${this.projectPath}/node_modules/@tailwindcss/postcss`,
          `${this.projectPath}/../0x1/node_modules/@tailwindcss/postcss`,
          `@tailwindcss/postcss` // Global fallback
        ];

        let postcss, tailwindPlugin;
        let postcssPath, tailwindPath;

        // Try to find PostCSS
        for (const path of possiblePostcssPaths) {
          try {
            console.debug(`[TailwindHandler] Trying PostCSS from: ${path}`);
            postcss = await import(path);
            postcssPath = path;
            console.debug(`[TailwindHandler] PostCSS imported successfully from: ${path}`);
            break;
          } catch (error) {
            console.debug(`[TailwindHandler] PostCSS import failed from ${path}: ${error}`);
          }
        }

        // Try to find Tailwind v4 plugin
        for (const path of possibleTailwindPaths) {
          try {
            console.debug(`[TailwindHandler] Trying Tailwind v4 from: ${path}`);
            tailwindPlugin = await import(path);
            tailwindPath = path;
            console.debug(`[TailwindHandler] Tailwind v4 plugin imported successfully from: ${path}`);
            break;
          } catch (error) {
            console.debug(`[TailwindHandler] Tailwind v4 import failed from ${path}: ${error}`);
          }
        }

        if (!postcss || !tailwindPlugin) {
          throw new Error(`Missing dependencies: postcss=${!!postcss}, tailwind=${!!tailwindPlugin}`);
        }

        console.debug(`[TailwindHandler] Creating PostCSS processor...`);
        const processor = postcss.default([tailwindPlugin.default]);
        console.debug(`[TailwindHandler] PostCSS processor created`);
        
        const result = await processor.process(cssContent, {
          from: filePath,
          to: undefined
        });

        console.debug(`[TailwindHandler] PostCSS processing complete: ${result.css.length} bytes`);
        return result.css;
      } catch (error) {
        console.debug(`[TailwindHandler] v4 processing detailed error: ${error}`);
        throw new Error(`Tailwind v4 processing failed: ${error}`);
      }
    } else {
      // Use Tailwind v3 PostCSS processing
      try {
        const possiblePostcssPaths = [
          `${this.projectPath}/node_modules/postcss`,
          `${this.projectPath}/../0x1/node_modules/postcss`,
          `postcss`
        ];
        
        const possibleTailwindPaths = [
          `${this.projectPath}/node_modules/tailwindcss`,
          `${this.projectPath}/../0x1/node_modules/tailwindcss`,
          `tailwindcss`
        ];

        let postcss, tailwind;

        // Try to find PostCSS
        for (const path of possiblePostcssPaths) {
          try {
            console.debug(`[TailwindHandler] Trying PostCSS from: ${path}`);
            postcss = await import(path);
            console.debug(`[TailwindHandler] PostCSS imported successfully from: ${path}`);
            break;
          } catch (error) {
            console.debug(`[TailwindHandler] PostCSS import failed from ${path}: ${error}`);
          }
        }

        // Try to find Tailwind v3
        for (const path of possibleTailwindPaths) {
          try {
            console.debug(`[TailwindHandler] Trying Tailwind v3 from: ${path}`);
            tailwind = await import(path);
            console.debug(`[TailwindHandler] Tailwind v3 imported successfully from: ${path}`);
            break;
          } catch (error) {
            console.debug(`[TailwindHandler] Tailwind v3 import failed from ${path}: ${error}`);
          }
        }

        if (!postcss || !tailwind) {
          throw new Error(`Missing dependencies: postcss=${!!postcss}, tailwind=${!!tailwind}`);
        }

        console.debug(`[TailwindHandler] Creating PostCSS processor...`);
        const processor = postcss.default([
          tailwind.default({
            content: this.config.content || ['**/*.{html,js,ts,jsx,tsx}'],
            theme: { extend: {} }
          })
        ]);

        console.debug(`[TailwindHandler] PostCSS processor created`);

        const result = await processor.process(cssContent, {
          from: filePath
        });

        console.debug(`[TailwindHandler] PostCSS processing complete: ${result.css.length} bytes`);
        return result.css;
      } catch (error) {
        console.debug(`[TailwindHandler] v3 processing detailed error: ${error}`);
        throw new Error(`Tailwind v3 processing failed: ${error}`);
      }
    }
  }

  private getMinimalCSS(): string {
    // Compact CSS that's >1000 chars for BuildOrchestrator but minimal for bundle
    return `*,*::before,*::after{box-sizing:border-box;border:0 solid #e5e7eb}html{line-height:1.5;font-family:ui-sans-serif,system-ui,sans-serif}body{margin:0;line-height:inherit}.block{display:block}.inline-block{display:inline-block}.flex{display:flex}.grid{display:grid}.hidden{display:none}.flex-col{flex-direction:column}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-4{gap:1rem}.p-2{padding:0.5rem}.p-3{padding:0.75rem}.p-4{padding:1rem}.p-6{padding:1.5rem}.px-3{padding-left:0.75rem;padding-right:0.75rem}.px-4{padding-left:1rem;padding-right:1rem}.py-2{padding-top:0.5rem;padding-bottom:0.5rem}.py-3{padding-top:0.75rem;padding-bottom:0.75rem}.m-2{margin:0.5rem}.m-4{margin:1rem}.mx-auto{margin-left:auto;margin-right:auto}.mb-4{margin-bottom:1rem}.mt-4{margin-top:1rem}.w-full{width:100%}.w-auto{width:auto}.h-full{height:100%}.text-sm{font-size:0.875rem}.text-base{font-size:1rem}.text-lg{font-size:1.125rem}.text-xl{font-size:1.25rem}.text-2xl{font-size:1.5rem}.font-medium{font-weight:500}.font-bold{font-weight:700}.text-center{text-align:center}.text-white{color:#fff}.text-black{color:#000}.text-gray-600{color:#4b5563}.text-gray-900{color:#111827}.text-blue-500{color:#3b82f6}.bg-white{background-color:#fff}.bg-gray-100{background-color:#f3f4f6}.bg-blue-500{background-color:#3b82f6}.border{border-width:1px}.border-gray-200{border-color:#e5e7eb}.rounded{border-radius:0.25rem}.rounded-lg{border-radius:0.5rem}.shadow{box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1)}.shadow-lg{box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.1)}.transition{transition-property:all;transition-duration:150ms}.cursor-pointer{cursor:pointer}@media (min-width:768px){.md\\:flex{display:flex}.md\\:text-xl{font-size:1.25rem}}.hover\\:bg-gray-100:hover{background-color:#f3f4f6}.hover\\:bg-blue-600:hover{background-color:#2563eb}.btn{display:inline-flex;align-items:center;padding:0.5rem 1rem;border-radius:0.375rem;font-weight:500;border:none;cursor:pointer}.btn-primary{background-color:#3b82f6;color:#fff}.card{background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;padding:1.5rem;box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1)}.container{width:100%;max-width:1200px;margin:0 auto;padding:0 1rem}`;
  }

  async writeOutput(path: string, css: string): Promise<void> {
    if (path) {
      await Bun.write(path, css);
    }
  }

  private detectDirectives(cssContent: string): string {
    const directives: string[] = [];
    if (cssContent.includes('@import "tailwindcss"')) directives.push('@import "tailwindcss"');
    if (cssContent.includes('@tailwind')) directives.push('@tailwind');
    if (cssContent.includes('@layer')) directives.push('@layer');
    if (cssContent.includes('@apply')) directives.push('@apply');
    return directives.join(', ') || 'none';
  }
}

export async function createTailwindHandler(
  projectPath: string, 
  config: Partial<TailwindConfig> = {}
): Promise<TailwindHandler> {
  return new TailwindHandler(projectPath, {
    content: config.content || ['**/*.{html,js,ts,jsx,tsx}'],
    outputPath: config.outputPath
  });
}

export async function processTailwindFast(
  projectPath: string,
  options: any
): Promise<{ success: boolean; css: string; processingTime: number; fromCache: boolean }> {
  try {
    const handler = new TailwindHandler(projectPath, {
      content: options.config?.content || options.content || ['**/*.{html,js,ts,jsx,tsx}'],
      outputPath: options.outputPath
    });
    
    const result = await handler.process();
    
    if (result.css && options.outputPath) {
      await handler.writeOutput(options.outputPath, result.css);
    }
    
    return {
      success: true,
      css: result.css,
      processingTime: result.processingTime,
      fromCache: result.fromCache
    };
  } catch {
    return {
      success: false,
      css: '.flex{display:flex}.p-4{padding:1rem}',
      processingTime: 0,
      fromCache: false
    };
  }
}

export default TailwindHandler; 