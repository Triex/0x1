# 0x1 TypeScript App

This project was created with [0x1](https://github.com/Triex/0x1) - the ultra-minimal TypeScript framework with extreme performance.

## Getting Started

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
my-app/
├── 0x1.config.ts        # 0x1 TypeScript configuration
├── tsconfig.json          # TypeScript configuration
├── src/
│   ├── components/        # Reusable TypeScript components
│   ├── pages/             # Page components with routing
│   ├── styles/            # CSS styles
│   ├── app.ts             # Application entry
│   └── index.html         # HTML entry point
└── public/                # Static assets
```

## Features

- **Full TypeScript Support**: Built with and for TypeScript
- **React-like Hooks**: `useState`, `useEffect`, and other hooks for state management
- **Component-based Architecture**: Clean separation of concerns
- **Blazing Fast**: <10kB runtime with zero hydration cost
- **Efficient Routing**: Zero-dependency router for SPA navigation
- **Type-Safe**: Full type safety and IDE support

## Learn More

To learn more about 0x1, check out the following resources:

- [0x1 Documentation](https://github.com/Triex/0x1) - Learn about 0x1 features and API
- [0x1 Templates](https://github.com/Triex/0x1/templates) - Explore more 0x1 templates

## Commands

- `bun dev` - Start the development server
- `bun run build` - Build the app for production
- `bun run preview` - Preview the production build locally
- `bun run deploy` - Deploy the app to production

## Deployment

The easiest way to deploy your 0x1 app is to use the [Vercel Platform](https://vercel.com).
