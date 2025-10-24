import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'keyboard-test': 'src/keyboard-test.ts' },
  format: ['iife'],
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  minify: false, // Keep readable for debugging
  sourcemap: true,
  globalName: 'SpicetifyKeyboardTest',
  clean: false, // Don't remove main extension build
});
