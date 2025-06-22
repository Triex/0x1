# Container Component

A responsive layout container that provides consistent max-width, padding, and centering for your content.

## Usage

```tsx
import { Container } from '@0x1js/components';

function App() {
  return (
    <Container>
      <h1>My Content</h1>
      <p>This content is contained within responsive boundaries.</p>
    </Container>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element \| JSX.Element[] \| string` | - | Content to display inside the container |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| 'full'` | `'lg'` | Maximum width of the container |
| `paddingX` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Horizontal padding |
| `paddingY` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'none'` | Vertical padding |
| `centered` | `boolean` | `true` | Whether to center the container horizontally |
| `className` | `string` | `''` | Additional CSS classes |
| `style` | `Record<string, string \| number>` | `{}` | Inline styles |
| `as` | `'div' \| 'main' \| 'section' \| 'article' \| 'header' \| 'footer'` | `'div'` | HTML element type |
| `data-testid` | `string` | - | Test ID for testing frameworks |

## Size Variants

Control the maximum width of your content:

```tsx
{/* Small: 640px max-width */}
<Container size="sm">Small container</Container>

{/* Medium: 768px max-width */}
<Container size="md">Medium container</Container>

{/* Large: 1024px max-width (default) */}
<Container size="lg">Large container</Container>

{/* Extra Large: 1280px max-width */}
<Container size="xl">Extra large container</Container>

{/* 2X Large: 1536px max-width */}
<Container size="2xl">2XL container</Container>

{/* Full width: 100% max-width */}
<Container size="full">Full width container</Container>
```

## Padding Options

### Horizontal Padding (paddingX)
```tsx
<Container paddingX="none">No horizontal padding</Container>
<Container paddingX="sm">Small horizontal padding</Container>
<Container paddingX="md">Medium horizontal padding (default)</Container>
<Container paddingX="lg">Large horizontal padding</Container>
<Container paddingX="xl">Extra large horizontal padding</Container>
```

### Vertical Padding (paddingY)
```tsx
<Container paddingY="none">No vertical padding (default)</Container>
<Container paddingY="sm">Small vertical padding</Container>
<Container paddingY="md">Medium vertical padding</Container>
<Container paddingY="lg">Large vertical padding</Container>
<Container paddingY="xl">Extra large vertical padding</Container>
```

## Semantic HTML Elements

Use different HTML elements for better semantics:

```tsx
{/* Main content area */}
<Container as="main">
  <h1>Main Content</h1>
</Container>

{/* Page section */}
<Container as="section">
  <h2>About Us</h2>
</Container>

{/* Article content */}
<Container as="article">
  <h1>Blog Post Title</h1>
</Container>

{/* Header area */}
<Container as="header">
  <nav>Navigation</nav>
</Container>

{/* Footer area */}
<Container as="footer">
  <p>&copy; 2024 My Company</p>
</Container>
```

## Examples

### Basic Page Layout
```tsx
function Page() {
  return (
    <>
      <Container as="header" paddingY="md">
        <nav>Header Navigation</nav>
      </Container>
      
      <Container as="main" size="xl" paddingY="lg">
        <h1>Page Title</h1>
        <p>Main content goes here...</p>
      </Container>
      
      <Container as="footer" paddingY="md">
        <p>&copy; 2024 Company</p>
      </Container>
    </>
  );
}
```

### Responsive Grid Layout
```tsx
<Container size="2xl" paddingX="lg" paddingY="xl">
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem'
  }}>
    <Card>Content 1</Card>
    <Card>Content 2</Card>
    <Card>Content 3</Card>
  </div>
</Container>
```

### Narrow Content Container
```tsx
<Container size="sm" paddingY="xl">
  <article>
    <h1>Blog Post</h1>
    <p>This narrow container is perfect for reading content...</p>
  </article>
</Container>
```

### Full-Width Section with Contained Content
```tsx
<div style={{ backgroundColor: '#f8fafc', width: '100%' }}>
  <Container paddingY="xl">
    <h2>Featured Section</h2>
    <p>This content is contained but the background extends full width.</p>
  </Container>
</div>
```

## Accessibility

- Uses semantic HTML elements when specified with the `as` prop
- Maintains proper content flow and structure
- Provides consistent spacing and layout patterns
- Compatible with screen readers and keyboard navigation

## Responsive Behavior

The Container component is fully responsive:

- Automatically adjusts to available screen width
- Maintains consistent padding on smaller screens
- Provides appropriate max-widths for different breakpoints
- Centers content automatically (unless disabled)

## Best Practices

1. **Use semantic elements**: Utilize the `as` prop for better HTML semantics
2. **Consistent spacing**: Use the padding props instead of custom margins
3. **Responsive design**: Choose appropriate sizes for your content type
4. **Nesting**: Containers can be nested for complex layouts
5. **Accessibility**: Always consider the semantic meaning of your container
