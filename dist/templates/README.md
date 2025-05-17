# 0x1 Framework Templates

This directory contains the official templates for the 0x1 framework. Each template is organized by complexity level and language preference.

## Template Structure

```
templates/
├── minimal/
│   ├── javascript/
│   └── typescript/
├── standard/
│   ├── javascript/
│   └── typescript/
└── full/
    ├── javascript/
    └── typescript/
```

## Testing Templates

Use these commands to quickly test each template:

### Quick Template Test

```bash
# Create a test project using a specific template with theme and PWA
bun 0x1 new test-project --template minimal/typescript --theme "royal-purple" --pwa
cd test-project

# Start development server
bun 0x1 dev

# In a new terminal, build for production
cd test-project
bun 0x1 build

# Preview production build
bun 0x1 preview
```

### Testing PWA Status Bar Styles

To test different iOS status bar styles, you can create test projects with different configurations:

```bash
# Test with default status bar style
bun 0x1 new test-default --pwa

# Test with black status bar style
bun 0x1 new test-black --pwa
# (Select 'Black' when prompted for status bar style)

# Test with black-translucent status bar style (fullscreen mode)
bun 0x1 new test-translucent --pwa
# (Select 'Black Translucent' when prompted for status bar style)
```

Test these PWA configurations on iOS devices or use Chrome DevTools' device emulation to verify the appearance of the status bar.

### Testing with Different Themes

```bash
# Test each available theme with a specific template
mkdir theme-tests && cd theme-tests

# Available themes: midnight-blue, forest-green, royal-purple, slate-gray, classic
themes=("midnight-blue" "forest-green" "royal-purple" "slate-gray" "classic")

for theme in "${themes[@]}"
do
  echo "Testing theme: $theme"
  bun 0x1 new theme-$theme --template standard/typescript --theme $theme --pwa
done
```

### Comprehensive Testing

To systematically test all templates:

```bash
# Create a testing directory
mkdir template-tests && cd template-tests

# Test each template variant
templates=("minimal/javascript" "minimal/typescript" "standard/javascript" "standard/typescript" "full/javascript" "full/typescript")

for template in "${templates[@]}"
do
  echo "Testing template: $template"
  
  # Parse template name for directory
  template_dir=$(echo $template | tr "/" "-")
  
  # Create project with this template
  bun 0x1 new $template_dir --template $template --themeColor "#059669" --pwa
  
  # Build the project
  cd $template_dir
  bun 0x1 build
  
  # Test if build succeeded
  if [ -d "dist" ]; then
    echo "✅ Build successful for $template"
  else
    echo "❌ Build failed for $template"
  fi
  
  cd ..
  echo "-----------------------------------"
done
```

## Setting Up Automated Testing

For automated testing of the templates, we recommend using [Playwright](https://playwright.dev/):

1. **Install Playwright**:

```bash
bun add -D @playwright/test
```

2. **Create a basic test file** (template-tests.spec.js):

```javascript
// template-tests.spec.js
import { test, expect } from '@playwright/test';

// Test each template variant
const templates = [
  'minimal/javascript',
  'minimal/typescript',
  'standard/javascript',
  'standard/typescript',
  'full/javascript',
  'full/typescript'
];

for (const template of templates) {
  test(`Template ${template} loads correctly`, async ({ page }) => {
    // Create a unique project name
    const projectName = `test-${template.replace('/', '-')}`;
    const projectDir = `/tmp/${projectName}`;
    
    // Create project with CLI (pre-setup)
    // Note: You would run this as a setup step before the tests
    
    // Visit the dev server
    await page.goto(`http://localhost:3000`);
    
    // Check for basic elements that should exist in all templates
    await expect(page.locator('#app')).toBeVisible();
    
    // Check for PWA manifest
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toBeAttached();
    
    // Test service worker registration
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swRegistered).toBeTruthy();
  });
}
```

3. **Create a Playwright config** (playwright.config.js):

```javascript
// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
      },
    },
  ],
});
```

4. **Run the tests**:

```bash
bun playwright test
```

This setup provides both manual testing instructions for quick verification and an automated testing setup using Playwright for more thorough validation.
