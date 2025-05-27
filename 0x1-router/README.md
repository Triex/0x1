# 0x1-router

A lightweight, type-safe client-side router for JavaScript and TypeScript applications.

## Features

- 🌐 Simple client-side routing
- 🔒 Type-safe with full TypeScript support  
- 📦 JSX-compatible Link component
- 🪝 React-style hooks API
- 🪶 Tiny footprint with zero dependencies
- 🎯 History API integration

## Installation

```bash
# Using bun
bun add 0x1-router

# Using npm
npm install 0x1-router

# Using yarn
yarn add 0x1-router
```

## Basic Usage

```typescript
import { Link, Route, useRouter } from '0x1-router';

// Navigation with Link component
function Nav() {
  return (
    <nav>
      <Link href="/" className="nav-link">Home</Link>
      <Link href="/about" className="nav-link">About</Link>
      <Link href="/contact" className="nav-link">Contact</Link>
    </nav>
  );
}

// Programmatic navigation
function HomePage() {
  const { navigate } = useRouter();
  
  const goToAbout = () => {
    navigate('/about');
  };
  
  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={goToAbout}>Go to About</button>
    </div>
  );
}

// Route definition and rendering
const router = useRouter();

router.addRoute({
  path: '/',
  component: HomePage,
  exact: true
});

router.addRoute({
  path: '/about',
  component: AboutPage
});

// Render current route
function App() {
  return (
    <div>
      <Nav />
      <Route />
    </div>
  );
}
```

## API Reference

### Components

#### `Link`
JSX component for navigation links.

**Props:**
- `href: string` - The target path
- `className?: string` - CSS class name
- `children: any` - Link content

#### `Route`
Renders the component for the current route.

### Hooks

#### `useRouter()`
Returns router utilities:
- `navigate(path: string)` - Navigate to a path
- `currentPath: string` - Current route path
- `addRoute(route: Route)` - Add a route definition
- `getCurrentRoute()` - Get current route object

### Types

#### `Route`
```typescript
interface Route {
  path: string;
  component: () => JSX.Element;
  exact?: boolean;
}
```

## License

MIT 