/**
 * 0x1 Minimal Configuration
 * Configure your minimal 0x1 application
 */

/** @type {import('0x1').0x1Config} */
export default {
  app: {
    name: "0x1-minimal-app",
    title: "0x1 Minimal App",
    description: "A lightweight 0x1 application"
  },
  server: {
    port: 3000,
    host: "localhost",
    basePath: "/"
  },
  styling: {
    tailwind: {
      version: "3.4.1",
      config: {
        // Use tailwind.config.js
      }
    }
  },
  build: {
    outDir: "dist",
    minify: true,
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
  }
};
