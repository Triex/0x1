# 0x1 Lint Extension for VSCode

An extension that provides comprehensive TypeScript support for 0x1 framework projects in VSCode. This extension eliminates TypeScript errors related to JSX syntax, component imports, and other 0x1-specific code patterns without requiring React dependencies.

## Features

- Full JSX/TSX support without React dependencies
- Type definitions for 0x1 framework
- Automatic project configuration
- Syntax highlighting optimized for 0x1
- Integrated linting rules specific to 0x1 patterns

## Architecture

```
0x1-lint-extension/
├── .vscode/                  # VS Code specific files
│   └── launch.json           # Debug configuration
├── src/                      # Extension source code
│   ├── extension.ts          # Main extension code
│   ├── config-manager.ts     # Handles VS Code and TS configuration
│   └── commands/             # Custom commands
│       └── initialize.ts     # Initializes 0x1 project support
├── types/                    # Type definitions
│   ├── 0x1.d.ts              # Core 0x1 framework types
│   └── jsx.d.ts              # JSX runtime definitions
├── syntaxes/                 # Syntax highlighting
│   └── 0x1.tmLanguage.json   # Custom syntax rules
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Documentation
```

## How It Works

### Type Definitions

The extension provides two key type definition files:

1. **0x1.d.ts**: Defines the core 0x1 module exports including `createElement`, `Fragment`, and component helpers.
2. **jsx.d.ts**: Provides global JSX namespace definitions that allow TypeScript to understand JSX syntax without React.

### TypeScript Configuration

The extension automatically configures your project's TypeScript settings to:

- Set the correct JSX factory to work with 0x1
- Include the extension's type definitions
- Recognize 0x1 imports without errors

### Linting Rules

Custom linting rules enforce 0x1-specific best practices:

- Component naming conventions
- Import patterns for 0x1 modules
- JSX usage in 0x1 context

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "0x1 Lint Extension"
4. Click Install
5. Reload VS Code

### Manual Installation

1. Download the `.vsix` file from the releases page
2. Open VS Code
3. Go to Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
4. Click on the "..." menu in the top-right of the Extensions panel
5. Select "Install from VSIX..."
6. Choose the downloaded file
7. Reload VS Code

## Usage

### Automatic Configuration

The extension automatically detects 0x1 projects and configures them properly. No manual steps required for basic functionality.

### Manual Configuration

For advanced customization, you can run the "0x1: Initialize Project" command:

1. Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "0x1: Initialize Project" and press Enter
3. Follow the prompts to configure your project

### Adding Type Definitions to an Existing Project

If you're working on an existing 0x1 project, you can manually add the extension's type definitions:

1. Create a `tsconfig.json` file if it doesn't exist
2. Add the following configuration:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "createElement",
    "typeRoots": [
      "./node_modules/@types",
      "./node_modules/0x1-lint-extension/types"
    ]
  }
}
```

## Development

### Building the Extension

```bash
# Install dependencies
bun install

# Compile
bun run compile

# Package
bun run package
```

### Testing

```bash
bun run test
```

## Contributing

Contributions are welcome! Please refer to the contribution guidelines in the repository.

## License

TDL v1