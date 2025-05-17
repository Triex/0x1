/**
 * 0x1 Logger
 * Beautiful terminal output for 0x1 CLI
 */

import kleur from 'kleur';

// Enable colorful output
kleur.enabled = true;

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
   * Log an info message
   */
  info: (message: string) => {
    console.log(kleur.blue('ℹ'), message);
  },

  /**
   * Log a success message
   */
  success: (message: string) => {
    console.log(kleur.green('✓'), message);
  },

  /**
   * Log a warning message
   */
  warn: (message: string) => {
    console.log(kleur.yellow('⚠'), message);
  },

  /**
   * Log an error message
   */
  error: (message: string) => {
    console.log(kleur.red('✗'), message);
  },

  /**
   * Log a debugging message (only in verbose mode)
   */
  debug: (message: string) => {
    if (process.env.DEBUG === 'true') {
      console.log(kleur.dim('🐛'), kleur.dim(message));
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
   * Display a section header
   */
  section: (title: string) => {
    console.log();
    console.log(kleur.bold(kleur.cyan(`■ ${title}`)));
    console.log(kleur.dim('─'.repeat(title.length + 2)));
  },

  /**
   * Display a spinner with a message
   * Returns a function to stop the spinner with a success/error message
   */
  spinner: (message: string) => {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const spinnerText = kleur.cyan(message);
    
    process.stdout.write(`${frames[0]} ${spinnerText}`);
    
    const interval = setInterval(() => {
      i = (i + 1) % frames.length;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${kleur.cyan(frames[i])} ${spinnerText}`);
    }, 80);
    
    return {
      stop: (type: 'success' | 'error' | 'warn', endMessage?: string) => {
        clearInterval(interval);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        
        const icon = type === 'success' 
          ? kleur.green('✓') 
          : type === 'error' 
            ? kleur.red('✗') 
            : kleur.yellow('⚠');
        
        console.log(`${icon} ${endMessage || message}`);
      }
    };
  },

  /**
   * Create a box with a message
   */
  box: (message: string) => {
    const lines = message.split('\n');
    const width = Math.max(...lines.map(line => line.length)) + 2;
    
    console.log();
    console.log(kleur.cyan('┌' + '─'.repeat(width) + '┐'));
    
    lines.forEach(line => {
      const padding = ' '.repeat(width - line.length - 1);
      console.log(kleur.cyan('│') + ` ${line}${padding}` + kleur.cyan('│'));
    });
    
    console.log(kleur.cyan('└' + '─'.repeat(width) + '┘'));
    console.log();
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
   * Highlight text in output
   */
  highlight: (text: string) => {
    return kleur.cyan().bold(text);
  },

  /**
   * Format text as code
   */
  code: (text: string) => {
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
