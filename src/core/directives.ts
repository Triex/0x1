/**
 * 0x1 Client/Server Directives - Next.js 15 Compatible
 * Provides "use client" and "use server" directive support
 */

// Global directive tracking
const componentDirectives = new Map<string, 'client' | 'server'>();
const serverFunctions = new Map<string, (...args: any[]) => any>();

/**
 * Mark a component or function as client-side only
 * Usage: Add "use client" at the top of your file
 */
export function markAsClient(componentOrFunction: any, name?: string): void {
  const key = name || componentOrFunction.name || 'anonymous';
  componentDirectives.set(key, 'client');
}

/**
 * Mark a function as server-side only
 * Usage: Add "use server" at the top of your file
 */
export function markAsServer(serverFunction: (...args: any[]) => any, name?: string): void {
  const key = name || serverFunction.name || 'anonymous';
  componentDirectives.set(key, 'server');
  serverFunctions.set(key, serverFunction);
}

/**
 * Check if a component/function is marked as client-side
 */
export function isClientComponent(name: string): boolean {
  return componentDirectives.get(name) === 'client';
}

/**
 * Check if a function is marked as server-side
 */
export function isServerFunction(name: string): boolean {
  return componentDirectives.get(name) === 'server';
}

/**
 * Execute a server function (creates internal API call)
 */
export async function executeServerFunction(name: string, ...args: any[]): Promise<any> {
  const serverFunction = serverFunctions.get(name);
  
  if (!serverFunction) {
    throw new Error(`Server function "${name}" not found`);
  }
  
  // In browser environment, make API call to server
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/__0x1_server_action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionName: name,
          args: args
        })
      });
      
      if (!response.ok) {
        // handleError(`Server function failed: ${response.statusText}`);
        throw new Error(`Server function failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error executing server function "${name}":`, error);
      throw error;
    }
  }
  
  // In server environment, execute directly
  try {
    return await serverFunction(...args);
  } catch (error) {
    console.error(`Error executing server function "${name}":`, error);
    throw error;
  }
}

/**
 * Create a server action wrapper
 * This automatically handles the server/client boundary
 */
export function createServerAction<T extends (...args: any[]) => any>(
  serverFunction: T,
  name?: string
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  const functionName = name || serverFunction.name || 'anonymous';
  markAsServer(serverFunction, functionName);
  
  return ((...args: Parameters<T>) => {
    return executeServerFunction(functionName, ...args);
  });
}

/**
 * Directive processor for transpilation
 * This processes "use client" and "use server" directives in source code
 */
export function processDirectives(sourceCode: string, filename: string): {
  code: string;
  directive: 'client' | 'server' | null;
  serverFunctions: string[];
} {
  const lines = sourceCode.split('\n');
  let directive: 'client' | 'server' | null = null;
  const serverFunctions: string[] = [];
  
  // Check for directives in the first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    if (line === '"use client"' || line === "'use client'") {
      directive = 'client';
      break;
    }
    
    if (line === '"use server"' || line === "'use server'") {
      directive = 'server';
      break;
    }
  }
  
  let processedCode = sourceCode;
  
  // If it's a server file, wrap async functions as server actions
  if (directive === 'server') {
    // Find async function declarations and expressions
    const asyncFunctionRegex = /(?:export\s+)?async\s+function\s+(\w+)/g;
    const asyncArrowRegex = /(?:export\s+)?const\s+(\w+)\s*=\s*async\s*\(/g;
    
    let match;
    
    // Process async function declarations
    while ((match = asyncFunctionRegex.exec(sourceCode)) !== null) {
      const functionName = match[1];
      serverFunctions.push(functionName);
    }
    
    // Process async arrow functions
    while ((match = asyncArrowRegex.exec(sourceCode)) !== null) {
      const functionName = match[1];
      serverFunctions.push(functionName);
    }
    
    // Add server action registration at the end
    if (serverFunctions.length > 0) {
      const registrationCode = `
// 0x1 Server Action Registration
import { markAsServer } from '0x1/core/directives';
${serverFunctions.map(name => `markAsServer(${name}, '${name}');`).join('\n')}
`;
      processedCode += registrationCode;
    }
  }
  
  // If it's a client file, add client marking
  if (directive === 'client') {
    // Find component exports
    const componentRegex = /export\s+(?:default\s+)?function\s+(\w+)/g;
    const componentArrowRegex = /export\s+const\s+(\w+)\s*=\s*\(/g;
    
    const components: string[] = [];
    let match;
    
    while ((match = componentRegex.exec(sourceCode)) !== null) {
      components.push(match[1]);
    }
    
    while ((match = componentArrowRegex.exec(sourceCode)) !== null) {
      components.push(match[1]);
    }
    
    if (components.length > 0) {
      const registrationCode = `
// 0x1 Client Component Registration
import { markAsClient } from '0x1/core/directives';
${components.map(name => `markAsClient(${name}, '${name}');`).join('\n')}
`;
      processedCode += registrationCode;
    }
  }
  
  return {
    code: processedCode,
    directive,
    serverFunctions
  };
}

/**
 * Server action handler for the dev server
 * This handles /__0x1_server_action requests
 */
export async function handleServerAction(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const { functionName, args } = await request.json();
    
    if (!functionName || !serverFunctions.has(functionName)) {
      return new Response(
        JSON.stringify({ error: `Server function "${functionName}" not found` }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const serverFunction = serverFunctions.get(functionName)!;
    const result = await serverFunction(...(args || []));
    
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Server action error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Type definitions for server functions
 */
export type ServerFunction<T extends (...args: any[]) => any> = T extends (...args: infer P) => infer R
  ? (...args: P) => Promise<Awaited<R>>
  : never;

/**
 * Utility to create typed server actions
 */
export function serverAction<T extends (...args: any[]) => any>(fn: T): ServerFunction<T> {
  return createServerAction(fn) as unknown as ServerFunction<T>;
}

/**
 * Client component wrapper
 * Use this to explicitly mark components as client-side
 */
export function clientComponent<T extends (...args: any[]) => any>(component: T): T {
  markAsClient(component);
  return component;
}

/**
 * Initialize directive system
 */
export function initializeDirectives(): void {
  // Set up global error handling for server actions
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('Server function')) {
        console.error('Unhandled server action error:', event.reason);
      }
    });
  }
} 