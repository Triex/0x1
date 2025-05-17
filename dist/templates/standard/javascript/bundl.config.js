/**
 * 0x1 Standard Configuration
 * Configure your 0x1 application with robust defaults
 */

/** @type {import('0x1').0x1Config} */
export default {
  app: {
    name: "0x1-standard-app",
    title: "0x1 Standard App",
    description: "Built with 0x1 - with standard features"
  },
  server: {
    port: 3000,
    host: "localhost",
    basePath: "/"
  },
  routes: {
    "/": "./pages/home",
    "/about": "./pages/about"
  },
  styling: {
    tailwind: {
      version: "4.0.0",
      config: {
        // Tailwind CSS v4 now uses CSS variables for configuration
        darkMode: "class",
        theme: {
          extend: {
            // Modern animation utilities
            animation: {
              'fade-in': 'fadeIn 0.3s ease-in-out',
              'slide-in-right': 'slideInRight 0.4s ease-out',
              'slide-up': 'slideUp 0.4s ease-out'
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
          },
        },
        plugins: [
          // Add native form control styling
          require('@tailwindcss/forms'),
          // Add modern typography styles
          require('@tailwindcss/typography')
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
