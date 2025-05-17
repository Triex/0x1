/**
 * 0x1 TypeScript Configuration
 * Configure your 0x1 application with TypeScript support
 */

// TypeScript types for 0x1 configuration
type BundlConfig = {
  app: {
    name: string;
    title: string;
    description: string;
  };
  server: {
    port: number;
    host: string;
    basePath: string;
  };
  routes: Record<string, string>;
  styling: {
    tailwind: boolean | {
      version: string;
      config: {
        darkMode?: 'media' | 'class';
        future?: Record<string, boolean>;
        theme?: {
          extend?: Record<string, any>;
          [key: string]: any;
        };
        plugins?: any[];
        [key: string]: any;
      };
    };
  };
  build: {
    outDir: string;
    minify: boolean;
    precomputeTemplates?: boolean;
    prefetchLinks?: boolean;
    ignore?: string[];
  };
  deployment?: {
    provider?: string;
    edge?: boolean;
  };
};

const config: BundlConfig = {
  app: {
    name: "bundl-typescript-app",
    title: "0x1 TypeScript App",
    description: "Built with 0x1 - the ultra-minimal TypeScript framework"
  },
  server: {
    port: 3000,
    host: "localhost",
    basePath: "/"
  },
  // Modern project structure with files in root
  routes: {
    "/": "./pages/home",
    "/about": "./pages/about"
  },
  styling: {
    tailwind: {
      version: "4.0.0",
      config: {
        // Tailwind CSS v4 now uses CSS variables for configuration
        // and doesn't need future flags in the same way
        darkMode: "class", // Still using class-based dark mode
        theme: {
          extend: {
            // Modern animation utilities
            animation: {
              'fade-in': 'fadeIn 0.3s ease-in-out',
              'slide-in-right': 'slideInRight 0.4s ease-out',
              'slide-up': 'slideUp 0.4s ease-out',
              'bounce-subtle': 'bounceSoft 1s infinite'
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
              },
              bounceSoft: {
                '0%, 100%': { transform: 'translateY(-2px)' },
                '50%': { transform: 'translateY(0)' },
              },
            },
            // Modern blur effects
            backdropBlur: {
              xs: '1px',
              '3xl': '64px',
            },
          },
        },
        plugins: [
          // Add native form control styling
          require('@tailwindcss/forms'),
          // Add modern typography styles
          require('@tailwindcss/typography'),
        ]
      }
    }
  },
  build: {
    outDir: "dist",
    minify: true,
    precomputeTemplates: true,
    prefetchLinks: true,
    ignore: [
      "**/.git/**",
      "**/node_modules/**",
      "**/.vscode/**",
      "**/dist/**",
      "**/.DS_Store", 
      "**/styles/main.css",  // Ignore source CSS files
      "**/tailwind.config.js", // Keep tailwind config but process separately
      "**/postcss.config.js"   // Keep postcss config but process separately
    ]
  },
  deployment: {
    provider: "vercel",
    edge: true
  }
};

export default config;
