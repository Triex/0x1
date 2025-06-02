# 0x1 Templates

Official templates for the [0x1 framework](https://github.com/Triex/0x1) - the ultra-minimal TypeScript framework.

## 🚀 Quick Start

Install the templates package:

```bash
bun add 0x1-templates
```

Use with the 0x1 CLI:

```bash
0x1 new my-app --template full
0x1 new crypto-app --template crypto-dash
```

## 📦 Available Templates

### Bundled with CLI (Lightweight)
- **minimal** (~500KB) - Basic setup with minimal dependencies
- **standard** (~50MB) - Common libraries and project structure ⭐ *Recommended*

### Requires 0x1-templates Package (Feature-Rich)
- **full** (~180MB) - Complete setup with all recommended features
- **crypto-dash** (~650MB) - Crypto wallet and DeFi dashboard

## 🎯 Template Features

| Template | TypeScript | Tailwind | PWA | State Mgmt | DeFi | Size |
|----------|------------|----------|-----|------------|------|------|
| minimal | ✅ | ❌ | ❌ | ❌ | ❌ | ~500KB |
| standard | ✅ | ✅ | ✅ | ✅ | ❌ | ~50MB |
| full | ✅ | ✅ | ✅ | ✅ | ❌ | ~180MB |
| crypto-dash | ✅ | ✅ | ✅ | ✅ | ✅ | ~650MB |

## 💡 Usage

### Direct Import (Advanced)

```typescript
import { getTemplatePath, templateExists } from '0x1-templates';

// Check if template exists
if (templateExists('full')) {
  const templatePath = getTemplatePath('full');
  console.log(`Template located at: ${templatePath}`);
}
```

### Template Metadata

```typescript
import { templateMetadata, getTemplateMetadata } from '0x1-templates';

// Get all template info
console.log(templateMetadata);

// Get specific template info
const fullTemplate = getTemplateMetadata('full');
console.log(fullTemplate?.features); // ['TypeScript', 'Tailwind CSS', ...]
```

## 🏗️ Architecture

The templates package follows the same modular approach as other 0x1 packages:

```
0x1-templates/
├── minimal/          # Minimal template files
├── standard/         # Standard template files  
├── full/             # Full-featured template files
├── crypto-dash/      # Crypto dashboard template files
├── licenses/         # License templates (MIT, TDL, etc.)
└── src/              # Template utilities and metadata
```

## 🔄 Development

Building the package:

```bash
cd 0x1-templates
bun run build
```

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

## 🤝 Contributing

Please see the main [0x1 repository](https://github.com/Triex/0x1) for contribution guidelines.

---

Part of the 0x1 framework ecosystem:
- [0x1](https://github.com/Triex/0x1) - Core framework
- [0x1-router](../0x1-router) - Client-side routing
- [0x1-store](../0x1-store) - State management
- **0x1-templates** - Project templates
