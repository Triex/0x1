#!/usr/bin/env bun
/**
 * 0x1 CLI - Optimized Entry Point
 * Uses lazy loading to minimize bundle size
 */

import { logger } from './utils/logger';
import { parseArgs } from './utils/parse-args';

// Version info
const CLI_VERSION = process.env.npm_package_version || '0.0.355';

// Command definitions with lazy loading
const COMMANDS = {
  new: {
    description: 'Create a new 0x1 project',
    loader: () => import('./commands/new'),
    method: 'createNewProject'
  },
  create: {
    description: 'Create a new 0x1 project (alias for new)',
    loader: () => import('./commands/new'),
    method: 'createNewProject'
  },
  dev: {
    description: 'Start development server',
    loader: () => import('./commands/dev'),
    method: 'runDevServer'
  },
  build: {
    description: 'Build for production',
    loader: () => import('./commands/build'),
    method: 'buildProject'
  },
  preview: {
    description: 'Preview production build',
    loader: () => import('./commands/preview'),
    method: 'previewBuild'
  },
  generate: {
    description: 'Generate components',
    loader: () => import('./commands/generate'),
    method: 'generateComponent'
  },
  gen: {
    description: 'Generate components (alias)',
    loader: () => import('./commands/generate'),
    method: 'generateComponent'
  },
  g: {
    description: 'Generate components (short alias)',
    loader: () => import('./commands/generate'),
    method: 'generateComponent'
  },
  deploy: {
    description: 'Deploy to production',
    loader: () => import('./commands/deploy'),
    method: 'deployProject'
  },
  pwa: {
    description: 'Add PWA features',
    loader: () => import('./commands/pwa'),
    method: 'addPWA'
  },
  help: {
    description: 'Show help information',
    loader: () => import('./commands/help'),
    method: 'showHelp'
  }
} as const;

type CommandName = keyof typeof COMMANDS;

// CLI banner (lightweight)
const showBanner = () => {
  logger.banner([
    ' ██████╗  ██╗  ██╗ ███╗',
    '██╔═══██╗ ╚██╗██╔╝ ╚██║',
    '██║   ██║  ╚███╔╝   ██║',
    '██║   ██║  ██╔██╗   ██║',
    '╚██████╔╝ ██╔╝ ██╗  ██║',
    ' ╚════╝   ╚═╝  ╚═╝  ╚═╝framework'
  ]);
  logger.info(`Running 0x1 CLI v${CLI_VERSION} - The ultra-minimal TypeScript framework`);
  logger.spacer();
};

/**
 * Execute a command with lazy loading
 */
async function executeCommand(commandName: CommandName, args: any): Promise<void> {
  const commandDef = COMMANDS[commandName];
  
  if (!commandDef) {
    throw new Error(`Unknown command: ${commandName}`);
  }

  try {
    // Dynamically load the command module
    const module = await commandDef.loader();
    const method = (module as any)[commandDef.method];
    
    if (typeof method !== 'function') {
      throw new Error(`Command ${commandName} does not export method ${commandDef.method}`);
    }

    // Execute the command with appropriate arguments
    switch (commandName) {
      case 'new':
      case 'create':
        await method(args._[1], args);
        break;
      
      case 'generate':
      case 'gen':
      case 'g':
        await method(args._[1] || 'component', args._[2] || 'NewComponent', args);
        break;
      
      case 'deploy':
        await method(args);
        break;
      
      case 'pwa':
        await method({
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
        method(args._[1]);
        break;
      
      default:
        // For dev, build, preview - pass args directly
        await method(args);
        break;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot resolve module')) {
      throw new Error(`Command ${commandName} is not available in this build`);
    }
    throw error;
  }
}

/**
 * Main CLI function with optimized loading
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const command = (args._[0] || 'help') as CommandName;

  // Show banner for all commands except dev server (to avoid clutter during development)
  if (!['dev', 'preview', 'build'].includes(command)) {
    showBanner();
  }

  // Validate command
  if (!(command in COMMANDS)) {
    logger.error(`Unknown command: ${command}`);
    logger.info('Available commands:');
    Object.entries(COMMANDS).forEach(([name, def]) => {
      logger.info(`  ${name.padEnd(12)} ${def.description}`);
    });
    process.exit(1);
  }

  try {
    await executeCommand(command, args);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(errorMessage);
    
    // Show debug info in development
    if (process.env.DEBUG) {
      console.error(error);
    }
    
    process.exit(1);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:' + error.message);
  if (process.env.DEBUG) {
    console.error(error);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:' + String(reason));
  if (process.env.DEBUG) {
    console.error(reason);
  }
  process.exit(1);
});

// Run CLI
main().catch(err => {
  logger.error(`Failed to execute command: ${err}`);
  process.exit(1);
});
