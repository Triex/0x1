# Card Component

A flexible container component with various styling variants and built-in hover effects.

## Usage

```tsx
import { Card } from '@0x1js/components';

function App() {
  return (
    <Card>
      <h3>Card Title</h3>
      <p>This is some content inside the card.</p>
    </Card>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element \| JSX.Element[] \| string` | - | Content to display inside the card |
| `variant` | `'default' \| 'outlined' \| 'elevated' \| 'glass'` | `'default'` | Visual style variant |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Internal padding size |
| `clickable` | `boolean` | `false` | Whether the card should be clickable with hover effects |
| `onClick` | `() => void` | - | Click handler for clickable cards |
| `className` | `string` | `''` | Additional CSS classes |
| `style` | `Record<string, string \| number>` | `{}` | Inline styles |
| `data-testid` | `string` | - | Test ID for testing frameworks |

## Variants

### Default
Standard card with light background and subtle border.

```tsx
<Card variant="default">
  <p>Default card styling</p>
</Card>
```

### Outlined
Card with transparent background and visible border.

```tsx
<Card variant="outlined">
  <p>Outlined card styling</p>
</Card>
```

### Elevated
Card with white background and drop shadow for elevation effect.

```tsx
<Card variant="elevated">
  <p>Elevated card with shadow</p>
</Card>
```

### Glass
Modern glass-morphism effect with blur and transparency.

```tsx
<Card variant="glass">
  <p>Glass morphism effect</p>
</Card>
```

## Padding Options

Control the internal spacing of the card:

```tsx
{/* No padding */}
<Card padding="none">Content</Card>

{/* Small padding */}
<Card padding="sm">Content</Card>

{/* Medium padding (default) */}
<Card padding="md">Content</Card>

{/* Large padding */}
<Card padding="lg">Content</Card>

{/* Extra large padding */}
<Card padding="xl">Content</Card>
```

## Interactive Cards

Make cards clickable with hover effects:

```tsx
<Card 
  clickable 
  onClick={() => console.log('Card clicked!')}
  variant="elevated"
>
  <h3>Clickable Card</h3>
  <p>This card will lift on hover and respond to clicks.</p>
</Card>
```

## Examples

### Basic Card
```tsx
<Card>
  <h2>Welcome</h2>
  <p>This is a simple card with default styling.</p>
</Card>
```

### Product Card
```tsx
<Card variant="elevated" clickable onClick={() => navigateToProduct()}>
  <img src="/product.jpg" alt="Product" />
  <h3>Product Name</h3>
  <p>$29.99</p>
</Card>
```

### Info Card
```tsx
<Card variant="outlined" padding="lg">
  <div style={{ textAlign: 'center' }}>
    <h3>Statistics</h3>
    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>1,234</p>
    <p>Total Users</p>
  </div>
</Card>
```

## Accessibility

- Cards automatically include proper semantic structure
- Clickable cards include `cursor: pointer` styling
- All interactive elements support keyboard navigation
- Color contrast meets WCAG guidelines

## Styling

The Card component uses CSS-in-JS for styling but can be customized with:

- `className` prop for external CSS classes
- `style` prop for inline styles
- CSS custom properties for theming

```css
.card {
  /* Custom styles */
}

.card--clickable:hover {
  /* Custom hover effects */
}
```
