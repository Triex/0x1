/**
 * 0x1 Framework - Client-side Server Actions Wrapper
 * This allows client components to call server actions through the framework's endpoint
 */

/**
 * Execute a server action from the client side
 */
export async function executeServerAction(
  functionName: string,
  args: any[] = [],
  filePath?: string
): Promise<any> {
  try {
    const response = await fetch('/__0x1_server_action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        functionName,
        args,
        __filePath: filePath
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Server action failed: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error executing server action "${functionName}":`, error);
    throw error;
  }
}

/**
 * Create a typed server action wrapper for a specific function
 */
export function createServerActionWrapper<T extends (...args: any[]) => any>(
  functionName: string,
  filePath?: string
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>) => {
    return executeServerAction(functionName, args, filePath);
  };
}

/**
 * Streaming server action executor (for actions that return Response streams)
 */
export async function executeStreamingServerAction(
  functionName: string,
  args: any[] = [],
  filePath?: string
): Promise<Response> {
  const response = await fetch('/__0x1_server_action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      functionName,
      args,
      __filePath: filePath,
      __streaming: true
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Streaming server action failed: ${errorData.error || response.statusText}`);
  }

  return response;
}

/**
 * Create a typed streaming server action wrapper
 */
export function createStreamingServerActionWrapper<T extends (...args: any[]) => Promise<Response>>(
  functionName: string,
  filePath?: string
): (...args: Parameters<T>) => Promise<Response> {
  return async (...args: Parameters<T>) => {
    return executeStreamingServerAction(functionName, args, filePath);
  };
} 