/**
 * 0x1 Framework - Error Boundary Middleware
 * Provides elegant error handling for the development server
 */

import { logger } from '../../utils/logger';

// Error response types
export type ErrorResponseOptions = {
  statusCode?: number;
  title?: string;
  error?: Error | string;
  details?: string;
  isDev?: boolean;
};

/**
 * Create an error response with beautiful formatting
 */
export function createErrorResponse(options: ErrorResponseOptions): Response {
  const {
    statusCode = 500,
    title = 'Server Error',
    error,
    details,
    isDev = process.env.NODE_ENV !== 'production'
  } = options;
  
  // Log the error
  if (error) {
    logger.error(`Server error (${statusCode}): ${error}`);
  }
  
  // Create the error HTML
  const html = generateErrorHTML({
    statusCode,
    title,
    errorMessage: error instanceof Error ? error.message : error as string,
    errorStack: isDev && error instanceof Error ? error.stack : undefined,
    details
  });
  
  // Return the response
  return new Response(html, {
    status: statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

/**
 * Generate error HTML with beautiful styling
 */
function generateErrorHTML(props: {
  statusCode: number;
  title: string;
  errorMessage?: string;
  errorStack?: string;
  details?: string;
}): string {
  const { statusCode, title, errorMessage, errorStack, details } = props;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusCode} - ${title}</title>
  <style>
    :root {
      --primary-color: #1e88e5;
      --error-color: #e53935;
      --text-color: #333;
      --background-color: #f9f9f9;
      --card-background: #fff;
      --border-color: #eaeaea;
      --code-background: #f5f5f5;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --primary-color: #90caf9;
        --error-color: #ef5350;
        --text-color: #e0e0e0;
        --background-color: #121212;
        --card-background: #1e1e1e;
        --border-color: #333;
        --code-background: #2d2d2d;
      }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      background-color: var(--background-color);
      padding: 2rem 1rem;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .error-card {
      background-color: var(--card-background);
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      margin-bottom: 2rem;
      border-left: 5px solid var(--error-color);
    }
    
    .error-title {
      display: flex;
      align-items: center;
      margin-bottom: 1.5rem;
      color: var(--error-color);
    }
    
    .error-title h1 {
      font-size: 1.8rem;
      font-weight: 600;
      margin-left: 0.75rem;
    }
    
    .error-code {
      background-color: var(--error-color);
      color: white;
      border-radius: 0.25rem;
      padding: 0.25rem 0.5rem;
      font-family: monospace;
      font-weight: bold;
      margin-right: 1rem;
    }
    
    .error-message {
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .error-stack {
      background-color: var(--code-background);
      border-radius: 0.25rem;
      padding: 1rem;
      overflow-x: auto;
      font-family: monospace;
      font-size: 0.9rem;
      white-space: pre-wrap;
      margin-bottom: 1.5rem;
    }
    
    .error-details {
      font-size: 0.95rem;
      opacity: 0.9;
    }
    
    .footer {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.9rem;
      color: #666;
    }
    
    .footer a {
      color: var(--primary-color);
      text-decoration: none;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-card">
      <div class="error-title">
        <span class="error-code">${statusCode}</span>
        <h1>${title}</h1>
      </div>
      
      ${errorMessage ? `<div class="error-message">${errorMessage}</div>` : ''}
      
      ${errorStack ? `<div class="error-stack">${errorStack}</div>` : ''}
      
      ${details ? `<div class="error-details">${details}</div>` : ''}
    </div>
    
    <div class="footer">
      <p>Powered by <a href="https://github.com/Triex/0x1" target="_blank">0x1 Framework</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Server-side error boundary middleware
 */
export interface ErrorBoundaryOptions {
  showStack?: boolean;
  logErrors?: boolean;
}

export function createErrorBoundary(options: ErrorBoundaryOptions = {}) {
  const { showStack = true, logErrors = true } = options;

  return {
    handleError(error: any, request?: Request): Response {
      if (logErrors) {
        logger.error(`Error boundary caught: ${error instanceof Error ? error.message : String(error)}`);
      }

      const url = request ? new URL(request.url) : null;
      const isAPIRequest = url?.pathname.startsWith('/api/');
      const isJSRequest = url?.pathname.endsWith('.js');

      if (isAPIRequest) {
        return new Response(JSON.stringify({
          error: error.message,
          stack: showStack ? error.stack : undefined
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (isJSRequest) {
        return new Response(`
console.error('Server error:', ${JSON.stringify(error.message)});
if (window.ErrorBoundary) {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = \`
      <div style="padding: 20px; color: red; border: 2px solid red; background: #ffe6e6;">
        <h3>Server Error</h3>
        <pre>\${${JSON.stringify(error.message)}}</pre>
        ${showStack ? `<details><summary>Stack</summary><pre>\${${JSON.stringify(error.stack)}}</pre></details>` : ''}
      </div>
    \`;
  }
}
        `, {
          status: 500,
          headers: { "Content-Type": "application/javascript" }
        });
      }

      // HTML error page
      return new Response(`
<!DOCTYPE html>
<html>
<head>
  <title>Error - 0x1</title>
  <style>
    body { font-family: monospace; padding: 40px; background: #f5f5f5; }
    .error { background: white; padding: 30px; border-radius: 8px; border-left: 4px solid #ff4444; }
    pre { background: #f0f0f0; padding: 15px; border-radius: 4px; overflow: auto; }
  </style>
</head>
<body>
  <div class="error">
    <h1>🚨 Server Error</h1>
    <p><strong>Message:</strong> ${error.message}</p>
    ${showStack ? `<details><summary>Stack Trace</summary><pre>${error.stack}</pre></details>` : ''}
    <hr>
    <p><em>This error was caught by the 0x1 error boundary.</em></p>
  </div>
</body>
</html>
      `, {
        status: 500,
        headers: { "Content-Type": "text/html" }
      });
    }
  };
}

/**
 * Not found handler
 */
export function notFoundHandler(request: Request): Response {
  const url = new URL(request.url);
  return createErrorResponse({
    statusCode: 404,
    title: 'Not Found',
    error: `The requested resource '${url.pathname}' was not found on this server.`,
    details: 'Please check the URL and try again.'
  });
}
