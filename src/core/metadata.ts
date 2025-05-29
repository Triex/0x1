/**
 * 0x1 Metadata System - Next.js 15 Compatible
 * Simple, static metadata exports for production apps
 */

export interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string;
  secureUrl?: string;
}

export interface TwitterCard {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string | OpenGraphImage;
  imageAlt?: string;
}

export interface OpenGraph {
  title?: string;
  description?: string;
  url?: string;
  siteName?: string;
  locale?: string;
  type?: 'website' | 'article' | 'book' | 'profile' | 'music.song' | 'music.album' | 'music.playlist' | 'music.radio_station' | 'video.movie' | 'video.episode' | 'video.tv_show' | 'video.other';
  images?: OpenGraphImage | OpenGraphImage[];
  audio?: string | { url: string; type?: string }[];
  video?: string | { url: string; type?: string; width?: number; height?: number }[];
  determiner?: 'a' | 'an' | 'the' | 'auto' | '';
  countryName?: string;
  ttl?: number;
  publishedTime?: string;
  modifiedTime?: string;
  expirationTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}

export interface Robots {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  noimageindex?: boolean;
  nocache?: boolean;
  notranslate?: boolean;
  indexifembedded?: boolean;
  nositelinkssearchbox?: boolean;
  unavailable_after?: string;
  'max-video-preview'?: number | 'none';
  'max-image-preview'?: 'none' | 'standard' | 'large';
  'max-snippet'?: number | 'none';
}

export interface Viewport {
  width?: string | number;
  height?: string | number;
  initialScale?: number;
  minimumScale?: number;
  maximumScale?: number;
  userScalable?: boolean;
  shrinkToFit?: boolean;
  viewportFit?: 'auto' | 'contain' | 'cover';
  interactiveWidget?: 'resizes-visual' | 'resizes-content' | 'overlays-content';
  themeColor?: string | { media?: string; color: string }[];
  colorScheme?: 'normal' | 'light' | 'dark' | 'light dark' | 'dark light';
}

export interface LanguageAlternate {
  hrefLang: string;
  href: string;
}

export interface AppLinks {
  ios?: {
    url?: string;
    app_store_id?: string;
    app_name?: string;
  };
  android?: {
    package?: string;
    url?: string;
    class?: string;
    app_name?: string;
  };
  web?: {
    url?: string;
    should_fallback?: boolean;
  };
}

/**
 * Next.js 15 Compatible Metadata Interface
 * Use this for static metadata exports: export const metadata: Metadata = {...}
 */
export interface Metadata {
  // Basic metadata
  title?: string | { template?: string; default?: string; absolute?: string };
  description?: string;
  keywords?: string | string[];
  authors?: { name?: string; url?: string }[];
  creator?: string;
  publisher?: string;
  formatDetection?: {
    email?: boolean;
    address?: boolean;
    telephone?: boolean;
  };
  
  // SEO
  robots?: string | Robots;
  alternates?: {
    canonical?: string | URL;
    languages?: Record<string, string | URL> | LanguageAlternate[];
    media?: Record<string, string | URL>;
    types?: Record<string, string | URL>;
  };
  
  // Social Media
  openGraph?: OpenGraph;
  twitter?: TwitterCard;
  
  // PWA & Mobile
  viewport?: string | Viewport;
  themeColor?: string | { media?: string; color: string }[];
  colorScheme?: 'normal' | 'light' | 'dark' | 'light dark' | 'dark light';
  manifest?: string;
  appleWebApp?: {
    capable?: boolean;
    title?: string;
    statusBarStyle?: 'default' | 'black' | 'black-translucent';
    startupImage?: string | { url: string; media?: string }[];
  };
  
  // App Links
  appLinks?: AppLinks;
  
  // Icons
  icons?: {
    icon?: string | { url: string; type?: string; sizes?: string }[];
    shortcut?: string | { url: string; type?: string; sizes?: string }[];
    apple?: string | { url: string; type?: string; sizes?: string }[];
    other?: { rel: string; url: string; type?: string; sizes?: string }[];
  };
  
  // Verification
  verification?: {
    google?: string;
    yandex?: string;
    yahoo?: string;
    other?: Record<string, string>;
  };
  
  // Analytics & Tracking
  analytics?: {
    googleAnalytics?: string;
    googleTagManager?: string;
    plausible?: { domain: string; trackLocalhost?: boolean };
    fathom?: { siteId: string; honorDNT?: boolean };
    custom?: { name: string; src: string; async?: boolean; defer?: boolean }[];
  };
  
  // Custom meta tags
  other?: Record<string, string | number | boolean>;
}

/**
 * Default metadata configuration
 */
export const DEFAULT_METADATA: Metadata = {
  title: {
    template: '%s | 0x1 App',
    default: '0x1 App'
  },
  description: 'Built with 0x1 - the ultra-minimal framework',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    shrinkToFit: false
  },
  themeColor: '#7c3aed',
  colorScheme: 'light dark',
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: '0x1 App'
  },
  twitter: {
    card: 'summary_large_image'
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png'
  },
  manifest: '/manifest.json'
};

/**
 * Merge metadata with defaults (simplified)
 */
export function mergeMetadata(metadata: Metadata, defaults: Metadata = DEFAULT_METADATA): Metadata {
  return {
    ...defaults,
    ...metadata,
    // Handle nested objects
    openGraph: { ...(defaults.openGraph || {}), ...(metadata.openGraph || {}) },
    twitter: metadata.twitter ? {
      ...(defaults.twitter || {}),
      ...metadata.twitter,
      // Ensure card property is set if not provided
      card: metadata.twitter.card || (defaults.twitter?.card) || 'summary' as const
    } : defaults.twitter,
    icons: { ...(defaults.icons || {}), ...(metadata.icons || {}) },
    viewport: typeof metadata.viewport === 'object' && typeof defaults.viewport === 'object'
      ? { ...defaults.viewport, ...metadata.viewport }
      : metadata.viewport || defaults.viewport,
    appleWebApp: { ...(defaults.appleWebApp || {}), ...(metadata.appleWebApp || {}) },
    verification: { ...(defaults.verification || {}), ...(metadata.verification || {}) },
    analytics: { ...(defaults.analytics || {}), ...(metadata.analytics || {}) },
    alternates: { ...(defaults.alternates || {}), ...(metadata.alternates || {}) },
    appLinks: { ...(defaults.appLinks || {}), ...(metadata.appLinks || {}) },
    other: { ...(defaults.other || {}), ...(metadata.other || {}) },
  };
}

/**
 * Resolve title with template support
 */
export function resolveTitle(metadata: Metadata, pageTitle?: string): string {
  const titleConfig = metadata.title;
  
  if (!titleConfig) return pageTitle || 'Untitled';
  
  if (typeof titleConfig === 'string') {
    return titleConfig;
  }
  
  const { template, default: defaultTitle, absolute } = titleConfig;
  
  if (absolute) return absolute;
  if (pageTitle && template) {
    return template.replace('%s', pageTitle);
  }
  
  return pageTitle || defaultTitle || 'Untitled';
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate HTML meta tags from metadata
 */
export function generateMetaTags(metadata: Metadata): string {
  const tags: string[] = [];
  
  // Basic meta tags
  if (metadata.description) {
    tags.push(`<meta name="description" content="${escapeHtml(metadata.description)}">`);
  }
  
  if (metadata.keywords) {
    const keywords = Array.isArray(metadata.keywords) 
      ? metadata.keywords.join(', ') 
      : metadata.keywords;
    tags.push(`<meta name="keywords" content="${escapeHtml(keywords)}">`);
  }
  
  // Viewport
  if (metadata.viewport) {
    if (typeof metadata.viewport === 'string') {
      tags.push(`<meta name="viewport" content="${escapeHtml(metadata.viewport)}">`);
    } else {
      const viewportParts: string[] = [];
      const vp = metadata.viewport;
      
      if (vp.width) viewportParts.push(`width=${vp.width}`);
      if (vp.height) viewportParts.push(`height=${vp.height}`);
      if (vp.initialScale) viewportParts.push(`initial-scale=${vp.initialScale}`);
      if (vp.minimumScale) viewportParts.push(`minimum-scale=${vp.minimumScale}`);
      if (vp.maximumScale) viewportParts.push(`maximum-scale=${vp.maximumScale}`);
      if (vp.userScalable !== undefined) viewportParts.push(`user-scalable=${vp.userScalable ? 'yes' : 'no'}`);
      if (vp.shrinkToFit !== undefined) viewportParts.push(`shrink-to-fit=${vp.shrinkToFit ? 'yes' : 'no'}`);
      if (vp.viewportFit) viewportParts.push(`viewport-fit=${vp.viewportFit}`);
      
      if (viewportParts.length > 0) {
        tags.push(`<meta name="viewport" content="${viewportParts.join(', ')}">`);
      }
    }
  }
  
  // Theme color
  if (metadata.themeColor) {
    if (typeof metadata.themeColor === 'string') {
      tags.push(`<meta name="theme-color" content="${escapeHtml(metadata.themeColor)}">`);
    } else {
      metadata.themeColor.forEach(theme => {
        const mediaAttr = theme.media ? ` media="${escapeHtml(theme.media)}"` : '';
        tags.push(`<meta name="theme-color" content="${escapeHtml(theme.color)}"${mediaAttr}>`);
      });
    }
  }
  
  // Color scheme
  if (metadata.colorScheme) {
    tags.push(`<meta name="color-scheme" content="${escapeHtml(metadata.colorScheme)}">`);
  }
  
  // Robots
  if (metadata.robots) {
    if (typeof metadata.robots === 'string') {
      tags.push(`<meta name="robots" content="${escapeHtml(metadata.robots)}">`);
    } else {
      const robotsParts: string[] = [];
      const robots = metadata.robots;
      
      if (robots.index !== undefined) robotsParts.push(robots.index ? 'index' : 'noindex');
      if (robots.follow !== undefined) robotsParts.push(robots.follow ? 'follow' : 'nofollow');
      if (robots.noarchive) robotsParts.push('noarchive');
      if (robots.nosnippet) robotsParts.push('nosnippet');
      if (robots.noimageindex) robotsParts.push('noimageindex');
      if (robots.nocache) robotsParts.push('nocache');
      if (robots.notranslate) robotsParts.push('notranslate');
      if (robots.indexifembedded) robotsParts.push('indexifembedded');
      if (robots.nositelinkssearchbox) robotsParts.push('nositelinkssearchbox');
      if (robots.unavailable_after) robotsParts.push(`unavailable_after:${robots.unavailable_after}`);
      if (robots['max-video-preview'] !== undefined) {
        robotsParts.push(`max-video-preview:${robots['max-video-preview']}`);
      }
      if (robots['max-image-preview']) robotsParts.push(`max-image-preview:${robots['max-image-preview']}`);
      if (robots['max-snippet'] !== undefined) robotsParts.push(`max-snippet:${robots['max-snippet']}`);
      
      if (robotsParts.length > 0) {
        tags.push(`<meta name="robots" content="${robotsParts.join(', ')}">`);
      }
    }
  }
  
  // Open Graph
  if (metadata.openGraph) {
    const og = metadata.openGraph;
    
    if (og.title) tags.push(`<meta property="og:title" content="${escapeHtml(og.title)}">`);
    if (og.description) tags.push(`<meta property="og:description" content="${escapeHtml(og.description)}">`);
    if (og.url) tags.push(`<meta property="og:url" content="${escapeHtml(og.url)}">`);
    if (og.siteName) tags.push(`<meta property="og:site_name" content="${escapeHtml(og.siteName)}">`);
    if (og.locale) tags.push(`<meta property="og:locale" content="${escapeHtml(og.locale)}">`);
    if (og.type) tags.push(`<meta property="og:type" content="${escapeHtml(og.type)}">`);
    
    // Images
    if (og.images) {
      const images = Array.isArray(og.images) ? og.images : [og.images];
      images.forEach(image => {
        tags.push(`<meta property="og:image" content="${escapeHtml(image.url)}">`);
        if (image.width) tags.push(`<meta property="og:image:width" content="${image.width}">`);
        if (image.height) tags.push(`<meta property="og:image:height" content="${image.height}">`);
        if (image.alt) tags.push(`<meta property="og:image:alt" content="${escapeHtml(image.alt)}">`);
        if (image.type) tags.push(`<meta property="og:image:type" content="${escapeHtml(image.type)}">`);
      });
    }
  }
  
  // Twitter Card
  if (metadata.twitter) {
    const twitter = metadata.twitter;
    
    tags.push(`<meta name="twitter:card" content="${escapeHtml(twitter.card)}">`);
    if (twitter.site) tags.push(`<meta name="twitter:site" content="${escapeHtml(twitter.site)}">`);
    if (twitter.creator) tags.push(`<meta name="twitter:creator" content="${escapeHtml(twitter.creator)}">`);
    if (twitter.title) tags.push(`<meta name="twitter:title" content="${escapeHtml(twitter.title)}">`);
    if (twitter.description) tags.push(`<meta name="twitter:description" content="${escapeHtml(twitter.description)}">`);
    
    if (twitter.image) {
      if (typeof twitter.image === 'string') {
        tags.push(`<meta name="twitter:image" content="${escapeHtml(twitter.image)}">`);
      } else {
        tags.push(`<meta name="twitter:image" content="${escapeHtml(twitter.image.url)}">`);
        if (twitter.image.alt) tags.push(`<meta name="twitter:image:alt" content="${escapeHtml(twitter.image.alt)}">`);
      }
    }
  }
  
  // Apple Web App
  if (metadata.appleWebApp) {
    const apple = metadata.appleWebApp;
    
    if (apple.capable) tags.push(`<meta name="apple-mobile-web-app-capable" content="yes">`);
    if (apple.title) tags.push(`<meta name="apple-mobile-web-app-title" content="${escapeHtml(apple.title)}">`);
    if (apple.statusBarStyle) {
      tags.push(`<meta name="apple-mobile-web-app-status-bar-style" content="${escapeHtml(apple.statusBarStyle)}">`);
    }
  }
  
  // Format detection
  if (metadata.formatDetection) {
    const fd = metadata.formatDetection;
    const formatParts: string[] = [];
    
    if (fd.telephone !== undefined) formatParts.push(`telephone=${fd.telephone ? 'yes' : 'no'}`);
    if (fd.email !== undefined) formatParts.push(`email=${fd.email ? 'yes' : 'no'}`);
    if (fd.address !== undefined) formatParts.push(`address=${fd.address ? 'yes' : 'no'}`);
    
    if (formatParts.length > 0) {
      tags.push(`<meta name="format-detection" content="${formatParts.join(', ')}">`);
    }
  }
  
  // Verification
  if (metadata.verification) {
    const verification = metadata.verification;
    
    if (verification.google) {
      tags.push(`<meta name="google-site-verification" content="${escapeHtml(verification.google)}">`);
    }
    if (verification.yandex) {
      tags.push(`<meta name="yandex-verification" content="${escapeHtml(verification.yandex)}">`);
    }
    if (verification.yahoo) {
      tags.push(`<meta name="y_key" content="${escapeHtml(verification.yahoo)}">`);
    }
    if (verification.other) {
      Object.entries(verification.other).forEach(([name, content]) => {
        tags.push(`<meta name="${escapeHtml(name)}" content="${escapeHtml(content)}">`);
      });
    }
  }
  
  // Authors
  if (metadata.authors) {
    metadata.authors.forEach(author => {
      if (author.name) {
        tags.push(`<meta name="author" content="${escapeHtml(author.name)}">`);
      }
    });
  }
  
  // Creator and Publisher
  if (metadata.creator) {
    tags.push(`<meta name="creator" content="${escapeHtml(metadata.creator)}">`);
  }
  if (metadata.publisher) {
    tags.push(`<meta name="publisher" content="${escapeHtml(metadata.publisher)}">`);
  }
  
  // Custom meta tags
  if (metadata.other) {
    Object.entries(metadata.other).forEach(([name, content]) => {
      tags.push(`<meta name="${escapeHtml(name)}" content="${escapeHtml(String(content))}">`);
    });
  }
  
  return tags.length > 0 ? '\n  ' + tags.join('\n  ') : '';
}

/**
 * Generate HTML link tags from metadata
 */
export function generateLinkTags(metadata: Metadata): string {
  const tags: string[] = [];
  
  // Manifest
  if (metadata.manifest) {
    tags.push(`<link rel="manifest" href="${escapeHtml(metadata.manifest)}">`);
  }
  
  // Icons
  if (metadata.icons) {
    const icons = metadata.icons;
    
    // Standard icons
    if (icons.icon) {
      const iconList = Array.isArray(icons.icon) ? icons.icon : [icons.icon];
      iconList.forEach(icon => {
        if (typeof icon === 'string') {
          tags.push(`<link rel="icon" href="${escapeHtml(icon)}">`);
        } else {
          const typeAttr = icon.type ? ` type="${escapeHtml(icon.type)}"` : '';
          const sizesAttr = icon.sizes ? ` sizes="${escapeHtml(icon.sizes)}"` : '';
          tags.push(`<link rel="icon" href="${escapeHtml(icon.url)}"${typeAttr}${sizesAttr}>`);
        }
      });
    }
    
    // Shortcut icons
    if (icons.shortcut) {
      const shortcutList = Array.isArray(icons.shortcut) ? icons.shortcut : [icons.shortcut];
      shortcutList.forEach(icon => {
        if (typeof icon === 'string') {
          tags.push(`<link rel="shortcut icon" href="${escapeHtml(icon)}">`);
        } else {
          const typeAttr = icon.type ? ` type="${escapeHtml(icon.type)}"` : '';
          const sizesAttr = icon.sizes ? ` sizes="${escapeHtml(icon.sizes)}"` : '';
          tags.push(`<link rel="shortcut icon" href="${escapeHtml(icon.url)}"${typeAttr}${sizesAttr}>`);
        }
      });
    }
    
    // Apple touch icons
    if (icons.apple) {
      const appleList = Array.isArray(icons.apple) ? icons.apple : [icons.apple];
      appleList.forEach(icon => {
        if (typeof icon === 'string') {
          tags.push(`<link rel="apple-touch-icon" href="${escapeHtml(icon)}">`);
        } else {
          const sizesAttr = icon.sizes ? ` sizes="${escapeHtml(icon.sizes)}"` : '';
          tags.push(`<link rel="apple-touch-icon" href="${escapeHtml(icon.url)}"${sizesAttr}>`);
        }
      });
    }
    
    // Other icons
    if (icons.other) {
      icons.other.forEach(icon => {
        const typeAttr = icon.type ? ` type="${escapeHtml(icon.type)}"` : '';
        const sizesAttr = icon.sizes ? ` sizes="${escapeHtml(icon.sizes)}"` : '';
        tags.push(`<link rel="${escapeHtml(icon.rel)}" href="${escapeHtml(icon.url)}"${typeAttr}${sizesAttr}>`);
      });
    }
  }
  
  // Canonical URL
  if (metadata.alternates?.canonical) {
    const canonical = typeof metadata.alternates.canonical === 'string' 
      ? metadata.alternates.canonical 
      : metadata.alternates.canonical.toString();
    tags.push(`<link rel="canonical" href="${escapeHtml(canonical)}">`);
  }
  
  // Language alternates
  if (metadata.alternates?.languages) {
    if (Array.isArray(metadata.alternates.languages)) {
      metadata.alternates.languages.forEach(lang => {
        tags.push(`<link rel="alternate" hreflang="${escapeHtml(lang.hrefLang)}" href="${escapeHtml(lang.href)}">`);
      });
    } else {
      Object.entries(metadata.alternates.languages).forEach(([hrefLang, href]) => {
        const hrefStr = typeof href === 'string' ? href : href.toString();
        tags.push(`<link rel="alternate" hreflang="${escapeHtml(hrefLang)}" href="${escapeHtml(hrefStr)}">`);
      });
    }
  }
  
  return tags.length > 0 ? '\n  ' + tags.join('\n  ') : '';
}

/**
 * Generate analytics scripts from metadata
 */
export function generateAnalyticsScripts(metadata: Metadata): string {
  if (!metadata.analytics) return '';
  
  const scripts: string[] = [];
  const analytics = metadata.analytics;
  
  // Google Analytics
  if (analytics.googleAnalytics) {
    scripts.push(`
  <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(analytics.googleAnalytics)}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${escapeHtml(analytics.googleAnalytics)}');
  </script>`);
  }
  
  // Google Tag Manager
  if (analytics.googleTagManager) {
    scripts.push(`
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${escapeHtml(analytics.googleTagManager)}');</script>`);
  }
  
  // Plausible
  if (analytics.plausible) {
    const domain = analytics.plausible.domain;
    const trackLocalhost = analytics.plausible.trackLocalhost ? ' data-include-localhost="true"' : '';
    scripts.push(`
  <script defer data-domain="${escapeHtml(domain)}"${trackLocalhost} src="https://plausible.io/js/script.js"></script>`);
  }
  
  // Fathom
  if (analytics.fathom) {
    const siteId = analytics.fathom.siteId;
    const honorDNT = analytics.fathom.honorDNT ? ' honor-dnt="true"' : '';
    scripts.push(`
  <script src="https://cdn.usefathom.com/script.js" data-site="${escapeHtml(siteId)}"${honorDNT} defer></script>`);
  }
  
  // Custom analytics
  if (analytics.custom) {
    analytics.custom.forEach(script => {
      const asyncAttr = script.async ? ' async' : '';
      const deferAttr = script.defer ? ' defer' : '';
      scripts.push(`
  <script src="${escapeHtml(script.src)}"${asyncAttr}${deferAttr}></script>`);
    });
  }
  
  return scripts.join('');
}

/**
 * Generate complete head content from metadata
 */
export function generateHeadContent(metadata: Metadata, pageTitle?: string): string {
  const resolvedTitle = resolveTitle(metadata, pageTitle);
  const metaTags = generateMetaTags(metadata);
  const linkTags = generateLinkTags(metadata);
  const analyticsScripts = generateAnalyticsScripts(metadata);
  
  return `
  <meta charset="utf-8">
  <title>${escapeHtml(resolvedTitle)}</title>
  ${metaTags}${linkTags}${analyticsScripts}`.trim();
}

/**
 * Automatically extract metadata from a file's exports
 * This enables Next.js 15-style static metadata exports
 */
export async function extractMetadataFromFile(filePath: string): Promise<Metadata | null> {
  try {
    // Dynamic import to get the metadata export
    const module = await import(filePath);
    
    // Check for metadata export
    if (module.metadata && typeof module.metadata === 'object') {
      return module.metadata as Metadata;
    }
    
    // Check for generateMetadata function
    if (typeof module.generateMetadata === 'function') {
      const result = await module.generateMetadata();
      return result as Metadata;
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to extract metadata from ${filePath}:`, error);
    return null;
  }
}

/**
 * Process component metadata and apply to document
 * This is called automatically by the framework
 */
export async function processComponentMetadata(componentPath: string): Promise<Metadata | null> {
  const metadata = await extractMetadataFromFile(componentPath);
  
  if (metadata && typeof document !== 'undefined') {
    const mergedMetadata = mergeMetadata(metadata, DEFAULT_METADATA);
    updateDocumentHeadFromHTML(generateHeadContent(mergedMetadata));
    return mergedMetadata;
  }
  
  return metadata;
}

/**
 * Auto-apply metadata from component files
 * This is called during development and build time
 */
export function autoApplyMetadata(componentPath: string): void {
  if (typeof window !== 'undefined') {
    // Client-side: apply immediately
    processComponentMetadata(componentPath).catch(console.error);
  } else {
    // Server-side: queue for processing
    console.log(`Queuing metadata processing for: ${componentPath}`);
  }
}

/**
 * Update document head from HTML content
 * Internal utility for applying metadata
 */
function updateDocumentHeadFromHTML(htmlContent: string): void {
  if (typeof document === 'undefined') return;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<html><head>${htmlContent}</head></html>`, 'text/html');
  const newHead = doc.head;
  
  // Update title
  const newTitle = newHead.querySelector('title');
  if (newTitle) {
    document.title = newTitle.textContent || '';
  }
  
  // Update meta tags
  const newMetas = newHead.querySelectorAll('meta');
  newMetas.forEach(newMeta => {
    const name = newMeta.getAttribute('name');
    const property = newMeta.getAttribute('property');
    const httpEquiv = newMeta.getAttribute('http-equiv');
    
    let selector = '';
    if (name) selector = `meta[name="${name}"]`;
    else if (property) selector = `meta[property="${property}"]`;
    else if (httpEquiv) selector = `meta[http-equiv="${httpEquiv}"]`;
    
    if (selector) {
      const existing = document.head.querySelector(selector);
      if (existing) {
        existing.replaceWith(newMeta.cloneNode(true));
      } else {
        document.head.appendChild(newMeta.cloneNode(true));
      }
    }
  });
  
  // Update link tags
  const newLinks = newHead.querySelectorAll('link');
  newLinks.forEach(newLink => {
    const rel = newLink.getAttribute('rel');
    if (rel) {
      const existing = document.head.querySelector(`link[rel="${rel}"]`);
      if (existing) {
        existing.replaceWith(newLink.cloneNode(true));
      } else {
        document.head.appendChild(newLink.cloneNode(true));
      }
    }
  });
}