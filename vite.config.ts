import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { sandboxShotPlugin } from './sandbox/_shared/vite-shot-plugin';

const alias = (name: string) => ({
  find: `@${name}`,
  replacement: fileURLToPath(new URL(`./src/${name}`, import.meta.url)),
});

// `vite build --mode archive` produces the single-file time-capsule HTML (docs/BRIEF.md §7.2).
// The normal build produces a self-contained dist/ with zero runtime network calls.
export default defineConfig(({ mode }) => ({
  base: './',
  resolve: {
    alias: ['engine', 'render', 'style', 'sim', 'world', 'dungeons', 'content', 'ui', 'net', 'dev'].map(alias),
  },
  build: {
    target: 'es2022',
    sourcemap: mode !== 'archive',
    outDir: mode === 'archive' ? 'dist-archive' : 'dist',
    assetsInlineLimit: mode === 'archive' ? Number.MAX_SAFE_INTEGER : 4096,
  },
  // sandboxShotPlugin is dev-serve only (Phase 0.75 studies); it never enters a build.
  plugins: mode === 'archive' ? [viteSingleFile({ removeViteModuleLoader: true })] : [sandboxShotPlugin()],
  server: { port: 5173, strictPort: true },
}));
