/**
 * 0x1 CLI - Deploy Command
 * Deploys the application to various hosting providers
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import prompts from 'prompts';
import { logger } from '../utils/logger.js';

export interface DeployOptions {
  provider?: 'vercel' | 'netlify' | 'github' | 'custom';
  dir?: string;
  production?: boolean;
  token?: string;
}

/**
 * Deploy the application to a hosting provider
 */
export async function deployProject(options: DeployOptions = {}): Promise<void> {
  logger.section('Deploying application');
  
  // Set default options
  const dir = options.dir || 'dist';
  const production = options.production ?? true;
  
  // Get the absolute path to the build directory
  const buildPath = resolve(process.cwd(), dir);
  
  // Check if the build directory exists
  if (!existsSync(buildPath)) {
    logger.error(`Build directory not found: ${buildPath}`);
    logger.info('Run "0x1 build" first to create a production build.');
    process.exit(1);
  }
  
  // Get provider if not set
  const provider = options.provider || await promptProvider();
  
  // Deploy based on the selected provider
  switch (provider) {
    case 'vercel':
      await deployToVercel(buildPath, options);
      break;
    case 'netlify':
      await deployToNetlify(buildPath, options);
      break;
    case 'github':
      await deployToGitHubPages(buildPath, options);
      break;
    case 'custom':
      await deployToCustomProvider(buildPath, options);
      break;
    default:
      logger.error(`Unsupported provider: ${provider}`);
      process.exit(1);
  }
}

/**
 * Prompt for deployment provider
 */
async function promptProvider(): Promise<'vercel' | 'netlify' | 'github' | 'custom'> {
  const response = await prompts({
    type: 'select',
    name: 'provider',
    message: 'Select a deployment provider',
    choices: [
      { title: 'Vercel', value: 'vercel', description: 'Deploy to Vercel' },
      { title: 'Netlify', value: 'netlify', description: 'Deploy to Netlify' },
      { title: 'GitHub Pages', value: 'github', description: 'Deploy to GitHub Pages' },
      { title: 'Custom', value: 'custom', description: 'Deploy to a custom provider' }
    ],
    initial: 0
  });
  
  return response.provider;
}

/**
 * Deploy to Vercel
 */
async function deployToVercel(buildPath: string, options: DeployOptions): Promise<void> {
  const spin = logger.spinner('Deploying to Vercel');
  
  try {
    // Check if Vercel CLI is installed
    const { execa } = await import('execa');
    
    try {
      await execa('vercel', ['--version'], { stdio: 'pipe' });
    } catch (error) {
      spin.stop('error', 'Vercel CLI not found');
      logger.error('Please install Vercel CLI:');
      logger.command('npm i -g vercel');
      process.exit(1);
    }
    
    // Deploy to Vercel
    const args = ['deploy', buildPath];
    
    // Add production flag if needed
    if (options.production) {
      args.push('--prod');
    }
    
    // Add token if provided
    if (options.token) {
      args.push('--token', options.token);
    }
    
    const { stdout } = await execa('vercel', args, { stdio: 'pipe' });
    
    // Extract deployment URL
    const deployUrl = stdout.match(/https:\/\/[^\s]+/)?.[0] || 'Unknown URL';
    
    spin.stop('success', 'Deployed to Vercel');
    logger.spacer();
    logger.box(`
🚀 Deployment successful!

Your site is live at:
${logger.highlight(deployUrl)}
`);
    
  } catch (error) {
    spin.stop('error', 'Failed to deploy to Vercel');
    logger.error(`${error}`);
    process.exit(1);
  }
}

/**
 * Deploy to Netlify
 */
async function deployToNetlify(buildPath: string, options: DeployOptions): Promise<void> {
  const spin = logger.spinner('Deploying to Netlify');
  
  try {
    // Check if Netlify CLI is installed
    const { execa } = await import('execa');
    
    try {
      await execa('netlify', ['--version'], { stdio: 'pipe' });
    } catch (error) {
      spin.stop('error', 'Netlify CLI not found');
      logger.error('Please install Netlify CLI:');
      logger.command('npm i -g netlify-cli');
      process.exit(1);
    }
    
    // Deploy to Netlify
    const args = ['deploy', '--dir', buildPath];
    
    // Add production flag if needed
    if (options.production) {
      args.push('--prod');
    }
    
    // Add token if provided
    if (options.token) {
      args.push('--auth', options.token);
    }
    
    const { stdout } = await execa('netlify', args, { stdio: 'pipe' });
    
    // Extract deployment URL
    const deployUrl = stdout.match(/https:\/\/[^\s]+/)?.[0] || 'Unknown URL';
    
    spin.stop('success', 'Deployed to Netlify');
    logger.spacer();
    logger.box(`
🚀 Deployment successful!

Your site is live at:
${logger.highlight(deployUrl)}
`);
    
  } catch (error) {
    spin.stop('error', 'Failed to deploy to Netlify');
    logger.error(`${error}`);
    process.exit(1);
  }
}

/**
 * Deploy to GitHub Pages
 */
async function deployToGitHubPages(buildPath: string, options: DeployOptions): Promise<void> {
  const spin = logger.spinner('Deploying to GitHub Pages');
  
  try {
    // Check if gh-pages is installed
    const { execa } = await import('execa');
    
    try {
      await execa('npx', ['gh-pages', '--version'], { stdio: 'pipe' });
    } catch (error) {
      // If not installed, install it
      spin.stop('info', 'Installing gh-pages package');
      await execa('bun', ['add', '-D', 'gh-pages'], { stdio: 'pipe' });
      spin.update('Deploying to GitHub Pages');
    }
    
    // Deploy to GitHub Pages
    await execa('npx', ['gh-pages', '-d', buildPath, '-m', 'Deploy 0x1 app to GitHub Pages'], { stdio: 'pipe' });
    
    // Get repo URL to determine the GitHub Pages URL
    let repoUrl = '';
    try {
      const { stdout } = await execa('git', ['config', '--get', 'remote.origin.url'], { stdio: 'pipe' });
      repoUrl = stdout.trim();
    } catch (error) {
      // If not in a git repo, we can't determine the URL
      repoUrl = 'unknown';
    }
    
    // Try to extract username and repo name
    let deployUrl = 'https://your-username.github.io/your-repo/';
    
    if (repoUrl !== 'unknown') {
      const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/\.]+)/);
      if (match) {
        const [, username, repo] = match;
        deployUrl = `https://${username}.github.io/${repo}/`;
      }
    }
    
    spin.stop('success', 'Deployed to GitHub Pages');
    logger.spacer();
    logger.box(`
🚀 Deployment successful!

Your site should be live shortly at:
${logger.highlight(deployUrl)}

Note: It may take a few minutes for GitHub Pages to build your site.
`);
    
  } catch (error) {
    spin.stop('error', 'Failed to deploy to GitHub Pages');
    logger.error(`${error}`);
    process.exit(1);
  }
}

/**
 * Deploy to custom provider
 */
async function deployToCustomProvider(buildPath: string, options: DeployOptions): Promise<void> {
  logger.info('Custom deployment provider selected');
  
  // Prompt for custom provider details
  const response = await prompts([
    {
      type: 'text',
      name: 'command',
      message: 'Enter the deployment command',
      initial: `npx surge ${buildPath} --domain my-app.surge.sh`
    }
  ]);
  
  if (!response.command) {
    logger.error('Deployment command is required');
    process.exit(1);
  }
  
  const spin = logger.spinner('Deploying to custom provider');
  
  try {
    // Run the custom command
    const { execa } = await import('execa');
    
    // Split the command into command and args
    const parts = response.command.split(' ');
    const command = parts[0];
    const args = parts.slice(1);
    
    // Run the command
    await execa(command, args, { stdio: 'inherit' });
    
    spin.stop('success', 'Custom deployment completed');
    
  } catch (error) {
    spin.stop('error', 'Failed to deploy with custom command');
    logger.error(`${error}`);
    process.exit(1);
  }
}
