# 0x1 Component Library

A crafted, high-performance component library for 0x1 Framework applications. 
Designed to be minimal, flexible, and zero-dependency, while providing a simple developer experience.

## Features

✅ **Zero Dependencies** — Pure TypeScript/JSX components with no external libraries
✅ **Type-Safe** — Fully typed components with comprehensive TypeScript definitions
✅ **Customizable** — Easily customize components via props or extend them as needed
✅ **Minimal** — Designed for optimal bundle size and performance
✅ **Accessible** — Built with accessibility in mind, following WCAG guidelines
✅ **Modern** — Leveraging the latest web standards and best practices
✅ **Beautiful Docs** — Comprehensive markdown documentation for each component

## Installation

Components can be added to your project using the 0x1 CLI:

```bash
# Add a specific component
0x1 add Button

# Add multiple components at once
0x1 add Button Card Container
```

## Available Components

### UI Components

| Component | Description | Status |
|-----------|-------------|--------|
| Button | Flexible button component with various styles and states | ✅ |
| Card | Versatile card component for content containers | ✅ |
| Badge | Small status indicators | 🏗️ |
| Avatar | User profile pictures with fallback | 🏗️ |
| Dialog | Modal dialog with customizable content | 🏗️ |
| Dropdown | Toggleable menu for options | 🏗️ |
| Toggle | On/off switch component | 🏗️ |

### Layout Components

| Component | Description | Status |
|-----------|-------------|--------|
| Container | Responsive container with max-width | ✅ |
| Grid | Flexible grid layout system | 🏗️ |
| Stack | Vertical or horizontal stacking with consistent spacing | 🏗️ |
| Divider | Horizontal or vertical dividing line | 🏗️ |

### Form Components

| Component | Description | Status |
|-----------|-------------|--------|
| Input | Text input with validation | 🏗️ |
| Select | Dropdown select menu | 🏗️ |
| Checkbox | Customizable checkbox component | 🏗️ |
| RadioGroup | Group of radio options | 🏗️ |
| Switch | Toggle switch with animation | 🏗️ |

### Data Display

| Component | Description | Status |
|-----------|-------------|--------|
| Table | Data table with sorting and filtering | ✅ |
| List | Simple list component | 🏗️ |
| Code | Code block with syntax highlighting | 🏗️ |

### Feedback Components

| Component | Description | Status |
|-----------|-------------|--------|
| Toast | Notification toast messages | ✅ |
| Alert | Contextual feedback messages | ✅ |
| Progress | Loading and progress indicators | 🏗️ |
| Skeleton | Loading placeholder | 🏗️ |

## Component Structure

Each component follows a consistent structure:

```
ComponentName/
├── ComponentName.tsx      # Main component implementation
├── ComponentName.md       # Documentation with examples
├── variants.ts           # Style variants and configurations (if applicable)
└── utils.ts              # Helper functions (if needed)
```

## Design Principles

The 0x1 Component Library follows these core principles:

1. **Function over form** — Components should be practical first, with styling as an enhancement
2. **Composition over configuration** — Prefer composable patterns over complex prop APIs
3. **Progressive enhancement** — Components should work without JavaScript when possible
4. **Accessibility by default** — All components must meet WCAG AA standards
5. **Performance-focused** — Minimal re-renders and optimal runtime performance

## Contributing

We welcome contributions to the 0x1 Component Library! Please follow these steps:

1. Create a new component following the existing structure
2. Ensure comprehensive documentation and examples
3. Add appropriate TypeScript types
4. Test with different use cases
5. Submit a pull request

## License

TDL © 0x1 Framework
