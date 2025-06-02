/**
 * Global Metadata Configuration - Next.js 15 Style
 * Static metadata that applies to all pages
 */

// Import from the core metadata module directly
export interface Metadata {
  title?: string | { template?: string; default?: string; absolute?: string };
  description?: string;
  keywords?: string | string[];
  authors?: Array<{ name: string; url?: string }>;
  creator?: string;
  publisher?: string;
  viewport?: {
    width?: string | number;
    height?: string | number;
    initialScale?: number;
    minimumScale?: number;
    maximumScale?: number;
    userScalable?: boolean;
    shrinkToFit?: boolean;
    viewportFit?: 'auto' | 'contain' | 'cover';
  };
  themeColor?: string | Array<{ media?: string; color: string }>;
  colorScheme?: 'light' | 'dark' | 'light dark' | 'dark light' | 'only light' | 'only dark';
  openGraph?: {
    type?: 'website' | 'article' | 'book' | 'profile';
    locale?: string;
    url?: string;
    siteName?: string;
    title?: string;
    description?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
  };
  twitter?: {
    card: 'summary' | 'summary_large_image' | 'app' | 'player';
    title?: string;
    description?: string;
    image?: string;
    creator?: string;
  };
  manifest?: string;
  appleWebApp?: {
    capable?: boolean;
    statusBarStyle?: 'default' | 'black' | 'black-translucent';
    title?: string;
  };
  icons?: {
    icon?: Array<{ url: string; sizes?: string; type?: string }>;
    apple?: Array<{ url: string; sizes?: string; type?: string }>;
    other?: Array<{ rel: string; url: string; color?: string }>;
  };
  verification?: {
    google?: string;
    yandex?: string;
    yahoo?: string;
  };
  other?: Record<string, string>;
  robots?: {
    index?: boolean;
    follow?: boolean;
    googleBot?: {
      index?: boolean;
      follow?: boolean;
      'max-video-preview'?: number;
      'max-image-preview'?: 'none' | 'standard' | 'large';
      'max-snippet'?: number;
    };
  };
  formatDetection?: {
    telephone?: boolean;
    date?: boolean;
    address?: boolean;
    email?: boolean;
    url?: boolean;
  };
}

// Static metadata export (Next.js 15 compatible)
export const metadata: Metadata = {
  title: {
    template: '%s | 0x1 App',
    default: '0x1 App - Ultra-Fast Web Framework'
  },
  description: 'Built with 0x1 - The ultra-minimal TypeScript framework with extreme performance',
  keywords: ['0x1', 'typescript', 'framework', 'fast', 'minimal', 'web'],
  authors: [{ name: '0x1 Team' }],
  creator: '0x1 Framework',
  publisher: '0x1 Framework',
  
  // Viewport and theme
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
  
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  
  colorScheme: 'light dark',
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    siteName: '0x1 App',
    title: '0x1 App - Ultra-Fast Web Framework',
    description: 'Built with 0x1 - The ultra-minimal TypeScript framework with extreme performance',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '0x1 App'
      }
    ]
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: '0x1 App - Ultra-Fast Web Framework',
    description: 'Built with 0x1 - The ultra-minimal TypeScript framework with extreme performance',
    image: '/og-image.png',
    creator: '@0x1framework'
  },
  
  // PWA
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '0x1 App'
  },
  
  // Icons
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#000000' }
    ]
  },
  
  // Analytics and verification (replace with your own)
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code'
  },
  
  // Additional meta tags
  other: {
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml'
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  
  // Format detection
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false
  }
};

// Page-specific metadata helpers
export function createPageMetadata(params: {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}): Metadata {
  const { title, description, image, url, type = 'website' } = params;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type,
      ...(image && {
        images: [{ url: image, width: 1200, height: 630, alt: title }]
      })
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image && { image })
    }
  };
} 