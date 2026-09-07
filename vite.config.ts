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
    sourcemap: mode !== 'archive' && mode !== 'demo',
    outDir: mode === 'archive' ? 'dist-archive' : mode === 'demo' ? 'dist-demo' : 'dist',
    assetsInlineLimit: mode === 'archive' ? Number.MAX_SAFE_INTEGER : 4096,
    // `vite build --mode demo`: the Phase 0.75 demo reel as a static site (the hub and the five scenes),
    // for sharing on a static host. Relative paths (base './'), no runtime network calls, no dev plugin.
    ...(mode === 'demo' ? { rollupOptions: { input: Object.fromEntries(['index', 'forest-dusk', 'desert-noon', 'bog-night', 'frozen-night', 'caves-descent'].map((n) => [n, fileURLToPath(new URL(n === 'index' ? './sandbox/index.html' : `./sandbox/${n}/index.html`, import.meta.url))])) } } : {}),
  },
  // sandboxShotPlugin is dev-serve only (Phase 0.75 studies); it never enters a build.
  plugins: mode === 'archive' ? [viteSingleFile({ removeViteModuleLoader: true })] : mode === 'demo' ? [] : [sandboxShotPlugin()],
  server: { port: 5173, strictPort: true },
}));
