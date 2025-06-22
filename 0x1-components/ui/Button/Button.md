# Button

A versatile button component with multiple variants, sizes, and states. Designed to be accessible, minimal, and beautifully styled.

## Features

- Multiple visual variants: primary, secondary, outline, ghost, link, and danger
- Three sizes: small, medium, and large
- Loading state with animated spinner
- Support for left and right icons
- Full-width option
- Fully accessible with keyboard navigation and screen reader support
- Zero dependencies - built with pure TypeScript and React

## Usage

```tsx
import { Button } from '../components/ui/Button/Button';

export default function MyComponent() {
  return (
    <div className="space-y-4">
      <Button>Default Button</Button>
      <Button variant="secondary">Secondary Button</Button>
      <Button variant="outline">Outline Button</Button>
      <Button variant="ghost">Ghost Button</Button>
      <Button variant="link">Link Button</Button>
      <Button variant="danger">Danger Button</Button>
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'link' \| 'danger'` | `'primary'` | The visual style of the button |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | The size of the button |
| `width` | `'auto' \| 'full'` | `'auto'` | Control button width |
| `isLoading` | `boolean` | `false` | Show a loading spinner |
| `iconLeft` | `ReactNode` | `undefined` | Icon to display before button content |
| `iconRight` | `ReactNode` | `undefined` | Icon to display after button content |
| `disabled` | `boolean` | `false` | Disable the button |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |

Plus all standard button attributes like `onClick`, `aria-*`, etc.

## Examples

### Basic Button Variants

```tsx
<div className="flex flex-wrap gap-4">
  <Button>Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="link">Link</Button>
  <Button variant="danger">Danger</Button>
</div>
```

### Button Sizes

```tsx
<div className="flex items-center gap-4">
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
</div>
```

### Loading State

```tsx
<div className="flex gap-4">
  <Button isLoading>Loading</Button>
  <Button variant="secondary" isLoading>Loading</Button>
  <Button variant="outline" isLoading>Loading</Button>
</div>
```

### With Icons

```tsx
<div className="flex gap-4">
  <Button 
    iconLeft={<span className="i-lucide-arrow-left w-4 h-4" />}
  >
    Back
  </Button>
  
  <Button 
    iconRight={<span className="i-lucide-arrow-right w-4 h-4" />}
  >
    Next
  </Button>
  
  <Button 
    iconLeft={<span className="i-lucide-download w-4 h-4" />} 
    iconRight={<span className="i-lucide-arrow-right w-4 h-4" />}
  >
    Download
  </Button>
</div>
```

### Full Width Button

```tsx
<Button width="full">Full Width Button</Button>
```

### With Custom Class Names

```tsx
<Button className="bg-gradient-to-r from-purple-500 to-blue-500">
  Custom Button
</Button>
```

## Accessibility

The Button component follows these accessibility best practices:

- Uses native `<button>` element for proper keyboard navigation
- Maintains appropriate contrast ratios in all variants
- Includes focus styles for keyboard users
- Properly disables the button when in disabled or loading states
- Works with screen readers to announce state changes

## Composition

Button can be combined with other components for more complex UIs:

```tsx
<div className="flex gap-2">
  <Button variant="ghost" iconLeft={<span className="i-lucide-filter w-4 h-4" />}>
    Filter
  </Button>
  <Button variant="outline">
    Cancel
  </Button>
  <Button>
    Save
  </Button>
</div>
```

## Custom Variants

You can extend the Button component to create your own custom variant:

```tsx
// Create a custom success button
<Button 
  className="bg-green-600 hover:bg-green-700 text-white"
  iconLeft={<span className="i-lucide-check w-4 h-4" />}
>
  Success
</Button>
```

## Best Practices

- Use the appropriate variant for the action's importance:
  - Primary: Main actions (Save, Submit)
  - Secondary: Alternative actions (Cancel, Reset)
  - Outline/Ghost: Less important actions
  - Link: Navigation actions
  - Danger: Destructive actions (Delete)
- Include meaningful text that describes the action
- Avoid using too many buttons in the same section
- Use loading state for actions that take time to complete
