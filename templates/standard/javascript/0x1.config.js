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
      version: "4.1.7",
      config: {
        // Use the external tailwind.config.js for configuration
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
      "**/src/styles.css",  // Ignore source CSS files
      "**/tailwind.config.js", // Keep tailwind config but process separately
      "**/postcss.config.js"   // Keep postcss config but process separately
    ]
  },
  deployment: {
    provider: "vercel",
    edge: true
  }
};
