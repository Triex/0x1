/**
 * 0x1 Icon Generator
 * Utility for generating PWA icons of various sizes and types
 */

import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
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
  baseColor: '#0077cc', 
  backgroundColor: '#ffffff',
  text: '',
  subtext: '0x1', // Default 0x1 branding
  outputPath: 'public/icons'
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
    text = DEFAULT_OPTIONS.text,
    subtext = DEFAULT_OPTIONS.subtext,
    textColor = '#ffffff',
    theme,
    logoText
  } = options;
  
  // Ensure proper sizing
  const padding = isMaskable ? size * 0.15 : size * 0.1; // More padding for maskable icons
  const iconSize = size - (padding * 2);
  
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
  
  return `
<svg width="${size}" height="${size}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  ${isMaskable ? `<rect width="100" height="100" fill="${backgroundColor}" />` : ''}
  <${themeStyling.shape} fill="${backgroundColor}" stroke="${baseColor}" stroke-width="5" />
  ${themeStyling.effect}
  <text x="50" y="${showSubtext ? 53 : 55}" font-family="Arial, sans-serif" font-weight="bold" font-size="${fontSize}" fill="${baseColor}" text-anchor="middle" dominant-baseline="middle">${mainText}</text>
  ${showSubtext && subtext && !logoText ? `<text x="50" y="75" font-family="Arial, sans-serif" font-size="${size > 144 ? 16 : 12}" fill="${baseColor}" text-anchor="middle" dominant-baseline="middle">${subtext}</text>` : ''}
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
 * Save SVG to file
 */
async function saveSVG(svgContent: string, filePath: string): Promise<void> {
  try {
    // Ensure directory exists
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    
    await writeFile(filePath, svgContent);
    console.log(`Generated ${filePath}`);
  } catch (error) {
    console.error(`Failed to save SVG to ${filePath}:`, error);
    throw error;
  }
}

/**
 * Generate standard icons for PWA
 */
export async function generateStandardIcons(
  projectPath: string,
  options: IconGeneratorOptions = {}
): Promise<void> {
  const outputPath = options.outputPath || DEFAULT_OPTIONS.outputPath;
  
  for (const size of STANDARD_SIZES) {
    const svgContent = generateSVG(size, options);
    const filePath = join(projectPath, outputPath, `icon-${size}x${size}.svg`);
    await saveSVG(svgContent, filePath);
  }
  
  // Generate favicon.svg
  const faviconContent = generateSVG(32, options);
  const faviconPath = join(projectPath, outputPath, '../favicon.svg');
  await saveSVG(faviconContent, faviconPath);
  
  // Generate apple-touch-icon
  const appleTouchContent = generateSVG(180, options);
  const appleTouchPath = join(projectPath, outputPath, 'apple-touch-icon.png');
  await saveSVG(appleTouchContent, appleTouchPath);
}

/**
 * Generate maskable icons for PWA
 */
export async function generateMaskableIcons(
  projectPath: string,
  options: IconGeneratorOptions = {}
): Promise<void> {
  const outputPath = options.outputPath || DEFAULT_OPTIONS.outputPath;
  
  for (const size of MASKABLE_SIZES) {
    const svgContent = generateSVG(size, options, true);
    const filePath = join(projectPath, outputPath, `maskable-icon-${size}x${size}.svg`);
    await saveSVG(svgContent, filePath);
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
    const filePath = join(projectPath, outputPath, `splash-${name}.svg`);
    await saveSVG(svgContent, filePath);
  }
}

/**
 * Generate all required icons for a PWA
 */
export async function generateAllIcons(
  projectPath: string,
  pwaConfig: PWAConfig,
  options: IconGeneratorOptions = {}
): Promise<void> {
  // Extract logoText from PWA config if available
  const logoText = (pwaConfig as any).logoText || '';
  const theme = (pwaConfig as any).theme || 'classic';
  
  // Prepare options from PWA config
  const iconOptions: IconGeneratorOptions = {
    baseColor: pwaConfig.themeColor,
    backgroundColor: pwaConfig.backgroundColor,
    // Use logoText if provided, otherwise use first character of shortName
    text: logoText || pwaConfig.shortName.charAt(0),
    subtext: pwaConfig.shortName,
    // Pass theme and logoText through
    theme: theme,
    logoText: logoText,
    outputPath: pwaConfig.iconsPath?.startsWith('/') 
      ? pwaConfig.iconsPath.substring(1) // Remove leading slash
      : pwaConfig.iconsPath || DEFAULT_OPTIONS.outputPath
  };
  
  // Merge with provided options
  const finalOptions = { ...iconOptions, ...options };
  
  try {
    await Promise.all([
      generateStandardIcons(projectPath, finalOptions),
      generateMaskableIcons(projectPath, finalOptions),
      generateSplashScreens(projectPath, finalOptions)
    ]);
    
    console.log('All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating PWA icons:', error);
    throw error;
  }
}
