import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

await Promise.all([
  build({
    entryPoints: [path.join(rootDir, 'electron', 'main.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: path.join(rootDir, 'dist-electron', 'main.cjs'),
    external: ['electron'],
    sourcemap: true,
  }),
  build({
    entryPoints: [path.join(rootDir, 'electron', 'preload.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: path.join(rootDir, 'dist-electron', 'preload.cjs'),
    external: ['electron'],
    sourcemap: true,
  }),
]);

console.log('Built electron main & preload bundles.');
