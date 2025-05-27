/**
 * 0x1 Framework - TypeScript Declaration File
 * Provides type definitions for utility modules
 */

declare module '../utils/network' {
  export function isPortAvailable(port: number): Promise<boolean>;
  export function getLocalIP(): string;
  export function openBrowser(url: string): void;
}

declare module '../utils/shutdown' {
  export function shutdownServer(cleanup: () => Promise<void> | void): Promise<void>;
  export function cleanupProcesses(processes: Array<import('bun').Subprocess | null>): Promise<void>;
  export function cleanupTempDirectories(directories: string[]): Promise<void>;
}
