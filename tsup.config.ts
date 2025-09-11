import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/extension.ts'],
  format: ['iife'],
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  minify: true,
  sourcemap: true,
  globalName: 'SpicetifyPlaylistHotkeys',
  clean: true,
});