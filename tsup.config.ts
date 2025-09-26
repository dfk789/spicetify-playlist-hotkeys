import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'hotkey-playlist': 'src/extension.ts' },
  loader: { '.svg': 'text' },
  format: ['iife'],
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  minify: true,
  sourcemap: true,
  globalName: 'SpicetifyPlaylistHotkeys',
  clean: true,
});