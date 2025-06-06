/**
 * 0x1 Head Management System - Next15 Compatible
 * Simple, static head management for production apps
 */

import { DEFAULT_METADATA, Metadata, generateHeadContent, mergeMetadata } from './metadata';

// Global metadata store (simplified)
let globalMetadata: Metadata = { ...DEFAULT_METADATA };

/**
 * Set global metadata that applies to all pages (Next15 style)
 * Call this once in your root layout
 */
export function setGlobalMetadata(metadata: Metadata): void {
  globalMetadata = mergeMetadata(metadata, DEFAULT_METADATA);
}

/**
 * Get current global metadata
 */
export function getGlobalMetadata(): Metadata {
  return globalMetadata;
}

/**
 * Update document head with metadata (client-side only)
 * Use this for page-specific metadata updates
 */
export function updateDocumentHead(metadata: Metadata, pageTitle?: string): void {
  if (typeof document === 'undefined') return;
  
  const mergedMetadata = mergeMetadata(metadata, globalMetadata);
  const headContent = generateHeadContent(mergedMetadata, pageTitle);
  
  // Update document head
  const head = document.head;
  
  // Remove existing 0x1 managed meta tags
  const existingTags = head.querySelectorAll('[data-0x1-meta]');
  existingTags.forEach(tag => tag.remove());
  
  // Create a temporary container to parse the new head content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = headContent;
  
  // Add new tags with 0x1 marker
  Array.from(tempDiv.children).forEach(child => {
    const element = child.cloneNode(true) as Element;
    element.setAttribute('data-0x1-meta', 'true');
    head.appendChild(element);
  });
  
  // Update title separately
  const titleElement = tempDiv.querySelector('title');
  if (titleElement) {
    document.title = titleElement.textContent || '';
  }
}

/**
 * Head component props
 */
export interface HeadProps {
  children?: any;
  title?: string;
  metadata?: Metadata;
}

/**
 * Head component for JSX-based head content (Next15 style)
 * Usage: <Head title="Page Title" metadata={{...}} />
 */
export function Head(props: HeadProps): null {
  const { title, metadata = {}, children } = props;
  
  // Update document head when component is rendered
  if (typeof document !== 'undefined') {
    // Use setTimeout to ensure this runs after the current render cycle
    setTimeout(() => {
      updateDocumentHead(metadata, title);
      
      // Process children if provided (for custom head elements)
      if (children) {
        processHeadChildren(children);
      }
    }, 0);
  }
  
  // Head component doesn't render anything in the DOM
  return null;
}

/**
 * Process JSX children for head elements
 */
function processHeadChildren(children: any): void {
  if (!children || typeof document === 'undefined') return;
  
  const childArray = Array.isArray(children) ? children : [children];
  
  childArray.forEach(child => {
    if (!child || typeof child !== 'object') return;
    
    // Handle JSX elements
    if (child.type && typeof child.type === 'string') {
      const element = createElementFromObject(child);
      if (element) {
        element.setAttribute('data-0x1-meta', 'true');
        document.head.appendChild(element);
      }
    }
  });
}

/**
 * Create DOM element from JSX object
 */
function createElementFromObject(obj: any): Element | null {
  if (!obj.type || typeof obj.type !== 'string') return null;
  
  const element = document.createElement(obj.type);
  
  // Set attributes from props
  if (obj.props) {
    Object.entries(obj.props).forEach(([key, value]) => {
      if (key === 'children') {
        if (typeof value === 'string') {
          element.textContent = value;
        }
      } else if (key === 'dangerouslySetInnerHTML' && value && typeof value === 'object' && '__html' in value) {
        element.innerHTML = (value as any).__html;
      } else if (value !== null && value !== undefined) {
        element.setAttribute(key, String(value));
      }
    });
  }
  
  return element;
}

/**
 * Hook for using metadata in components (simplified)
 * Use this in functional components for page-specific metadata
 */
export function useMetadata(metadata: Metadata, title?: string): void {
  if (typeof document !== 'undefined') {
    // Update head when metadata changes
    setTimeout(() => {
      updateDocumentHead(metadata, title);
    }, 0);
  }
}

/**
 * Generate metadata object for a page (Next15 style)
 * Use this to create metadata objects for static export
 */
export function generateMetadata(params: {
  title?: string;
  description?: string;
  keywords?: string | string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}): Metadata {
  const {
    title,
    description,
    keywords,
    image,
    url,
    type = 'website',
    publishedTime,
    modifiedTime,
    authors,
    section,
    tags
  } = params;
  
  const metadata: Metadata = {};
  
  if (title) metadata.title = title;
  if (description) metadata.description = description;
  if (keywords) metadata.keywords = keywords;
  
  // Open Graph
  metadata.openGraph = {
    type,
    title,
    description,
    url,
    ...(image && {
      images: [{
        url: image,
        width: 1200,
        height: 630,
        alt: title || 'Image'
      }]
    }),
    ...(publishedTime && { publishedTime }),
    ...(modifiedTime && { modifiedTime }),
    ...(authors && { authors }),
    ...(section && { section }),
    ...(tags && { tags })
  };
  
  // Twitter
  metadata.twitter = {
    card: 'summary_large_image',
    title,
    description,
    ...(image && { image })
  };
  
  return metadata;
}

/**
 * Server-side head generation for SSR
 */
export function generateServerHead(metadata: Metadata, pageTitle?: string): string {
  const mergedMetadata = mergeMetadata(metadata, globalMetadata);
  return generateHeadContent(mergedMetadata, pageTitle);
}

/**
 * Initialize head management system
 * Call this once in your app initialization
 */
export function initializeHeadManagement(): void {
  // Set up any global head management initialization
  if (typeof document !== 'undefined') {
    // Ensure charset is set
    if (!document.querySelector('meta[charset]')) {
      const charset = document.createElement('meta');
      charset.setAttribute('charset', 'utf-8');
      charset.setAttribute('data-0x1-meta', 'true');
      document.head.insertBefore(charset, document.head.firstChild);
    }
  }
} 