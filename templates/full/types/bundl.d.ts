/**
 * Type declarations for 0x1 framework
 */

declare module '0x1' {
  /**
   * Template literal tag for HTML content
   */
  export function html(strings: TemplateStringsArray, ...values: any[]): string;
  
  /**
   * Router for client-side routing
   */
  export class Router {
    constructor(rootElement: HTMLElement);
    
    /**
     * Add a route to the router
     */
    addRoute(path: string, handler: RouteHandler): void;
    
    /**
     * Set a handler for 404 Not Found routes
     */
    setNotFound(handler: RouteHandler): void;
    
    /**
     * Initialize the router
     */
    init(): void;
    
    /**
     * Navigate to a specific path
     */
    navigate(path: string): void;
  }
  
  /**
   * Route handler function type
   */
  type RouteHandler = (params?: Record<string, string>) => string | Promise<string>;
  
  /**
   * Server-side API utilities
   */
  export const server: {
    /**
     * Set HTTP status code for the response
     */
    status(code: number): typeof server;
    
    /**
     * Send JSON response
     */
    json(data: any): Response;
    
    /**
     * Send plain text response
     */
    text(data: string): Response;
    
    /**
     * Send HTML response
     */
    html(data: string): Response;
  };
}
