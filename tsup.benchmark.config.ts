import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'playlist-benchmark': 'src/playlist-benchmark.ts' },
  format: ['iife'],
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  minify: false, // Keep readable for debugging
  sourcemap: true,
  globalName: 'SpicetifyPlaylistBenchmark',
  clean: false, // Don't remove other builds
});
