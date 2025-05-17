# 0x1 Standard TypeScript App

A complete starting point for building modern web applications with the 0x1 framework and TypeScript.

## Features

- **TypeScript**: Full TypeScript support for excellent developer experience
- **Component System**: Modular component architecture
- **Routing**: Advanced client-side routing with page transitions
- **Tailwind CSS**: Modern utility-first CSS framework
- **Dark Mode**: Built-in dark mode support
- **Performance**: Optimized for fast loading and interactions

## Project Structure

```
my-app/
├── components/       # Reusable UI components
│   ├── Card.ts
│   ├── Footer.ts
│   └── Header.ts
├── lib/             # Library code and utilities
│   └── router.ts
├── pages/           # Page components
│   ├── about.ts
│   ├── home.ts
│   └── not-found.ts
├── public/          # Static assets
│   └── favicon.svg
├── styles/          # CSS styling
│   └── main.css
├── app.ts           # Main application entry point
├── index.html       # HTML template
├── 0x1.config.ts  # 0x1 configuration
└── package.json     # Dependencies and scripts
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

This template provides a solid foundation for building web applications. When you're ready to add more advanced features, consider:

1. Adding state management for complex applications
2. Implementing PWA features for offline support
3. Setting up API integrations
4. Adding authentication

Or upgrade to the **Full** template which includes these features built-in.
