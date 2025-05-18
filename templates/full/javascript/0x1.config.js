/**
 * 0x1 Full Configuration - JavaScript Version
 * Complete configuration with all available options for maximum flexibility
 */

/** @type {import('0x1').0x1Config} */
export default {
  app: {
    name: "0x1-full-app",
    title: "0x1 Full-Featured App",
    description: "A complete web application with all 0x1 features enabled"
  },
  server: {
    port: 3000,
    host: "localhost",
    basePath: "/",
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    compression: {
      enabled: true,
      level: 6
    },
    security: {
      helmet: true,
      xssProtection: true,
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "https://api.example.com"]
      }
    }
  },
  routes: {
    "/": "./pages/home",
    "/about": "./pages/about",
    "/features": "./pages/features",
    "/products/:id": "./pages/product"
  },
  styling: {
    tailwind: {
      version: "4.0.0",
      config: {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              primary: {
                50: '#eef2ff',
                100: '#e0e7ff',
                200: '#c7d2fe',
                300: '#a5b4fc',
                400: '#818cf8',
                500: '#6366f1',
                600: '#4f46e5',
                700: '#4338ca',
                800: '#3730a3',
                900: '#312e81',
                950: '#1e1b4b'
              }
            },
            animation: {
              'fade-in': 'fadeIn 0.3s ease-in-out',
              'slide-in-right': 'slideInRight 0.4s ease-out',
              'slide-up': 'slideUp 0.4s ease-out',
              'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            },
            keyframes: {
              fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
              },
              slideInRight: {
                '0%': { transform: 'translateX(20px)', opacity: '0' },
                '100%': { transform: 'translateX(0)', opacity: '1' },
              },
              slideUp: {
                '0%': { transform: 'translateY(10px)', opacity: '0' },
                '100%': { transform: 'translateY(0)', opacity: '1' },
              }
            }
          }
        },
        plugins: [
          require('@tailwindcss/forms'),
          require('@tailwindcss/typography'),
          require('@tailwindcss/aspect-ratio')
        ]
      }
    }
  },
  build: {
    outDir: "dist",
    minify: true,
    sourcemap: true,
    precomputeTemplates: true,
    prefetchLinks: true,
    bundleAnalyzer: {
      enabled: process.env.ANALYZE === 'true',
      openAnalyzer: true
    },
    splitChunks: true,
    treeshake: true,
    cssModules: {
      enabled: true,
      scopeBehaviour: 'local',
      generateScopedName: '[local]_[hash:base64:5]'
    }
  },
  // JavaScript-specific options
  optimizations: {
    polyfills: {
      useBuiltIns: "usage",
      targets: {
        browsers: [">0.25%", "not dead"]
      }
    }
  },
  pwa: {
    enabled: true,
    manifest: './public/manifest.json',
    workbox: {
      swSrc: './public/service-worker.js',
      swDest: 'dist/service-worker.js',
      globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,gif,webp,woff,woff2}']
    },
    icons: {
      source: './public/app-icon.png',
      output: './public/icons/'
    }
  },
  seo: {
    sitemap: {
      enabled: true,
      output: 'sitemap.xml'
    },
    robots: true,
    defaultMeta: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      language: 'en',
      ogType: 'website',
      twitterCard: 'summary_large_image'
    }
  },
  analytics: {
    provider: 'plausible',
    settings: {
      domain: 'example.com',
      trackLocalhost: false
    }
  },
  deployment: {
    provider: 'vercel',
    edge: true,
    autoScaling: true,
    regions: ['iad1', 'sfo1', 'sin1'],
    analytics: true
  },
  i18n: {
    enabled: true,
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de'],
    localeDetection: true
  },
  experimental: {
    ssr: true,
    islandComponents: true,
    optimizeImages: true,
    lazyComponents: true
  },
  runtime: {
    bun: {
      optimizeFsReads: true,
      jit: true
    }
  }
};
