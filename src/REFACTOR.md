# 0x1 Framework CLI Refactoring Plan

This document outlines a comprehensive refactoring plan for the 0x1 framework CLI. The goal is to create a cleaner, more maintainable codebase that follows best practices while optimizing for performance and developer experience.

## TypeScript Migration Audit (Updated)

After a comprehensive audit of the codebase, we've identified the following TypeScript-related issues that need to be addressed:

### 1. JavaScript Adapter Files

Many commands exist in both `.ts` and `.js` versions, where the `.js` files are thin adapters importing from their `.ts` counterparts:

Examples:
- `src/cli/commands/build.js` -> imports from `./build.ts`
- `src/cli/commands/dev.js` -> imports from `./dev.ts`

These adapter files add unnecessary complexity and should be removed in favor of a proper TypeScript compilation flow.

### 2. Inconsistent Import Patterns

The codebase contains mixed import patterns:

- Some files import with `.js` extensions: `import { logger } from '../utils/logger.js'`
- Others import with `.ts` extensions: `import { build } from './build.ts'`
- Some import without extensions: `import { join } from 'path'`

This inconsistency makes it difficult to maintain the codebase and can lead to runtime errors.

### 3. TypeScript Configuration Issues

The current `tsconfig.json` has:

```json
"noEmit": true,
```

This means TypeScript isn't configured to output JS files, which explains why the JavaScript adapter files exist.

### 4. Manual Transpilation Process

The build process in `build-framework.ts` manually transpiles TypeScript using Bun's tools rather than using TypeScript's standard compilation flow. This adds complexity and potential for errors.

### 5. Missing Type Definitions

Some dependencies lack proper TypeScript definitions, such as:

```
Could not find a declaration file for module 'glob'.
```

### 6. TypeScript/JavaScript Migration Plan

Based on our audit, we'll implement the following migration to TypeScript:

#### Step 1: Update TypeScript Configuration

Modify `tsconfig.json` to enable JavaScript output:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",         // Add output directory
    "noEmit": false,            // Change to false
    "declaration": true,        // Generate .d.ts files
    // Other existing options...
  }
}
```

#### Step 2: Standardize Import Patterns

Update all import statements to follow the ESM pattern without file extensions:

```typescript
// BEFORE (mixed pattern)
import { logger } from '../utils/logger.js';
import { build } from './build.ts';

// AFTER (standardized)
import { logger } from '../utils/logger';
import { build } from './build';
```

#### Step 3: Install Missing Type Definitions

```bash
bun add -d @types/glob
```

#### Step 4: Update Build Process

Modify `build-framework.ts` to use Bun's TypeScript compilation:

```typescript
// Use Bun build to transpile TypeScript files
const tsResult = Bun.spawnSync([
  "bun", "build", "src",
  "--outdir", "dist",
  "--target", "node",
  "--format", "esm",
]);
```

#### Step 5: Remove JavaScript Adapter Files

Once TypeScript compilation is working, remove all `.js` adapter files and update the entry points to use the compiled output directly.

#### Step 6: Create Module Type Declaration

For modules without type definitions, create a declarations file:

```typescript
// src/types/global.d.ts
declare module 'glob';
```

#### Step 7: Update Package Scripts

Add build scripts to package.json:

```json
"scripts": {
  "build": "bun run scripts/build-framework.ts",
  "dev": "bun run src/cli/index.ts dev",
  "clean": "rm -rf dist"
}
```

#### Step 8: Fix TypeScript Errors

Address remaining TypeScript errors and inconsistencies, ensuring proper typing throughout the codebase.

## Current Structure Analysis

The current CLI structure has several issues:

1. **Duplicated Functionality**: Multiple server implementations with overlapping features
2. **Inconsistent Import Patterns**: Mix of `.js` and `.ts` extensions in imports
3. **Scattered Utility Functions**: Related functionality spread across multiple files
4. **JS Adapter Pattern**: Using JS files to re-export from TS files, adding complexity
5. **Unclear Separation of Concerns**: Framework utilities mixed with CLI utilities

### Current Directory Structure

```
src/cli/
├── commands/
│   ├── dev.js                    # JS adapter for dev.ts
│   ├── dev.ts                    # Dev command implementation
│   ├── build.js                  # JS adapter for build.ts
│   ├── build.ts                  # Build command implementation
│   └── utils/
│       ├── component-handler.ts  # Component handling logic
│       ├── css-handler.ts        # CSS processing logic
│       ├── jsx-templates.ts      # JSX runtime templates
│       ├── live-reload/          # Live reload implementation
│       ├── server/               # Server-related utilities
│       ├── server-templates.ts   # HTML templates for server
│       ├── standalone-server.ts  # Alternative server implementation
│       └── tailwind-handler.ts   # Tailwind CSS integration
├── server/
│   ├── dev-server.ts             # Main dev server implementation
│   ├── handlers/                 # Some handlers already moved here
│   └── middleware/               # Some middleware already moved here
└── utils/
    ├── logger.js                 # Logging utilities
    └── parse-args.js             # CLI argument parsing
```

## Target Structure

The target structure follows modern best practices with clear separation of concerns:

```
types/
├── global.d.ts                   # Global type definitions
├── etc
etc
src/cli/
├── commands/                     # CLI commands (all TypeScript)
│   ├── dev.ts                    # Dev command implementation
│   ├── build.ts                  # Build command implementation
│   └── create.ts                 # Project creation command
├── server/                       # Server implementation
│   ├── dev-server.ts             # Main dev server (consolidated)
│   ├── handlers/                 # Request handlers
│   │   ├── component-handler.ts  # Component handling
│   │   ├── css-handler.ts        # CSS processing
│   │   ├── live-reload.ts        # Live reload system
│   │   └── tailwind-handler.ts   # Tailwind integration
│   └── middleware/               # Server middleware
│       ├── error-boundary.ts     # Error handling
│       └── static-files.ts       # Static file serving
└── utils/                        # CLI utilities
    ├── logger.ts                 # Logging utilities
    ├── parse-args.ts             # Argument parsing
    ├── transpilation.ts          # Code transpilation utilities
    ├── icon-generator.ts         # Icon generation (moved from src/utils)
    └── animations.ts             # CLI animations (moved from src/utils)

src/utils/                        # Framework utilities
├── dom.ts    / or directory?     # DOM manipulation utilities
└── core.ts                       # Core framework utilities
```

## Refactoring Steps

### 1. Server Consolidation

#### 1.1. Create Consolidated Server Implementation

Use `standalone-server.ts` as the base for the consolidated server implementation:

1. Copy relevant code from `standalone-server.ts` to `dev-server.ts`
2. Update import paths to match new structure
3. Preserve unique functionality from original `dev-server.ts`

#### 1.2. Refactor Handler Implementation

Move handlers to dedicated files in the `server/handlers/` directory:

1. Extract component handling logic to `component-handler.ts`
2. Extract CSS processing logic to `css-handler.ts`
3. Consolidate live reload functionality in `live-reload.ts`
4. Move Tailwind integration to `tailwind-handler.ts`

#### 1.3. Implement Middleware

Create middleware for common server tasks:

1. Implement error boundary middleware in `error-boundary.ts`
2. Implement static files middleware in `static-files.ts`

### 2. CLI Commands Refactoring

#### 2.1. Remove JS Adapters

Update the CLI to import TypeScript files directly:

1. Modify `index.ts` to import from `.ts` files
2. Remove redundant `.js` adapter files
3. Update all import statements to use `.ts` extension

#### 2.2. Standardize Command Interface

Create a consistent interface for all CLI commands:

1. Define a common `CliCommand` interface
2. Ensure all commands follow the same pattern
3. Implement proper error handling and logging

### 3. Utility Functions Reorganization

#### 3.1. Consolidate CLI Utilities

Move all CLI-specific utilities to the `cli/utils/` directory:

1. Update `logger.js` to `logger.ts` with improved typing
2. Update `parse-args.js` to `parse-args.ts` with better error handling
3. Consolidate transpilation utilities in `transpilation.ts`
4. Move icon generation from `src/utils` to `cli/utils`
5. Move CLI animations from `src/utils` to `cli/utils`

#### 3.2. Separate Framework Utilities

Keep framework-specific utilities in `src/utils/`:

1. Create `dom.ts` for DOM manipulation utilities
2. Create `core.ts` for core framework utilities
3. Ensure clear separation between framework and CLI utilities

### 4. Testing and Documentation

#### 4.1. Implement Tests

Add tests for critical functionality:

1. Create tests for server implementation
2. Create tests for handlers and middleware
3. Create tests for CLI commands
4. Create tests for utility functions

#### 4.2. Update Documentation

Update documentation to reflect new structure:

1. Update README.md with new CLI structure
2. Document command interface and options
3. Document server configuration options
4. Document extension points for plugins

## Implementation Timeline

### Phase 1: Server Consolidation (1-2 days)
- Consolidate server implementations
- Move handlers to dedicated files
- Implement middleware

### Phase 2: CLI Commands Refactoring (1 day)
- Remove JS adapters
- Standardize command interface

### Phase 3: Utility Functions Reorganization (1 day)
- Consolidate CLI utilities
- Separate framework utilities

### Phase 4: Testing and Documentation (1-2 days)
- Implement tests
- Update documentation

## Backward Compatibility Considerations

- Maintain existing CLI command syntax
- Ensure existing projects continue to work
- Provide clear migration path for custom extensions

## Performance Improvements

- Reduce startup time by removing redundant code
- Improve build performance with better caching
- Optimize live reload for faster feedback

## Best Practices Enforced

- Use TypeScript throughout
- Proper error handling and logging
- Clear separation of concerns
- Consistent coding style
- Comprehensive documentation
