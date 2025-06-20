#!/usr/bin/env bun
/**
 * 0x1 CLI - Optimized Entry Point
 * Uses lazy loading to minimize bundle size
 */

import { logger } from './utils/logger';
import { parseArgs } from './utils/parse-args';

// Version info
const CLI_VERSION = process.env.npm_package_version || '0.0.365';

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
  version: {
    description: 'Show version information',
    loader: () => Promise.resolve({ showVersion: () => showVersion() }),
    method: 'showVersion'
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
 * Beautiful version display
 */
const showVersion = () => {
  // Nice ASCII art for version display
  console.log('\x1b[35m'); // Magenta color
  console.log(' ██████╗  ██╗  ██╗ ███╗');
  console.log('██╔═══██╗ ╚██╗██╔╝ ╚██║');
  console.log('██║   ██║  ╚███╔╝   ██║');
  console.log('██║   ██║  ██╔██╗   ██║');
  console.log('╚██████╔╝ ██╔╝ ██╗  ██║');
  console.log(' ╚════╝   ╚═╝  ╚═╝  ╚═╝framework');
  console.log('\x1b[0m'); // Reset color

  console.log('');
  console.log(`\x1b[1m\x1b[36m0x1 Framework\x1b[0m`);
  console.log(`\x1b[32mVersion: ${CLI_VERSION}\x1b[0m`);
  console.log(`\x1b[90mThe ultra-minimal TypeScript framework\x1b[0m`);
  console.log('');
  console.log(`\x1b[33mHomepage:\x1b[0m https://0x1.onl`);
  console.log(`\x1b[33mRepository:\x1b[0m https://github.com/Triex/0x1`);
  console.log(`\x1b[33mAuthor:\x1b[0m TriexDev`);
  console.log(`\x1b[33mLicense:\x1b[0m TDLv1`);
  console.log('');

  // Show runtime info
  console.log(`\x1b[90mRuntime Info:\x1b[0m`);
  console.log(`  \x1b[90mBun: ${process.versions.bun || 'Not detected'}\x1b[0m`);
  console.log(`  \x1b[90mNode: ${process.versions.node}\x1b[0m`);
  console.log(`  \x1b[90mPlatform: ${process.platform} ${process.arch}\x1b[0m`);
  console.log('');

  console.log(`\x1b[2m💡 Try '\x1b[0m\x1b[36m0x1 help\x1b[0m\x1b[2m' to see available commands\x1b[0m`);
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

      case 'version':
        method();
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

  // Handle version flags first (--version, -v)
  if (args.version || args.v) {
    showVersion();
    return;
  }

  const command = (args._[0] || 'help') as CommandName;

  // Show banner for all commands except dev server and version (to avoid clutter during development)
  if (!['dev', 'preview', 'build', 'version'].includes(command)) {
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
