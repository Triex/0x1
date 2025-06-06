# 0x1 Framework Routing Guide

**Complete guide to Next15-style routing in 0x1 Framework**

## Table of Contents

- [Overview](#overview)
- [File-Based Routing](#file-based-routing)
- [Dynamic Routes](#dynamic-routes)
- [Route Groups](#route-groups)
- [Nested Layouts](#nested-layouts)
- [Search Parameters](#search-parameters)
- [Route Conflict Detection](#route-conflict-detection)
- [Migration from Next.js](#migration-from-nextjs)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

0x1 Framework provides a complete Next15-compatible routing system with full feature parity. The routing system is built for performance and developer experience, offering:

- **File-based routing** with automatic route discovery
- **Dynamic routes** with parameters and catch-all segments
- **Route groups** for organization without affecting URLs
- **Nested layouts** with automatic composition
- **Search parameters** with React-style hooks
- **Conflict detection** with intelligent resolution
- **Hash fragment navigation** with auto-scroll

## File-Based Routing

### Basic Structure

The routing system follows Next15's app directory convention:

```
app/
├── layout.tsx              # Root layout (required)
├── page.tsx                # Home page (/)
├── not-found.tsx           # 404 page
├── about/
│   └── page.tsx            # /about
├── blog/
│   ├── layout.tsx          # Nested layout for blog
│   ├── page.tsx            # /blog
│   └── [slug]/
│       └── page.tsx        # /blog/[slug]
└── api/
    └── users/
        └── route.ts        # API route
```

### Special Files

| File | Purpose | Required |
|------|---------|----------|
| `layout.tsx` | Shared UI for a segment and its children | Yes (root) |
| `page.tsx` | Unique UI of a route and makes it publicly accessible | Yes |
| `loading.tsx` | Loading UI for a segment and its children | No |
| `error.tsx` | Error UI for a segment and its children | No |
| `not-found.tsx` | UI for 404 errors | No |
| `route.ts` | API endpoint | No |

### Basic Page Example

```tsx
// app/page.tsx
export const metadata = {
  title: 'Home',
  description: 'Welcome to my 0x1 app'
};

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to 0x1</h1>
      <p>The fastest TypeScript framework</p>
    </div>
  );
}
```

## Dynamic Routes

### Parameter Routes

Create dynamic segments using square brackets:

```tsx
// app/blog/[slug]/page.tsx
interface PageProps {
  params: { slug: string };
}

export default function BlogPost({ params }: PageProps) {
  return (
    <article>
      <h1>Blog Post: {params.slug}</h1>
      <p>Content for {params.slug}</p>
    </article>
  );
}
```

**URLs matched:**
- `/blog/getting-started` → `{ slug: 'getting-started' }`
- `/blog/advanced-routing` → `{ slug: 'advanced-routing' }`

### Catch-All Routes

Use `[...folder]` for catch-all routes:

```tsx
// app/docs/[...path]/page.tsx
interface PageProps {
  params: { path: string[] };
}

export default function DocsPage({ params }: PageProps) {
  const pathSegments = params.path || [];
  
  return (
    <div>
      <h1>Documentation</h1>
      <p>Path: {pathSegments.join(' > ')}</p>
    </div>
  );
}
```

**URLs matched:**
- `/docs/getting-started` → `{ path: ['getting-started'] }`
- `/docs/api/hooks` → `{ path: ['api', 'hooks'] }`
- `/docs/advanced/routing/dynamic` → `{ path: ['advanced', 'routing', 'dynamic'] }`

### Optional Catch-All Routes

Use `[[...folder]]` for optional catch-all routes:

```tsx
// app/shop/[[...categories]]/page.tsx
interface PageProps {
  params: { categories?: string[] };
}

export default function ShopPage({ params }: PageProps) {
  const categories = params.categories || [];
  
  return (
    <div>
      <h1>Shop</h1>
      {categories.length === 0 ? (
        <p>All products</p>
      ) : (
        <p>Categories: {categories.join(' > ')}</p>
      )}
    </div>
  );
}
```

**URLs matched:**
- `/shop` → `{ categories: undefined }`
- `/shop/electronics` → `{ categories: ['electronics'] }`
- `/shop/electronics/phones` → `{ categories: ['electronics', 'phones'] }`

## Route Groups

Route groups allow you to organize routes without affecting the URL structure. Wrap folder names in parentheses:

```
app/
├── (marketing)/
│   ├── about/page.tsx        # URL: /about
│   ├── contact/page.tsx      # URL: /contact
│   ├── pricing/page.tsx      # URL: /pricing
│   └── layout.tsx            # Shared marketing layout
├── (dashboard)/
│   ├── analytics/page.tsx    # URL: /analytics
│   ├── settings/page.tsx     # URL: /settings
│   ├── profile/page.tsx      # URL: /profile
│   └── layout.tsx            # Shared dashboard layout
└── layout.tsx                # Root layout
```

### Route Group Layout Example

```tsx
// app/(marketing)/layout.tsx
import Link from '0x1/link';

export default function MarketingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="marketing-header">
        <nav>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="marketing-footer">
        Marketing Footer
      </footer>
    </div>
  );
}
```

## Nested Layouts

Layouts nest automatically. Each segment can have its own layout:

```
app/
├── layout.tsx              # Root layout
├── (dashboard)/
│   ├── layout.tsx          # Dashboard layout
│   ├── analytics/
│   │   ├── layout.tsx      # Analytics layout
│   │   ├── page.tsx        # /analytics
│   │   └── reports/
│   │       └── page.tsx    # /analytics/reports
│   └── settings/
│       └── page.tsx        # /settings
```

**Layout hierarchy for `/analytics/reports`:**
1. Root layout (`app/layout.tsx`)
2. Dashboard layout (`app/(dashboard)/layout.tsx`)
3. Analytics layout (`app/(dashboard)/analytics/layout.tsx`)
4. Reports page (`app/(dashboard)/analytics/reports/page.tsx`)

### Layout Example

```tsx
// app/(dashboard)/analytics/layout.tsx
export default function AnalyticsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="analytics-container">
      <aside className="analytics-sidebar">
        <nav>
          <Link href="/analytics">Overview</Link>
          <Link href="/analytics/reports">Reports</Link>
          <Link href="/analytics/metrics">Metrics</Link>
        </nav>
      </aside>
      <main className="analytics-content">
        {children}
      </main>
    </div>
  );
}
```

## Search Parameters

0x1 provides Next15-compatible hooks for working with search parameters:

### useSearchParams Hook

```tsx
import { useSearchParams } from '0x1/router';

function SearchResults() {
  const searchParams = useSearchParams();
  
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  const page = Number(searchParams.get('page')) || 1;
  
  return (
    <div>
      <h1>Search Results</h1>
      {query && <p>Query: {query}</p>}
      {category && <p>Category: {category}</p>}
      <p>Page: {page}</p>
    </div>
  );
}
```

### useParams Hook

```tsx
import { useParams } from '0x1/router';

function ProductPage() {
  const params = useParams();
  
  // For /products/[id]/page.tsx
  const productId = params.id;
  
  // For /blog/[...path]/page.tsx
  const pathSegments = params.path as string[];
  
  return (
    <div>
      <h1>Product: {productId}</h1>
    </div>
  );
}
```

### usePathname Hook

```tsx
import { usePathname } from '0x1/router';

function Navigation() {
  const pathname = usePathname();
  
  return (
    <nav>
      <Link 
        href="/dashboard" 
        className={pathname === '/dashboard' ? 'active' : ''}
      >
        Dashboard
      </Link>
      <Link 
        href="/analytics" 
        className={pathname === '/analytics' ? 'active' : ''}
      >
        Analytics
      </Link>
    </nav>
  );
}
```

### Updating Search Parameters

```tsx
import { useRouter, useSearchParams, usePathname } from '0x1/router';

function FilterComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    router.navigate(`${pathname}?${params.toString()}`);
  };
  
  return (
    <div>
      <select onChange={(e) => updateFilter('category', e.target.value)}>
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => updateFilter('q', e.target.value)}
        value={searchParams.get('q') || ''}
      />
    </div>
  );
}
```

## Route Conflict Detection

0x1 automatically detects and resolves route conflicts when multiple files could handle the same URL:

### Example Conflict

```
app/
├── (auth)/
│   └── login/page.tsx        # URL: /login
└── login/page.tsx            # URL: /login (CONFLICT!)
```

**Resolution:**
- Non-grouped routes take precedence over grouped routes
- `app/login/page.tsx` wins over `app/(auth)/login/page.tsx`
- Detailed conflict report shown in development console

### Conflict Report

When conflicts are detected, you'll see:

```
🚨 ROUTE CONFLICT DETECTED
====================================
URL Path: /login
Winner: ✅ app/login/page.tsx  
Conflicting files:
  ❌ app/(auth)/login/page.tsx (group: auth)
====================================

🔧 How to Fix:
• Rename one of the conflicting page files
• Move one route to a different path structure
• Use route groups to organize without affecting URLs
```

### Conflict Resolution Rules

1. **Non-grouped vs Grouped**: Non-grouped routes take precedence
2. **Alphabetical**: When both are the same type, alphabetical order by file path
3. **Specificity**: More specific paths generally win

## Migration from Next.js

0x1 is designed as a drop-in replacement for Next.js routing. Here's how to migrate:

### 1. File Structure

✅ **No changes needed** - 0x1 uses the same app directory structure as Next15.

### 2. Import Changes

```tsx
// Before (Next.js)
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams, useParams, usePathname } from 'next/navigation';

// After (0x1)
import Link from '0x1/link';
import { useRouter, useSearchParams, useParams, usePathname } from '0x1/router';
```

### 3. Component APIs

```tsx
// Before (Next.js)
import { notFound } from 'next/navigation';

export default function ProductPage({ params }: { params: { id: string } }) {
  if (!product) {
    notFound(); // Next.js specific
  }
  
  return <div>Product: {params.id}</div>;
}

// After (0x1) - Use standard error handling
export default function ProductPage({ params }: { params: { id: string } }) {
  if (!product) {
    throw new Error('Product not found'); // Standard error handling
  }
  
  return <div>Product: {params.id}</div>;
}
```

### 4. Metadata

```tsx
// Before (Next.js) - Same API works in 0x1!
export const metadata = {
  title: 'My Page',
  description: 'Page description'
};

// After (0x1) - No changes needed
export const metadata = {
  title: 'My Page', 
  description: 'Page description'
};
```

### 5. Automated Migration Script

```bash
# Replace imports automatically
find ./app -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/from "next\/link"/from "0x1\/link"/g'
find ./app -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/from "next\/navigation"/from "0x1\/router"/g'

# Update router usage
find ./app -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/router\.push/router.navigate/g'
find ./app -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/router\.replace/router.navigate/g'
```

## API Reference

### Link Component

```tsx
import Link from '0x1/link';

<Link 
  href="/path"           // Required: destination path
  className="nav-link"   // Optional: CSS classes
  target="_blank"        // Optional: link target
  rel="noopener"         // Optional: link relationship
>
  Link text
</Link>
```

### Router Hook

```tsx
import { useRouter } from '0x1/router';

const router = useRouter();

// Navigate to a route
router.navigate('/path');
router.navigate('/search?q=query');
router.navigate('/docs#section');

// Check if router is ready
if (router.isReady) {
  // Router is initialized
}
```

### Search Params Hook

```tsx
import { useSearchParams } from '0x1/router';

const searchParams = useSearchParams();

// Get parameter
const query = searchParams.get('q');

// Get all parameters
const allParams = searchParams.toString();

// Check if parameter exists
const hasQuery = searchParams.has('q');

// Iterate over parameters
for (const [key, value] of searchParams) {
  console.log(key, value);
}
```

### Params Hook

```tsx
import { useParams } from '0x1/router';

const params = useParams();

// For [id] route
const id = params.id;

// For [...path] route
const pathSegments = params.path as string[];

// For [[...categories]] route
const categories = params.categories as string[] | undefined;
```

### Pathname Hook

```tsx
import { usePathname } from '0x1/router';

const pathname = usePathname();

// Returns current pathname
// e.g., '/blog/my-post'
```

## Best Practices

### 1. Layout Organization

```tsx
// Use route groups for logical organization
app/
├── (auth)/
│   ├── layout.tsx      # Auth-specific layout
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (app)/
│   ├── layout.tsx      # App-specific layout  
│   ├── dashboard/page.tsx
│   └── settings/page.tsx
└── layout.tsx          # Root layout
```

### 2. Dynamic Route Naming

```tsx
// Good: Descriptive parameter names
app/blog/[slug]/page.tsx
app/users/[userId]/posts/[postId]/page.tsx

// Avoid: Generic names
app/blog/[id]/page.tsx
app/users/[param1]/posts/[param2]/page.tsx
```

### 3. Search Parameter Management

```tsx
// Create reusable search param utilities
function useQueryParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.navigate(`${pathname}?${params.toString()}`);
  };
  
  const removeParam = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    router.navigate(`${pathname}?${params.toString()}`);
  };
  
  return { setParam, removeParam, searchParams };
}
```

### 4. Error Handling

```tsx
// app/error.tsx
'use client';

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 5. Loading States

```tsx
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p>Loading dashboard...</p>
    </div>
  );
}
```

## Troubleshooting

### Route Not Found

**Problem**: Page shows 404 even though file exists.

**Solutions**:
1. Check file naming: Must be `page.tsx`, not `index.tsx`
2. Verify app directory structure
3. Check for route conflicts in dev console
4. Ensure proper export: `export default function Page() {}`

### Route Conflicts

**Problem**: Multiple files handling same URL.

**Solutions**:
1. Check development console for conflict reports
2. Rename conflicting files to different paths
3. Use route groups appropriately
4. Review file organization

### Search Params Not Working

**Problem**: Search parameters not updating or reading correctly.

**Solutions**:
1. Use `useSearchParams()` hook, not `window.location.search`
2. Update params with router: `router.navigate()`
3. Check import: `import { useSearchParams } from '0x1/router'`

### Layout Not Applying

**Problem**: Layout not showing for certain routes.

**Solutions**:
1. Check layout file naming: Must be `layout.tsx`
2. Verify layout is in correct directory level
3. Ensure proper export: `export default function Layout() {}`
4. Check that layout accepts `children` prop

### Dynamic Routes Not Matching

**Problem**: Dynamic route parameters not passed correctly.

**Solutions**:
1. Check bracket syntax: `[param]`, `[...params]`, `[[...params]]`
2. Verify folder structure matches URL pattern
3. Check TypeScript interface for params
4. Use correct parameter names in component

---

## Additional Resources

- [0x1 Framework Documentation](https://0x1.onl/docs)
- [Next.js Routing Documentation](https://nextjs.org/docs/app/building-your-application/routing) (for reference)
- [0x1 Examples Repository](https://github.com/Triex/0x1/tree/main/examples)

---

*This guide covers the complete routing system in 0x1 Framework. For more advanced topics or specific use cases, refer to the main documentation or community discussions.* 