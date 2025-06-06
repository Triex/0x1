# Scroll Behavior & SPA Navigation

**Complete guide to 0x1's intelligent scroll management system**

## Overview

0x1 Framework provides sophisticated scroll management that automatically handles scroll position during navigation, following modern Single Page Application (SPA) best practices while giving developers full control when needed.

## Default Behavior

### ✅ Smart Defaults

0x1's router automatically handles scroll behavior based on the type of navigation:

| Navigation Type | Behavior | Why |
|----------------|----------|-----|
| **New route navigation** | Scroll to top | Users expect to start at the top of new pages |
| **Browser back/forward** | Restore scroll position | Users expect to return to where they were |
| **Hash fragment links** | Scroll to target element | Anchor links should jump to the right section |
| **External links** | Browser default | Don't interfere with external navigation |

### Example Navigation Flows

```typescript
// User navigates: Home → About → Contact
router.navigate('/');      // Starts at top ✅
router.navigate('/about'); // Scrolls to top ✅  
router.navigate('/contact'); // Scrolls to top ✅

// User clicks browser back button
// /contact → /about (restores previous scroll position) ✅
// /about → / (restores previous scroll position) ✅

// User clicks anchor link
router.navigate('/docs/api#useEffect'); // Scrolls to #useEffect element ✅
```

## Configuration

### Global Router Configuration

Set default scroll behavior for your entire application:

```tsx
import { Router } from '0x1/router';

const router = new Router({
  // Recommended: Smart behavior based on navigation type
  scrollBehavior: 'auto',
  
  // Alternative options:
  // scrollBehavior: 'top',      // Always scroll to top
  // scrollBehavior: 'preserve', // Never change scroll position  
  // scrollBehavior: 'smooth',   // Smooth scroll to top
});
```

### Scroll Behavior Options

| Option | Description | Use Case |
|--------|-------------|----------|
| `'auto'` | Smart default behavior (recommended) | Most applications |
| `'top'` | Always scroll to top | Document-heavy sites |
| `'preserve'` | Never change scroll position | Dashboard-style apps |
| `'smooth'` | Smooth animated scroll to top | Enhanced UX |

## Per-Link Overrides

Override the default behavior for specific links:

```tsx
import Link from '0x1/link';

function Navigation() {
  return (
    <nav>
      {/* Uses global router setting */}
      <Link href="/home">Home</Link>
      
      {/* Force scroll to top */}
      <Link href="/articles" scrollBehavior="top">
        Articles
      </Link>
      
      {/* Preserve scroll position (useful for modals/overlays) */}
      <Link href="/search" scrollBehavior="preserve">
        Search
      </Link>
      
      {/* Smooth scroll animation */}
      <Link href="/contact" scrollBehavior="smooth">
        Contact
      </Link>
      
      {/* Hash fragments work automatically */}
      <Link href="/docs#installation">
        Installation Guide
      </Link>
    </nav>
  );
}
```

## Programmatic Navigation

Control scroll behavior when navigating programmatically:

```tsx
import { useRouter } from '0x1/router';

function MyComponent() {
  const router = useRouter();
  
  const handleNavigation = () => {
    // Use global router setting
    router.navigate('/dashboard');
    
    // Override scroll behavior
    router.navigate('/profile', true, 'smooth');
    router.navigate('/settings', true, 'preserve');
    router.navigate('/help', true, 'top');
  };
  
  return (
    <div>
      <button onClick={() => router.navigate('/products')}>
        View Products (default scroll)
      </button>
      
      <button onClick={() => router.navigate('/cart', true, 'preserve')}>
        View Cart (keep scroll position)
      </button>
      
      <button onClick={() => router.navigate('/checkout', true, 'smooth')}>
        Checkout (smooth scroll to top)
      </button>
    </div>
  );
}
```

## Hash Fragment Navigation

### Automatic Scroll-to-Element

Hash fragments automatically scroll to the target element:

```tsx
// These will automatically scroll to the element with the matching ID
<Link href="/docs/api#hooks">API Hooks</Link>
<Link href="/guide#getting-started">Getting Started</Link>
<Link href="/tutorial#step-1">Step 1</Link>

// Programmatic hash navigation
router.navigate('/docs/advanced#performance');
```

### Hash Fragment Behavior

```typescript
// URL: /docs/api#useEffect
// 1. Navigates to /docs/api
// 2. Automatically scrolls to element with id="useEffect"
// 3. Updates browser history

// If element doesn't exist, scrolls to top as fallback
```

## Advanced Use Cases

### Modal/Overlay Navigation

For modals or overlays that shouldn't affect scroll position:

```tsx
function OpenModalLink() {
  return (
    <Link 
      href="/profile/edit" 
      scrollBehavior="preserve"
      className="modal-trigger"
    >
      Edit Profile
    </Link>
  );
}
```

### Tab Navigation

For tabbed interfaces where you want to preserve scroll position:

```tsx
function TabNavigation() {
  return (
    <div className="tabs">
      <Link href="/dashboard/overview" scrollBehavior="preserve">
        Overview
      </Link>
      <Link href="/dashboard/analytics" scrollBehavior="preserve">
        Analytics  
      </Link>
      <Link href="/dashboard/settings" scrollBehavior="preserve">
        Settings
      </Link>
    </div>
  );
}
```

### Long-form Content

For articles or documentation with smooth reading experience:

```tsx
function ArticleNavigation() {
  return (
    <div>
      {/* Smooth scroll between sections */}
      <Link href="/article#introduction" scrollBehavior="smooth">
        Introduction
      </Link>
      <Link href="/article#methodology" scrollBehavior="smooth">
        Methodology
      </Link>
      <Link href="/article#conclusion" scrollBehavior="smooth">
        Conclusion
      </Link>
    </div>
  );
}
```

## API Reference

### Router Constructor Options

```typescript
interface RouterOptions {
  scrollBehavior?: 'auto' | 'top' | 'preserve' | 'smooth';
  scrollToTop?: boolean; // Legacy - use scrollBehavior instead
  // ... other options
}
```

### Link Component Props

```typescript
interface LinkProps {
  href: string;
  scrollBehavior?: 'auto' | 'top' | 'preserve' | 'smooth';
  scrollToTop?: boolean; // Legacy - use scrollBehavior instead
  // ... other props
}
```

### Router Navigation Method

```typescript
router.navigate(
  path: string,
  pushState: boolean = true,
  scrollBehavior?: 'auto' | 'top' | 'preserve' | 'smooth'
): Promise<void>
```

## Migration from Other Frameworks

### From Next.js

```tsx
// Next.js
import { useRouter } from 'next/router';
const router = useRouter();
router.push('/about', undefined, { scroll: false });

// 0x1 equivalent
import { useRouter } from '0x1/router';
const router = useRouter();
router.navigate('/about', true, 'preserve');
```

### From React Router

```tsx
// React Router v6
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/about', { preventScrollReset: true });

// 0x1 equivalent  
import { useRouter } from '0x1/router';
const router = useRouter();
router.navigate('/about', true, 'preserve');
```

## Best Practices

### ✅ Recommended

- Use `'auto'` for most applications (smart defaults)
- Use `scrollBehavior="preserve"` for tabs, modals, and overlays
- Use `scrollBehavior="smooth"` for enhanced UX on modern devices
- Always test scroll behavior on mobile devices
- Use hash fragments for in-page navigation

### ❌ Avoid

- Don't use `'preserve'` for main page navigation (confuses users)
- Don't disable scroll behavior entirely unless absolutely necessary
- Don't forget to test browser back/forward behavior
- Don't use smooth scrolling for long distances (can be jarring)

## Browser Support

| Feature | Support |
|---------|---------|
| Scroll position restoration | All modern browsers |
| Smooth scrolling | Chrome 61+, Firefox 36+, Safari 15.4+ |
| Hash fragment scrolling | All browsers |
| History API | IE 10+ and all modern browsers |

## Troubleshooting

### Scroll Position Not Restored

```typescript
// Make sure you're using the router for navigation
import { useRouter } from '0x1/router';

// ✅ Correct
const router = useRouter();
router.navigate('/back');

// ❌ Wrong - bypasses router scroll management
window.location.href = '/back';
```

### Hash Fragment Not Working

```typescript
// Make sure the target element exists and has the correct ID
<section id="installation">
  <h2>Installation</h2>
</section>

// Link should match the ID exactly
<Link href="/docs#installation">Installation</Link>
```

### Smooth Scrolling Not Working

Check browser support and fallback to `'auto'`:

```typescript
const router = new Router({
  scrollBehavior: 'smooth' // Falls back to instant scroll if not supported
});
```

---

**Next Steps:**
- [Routing Guide](./routing-guide.md) - Learn about dynamic routes and layouts
- [API Reference](./api-reference.md) - Complete API documentation
- [Examples](./examples) - See scroll behavior in action 