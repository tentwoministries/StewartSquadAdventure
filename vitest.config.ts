import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(viteConfig({ mode: 'test', command: 'serve' }), defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
    // Smoke tests (tests/smoke) drive a headless browser and run under their own script — not here.
  },
}));
