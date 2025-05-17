// This file contains the theme mode implementation code to be integrated into new.ts

// 1. Update createConfigFiles to use themeMode
const createConfigFilesWithThemeMode = `
async function createConfigFiles(
  projectPath: string,
  options: {
    useTailwind: boolean;
    useTypescript: boolean;
    useStateManagement?: boolean;
    complexity: 'minimal' | 'standard' | 'full';
    themeMode?: 'light' | 'dark' | 'system';
  }
): Promise<void> {
  const { useTailwind, useTypescript, complexity, themeMode = 'dark' } = options;
  
  // Create 0x1.config.ts or 0x1.config.js
  const ext = useTypescript ? 'ts' : 'js';
  await Bun.write(
    join(projectPath, \`0x1.config.\${ext}\`),
    useTypescript
      ? \`import { _0x1Config } from '0x1';

const config: _0x1Config = {
  app: {
    name: '\${projectPath.split('/').pop()}',
    title: '0x1 App',
    description: 'Built with the 0x1 framework'
  },
  server: {
    port: 3000,
    host: 'localhost',
    basePath: '/'
  },
  routes: {
    '/': './pages/home'
  },
  styling: {
    tailwind: \${useTailwind},
    darkMode: '\${themeMode}'
  },
  build: {
    outDir: 'dist',
    minify: true,
    precomputeTemplates: true,
    prefetchLinks: true
  },
  deployment: {
    provider: 'vercel',
    edge: true
  }
};

export default config;\`
      : \`/** @type {import('0x1')._0x1Config} */
export default {
  app: {
    name: '\${projectPath.split('/').pop()}',
    title: '0x1 App',
    description: 'Built with the 0x1 framework'
  },
  server: {
    port: 3000,
    host: 'localhost',
    basePath: '/'
  },
  routes: {
    '/': './pages/home'
  },
  styling: {
    tailwind: \${useTailwind},
    darkMode: '\${themeMode}'
  },
  build: {
    outDir: 'dist',
    minify: true,
    precomputeTemplates: true,
    prefetchLinks: true
  },
  deployment: {
    provider: 'vercel',
    edge: true
  }
};\`
  );
  
  // Rest of the function remains unchanged...
}`;

// 2. Call to createConfigFiles with themeMode in createNewProject
const createConfigFilesCall = `
  // Create config files (tailwind, tsconfig, etc).
  await createConfigFiles(projectPath, {
    useTailwind,
    useTypescript,
    useStateManagement,
    complexity: projectOptions.complexity,
    themeMode: projectOptions.themeMode,
  });
`;

// 3. Theme Mode prompt in promptProjectOptions
const themeModePrompt = `
  // Ask about theme mode preference
  const themeModeDefault = defaultOptions.themeMode === 'light' ? 0 : 
                          defaultOptions.themeMode === 'system' ? 2 : 1; // Default to dark if not specified

  const themeModeResponse = await promptWithCancel({
    type: 'select',
    name: 'themeMode',
    message: '🌓 Choose theme mode:',
    choices: [
      {
        title: 'Light', 
        value: 'light',
        description: 'Light theme mode'
      },
      {
        title: 'Dark',
        value: 'dark',
        description: 'Dark theme mode (recommended)'
      },
      {
        title: 'System',
        value: 'system',
        description: 'Follow system preference'
      }
    ],
    initial: themeModeDefault
  });
  
  logger.spacer();
`;

// 4. Add themeMode to promptProjectOptions return value
const returnWithThemeMode = `
  return {
    template: defaultOptions.template || templatePath,
    typescript: languageResponse.language === 'typescript',
    tailwind: useTailwind,
    stateManagement: useStateManagement,
    tdlLicense: licenseResponse.tdlLicense,
    complexity: complexityResponse.complexity,
    pwa: pwaResponse.pwa,
    themeColor: themeColor,
    secondaryColor: secondaryColor,
    textColor: textColor,
    theme: themeResponse.theme,
    themeMode: themeModeResponse.themeMode,
    statusBarStyle: statusBarStyle
  };
`;
