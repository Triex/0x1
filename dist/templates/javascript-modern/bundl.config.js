/**
 * 0x1 Configuration
 * Configure your 0x1 application with modern structure
 */

/** @type {import('bundl').BundlConfig} */
export default {
  app: {
    name: "bundl-javascript-app",
    title: "0x1 JavaScript App",
    description: "Built with 0x1 - the ultra-minimal framework with modern structure"
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
        darkMode: "class",
        theme: {
          extend: {
            // Modern animation utilities
            animation: {
              'fade-in': 'fadeIn 0.3s ease-in-out',
              'slide-in-right': 'slideInRight 0.4s ease-out'
            },
            keyframes: {
              fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' }
              },
              slideInRight: {
                '0%': { transform: 'translateX(20px)', opacity: '0' },
                '100%': { transform: 'translateX(0)', opacity: '1' }
              }
            }
          }
        },
        plugins: [
          // Use require with plugins when available
        ]
      }
    }
  },
  build: {
    outDir: "dist",
    minify: true,
    precomputeTemplates: true,
    prefetchLinks: true
  },
  deployment: {
    provider: "vercel",
    edge: true
  }
};
