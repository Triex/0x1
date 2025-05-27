/**
 * Global JSX declarations for the 0x1 framework
 * This provides VSCode with the necessary information to understand JSX syntax
 */

// Define global JSX namespace for TypeScript tooling without importing conflicting types
declare global {
  // Separate 0x1 elements from the global JSX namespace to avoid conflicts
  namespace ZeroX1JSX {
    // Framework-specific element interfaces
    interface Element {
      [key: string]: any;
    }
  }
  
  // Standard JSX namespace for TypeScript tooling
  namespace JSX {
    // Using 'any' type to avoid conflicts with other type declarations
    interface Element {
      [key: string]: any;
    }
    
    interface ElementAttributesProperty {
      props: any;
    }
    
    interface ElementChildrenAttribute {
      children: any;
    }
    
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Ensure this is treated as a module
export {};
