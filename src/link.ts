/**
 * 0x1 Link Subpath Export
 * 
 * This file provides Next.js-compatible import paths.
 * Developers can import Link directly with:
 *   import Link from '0x1/link'
 * 
 * This makes migration from Next.js extremely simple:
 *   find: import Link from 'next/link'
 *   replace: import Link from '0x1/link'
 */

import Link from './components/link.js';

// Re-export as default for compatibility
export default Link;

// Also export as named export for flexibility
export { Link };
