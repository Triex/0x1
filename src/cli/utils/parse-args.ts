/**
 * 0x1 CLI Argument Parser
 * Parses command line arguments for the CLI
 */

interface Args {
  _: string[];
  [key: string]: any;
}

/**
 * Parse command line arguments into a structured object
 * 
 * @param args Command line arguments array
 * @returns Parsed arguments object
 */
export function parseArgs(args: string[]): Args {
  const result: Args = { _: [] };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Handle flags (--flag or -f)
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      
      // Handle --no-flag syntax
      if (key.startsWith('no-')) {
        const realKey = key.slice(3);
        result[realKey] = false;
        continue;
      }
      
      // Handle --flag=value syntax
      if (key.includes('=')) {
        const [flagKey, flagValue] = key.split('=');
        result[flagKey] = parseValue(flagValue);
        continue;
      }
      
      // Handle --flag value syntax
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        result[key] = parseValue(args[i + 1]);
        i++;
      } else {
        // Boolean flag
        result[key] = true;
      }
      continue;
    }
    
    // Handle short flags (-f)
    if (arg.startsWith('-') && !arg.startsWith('--') && arg !== '-') {
      const flags = arg.slice(1).split('');
      
      for (let j = 0; j < flags.length; j++) {
        const flag = flags[j];
        
        // For the last flag in a group, check if the next arg is a value
        if (j === flags.length - 1 && i + 1 < args.length && !args[i + 1].startsWith('-')) {
          result[flag] = parseValue(args[i + 1]);
          i++;
        } else {
          result[flag] = true;
        }
      }
      
      continue;
    }
    
    // Handle positional arguments
    result._.push(arg);
  }
  
  return result;
}

/**
 * Parse a string value into its appropriate type
 */
function parseValue(value: string): any {
  // Handle numbers
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  
  // Handle floats
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }
  
  // Handle booleans
  if (value.toLowerCase() === 'true') {
    return true;
  }
  
  if (value.toLowerCase() === 'false') {
    return false;
  }
  
  // Handle null
  if (value.toLowerCase() === 'null') {
    return null;
  }
  
  // Handle undefined
  if (value.toLowerCase() === 'undefined') {
    return undefined;
  }
  
  // Return as string
  return value;
}
