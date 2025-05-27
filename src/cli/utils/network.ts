/**
 * 0x1 Framework - Network Utilities
 * Provides functions for network-related operations in the development server
 */

import { networkInterfaces } from "os";

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  try {
    const server = Bun.serve({
      port,
      fetch() {
        return new Response("Test");
      },
    });
    server.stop();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get local IP address
 */
export function getLocalIP(): string {
  try {
    const nets = networkInterfaces();
    const results: Record<string, string[]> = {};

    for (const name of Object.keys(nets)) {
      const interfaces = nets[name];
      if (!interfaces) continue;
      
      for (const net of interfaces) {
        // Skip over non-IPv4 and internal (loopback) addresses
        if (net.family === 'IPv4' && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }
          results[name].push(net.address);
        }
      }
    }

    // Prioritize en0 (common for wifi on MacOS), eth0 (common for ethernet on Linux)
    for (const name of ['en0', 'eth0', 'Ethernet', 'Wi-Fi']) {
      if (results[name] && results[name].length > 0) {
        return results[name][0];
      }
    }

    // Fallback to first available IP
    for (const ips of Object.values(results)) {
      if (ips && ips.length > 0) {
        return ips[0];
      }
    }
  } catch (error) {
    console.error('Failed to get local IP:', error);
  }

  // Default fallback
  return '127.0.0.1';
}

/**
 * Open the default browser with the specified URL
 */
export function openBrowser(url: string): void {
  try {
    const platform = process.platform;
    
    // Determine the command based on platform
    const cmd = platform === 'win32' ? 'start' : 
                platform === 'darwin' ? 'open' : 'xdg-open';
    
    // Use Bun's subprocess to open the browser
    Bun.spawn([cmd, url], {
      stdout: 'inherit',
      stderr: 'inherit'
    });
  } catch (error) {
    console.error('Failed to open browser:', error);
  }
}
