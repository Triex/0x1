/**
 * 0x1 CLI - Generate Command
 * Generates components, pages, and other code artifacts
 */

import { existsSync } from 'fs';
import { mkdir } from 'fs/promises'; // Keep mkdir for directory creation
import { dirname, join, resolve } from 'path';
import { logger } from '../utils/logger.js';

export interface GenerateOptions {
  path?: string;
  force?: boolean;
  typescript?: boolean;
}

type GeneratorType = 'component' | 'page' | 'layout' | 'hook';

/**
 * Generate a new code artifact
 */
export async function generateComponent(
  type: string = 'component',
  name: string = '',
  options: GenerateOptions = {}
): Promise<void> {
  // Validate input
  if (!name) {
    logger.error('Name is required');
    logger.info('Usage: 0x1 generate <type> <name> [options]');
    logger.info('Example: 0x1 generate component Button');
    process.exit(1);
  }
  
  const validTypes = ['component', 'page', 'layout', 'hook'];
  if (!validTypes.includes(type)) {
    logger.error(`Invalid type: ${type}`);
    logger.info(`Supported types: ${validTypes.join(', ')}`);
    process.exit(1);
  }
  
  // Detect TypeScript usage
  const detectedTypeScript = options.typescript ?? detectTypeScript();
  const fileExt = detectedTypeScript ? 'ts' : 'js';
  
  // Determine the base directory for the artifact type
  const basePath = determineBasePath(type, options.path);
  
  // Parse the artifact name to determine the full path and actual component name
  const { componentName, fullPath } = parseComponentName(name, basePath, fileExt);
  
  // Check if the file already exists
  if (existsSync(fullPath) && !options.force) {
    logger.error(`File already exists: ${fullPath}`);
    logger.info('Use --force to overwrite');
    process.exit(1);
  }
  
  // Generate the artifact
  const spin = logger.spinner(`Generating ${type}: ${componentName}`);
  
  try {
    // Create directory if it doesn't exist
    await mkdir(dirname(fullPath), { recursive: true });
    
    // Generate code based on the artifact type
    let code = '';
    switch (type as GeneratorType) {
      case 'component':
        code = generateComponentCode(componentName, detectedTypeScript);
        break;
      case 'page':
        code = generatePageCode(componentName, detectedTypeScript);
        break;
      case 'layout':
        code = generateLayoutCode(componentName, detectedTypeScript);
        break;
      case 'hook':
        code = generateHookCode(componentName, detectedTypeScript);
        break;
      default:
        // This should never be reached due to earlier validation
        logger.error(`Unsupported type: ${type}`);
        process.exit(1);
    }
    
    // Write code to file
    // Use Bun's native file API for better performance
    await Bun.write(fullPath, code);
    
    spin.stop('success', `Generated ${type}: ${componentName}`);
    logger.info(`File created: ${fullPath}`);
  } catch (error) {
    spin.stop('error', `Failed to generate ${type}`);
    logger.error(`${error}`);
    process.exit(1);
  }
}

/**
 * Detect if the project is using TypeScript
 */
function detectTypeScript(): boolean {
  // Check for tsconfig.json or .ts files in the project
  return existsSync(resolve(process.cwd(), 'tsconfig.json'));
}

/**
 * Determine the base path for different artifact types
 */
function determineBasePath(type: string, customPath?: string): string {
  // If a custom path is provided, use that
  if (customPath) {
    return resolve(process.cwd(), customPath);
  }
  
  // Default paths for different artifact types
  switch (type) {
    case 'component':
      return resolve(process.cwd(), 'src/components');
    case 'page':
      return resolve(process.cwd(), 'src/pages');
    case 'layout':
      return resolve(process.cwd(), 'src/layouts');
    case 'hook':
      return resolve(process.cwd(), 'src/hooks');
    default:
      return resolve(process.cwd(), 'src');
  }
}

/**
 * Parse the component name into a full path and actual component name
 */
function parseComponentName(
  name: string,
  basePath: string,
  fileExt: string
): { componentName: string; fullPath: string } {
  // Handle nested paths (e.g., 'forms/Button')
  const parts = name.split('/');
  const componentName = parts[parts.length - 1];
  
  // Convert to PascalCase for component name
  const pascalCaseName = componentName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  // Build the full path
  const fullPath = join(basePath, ...parts.slice(0, -1), `${pascalCaseName}.${fileExt}`);
  
  return {
    componentName: pascalCaseName,
    fullPath,
  };
}

/**
 * Generate code for a component
 */
function generateComponentCode(name: string, isTypescript: boolean): string {
  return isTypescript 
    ? `/**
 * ${name} Component
 */

import { createElement, Component, mount } from '0x1';

interface ${name}Props {
  className?: string;
  // Add your props here
}

export class ${name} extends Component<${name}Props> {
  constructor(props: ${name}Props) {
    super(props);
  }
  
  render() {
    const { className = '' } = this.props;
    
    return createElement('div', {
      className: \`${name.toLowerCase()} \${className}\`,
      children: [
        // Add your JSX-like structure here
        createElement('h2', {
          children: ['${name} Component']
        })
      ]
    });
  }
}

// Functional component alternative
export function ${name}Functional(props: ${name}Props) {
  const { className = '' } = props;
  
  return createElement('div', {
    className: \`${name.toLowerCase()} \${className}\`,
    children: [
      // Add your JSX-like structure here
      createElement('h2', {
        children: ['${name} Component']
      })
    ]
  });
}

export default ${name};`
    : `/**
 * ${name} Component
 */

import { createElement, Component, mount } from '0x1';

export class ${name} extends Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    const { className = '' } = this.props;
    
    return createElement('div', {
      className: \`${name.toLowerCase()} \${className}\`,
      children: [
        // Add your JSX-like structure here
        createElement('h2', {
          children: ['${name} Component']
        })
      ]
    });
  }
}

// Functional component alternative
export function ${name}Functional(props) {
  const { className = '' } = props;
  
  return createElement('div', {
    className: \`${name.toLowerCase()} \${className}\`,
    children: [
      // Add your JSX-like structure here
      createElement('h2', {
        children: ['${name} Component']
      })
    ]
  });
}

export default ${name};`;
}

/**
 * Generate code for a page
 */
function generatePageCode(name: string, isTypescript: boolean): string {
  return isTypescript
    ? `/**
 * ${name} Page
 */

import { createElement, Component, mount } from '0x1';
import { Page } from '0x1/navigation';

interface ${name}PageProps {
  // Add your props here
}

export default class ${name}Page implements Page<${name}PageProps> {
  title = '${name}';
  
  render(props: ${name}PageProps = {}) {
    return createElement('div', {
      className: 'page ${name.toLowerCase()}-page',
      children: [
        createElement('h1', {
          children: ['${name} Page']
        }),
        // Add your page content here
        createElement('p', {
          children: ['Welcome to the ${name} page.']
        })
      ]
    });
  }
  
  onMount() {
    console.log('${name} page mounted');
    // Initialize page-specific logic
  }
  
  onUnmount() {
    console.log('${name} page unmounted');
    // Clean up page-specific resources
  }
}`
    : `/**
 * ${name} Page
 */

import { createElement, Component, mount } from '0x1';
import { Page } from '0x1/navigation';

export default class ${name}Page {
  title = '${name}';
  
  render(props = {}) {
    return createElement('div', {
      className: 'page ${name.toLowerCase()}-page',
      children: [
        createElement('h1', {
          children: ['${name} Page']
        }),
        // Add your page content here
        createElement('p', {
          children: ['Welcome to the ${name} page.']
        })
      ]
    });
  }
  
  onMount() {
    console.log('${name} page mounted');
    // Initialize page-specific logic
  }
  
  onUnmount() {
    console.log('${name} page unmounted');
    // Clean up page-specific resources
  }
}`;
}

/**
 * Generate code for a layout
 */
function generateLayoutCode(name: string, isTypescript: boolean): string {
  return isTypescript
    ? `/**
 * ${name} Layout
 */

import { createElement, Component, mount } from '0x1';

interface ${name}LayoutProps {
  children?: HTMLElement | HTMLElement[];
  className?: string;
  // Add your props here
}

export class ${name}Layout extends Component<${name}LayoutProps> {
  constructor(props: ${name}LayoutProps) {
    super(props);
  }
  
  render() {
    const { children = [], className = '' } = this.props;
    
    return createElement('div', {
      className: \`layout ${name.toLowerCase()}-layout \${className}\`,
      children: [
        // Add your layout structure here
        createElement('header', {
          className: '${name.toLowerCase()}-header',
          children: [
            createElement('h1', {
              children: ['${name}']
            })
          ]
        }),
        
        createElement('main', {
          className: '${name.toLowerCase()}-content',
          children
        }),
        
        createElement('footer', {
          className: '${name.toLowerCase()}-footer',
          children: [
            createElement('p', {
              children: ['© ' + new Date().getFullYear() + ' ${name}']
            })
          ]
        })
      ]
    });
  }
}

export default ${name}Layout;`
    : `/**
 * ${name} Layout
 */

import { createElement, Component, mount } from '0x1';

export class ${name}Layout extends Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    const { children = [], className = '' } = this.props;
    
    return createElement('div', {
      className: \`layout ${name.toLowerCase()}-layout \${className}\`,
      children: [
        // Add your layout structure here
        createElement('header', {
          className: '${name.toLowerCase()}-header',
          children: [
            createElement('h1', {
              children: ['${name}']
            })
          ]
        }),
        
        createElement('main', {
          className: '${name.toLowerCase()}-content',
          children
        }),
        
        createElement('footer', {
          className: '${name.toLowerCase()}-footer',
          children: [
            createElement('p', {
              children: ['© ' + new Date().getFullYear() + ' ${name}']
            })
          ]
        })
      ]
    });
  }
}

export default ${name}Layout;`;
}

/**
 * Generate code for a hook
 */
function generateHookCode(name: string, isTypescript: boolean): string {
  // Remove 'use' prefix if already present to avoid duplication
  const hookName = name.startsWith('use') ? name : `use${name}`;
  
  return isTypescript
    ? `/**
 * ${hookName} Hook
 */

import { useState, useEffect } from '0x1/hooks';

interface ${hookName}Options {
  // Add your options here
  initialValue?: any;
}

interface ${hookName}Result {
  // Add your return values here
  value: any;
  setValue: (value: any) => void;
}

export function ${hookName}(options: ${hookName}Options = {}): ${hookName}Result {
  const { initialValue = null } = options;
  
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    // Add your effect logic here
    console.log('${hookName} initialized with:', initialValue);
    
    return () => {
      // Clean up if necessary
      console.log('${hookName} cleaning up');
    };
  }, [initialValue]);
  
  // Add your hook logic here
  
  return {
    value,
    setValue
  };
}

export default ${hookName};`
    : `/**
 * ${hookName} Hook
 */

import { useState, useEffect } from '0x1/hooks';

export function ${hookName}(options = {}) {
  const { initialValue = null } = options;
  
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    // Add your effect logic here
    console.log('${hookName} initialized with:', initialValue);
    
    return () => {
      // Clean up if necessary
      console.log('${hookName} cleaning up');
    };
  }, [initialValue]);
  
  // Add your hook logic here
  
  return {
    value,
    setValue
  };
}

export default ${hookName};`;
}
