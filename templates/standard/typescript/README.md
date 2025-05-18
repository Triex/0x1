# 0x1 Minimal TypeScript App

A lightweight starting point built with the 0x1 framework. This minimal template provides just what you need to get started with TypeScript.

## Features

- **Truly Minimal**: Zero dependencies beyond TypeScript
- **Simple Routing**: Basic hash-based routing implementation
- **TypeScript**: Type safety without complexity
- **Fast Dev Experience**: Powered by Bun's incredible speed

## Project Structure

```
my-app/
├── 0x1.config.ts     # 0x1 configuration
├── package.json        # Project dependencies
├── public/             # Static assets
└── src/
    ├── app.ts          # Main application code
    ├── index.html      # HTML entry point
    └── styles.css      # Simple CSS styling
```

## Getting Started

```bash
# Start development server
bun dev

# Create production build
bun run build

# Preview production build
bun run preview
```

## Next Steps

This template is intentionally minimal. When you're ready to add more features, consider:

1. Creating a component system
2. Adding Tailwind CSS for styling
3. Implementing client-side state management
4. Setting up a more robust router

Or simply upgrade to the **Standard** or **Full** template for a more complete setup.
