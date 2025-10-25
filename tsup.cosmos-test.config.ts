import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cosmos-sub-test.ts'],
  outDir: 'dist',
  format: ['iife'],
  globalName: 'CosmosSubTestExtension',
  platform: 'browser',
  target: 'es2020',
  clean: false,
  minify: false,
  sourcemap: true,
  dts: false,
  outExtension: () => ({ js: '.cosmos-test.js' }),
  esbuildOptions(options) {
    options.banner = {
      js: '// CosmosAsync.sub Test Script - Phase 4.3 Research\n',
    };
  },
});
