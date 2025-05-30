/**
 * 0x1 Standard Configuration
 * Configure your standard 0x1 application with robust defaults
 */

// TypeScript types for 0x1 configuration
type _0x1Config = {
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
  styling?: {
    tailwind?: boolean | {
      version?: string;
      config?: Record<string, any>;
    };
  };
  build: {
    outDir: string;
    minify: boolean;
    ignore?: string[];
  };
};

const config: _0x1Config = {
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

export default config;
