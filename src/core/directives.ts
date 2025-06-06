/**
 * 0x1 Client/Server Directives - Next15 Compatible
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
 * Also provides automatic context inference and validation
 */
export function processDirectives(sourceCode: string, filename: string): {
  code: string;
  directive: 'client' | 'server' | null;
  serverFunctions: string[];
  errors: Array<{ type: string; message: string; line: number; suggestion: string }>;
  inferredContext?: 'client' | 'server';
} {
  const lines = sourceCode.split('\n');
  let directive: 'client' | 'server' | null = null;
  const serverFunctions: string[] = [];
  const errors: Array<{ type: string; message: string; line: number; suggestion: string }> = [];
  let inferredContext: 'client' | 'server' | undefined;
  
  // Check for explicit directives in the first few lines
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
  
  // If no explicit directive, try to infer context
  if (!directive) {
    inferredContext = inferContextFromCode(sourceCode, filename);
    if (inferredContext) {
      // Add helpful comment about inferred context
      const contextComment = `// 0x1 Auto-inferred: This file is treated as "${inferredContext}" context\n// Add "use ${inferredContext}" at the top to make this explicit\n\n`;
      sourceCode = contextComment + sourceCode;
    }
  }
  
  const finalContext = directive || inferredContext;
  
  // Validate context usage and collect errors
  if (finalContext) {
    const validationErrors = validateContextUsage(sourceCode, finalContext, filename);
    errors.push(...validationErrors);
  }
  
  let processedCode = sourceCode;
  
  // Process server files
  if (finalContext === 'server') {
    // Find async function declarations and expressions
    const asyncFunctionRegex = /(?:export\s+)?async\s+function\s+(\w+)/g;
    const asyncArrowRegex = /(?:export\s+)?const\s+(\w+)\s*=\s*async\s*\(/g;
    const nonAsyncFunctionRegex = /(?:export\s+)?function\s+(\w+)/g;
    const nonAsyncArrowRegex = /(?:export\s+)?const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g;
    
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
    
    // Check for non-async functions in server context (potential error)
    while ((match = nonAsyncFunctionRegex.exec(sourceCode)) !== null) {
      const functionName = match[1];
      // Skip if it's a component (starts with capital letter)
      if (!/^[A-Z]/.test(functionName)) {
        const lineNumber = sourceCode.substring(0, match.index).split('\n').length;
        errors.push({
          type: 'server-context-warning',
          message: `Function '${functionName}' in server context should typically be async`,
          line: lineNumber,
          suggestion: `Consider making this function async or move it to a client component if it doesn't need server-side execution`
        });
      }
    }
    
    // Add server action registration at the end - but only if this is actually server-side code
    // Don't add imports that would break in the browser
    if (serverFunctions.length > 0) {
      const registrationCode = `
// 0x1 Server Action Registration (server-side only)
// Note: Server actions are automatically registered during transpilation
`;
      processedCode += registrationCode;
    }
  }
  
  // Process client files
  if (finalContext === 'client') {
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
    
    // Check for async functions in client context (potential error)
    const asyncInClientRegex = /(?:export\s+)?(?:async\s+function|const\s+\w+\s*=\s*async)/g;
    while ((match = asyncInClientRegex.exec(sourceCode)) !== null) {
      const lineNumber = sourceCode.substring(0, match.index).split('\n').length;
      errors.push({
        type: 'client-context-warning',
        message: 'Async functions in client components should use React hooks like useEffect for async operations',
        line: lineNumber,
        suggestion: 'Use useEffect(() => { async function fetchData() { ... } fetchData(); }, []) for async operations in client components'
      });
    }
    
    // Add client component registration - but only as comments to avoid import errors
    if (components.length > 0) {
      const registrationCode = `
// 0x1 Client Component Registration (processed server-side)
// Components: ${components.join(', ')}
`;
      processedCode += registrationCode;
    }
  }
  
  return {
    code: processedCode,
    directive,
    serverFunctions,
    errors,
    inferredContext
  };
}

/**
 * Infer context from code patterns when no explicit directive is present
 */
function inferContextFromCode(sourceCode: string, filename: string): 'client' | 'server' | undefined {
  // Server context indicators
  const serverIndicators = [
    /import.*from\s+['"]fs['"]/, // File system operations
    /import.*from\s+['"]path['"]/, // Path operations
    /import.*from\s+['"]crypto['"]/, // Crypto operations
    /await\s+fetch\(/g, // Server-side fetch operations
    /process\.env\./g, // Environment variables
    /import.*from\s+['"]database['"]/, // Database imports
    /\.sql\(/g, // SQL operations
    /\.query\(/g, // Database queries
  ];
  
  // Client context indicators
  const clientIndicators = [
    /import.*useState.*from/, // React hooks
    /import.*useEffect.*from/, // React hooks
    /useState\(/g, // useState usage
    /useEffect\(/g, // useEffect usage
    /window\./g, // Browser window object
    /document\./g, // Browser document object
    /localStorage\./g, // Browser storage
    /sessionStorage\./g, // Browser storage
    /addEventListener\(/g, // Event listeners
    /onClick=/g, // Event handlers
    /onChange=/g, // Event handlers
  ];
  
  let serverScore = 0;
  let clientScore = 0;
  
  // Check server indicators
  for (const pattern of serverIndicators) {
    const matches = sourceCode.match(pattern);
    if (matches) {
      serverScore += matches.length;
    }
  }
  
  // Check client indicators
  for (const pattern of clientIndicators) {
    const matches = sourceCode.match(pattern);
    if (matches) {
      clientScore += matches.length;
    }
  }
  
  // File name hints
  if (filename.includes('action') || filename.includes('server')) {
    serverScore += 2;
  }
  
  if (filename.includes('component') || filename.includes('client') || filename.includes('hook')) {
    clientScore += 2;
  }
  
  // Return inferred context
  if (serverScore > clientScore && serverScore > 0) {
    return 'server';
  } else if (clientScore > serverScore && clientScore > 0) {
    return 'client';
  }
  
  return undefined; // Cannot infer
}

/**
 * Validate that code follows context-specific best practices
 */
function validateContextUsage(sourceCode: string, context: 'client' | 'server', filename: string): Array<{ type: string; message: string; line: number; suggestion: string }> {
  const errors: Array<{ type: string; message: string; line: number; suggestion: string }> = [];
  const lines = sourceCode.split('\n');
  
  if (context === 'server') {
    // Check for browser-only APIs in server context
    const browserAPIs = [
      { pattern: /window\./g, name: 'window' },
      { pattern: /document\./g, name: 'document' },
      { pattern: /localStorage\./g, name: 'localStorage' },
      { pattern: /sessionStorage\./g, name: 'sessionStorage' },
      { pattern: /addEventListener\(/g, name: 'addEventListener' },
    ];
    
    for (const api of browserAPIs) {
      let match;
      while ((match = api.pattern.exec(sourceCode)) !== null) {
        const lineNumber = sourceCode.substring(0, match.index).split('\n').length;
        errors.push({
          type: 'server-context-error',
          message: `Cannot use browser API '${api.name}' in server context`,
          line: lineNumber,
          suggestion: `Move this code to a client component with "use client" directive`
        });
      }
    }
    
    // Check for React hooks in server context
    const reactHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef'];
    for (const hook of reactHooks) {
      const pattern = new RegExp(`\\b${hook}\\(`, 'g');
      let match;
      while ((match = pattern.exec(sourceCode)) !== null) {
        const lineNumber = sourceCode.substring(0, match.index).split('\n').length;
        errors.push({
          type: 'server-context-error',
          message: `Cannot use React hook '${hook}' in server context`,
          line: lineNumber,
          suggestion: `Move this component to a client file with "use client" directive`
        });
      }
    }
  }
  
  if (context === 'client') {
    // Check for server-only APIs in client context
    const serverAPIs = [
      { pattern: /require\(['"]fs['"]\)/g, name: 'fs' },
      { pattern: /import.*from\s+['"]fs['"]/, name: 'fs' },
      { pattern: /require\(['"]path['"]\)/g, name: 'path' },
      { pattern: /process\.env\./g, name: 'process.env' },
    ];
    
    for (const api of serverAPIs) {
      let match;
      while ((match = api.pattern.exec(sourceCode)) !== null) {
        const lineNumber = sourceCode.substring(0, match.index).split('\n').length;
        errors.push({
          type: 'client-context-error',
          message: `Cannot use server API '${api.name}' in client context`,
          line: lineNumber,
          suggestion: `Move this code to a server action with "use server" directive`
        });
      }
    }
  }
  
  return errors;
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