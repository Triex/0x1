#!/usr/bin/env bun
/**
 * 0x1 CLI
 * Main entry point for the CLI commands
 */

import { logger } from './utils/logger.js';
import { parseArgs } from './utils/parse-args.js';

// Import modules using dynamic imports to work around potential TypeScript issues
const modules: Record<string, any> = {};

// Load command modules
async function loadModules() {
  // Core modules that should load without issues
  modules.help = await import('./commands/help.js');
  modules.new = await import('./commands/new.js');
  modules.generate = await import('./commands/generate.js');
  modules.preview = await import('./commands/preview.js');
  modules.deploy = await import('./commands/deploy.js');
  modules.pwa = await import('./commands/pwa.js');
  
  // Modules that might have import issues
  try {
    modules.dev = await import('./commands/dev.js');
  } catch (error) {
    logger.debug(`Failed to import dev module: ${error}`);
  }
  
  try {
    modules.build = await import('./commands/build.js');
  } catch (error) {
    logger.debug(`Failed to import build module: ${error}`);
  }
}

// Define command option interfaces
interface NewProjectOptions {
  template?: string;
  tailwind?: boolean;
  typescript?: boolean;
  javascript?: boolean; // Add explicit JavaScript flag
  stateManagement?: boolean;
  minimal?: boolean;
  force?: boolean;
  tdlLicense?: boolean;
  pwa?: boolean;
  'no-pwa'?: boolean; // Add explicit no-pwa flag
  themeColor?: string;
  secondaryColor?: string;
  textColor?: string;
  theme?: string;
  statusBarStyle?: 'default' | 'black' | 'black-translucent';
  complexity?: 'minimal' | 'standard' | 'full';
  overwrite?: boolean;
  [key: string]: any;
}

interface DevServerOptions {
  port?: number;
  host?: string;
  https?: boolean;
  open?: boolean;
  config?: string;
  [key: string]: any;
}

interface BuildOptions {
  outDir?: string;
  minify?: boolean;
  config?: string;
  [key: string]: any;
}

interface PreviewOptions {
  port?: number;
  host?: string;
  https?: boolean;
  open?: boolean;
  dir?: string;
  [key: string]: any;
}

interface GenerateOptions {
  path?: string;
  force?: boolean;
  [key: string]: any;
}

interface DeployOptions {
  provider?: string;
  dir?: string;
  [key: string]: any;
}

// Define Args interface with indexer for additional properties
interface Args {
  _: string[];
  [key: string]: any;
}

// CLI banner
const showBanner = () => {
  logger.banner([
    ' ██████╗  ██╗  ██╗ ███╗',
    '██╔═══██╗ ╚██╗██╔╝ ╚██║',
    '██║   ██║  ╚███╔╝   ██║',
    '██║   ██║  ██╔██╗   ██║',
    '╚██████╔╝ ██╔╝ ██╗  ██║',
    ' ╚════╝   ╚═╝  ╚═╝  ╚═╝framework'
  ]);
  logger.info(`v0.0.19 - The ultra-minimal TypeScript framework`);
  logger.spacer();
};

/**
 * Main CLI function
 */
async function main() {
  // Load all command modules first
  await loadModules();
  
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || 'help';

  // Show banner for all commands except dev server
  if (!['dev', 'preview', 'build'].includes(command)) {
    showBanner();
  }

  try {
    switch (command) {
      case 'new':
      case 'create':
        await modules.new.createNewProject(args._[1], args as unknown as NewProjectOptions);
        break;
      
      case 'dev':
        if (!modules.dev) {
          logger.error('Development server command is not available');
          process.exit(1);
        }
        await modules.dev.runDevServer(args as unknown as DevServerOptions);
        break;
      
      case 'build':
        if (!modules.build) {
          logger.error('Build command is not available');
          process.exit(1);
        }
        await modules.build.buildProject(args as unknown as BuildOptions);
        break;
      
      case 'preview':
        await modules.preview.previewBuild(args as unknown as PreviewOptions);
        break;
      
      case 'generate':
      case 'gen':
      case 'g':
        await modules.generate.generateComponent(args._[1], args._[2], args as unknown as GenerateOptions);
        break;
      
      case 'deploy':
        await modules.deploy.deployProject(args._[1], args as unknown as DeployOptions);
        break;
      
      case 'pwa':
        await modules.pwa.addPWA({
          name: args.name,
          shortName: args.shortName,
          themeColor: args.themeColor,
          backgroundColor: args.backgroundColor,
          description: args.description,
          icons: args.icons !== undefined ? args.icons !== 'false' : undefined,
          offline: args.offline !== undefined ? args.offline !== 'false' : undefined,
          skipPrompts: args.y || args.yes
        });
        break;
      
      case 'help':
      default:
        modules.help.showHelp(args._[1]);
        break;
    }
  } catch (error) {
    logger.error(`${error}`);
    process.exit(1);
  }
}

// Run CLI
main().catch(err => {
  logger.error(`Failed to execute command: ${err}`);
  process.exit(1);
});
