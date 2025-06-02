# Changelog

All notable changes to the 0x1 framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 20XX-XX-XX

### Added
- **Core Framework**
  - Zero-dependency router with hash-based and history API support
  - Component system with automatic DOM diffing
  - Suspense-like content loading for async operations
  - State management with hooks system (useState, useEffect)
  - Zero-dependency store for global state

- **CLI**
  - `new` command with customizable templates
  - `dev` command with development server and HMR
  - `build` command for production builds
  - `preview` command for testing production builds
  - `generate` command for scaffolding components and pages
  - `deploy` command for simplified deployment

- **Templates**
  - Basic starter template
  - TypeScript template with modern features

- **Performance Optimizations**
  - Extreme performance with <16kb JS payload
  - Native ESM imports without bundling
  - Precomputed static content

- **Documentation**
  - Comprehensive README with usage examples
  - TypeScript type definitions

### Dependencies
- kleur (^4.1.5) for terminal colors
- prompts (^2.4.2) for interactive CLI
- zod (^3.22.4) for validation
- execa (^8.0.1) for executing commands
- picocolors (^1.0.0) for terminal styling
- chokidar (^3.6.0) for file watching
- fast-glob (^3.3.2) for file pattern matching
- lightningcss (^1.24.0) for CSS processing

## [0.0.1]

### Added
- Initial project setup
- Basic project structure
- Core concepts and design principles
