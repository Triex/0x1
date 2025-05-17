/**
 * 0x1 Logger
 * Beautiful terminal output for 0x1 CLI
 */

import kleur from 'kleur';

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

// Enable colorful output
kleur.enabled = true;

// Gradient colors for beautiful outputs
const gradientColors = [
  (text: string) => kleur.cyan().bold(text),
  (text: string) => kleur.blue().bold(text),
  (text: string) => kleur.magenta().bold(text)
];

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
      console.log(kleur.cyan().bold(line));
    });
    console.log();
  },

  /**
   * Highlight text for output (useful in URLs, file paths, etc.)
   */
  highlight: (text: string) => {
    return kleur.cyan().bold(text);
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
    console.log(kleur.blue(icons.info), message);
  },

  /**
   * Log a success message
   */
  success: (message: string) => {
    console.log(kleur.green(icons.success), message);
  },

  /**
   * Log a warning message
   */
  warn: (message: string) => {
    console.log(kleur.yellow(icons.warning), message);
  },

  /**
   * Log an error message
   */
  error: (message: string) => {
    console.log(kleur.red(icons.error), message);
  },

  /**
   * Log a debugging message (only in verbose mode)
   */
  debug: (message: string) => {
    if (process.env.DEBUG === 'true') {
      console.log(kleur.dim(icons.debug), kleur.dim(message));
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
    console.log(kleur.dim('$ ') + kleur.bold(cmd));
  },

  /**
   * Display a section header with gradient styling
   */
  section: (title: string) => {
    console.log();
    const gradientTitle = applyGradient(title.toUpperCase());
    const line = kleur.cyan('═'.repeat(title.length + 4));
    console.log(line);
    console.log(kleur.cyan('║') + ' ' + gradientTitle + ' ' + kleur.cyan('║'));
    console.log(line);
  },

  /**
   * Display information in a beautiful box
   */
  box: (content: string) => {
    const lines = content.split('\n');
    const width = Math.max(...lines.map(line => stripAnsi(line).length)) + 2;
    
    // Top border with rounded corners
    console.log(kleur.dim('╭' + '─'.repeat(width) + '╮'));
    
    // Content lines with padding
    for (const line of lines) {
      console.log(kleur.dim('│') + ' ' + line + ' '.repeat(width - stripAnsi(line).length - 1) + kleur.dim('│'));
    }
    
    // Bottom border with rounded corners
    console.log(kleur.dim('╰' + '─'.repeat(width) + '╯'));
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
    const taskIcon = type ? kleur.cyan(icon) + ' ' : '';
    const displayMessage = taskIcon + message;
    
    // Add subtle gradient effect to the message
    const spinnerText = message.includes(':') 
      ? message.split(':').map((part, idx) => 
          idx === 0 ? applyGradient(part) + ':' : part
        ).join(' ')
      : message;
    
    process.stdout.write(`${kleur.cyan(frames[0])} ${displayMessage}`);
    
    const interval = setInterval(() => {
      i = (i + 1) % frames.length;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${kleur.cyan(frames[i])} ${displayMessage}`);
    }, 80);
    
    return {
      stop: (type: 'success' | 'error' | 'warn', endMessage?: string) => {
        clearInterval(interval);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        
        const icon = type === 'success' 
          ? kleur.green(icons.success) 
          : type === 'error' 
            ? kleur.red(icons.error) 
            : kleur.yellow(icons.warning);
        
        // Make success messages more beautiful
        if (type === 'success') {
          const successMsg = endMessage || message;
          const finalMsg = successMsg.includes(':') 
            ? successMsg.split(':').map((part, idx) => 
                idx === 0 ? kleur.green().bold(part) + ':' : part
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
        kleur.bold(h.padEnd(widths[i]))
      )
    );
    
    // Print header separator
    console.log(
      ...headers.map((_, i) => 
        kleur.dim('─'.repeat(widths[i]))
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
    return kleur.blue().dim(`'${text}'`);
  },

  /**
   * Format text as command
   */
  cmd: (text: string) => {
    return kleur.yellow(`${text}`);
  },

  /**
   * Update spinner text
   */
  update: (message: string) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${kleur.cyan('⠋')} ${kleur.cyan(message)}`);
  }
};
