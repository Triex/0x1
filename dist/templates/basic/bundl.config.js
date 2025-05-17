/**
 * 0x1 Configuration
 * Configure your 0x1 application
 */

/** @type {import('bundl').BundlConfig} */
export default {
  app: {
    name: "bundl-app",
    title: "0x1 App",
    description: "Built with 0x1 - the ultra-minimal framework"
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
    tailwind: false,
    darkMode: "media"
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
