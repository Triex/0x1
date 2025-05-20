/**
 * Environment detection utility for 0x1 framework
 * Provides a safe way to check environment without directly accessing process
 */

/**
 * Check if code is running in a browser environment
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Get the current environment (development or production)
 * - In browser: infers from URL or defaults to 'development'
 * - In Node.js: safely checks process.env.NODE_ENV with fallback
 */
export function getEnvironment(): 'development' | 'production' {
  if (isBrowser) {
    // For browsers, check for localhost or dev domains
    const hostname = window.location.hostname;
    if (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.includes('dev.') || 
      hostname.includes('.local')
    ) {
      return 'development';
    }
    return 'production';
  } else {
    // For Node.js, safely check process.env
    try {
      const nodeEnv = typeof process !== 'undefined' && 
                     process && 
                     process.env && 
                     process.env.NODE_ENV;
      
      return (nodeEnv === 'development') ? 'development' : 'production';
    } catch (e) {
      // Default to production if process is not available
      return 'production';
    }
  }
}

/**
 * Check if application is running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}
