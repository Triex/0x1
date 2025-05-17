/**
 * 0x1 CLI - Help Command
 * Shows help information for the CLI commands
 */

import { logger } from '../utils/logger.js';

interface CommandHelp {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  options?: Array<{
    name: string;
    description: string;
    default?: string | boolean | number;
  }>;
  examples?: string[];
}

// Define help content for all commands
const commandsHelp: Record<string, CommandHelp> = {
  new: {
    name: 'new',
    aliases: ['create'],
    description: 'Create a new 0x1 project',
    usage: '0x1 new <project-name> [options]',
    options: [
      { name: '--template <name>', description: 'Template to use (basic, spa, landing)', default: 'basic' },
      { name: '--tailwind', description: 'Include Tailwind CSS', default: true },
      { name: '--no-tailwind', description: 'Exclude Tailwind CSS' },
      { name: '--typescript', description: 'Use TypeScript', default: true },
      { name: '--no-typescript', description: 'Use JavaScript instead of TypeScript' },
      { name: '--minimal', description: 'Create a minimal project setup' },
      { name: '--force', description: 'Overwrite existing directory' }
    ],
    examples: [
      '0x1 new my-app',
      '0x1 new my-app --template spa',
      '0x1 new my-app --no-tailwind --no-typescript'
    ]
  },
  dev: {
    name: 'dev',
    description: 'Start the development server',
    usage: '0x1 dev [options]',
    options: [
      { name: '--port <port>', description: 'Port to use', default: 3000 },
      { name: '--host <host>', description: 'Host to bind to', default: 'localhost' },
      { name: '--https', description: 'Use HTTPS' },
      { name: '--open', description: 'Open browser automatically' },
      { name: '--config <path>', description: 'Path to config file' }
    ],
    examples: [
      '0x1 dev',
      '0x1 dev --port 8080',
      '0x1 dev --open'
    ]
  },
  build: {
    name: 'build',
    description: 'Build the application for production',
    usage: '0x1 build [options]',
    options: [
      { name: '--outDir <dir>', description: 'Output directory', default: 'dist' },
      { name: '--no-minify', description: 'Disable minification' },
      { name: '--config <path>', description: 'Path to config file' }
    ],
    examples: [
      '0x1 build',
      '0x1 build --outDir build',
      '0x1 build --no-minify'
    ]
  },
  preview: {
    name: 'preview',
    description: 'Preview the production build locally',
    usage: '0x1 preview [options]',
    options: [
      { name: '--port <port>', description: 'Port to use', default: 3000 },
      { name: '--host <host>', description: 'Host to bind to', default: 'localhost' },
      { name: '--https', description: 'Use HTTPS' },
      { name: '--open', description: 'Open browser automatically' },
      { name: '--dir <dir>', description: 'Directory to serve', default: 'dist' }
    ],
    examples: [
      '0x1 preview',
      '0x1 preview --port 8080',
      '0x1 preview --dir build'
    ]
  },
  generate: {
    name: 'generate',
    aliases: ['g'],
    description: 'Generate code components',
    usage: '0x1 generate <type> <name> [options]',
    options: [
      { name: '--path <path>', description: 'Path to generate into' },
      { name: '--force', description: 'Overwrite existing files' }
    ],
    examples: [
      '0x1 generate component Button',
      '0x1 g component form/TextField',
      '0x1 g page About'
    ]
  },
  deploy: {
    name: 'deploy',
    description: 'Deploy the application',
    usage: '0x1 deploy [options]',
    options: [
      { name: '--provider <name>', description: 'Deploy provider (vercel, netlify, github)', default: 'vercel' },
      { name: '--dir <dir>', description: 'Directory to deploy', default: 'dist' }
    ],
    examples: [
      '0x1 deploy',
      '0x1 deploy --provider netlify',
      '0x1 deploy --dir build'
    ]
  },
  pwa: {
    name: 'pwa',
    description: 'Add Progressive Web App (PWA) functionality',
    usage: '0x1 pwa [options]',
    options: [
      { name: '--name <name>', description: 'Application name' },
      { name: '--shortName <name>', description: 'Short name for app icons' },
      { name: '--description <text>', description: 'App description' },
      { name: '--themeColor <color>', description: 'Theme color (hex)', default: '#0077cc' },
      { name: '--backgroundColor <color>', description: 'Background color (hex)', default: '#ffffff' },
      { name: '--icons', description: 'Generate icons automatically', default: true },
      { name: '--no-icons', description: 'Skip icon generation' },
      { name: '--offline', description: 'Enable offline support', default: true },
      { name: '--no-offline', description: 'Disable offline support' },
      { name: '-y, --yes', description: 'Skip all prompts' }
    ],
    examples: [
      '0x1 pwa',
      '0x1 pwa --name "My App" --themeColor "#ff0000"',
      '0x1 pwa --no-icons --yes'
    ]
  },
  help: {
    name: 'help',
    description: 'Show help for a command',
    usage: '0x1 help [command]',
    examples: [
      '0x1 help',
      '0x1 help new',
      '0x1 help build'
    ]
  }
};

/**
 * Show help for a specific command or list all commands
 */
export function showHelp(command?: string): void {
  // If command is specified, show help for that command
  if (command && commandsHelp[command]) {
    showCommandHelp(commandsHelp[command]);
    return;
  }
  
  // Otherwise show the general help
  logger.spacer();
  logger.info('Usage: 0x1 <command> [options]');
  logger.spacer();
  
  logger.info('Commands:');
  Object.values(commandsHelp).forEach(cmd => {
    let names = cmd.name;
    if (cmd.aliases?.length) {
      names += `, ${cmd.aliases.join(', ')}`;
    }
    logger.log(`  ${logger.highlight(names.padEnd(20))} ${cmd.description}`);
  });
  
  logger.spacer();
  logger.info('For more details, run: 0x1 help <command>');
  logger.spacer();
}

/**
 * Show help for a specific command
 */
function showCommandHelp(cmd: CommandHelp): void {
  logger.spacer();
  logger.info(`Command: ${logger.highlight(cmd.name)}`);
  
  if (cmd.aliases?.length) {
    logger.info(`Aliases: ${cmd.aliases.join(', ')}`);
  }
  
  logger.spacer();
  logger.info(cmd.description);
  logger.spacer();
  
  logger.info('Usage:');
  logger.log(`  ${cmd.usage}`);
  logger.spacer();
  
  if (cmd.options?.length) {
    logger.info('Options:');
    cmd.options.forEach(opt => {
      const hasDefault = opt.default !== undefined;
      const defaultValue = hasDefault ? ` (default: ${opt.default})` : '';
      logger.log(`  ${logger.highlight(opt.name.padEnd(25))} ${opt.description}${defaultValue}`);
    });
    logger.spacer();
  }
  
  if (cmd.examples?.length) {
    logger.info('Examples:');
    cmd.examples.forEach(example => {
      logger.log(`  ${logger.code(example)}`);
    });
    logger.spacer();
  }
}
