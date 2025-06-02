/**
 * 0x1 Templates Package
 * Official templates for the 0x1 framework
 */

import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Available template types
 */
export type TemplateType = 'minimal' | 'standard' | 'full' | 'crypto-dash';

/**
 * Template metadata interface
 */
export interface TemplateMetadata {
  name: string;
  description: string;
  complexity: 'minimal' | 'standard' | 'full' | 'advanced';
  features: string[];
  dependencies: string[];
  size: string;
  recommended: boolean;
}

/**
 * Template metadata for all available templates
 */
export const templateMetadata: Record<TemplateType, TemplateMetadata> = {
  minimal: {
    name: 'Minimal',
    description: 'Basic setup with minimal dependencies',
    complexity: 'minimal',
    features: ['TypeScript', 'Basic routing', 'Simple components'],
    dependencies: ['0x1'],
    size: '~500KB',
    recommended: false
  },
  standard: {
    name: 'Standard',
    description: 'Common libraries and project structure',
    complexity: 'standard', 
    features: ['TypeScript', 'Tailwind CSS', 'Routing', 'State management', 'PWA ready'],
    dependencies: ['0x1', 'tailwindcss'],
    size: '~50MB',
    recommended: true
  },
  full: {
    name: 'Full',
    description: 'Complete setup with all recommended features',
    complexity: 'full',
    features: ['TypeScript', 'Tailwind CSS', 'Advanced routing', 'State management', 'PWA', 'Modern UI components', 'Dark/Light theme'],
    dependencies: ['0x1', 'tailwindcss', '@tailwindcss/postcss'],
    size: '~180MB',
    recommended: false
  },
  'crypto-dash': {
    name: 'Crypto Dashboard',
    description: 'Crypto wallet and dashboard with DeFi features',
    complexity: 'advanced',
    features: ['TypeScript', 'Tailwind CSS', 'Wallet integration', 'DeFi protocols', 'NFT support', 'Real-time crypto data'],
    dependencies: ['0x1', 'tailwindcss', '@rainbow-me/rainbowkit', 'wagmi', 'viem'],
    size: '~650MB',
    recommended: false
  }
};

/**
 * Get the path to a template directory
 */
export function getTemplatePath(template: TemplateType): string {
  const templatesRoot = join(__dirname, '..');
  return join(templatesRoot, template);
}

/**
 * Check if a template exists
 */
export function templateExists(template: TemplateType): boolean {
  return existsSync(getTemplatePath(template));
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): TemplateType[] {
  return Object.keys(templateMetadata) as TemplateType[];
}

/**
 * Get template metadata by name
 */
export function getTemplateMetadata(template: TemplateType): TemplateMetadata | null {
  return templateMetadata[template] || null;
}

/**
 * Get recommended template
 */
export function getRecommendedTemplate(): TemplateType {
  return 'standard';
}

/**
 * License utilities
 */
export const licenses = {
  /**
   * Get available license types
   */
  getAvailableTypes(): string[] {
    return ['mit', 'tdl', 'none'];
  },
  
  /**
   * Get license path
   */
  getLicensePath(type: string): string {
    const licensesRoot = join(__dirname, '..', 'licenses');
    return join(licensesRoot, `${type}.txt`);
  },
  
  /**
   * Check if license exists
   */
  licenseExists(type: string): boolean {
    return existsSync(this.getLicensePath(type));
  }
};

// Export everything as default as well
export default {
  templateMetadata,
  getTemplatePath,
  templateExists,
  getAvailableTemplates,
  getTemplateMetadata,
  getRecommendedTemplate,
  licenses
}; 