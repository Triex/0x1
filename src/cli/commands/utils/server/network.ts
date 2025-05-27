import { spawn } from "child_process";
import { networkInterfaces } from "os";

/**
 * Network utilities for development server
 */

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

    for (const name of Object.keys(nets)) {
      const netInterface = nets[name];
      if (!netInterface) continue;
      
      for (const net of netInterface) {
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (error) {
    // Fallback to localhost if we can't determine the IP
  }
  return "localhost";
}

/**
 * Open browser
 */
export async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;

  let command: string;
  let args: string[];

  if (platform === "darwin") {
    command = "open";
    args = [url];
  } else if (platform === "win32") {
    command = "start";
    args = ["", url];
  } else {
    command = "xdg-open";
    args = [url];
  }

  try {
    spawn(command, args, { detached: true, stdio: "ignore" });
  } catch (error) {
    throw new Error(`Failed to open browser: ${error}`);
  }
}
