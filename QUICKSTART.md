# 0x1 Framework - Quick Start Guide

## Installation

Install the 0x1 framework globally:

```bash
# Using Bun (preferred)
bun install -g 0x1
```

### Important: PATH Configuration

Bun installs global binaries to `~/.bun/bin`, but doesn't automatically add this to your PATH.

**If you get a "command not found" error after installation, add the following to your shell config:**

For **Bash** users (add to `~/.bashrc`):
```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

For **Zsh** users (add to `~/.zshrc`):
```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

For **Fish** users (add to `~/.config/fish/config.fish`):
```bash
set -gx BUN_INSTALL "$HOME/.bun"
set -gx PATH "$BUN_INSTALL/bin" $PATH
```

After updating your shell config, reload it:
```bash
# For bash/zsh
source ~/.bashrc  # or ~/.zshrc

# For fish
source ~/.config/fish/config.fish
```

## Alternative: Use Without Installation

You can also use 0x1 without installing it globally:

```bash
bunx 0x1 <command>
```

## Basic Usage

Create a new project:
```bash
0x1 new my-project
```

Start development server:
```bash
cd my-project
0x1 dev
```

Build for production:
```bash
0x1 build
```

## Advanced Usage

For more details, see the full documentation:
```bash
0x1 help
```
