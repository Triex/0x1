/**
 * 0x1 Logger
 * Beautiful terminal output for 0x1 CLI
 */

// Using Bun's native console styling capabilities instead of kleur

/**
 * Remove ANSI escape codes from a string
 * Used for calculating correct lengths for terminal output
 */
function stripAnsi(string: string): string {
  // This regex pattern matches all ANSI escape codes
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  ].join('|');
  
  return string.replace(new RegExp(pattern, 'g'), '');
}

// Gradient colors for beautiful outputs using Bun's native console styling
const gradientColors = [
  (text: string) => `\x1b[1;36m${text}\x1b[0m`, // cyan bold
  (text: string) => `\x1b[1;34m${text}\x1b[0m`, // blue bold
  (text: string) => `\x1b[1;35m${text}\x1b[0m`  // magenta bold
];

// ANSI color code helpers
const colors = {
  reset: '\x1b[0m',
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
  // Combined styles
  cyanBold: (text: string) => `\x1b[1;36m${text}\x1b[0m`,
  blueBold: (text: string) => `\x1b[1;34m${text}\x1b[0m`,
  greenBold: (text: string) => `\x1b[1;32m${text}\x1b[0m`,
  redBold: (text: string) => `\x1b[1;31m${text}\x1b[0m`,
  yellowBold: (text: string) => `\x1b[1;33m${text}\x1b[0m`,
  magentaBold: (text: string) => `\x1b[1;35m${text}\x1b[0m`,
  cyanDim: (text: string) => `\x1b[2;36m${text}\x1b[0m`,
  blueDim: (text: string) => `\x1b[2;34m${text}\x1b[0m`
};

// Beautiful icons for different states
const icons = {
  info: '💠',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  debug: '🔍',
  build: '🔨',
  dev: '🚀',
  server: '🌐',
  file: '📄',
  css: '🎨',
  js: '📦',
  typescript: '📘',
};

// Apply gradient to text
function applyGradient(text: string): string {
  const chars = text.split('');
  let colored = '';
  
  chars.forEach((char, i) => {
    const colorFn = gradientColors[i % gradientColors.length];
    colored += colorFn(char);
  });
  
  return colored;
}

export const logger = {
  /**
   * Display a banner with colorful text
   */
  banner: (lines: string[]) => {
    console.log();
    lines.forEach(line => {
      console.log(colors.cyanBold(line));
    });
    console.log();
  },

  /**
   * Highlight text for output (useful in URLs, file paths, etc.)
   */
  highlight: (text: string) => {
    return colors.cyanBold(text);
  },

  /**
   * Apply gradient to text for beautiful headers
   */
  gradient: (text: string) => {
    return applyGradient(text);
  },

  /**
   * Log an info message
   */
  info: (message: string) => {
    console.log(colors.blue(icons.info), message);
  },

  /**
   * Log a success message
   */
  success: (message: string) => {
    console.log(colors.green(icons.success), message);
  },

  /**
   * Log a warning message
   */
  warn: (message: string) => {
    console.log(colors.yellow(icons.warning), message);
  },

  /**
   * Log an error message
   */
  error: (message: string) => {
    console.log(colors.red(icons.error), message);
  },

  /**
   * Log a debugging message (only in verbose mode)
   */
  debug: (message: string) => {
    if (process.env.DEBUG === 'true') {
      console.log(colors.dim(icons.debug), colors.dim(message));
    }
  },

  /**
   * Add a newline for spacing
   */
  spacer: () => {
    console.log();
  },

  /**
   * Log a command being executed
   */
  command: (cmd: string) => {
    console.log(colors.dim('$ ') + colors.bold(cmd));
  },

  /**
   * Display a section header with gradient styling
   */
  section: (title: string) => {
    console.log();
    const gradientTitle = applyGradient(title.toUpperCase());
    const line = colors.cyan('═'.repeat(title.length + 4));
    console.log(line);
    console.log(colors.cyan('║') + ' ' + gradientTitle + ' ' + colors.cyan('║'));
    console.log(line);
  },

  /**
   * Display information in a beautiful box
   */
  box: (content: string) => {
    const lines = content.split('\n');
    const width = Math.max(...lines.map(line => stripAnsi(line).length)) + 2;
    
    // Top border with rounded corners
    console.log(colors.dim('╭' + '─'.repeat(width) + '╮'));
    
    // Content lines with padding
    for (const line of lines) {
      console.log(colors.dim('│') + ' ' + line + ' '.repeat(width - stripAnsi(line).length - 1) + colors.dim('│'));
    }
    
    // Bottom border with rounded corners
    console.log(colors.dim('╰' + '─'.repeat(width) + '╯'));
  },

  /**
   * Display a spinner with a message
   * Returns a function to stop the spinner with a success/error message
   */
  spinner: (message: string, type?: keyof typeof icons) => {
    // Beautiful spinner frames
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    
    // Choose the icon based on type or use default
    const icon = type ? icons[type] : ''; 
    
    // Create colorful message with icon if provided
    const taskIcon = type ? colors.cyan(icon) + ' ' : '';
    const displayMessage = taskIcon + message;
    
    // Add subtle gradient effect to the message
    const spinnerText = message.includes(':') 
      ? message.split(':').map((part, idx) => 
          idx === 0 ? applyGradient(part) + ':' : part
        ).join(' ')
      : message;
    
    process.stdout.write(`${colors.cyan(frames[0])} ${displayMessage}`);
    
    const interval = setInterval(() => {
      i = (i + 1) % frames.length;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${colors.cyan(frames[i])} ${displayMessage}`);
    }, 80);
    
    return {
      stop: (type: 'success' | 'error' | 'warn', endMessage?: string) => {
        clearInterval(interval);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        
        const icon = type === 'success' 
          ? colors.green(icons.success) 
          : type === 'error'
            ? colors.red(icons.error) 
            : colors.yellow(icons.warning);
        
        // Make success messages more beautiful
        if (type === 'success') {
          const successMsg = endMessage || message;
          const finalMsg = successMsg.includes(':') 
            ? successMsg.split(':').map((part, idx) => 
                idx === 0 ? colors.greenBold(part) + ':' : part
              ).join(' ')
            : successMsg;
          console.log(`${icon} ${finalMsg}`);
        } else {
          console.log(`${icon} ${endMessage || message}`);
        }
      }
    };
  },

  /**
   * Create a table with rows and columns
   */
  table: (headers: string[], rows: string[][]) => {
    // Calculate column widths
    const widths = headers.map((h, i) => {
      const columnValues = [h, ...rows.map(row => row[i] || '')];
      return Math.max(...columnValues.map(v => v.length)) + 2;
    });
    
    // Print header
    console.log();
    console.log(
      ...headers.map((h, i) => 
        colors.bold(h.padEnd(widths[i]))
      )
    );
    
    // Print header separator
    console.log(
      ...headers.map((_, i) => 
        colors.dim('─'.repeat(widths[i]))
      )
    );
    
    // Print rows
    rows.forEach(row => {
      console.log(
        ...row.map((cell, i) => 
          cell.padEnd(widths[i])
        )
      );
    });
    
    console.log();
  },

  /**
   * Log a plain message (useful for formatted output)
   */
  log: (message: string) => {
    console.log(message);
  },

  /**
   * Format text as code (e.g., for commands, file paths)
   */
  code: (text: string) => {
    return colors.blueDim(`'${text}'`);
  },

  /**
   * Format text as command
   */
  cmd: (text: string) => {
    return colors.yellow(`${text}`);
  },

  /**
   * Update spinner text
   */
  update: (message: string) => {
    // Provide the direction argument to clearLine (0 = entire line)
    process.stdout.clearLine(0);
    process.stdout.write('\r');
    process.stdout.write(`${colors.cyan('⠋')} ${colors.cyan(message)}`);
  }
};
