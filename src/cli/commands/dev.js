/**
 * 0x1 CLI - Dev Command Adapter
 */

import { startDevServer } from './dev.ts';

export { startDevServer };

export async function runDevServer(args) {
  await startDevServer({
    port: args.port ? parseInt(args.port, 10) : undefined,
    host: args.host,
    open: args.open,
    https: args.https,
    config: args.config
  });
}
