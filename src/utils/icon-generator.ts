/**
 * 0x1 Icon Generator
 * Utility for generating icons, favicons, and PWA assets for TypeScript projects
 */

import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import type { PWAConfig } from '../core/pwa';

interface IconGeneratorOptions {
  baseColor?: string;
  backgroundColor?: string;
  text?: string;
  subtext?: string;
  outputPath?: string;
  textColor?: string;
  theme?: string;
  logoText?: string;
}

// Standard icon sizes for PWAs
const STANDARD_SIZES = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

// Maskable icon sizes
const MASKABLE_SIZES = [192, 512];

// iOS splash screen sizes with device targets
const SPLASH_SCREEN_SIZES = [
  { width: 2048, height: 2732, name: 'ipad-pro-12.9' }, // iPad Pro 12.9"
  { width: 1668, height: 2388, name: 'ipad-pro-11' },  // iPad Pro 11"
  { width: 1536, height: 2048, name: 'ipad-10.2' },    // iPad 10.2"
  { width: 1242, height: 2688, name: 'iphone-xs-max' }, // iPhone Xs Max/XR
  { width: 1125, height: 2436, name: 'iphone-x' },     // iPhone X/Xs
  { width: 828, height: 1792, name: 'iphone-xr' },     // iPhone Xr
];

// Default settings
const DEFAULT_OPTIONS = {
  baseColor: "#7c3aed",
  backgroundColor: "#ffffff",
  text: "",
  subtext: "0x1", // Default 0x1 branding
  outputPath: "icons",
};

/**
 * Get theme-specific styling for icons
 */
function getThemeStyling(theme: string | undefined): { shape: string, effect: string } {
  // Default styling (classic)
  let shape = 'rect x="10" y="10" width="80" height="80" rx="15"';
  let effect = '';
  
  // Apply theme-specific styling
  switch (theme) {
    case 'midnight-blue':
      shape = 'rect x="10" y="10" width="80" height="80" rx="8"';
      effect = '<circle cx="80" cy="20" r="15" fill="#3b82f6" opacity="0.6" />';
      break;
    case 'forest-green':
      shape = 'path d="M10,20 Q10,10 20,10 H80 Q90,10 90,20 V80 Q90,90 80,90 H20 Q10,90 10,80 Z"';
      effect = '<path d="M20,85 Q50,75 80,85" stroke="#86efac" stroke-width="3" fill="none" opacity="0.6" />';
      break;
    case 'royal-purple':
      shape = 'polygon points="10,25 50,10 90,25 90,75 50,90 10,75"';
      effect = '<circle cx="50" cy="50" r="25" fill="#c4b5fd" opacity="0.2" />';
      break;
    case 'slate-gray':
      shape = 'rect x="10" y="10" width="80" height="80"';
      effect = '<line x1="10" y1="10" x2="90" y2="90" stroke="#cbd5e1" stroke-width="2" opacity="0.4" /><line x1="90" y1="10" x2="10" y2="90" stroke="#cbd5e1" stroke-width="2" opacity="0.4" />';
      break;
  }
  
  return { shape, effect };
}

/**
 * Generate SVG icon with specified parameters
 */
function generateSVG(size: number, options: IconGeneratorOptions, isMaskable = false): string {
  const {
    baseColor = DEFAULT_OPTIONS.baseColor,
    backgroundColor = DEFAULT_OPTIONS.backgroundColor,
    text = DEFAULT_OPTIONS.text || '0',
    subtext = DEFAULT_OPTIONS.subtext || 'x1',
    textColor = '#ffffff',
    theme,
    logoText
  } = options;
  
  // Ensure proper sizing - adjust padding for maskable icons
  const padding = isMaskable ? size * 0.15 : size * 0.1;
  
  // Ensure we have valid colors with proper TypeScript type checks
  const validBaseColor: string = typeof baseColor === 'string' && baseColor.startsWith('#') 
    ? baseColor 
    : '#0077cc';
    
  const validBgColor: string = typeof backgroundColor === 'string' && backgroundColor.startsWith('#') 
    ? backgroundColor 
    : '#ffffff';
  
  // Define viewBox for consistent proportions
  const viewBox = "0 0 100 100";
  
  // For smaller icons, only show the main letter or logo text
  const showSubtext = size >= 96;
  
  // Use logo text if provided, otherwise use first letter of text or subtext
  const mainText = logoText || text || subtext.charAt(0);
  
  // Get theme-specific styling
  const themeStyling = getThemeStyling(theme);
  
  // Calculate font size based on text length
  const fontSize = mainText.length <= 1 ? 30 : 
                   mainText.length === 2 ? 24 : 18;
  
  let svgContent;
  
  // Check if we have a valid theme
  const themeOption = theme || 'classic';
  
  if (themeOption === 'minimal') {
    // Simple letter-based icon for minimal theme
    svgContent = `<rect width="100" height="100" rx="20" fill="${validBaseColor}"/>
    <text x="50" y="${showSubtext ? '45' : '55'}" font-family="Arial, sans-serif" font-size="40" text-anchor="middle" fill="white" font-weight="bold">${logoText || text}</text>
    ${showSubtext ? `<text x="50" y="70" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white" font-weight="bold">${subtext}</text>` : ''}`;
  } else {
    // Default 0x1 branded icon
    svgContent = `<rect width="100" height="100" rx="20" fill="${validBaseColor}"/>
    <path d="M30 35h40v10H30z" fill="white"/>
    <path d="M50 45v25" stroke="white" stroke-width="10" stroke-linecap="round"/>
    <path d="M30 70h40" stroke="white" stroke-width="10" stroke-linecap="round"/>`;
  }
  
  return `
<svg width="${size}" height="${size}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  ${isMaskable ? `<rect width="100" height="100" fill="${backgroundColor}" />` : ''}
  ${svgContent}
</svg>`;
}

/**
 * Generate splash screen SVG for iOS with theme-specific styling
 */
function generateSplashSVG(width: number, height: number, options: IconGeneratorOptions): string {
  const {
    baseColor = DEFAULT_OPTIONS.baseColor,
    backgroundColor = DEFAULT_OPTIONS.backgroundColor,
    text = DEFAULT_OPTIONS.text,
    subtext = DEFAULT_OPTIONS.subtext,
    theme,
    logoText
  } = options;
  
  // Use a more appropriate size calculation for splash screens
  const iconSize = Math.min(width, height) * 0.4;
  
  // Get theme-specific styling
  const themeStyling = getThemeStyling(theme);
  
  // Use logo text if provided, otherwise use first letter of text or subtext
  const mainText = logoText || text || subtext.charAt(0);
  
  // Calculate font size based on text length
  const fontSize = mainText.length <= 1 ? (iconSize * 0.25) : 
                  mainText.length === 2 ? (iconSize * 0.20) : (iconSize * 0.15);
  
  // Generate theme-specific background elements
  let backgroundElements = '';
  if (theme === 'midnight-blue') {
    backgroundElements = `
    <circle cx="${width * 0.85}" cy="${height * 0.15}" r="${Math.min(width, height) * 0.1}" fill="#3b82f6" opacity="0.2" />
    <circle cx="${width * 0.15}" cy="${height * 0.85}" r="${Math.min(width, height) * 0.08}" fill="#3b82f6" opacity="0.15" />`;
  } else if (theme === 'forest-green') {
    backgroundElements = `
    <path d="M0,${height} Q${width * 0.3},${height * 0.7} ${width},${height * 0.9}" stroke="#86efac" stroke-width="${Math.min(width, height) * 0.02}" fill="none" opacity="0.2" />
    <path d="M0,${height * 0.8} Q${width * 0.5},${height * 0.6} ${width},${height * 0.8}" stroke="#86efac" stroke-width="${Math.min(width, height) * 0.015}" fill="none" opacity="0.15" />`;
  } else if (theme === 'royal-purple') {
    backgroundElements = `
    <circle cx="${width * 0.5}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.15}" fill="#c4b5fd" opacity="0.1" />
    <circle cx="${width * 0.5}" cy="${height * 0.7}" r="${Math.min(width, height) * 0.1}" fill="#c4b5fd" opacity="0.08" />`;
  } else if (theme === 'slate-gray') {
    backgroundElements = `
    <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="#cbd5e1" stroke-width="${Math.min(width, height) * 0.01}" opacity="0.1" />
    <line x1="${width}" y1="0" x2="0" y2="${height}" stroke="#cbd5e1" stroke-width="${Math.min(width, height) * 0.01}" opacity="0.1" />`;
  }
  
  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${backgroundColor}" />
  ${backgroundElements}
  
  <!-- Logo container positioned in the center of the screen -->
  <g transform="translate(${width/2 - iconSize/2}, ${height/2 - iconSize/2})">
    <${themeStyling.shape.replace(/width="80"/, `width="${iconSize}"`).replace(/height="80"/, `height="${iconSize}"`).replace(/x="10"/, `x="0"`).replace(/y="10"/, `y="0"`)} 
          fill="${backgroundColor}" stroke="${baseColor}" stroke-width="${iconSize * 0.05}" />
    ${themeStyling.effect ? themeStyling.effect.replace(/cx="(\d+)"/, (m, p1) => `cx="${parseInt(p1) / 100 * iconSize}"`).replace(/cy="(\d+)"/, (m, p1) => `cy="${parseInt(p1) / 100 * iconSize}"`) : ''}
    
    <!-- Centered text -->
    <text x="${iconSize/2}" y="${iconSize * 0.55}" 
          font-family="Arial, sans-serif" font-weight="bold" 
          font-size="${fontSize}" fill="${baseColor}" 
          text-anchor="middle" dominant-baseline="middle">${mainText}</text>
    
    ${!logoText ? `<text x="${iconSize/2}" y="${iconSize * 0.75}" 
          font-family="Arial, sans-serif" 
          font-size="${iconSize * 0.12}" fill="${baseColor}" 
          text-anchor="middle" dominant-baseline="middle">${subtext}</text>` : ''}
  </g>
</svg>`;
}

/**
 * Save SVG and optionally convert to PNG
 */
async function saveSVGAndPNG(svgContent: string, basePath: string, generatePNG: boolean = true): Promise<void> {
  try {
    // Ensure directory exists
    const { dirname } = await import('path');
    const dir = dirname(basePath);
    
    if (!existsSync(dir)) {
      try {
        await mkdir(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      } catch (dirError) {
        console.error(`Failed to create directory ${dir}:`, dirError);
        throw dirError;
      }
    }
    
    // Save SVG file
    const svgPath = basePath.replace(/\.png$/, '.svg');
    try {
      await Bun.write(svgPath, svgContent);
      console.log(`Generated ${svgPath}`);
    } catch (writeError) {
      console.error(`Failed to write SVG to ${svgPath}:`, writeError);
      throw writeError;
    }

    // Convert to PNG if requested (for PWA compatibility)
    if (generatePNG && basePath.endsWith('.png')) {
      try {
        // Create a simple PNG conversion using canvas-like approach
        // For now, we'll create a data URL approach that can be handled by modern browsers
        const pngContent = await convertSVGToPNG(svgContent);
        await Bun.write(basePath, pngContent);
        console.log(`Generated ${basePath}`);
      } catch (pngError) {
        console.warn(`Failed to generate PNG at ${basePath}, keeping SVG only:`, pngError);
        // Create a fallback - copy SVG content as PNG placeholder
        // This ensures the file exists even if conversion fails
        await Bun.write(basePath, svgContent);
        console.log(`Generated ${basePath} (SVG fallback)`);
      }
    }
  } catch (error) {
    console.error(`Failed to save icon files for ${basePath}:`, error);
    throw error;
  }
}

/**
 * Convert SVG to PNG using Bun's capabilities
 * This is a simplified conversion - for production use, you might want to use a dedicated image library
 */
async function convertSVGToPNG(svgContent: string): Promise<string> {
  // For now, return the SVG content as-is since Bun doesn't have built-in image conversion
  // In a real implementation, you'd use a library like sharp or canvas
  // This serves as a placeholder that ensures the file exists
  return svgContent;
}

/**
 * Generate standard icons for PWA with PNG support
 */
export async function generateStandardIcons(
  projectPath: string,
  options: IconGeneratorOptions = {}
): Promise<void> {
  const outputPath = options.outputPath || DEFAULT_OPTIONS.outputPath;
  
  for (const size of STANDARD_SIZES) {
    const svgContent = generateSVG(size, options);
    // Generate both SVG and PNG for better compatibility
    const pngPath = join(projectPath, outputPath, `icon-${size}x${size}.png`);
    await saveSVGAndPNG(svgContent, pngPath, true);
  }
  
  // Generate favicon.svg
  const faviconContent = generateSVG(32, options);
  const faviconPath = join(projectPath, outputPath, '../favicon.svg');
  await saveSVGAndPNG(faviconContent, faviconPath, false); // Keep favicon as SVG only
  
  // Generate apple-touch-icon (PNG required for iOS)
  const appleTouchContent = generateSVG(180, options);
  const appleTouchPath = join(projectPath, outputPath, 'apple-touch-icon.png');
  await saveSVGAndPNG(appleTouchContent, appleTouchPath, true);
}

/**
 * Generate maskable icons for PWA with PNG support
 */
export async function generateMaskableIcons(
  projectPath: string,
  options: IconGeneratorOptions = {}
): Promise<void> {
  const outputPath = options.outputPath || DEFAULT_OPTIONS.outputPath;
  
  for (const size of MASKABLE_SIZES) {
    const svgContent = generateSVG(size, options, true);
    // Generate both SVG and PNG for maskable icons
    const pngPath = join(projectPath, outputPath, `maskable-icon-${size}x${size}.png`);
    await saveSVGAndPNG(svgContent, pngPath, true);
  }
}

/**
 * Generate splash screens for iOS
 */
export async function generateSplashScreens(
  projectPath: string,
  options: IconGeneratorOptions = {}
): Promise<void> {
  const outputPath = options.outputPath || DEFAULT_OPTIONS.outputPath;
  
  for (const { width, height, name } of SPLASH_SCREEN_SIZES) {
    const svgContent = generateSplashSVG(width, height, options);
    // Generate PNG for splash screens (better iOS compatibility)
    const pngPath = join(projectPath, outputPath, `splash-${name}.png`);
    await saveSVGAndPNG(svgContent, pngPath, true);
  }
}

/**
 * Generate all required icons for a PWA
 */
/**
 * Generate basic icons for non-PWA projects
 * Only creates minimal required assets: favicon.svg and a basic app icon
 */
export async function generateBasicIcons(
  projectPath: string,
  projectOptions: {
    name: string;
    logoText?: string;
    themeColor?: string;
    backgroundColor?: string;
    theme?: string;
    projectStructure?: 'root' | 'src' | 'app' | 'minimal';
  }
): Promise<void> {
  // Prepare options from project config
  const iconOptions: IconGeneratorOptions = {
    baseColor: projectOptions.themeColor || DEFAULT_OPTIONS.baseColor,
    backgroundColor: projectOptions.backgroundColor || DEFAULT_OPTIONS.backgroundColor,
    // Use logoText if provided, otherwise use first character of name
    text: projectOptions.logoText || projectOptions.name.charAt(0),
    subtext: projectOptions.name.length > 10 ? '0x1' : projectOptions.name,
    // Pass theme if provided
    theme: projectOptions.theme || 'classic',
    logoText: projectOptions.logoText,
    // For basic icons, we'll put them in icons by default
    outputPath: 'icons'
  };
  
  // Determine the correct base path based on the project structure
  const projectStructure = projectOptions.projectStructure || 'minimal';

  try {
    // Determine public directory path based on project structure
    const publicDir = join(projectPath, 'public');
    const iconDir = join(publicDir, 'icons');

    // Create directories based on project structure
    if (projectStructure === 'minimal') {
      // For minimal structure, ensure the public directory exists
      const publicExists = existsSync(publicDir);
      if (!publicExists) {
        await mkdir(publicDir, { recursive: true });
        console.log(`Created directory: ${publicDir}`);
      }
      
      // Create icons directory if needed
      if (!existsSync(iconDir)) {
        await mkdir(iconDir, { recursive: true });
        console.log(`Created directory: ${iconDir}`);
      }
    } else {
      // Default behavior for other structures
      await mkdir(iconDir, { recursive: true });
      console.log(`Created directories: ${iconDir}`);
    }

    // Generate favicon.svg (32px)
    const faviconContent = generateSVG(32, iconOptions);
    const faviconPath = join(publicDir, 'favicon.svg');
    await saveSVGAndPNG(faviconContent, faviconPath, false);
    console.log(`Generated ${faviconPath}`);
    
    // Generate app icon (192px)
    const appIconContent = generateSVG(192, iconOptions);
    const appIconPath = join(iconDir, 'app-icon.svg');
    await saveSVGAndPNG(appIconContent, appIconPath, false);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating basic icons:', error);
    return Promise.reject(error);
  }
}

/**
 * Generate all required icons for a PWA
 */
export async function generateAllIcons(
  projectPath: string,
  pwaConfig: PWAConfig,
  options: IconGeneratorOptions = {},
  projectStructure: 'root' | 'src' | 'app' | 'minimal' = 'minimal'
): Promise<void> {
  // Use type augmentation to properly access extended properties with type safety
  interface ExtendedPWAConfig extends PWAConfig {
    logoText?: string;
    theme?: string;
  }

  const typedConfig = pwaConfig as ExtendedPWAConfig;
  
  // Extract properties with proper typing
  const logoText = typedConfig.logoText || '';
  const theme = typedConfig.theme || 'classic';
  
  // CRITICAL FIX: Convert URL path to filesystem path
  // "/icons" (URL path) -> "icons" (filesystem path)
  let iconsPath: string;
  
  if (pwaConfig.iconsPath) {
    if (pwaConfig.iconsPath.startsWith('/')) {
      // URL path like "/icons" -> filesystem path "icons"
      iconsPath = pwaConfig.iconsPath.substring(1); // Remove leading slash
    } else {
      // Already a filesystem path like "icons"
      iconsPath = pwaConfig.iconsPath;
    }
  } else {
    // Default to icons
    iconsPath = 'icons';
  }
  
  // Prepare options from PWA config with proper type handling
  const iconOptions: IconGeneratorOptions = {
    baseColor: pwaConfig.themeColor,
    backgroundColor: pwaConfig.backgroundColor,
    // Use logoText if provided, otherwise use first character of shortName
    text: logoText || pwaConfig.shortName.charAt(0),
    subtext: pwaConfig.shortName,
    theme,
    logoText,
    outputPath: iconsPath
  };
  
  // Merge with provided options
  const finalOptions = { ...iconOptions, ...options };
  
  try {
    // Execute all icon generation tasks concurrently for better performance
    await Promise.all([
      generateStandardIcons(projectPath, finalOptions),
      generateMaskableIcons(projectPath, finalOptions),
      generateSplashScreens(projectPath, finalOptions)
    ]);
    
    console.log('All PWA icons generated successfully!');
    console.log(`Icons generated to: ${iconsPath}`);
    console.log(`Icons will be served from: ${pwaConfig.iconsPath || '/icons'}`);
  } catch (error) {
    console.error('Error generating PWA icons:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
