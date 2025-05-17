/**
 * 0x1 CLI - Build Command Adapter
 */

import { build } from './build.ts';

export { build };

export async function buildProject(args) {
  await build({
    outDir: args.outDir || args.output,
    minify: args.minify ?? true,
    watch: args.watch,
    silent: args.silent,
    config: args.config
  });
}
