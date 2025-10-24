/**
 * Playlist API Benchmarking Tool
 *
 * Purpose: Measure current playlist operation performance to inform Phase 4 optimizations
 *
 * Tests:
 * 1. Playlist metadata fetch time
 * 2. Duplicate detection performance (pre-scan)
 * 3. Track addition latency
 * 4. Batch operations (multiple playlists)
 * 5. Cache effectiveness
 *
 * Usage:
 * 1. Build: npm run build:benchmark
 * 2. Copy to Extensions folder
 * 3. Enable: spicetify config extensions playlist-benchmark.js
 * 4. Console: PlaylistBenchmark.run()
 */

interface BenchmarkResult {
  testName: string;
  duration: number;
  itemCount?: number;
  throughput?: number;
  notes?: string;
}

interface BenchmarkReport {
  timestamp: Date;
  results: BenchmarkResult[];
  summary: {
    totalTests: number;
    totalDuration: number;
    fastest: string;
    slowest: string;
  };
}

class PlaylistBenchmarker {
  private results: BenchmarkResult[] = [];
  private debugEnabled = false;

  constructor() {
    this.log('PlaylistBenchmarker initialized');
  }

  private log(...args: unknown[]): void {
    if (!this.debugEnabled) return;
    console.log('[PlaylistBenchmark]', ...args);
  }

  setDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
    this.log('Debug mode:', enabled);
  }

  private async measure<T>(
    testName: string,
    fn: () => Promise<T>,
    itemCount?: number
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    const benchResult: BenchmarkResult = {
      testName,
      duration: Math.round(duration * 100) / 100,
      itemCount,
      throughput: itemCount ? Math.round((itemCount / duration) * 1000 * 100) / 100 : undefined,
    };

    this.results.push(benchResult);
    this.log(`✓ ${testName}: ${benchResult.duration}ms`, benchResult);

    return { result, duration };
  }

  /**
   * Test 1: Fetch all user playlists
   */
  async benchmarkPlaylistFetch(): Promise<void> {
    this.log('Test 1: Fetching all user playlists...');

    const { result: playlists } = await this.measure(
      'Playlist Fetch (All)',
      async () => {
        const response = await Spicetify.CosmosAsync.get('sp://core-playlist/v1/rootlist');
        const extractPlaylists = (items: any[]): any[] => {
          const result: any[] = [];
          for (const item of items) {
            if (item.type === 'playlist') {
              result.push(item);
            } else if (item.type === 'folder' && item.rows) {
              result.push(...extractPlaylists(item.rows));
            }
          }
          return result;
        };

        const allPlaylists = extractPlaylists(response.rows || []);
        return allPlaylists.filter((p: any) => p.ownedBySelf);
      }
    );

    Spicetify.showNotification(
      `📊 Benchmark: Found ${playlists.length} playlists\nDuration: ${this.results[0].duration}ms`,
      false,
      3000
    );

    return;
  }

  /**
   * Test 2: Measure duplicate detection on a single playlist
   */
  async benchmarkDuplicateDetection(playlistUri: string): Promise<void> {
    this.log('Test 2: Duplicate detection...');

    const playlistId = playlistUri.split(':')[2];

    // Fetch playlist contents
    const { result: tracks } = await this.measure(
      'Fetch Playlist Tracks',
      async () => {
        const response = await Spicetify.CosmosAsync.get(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(uri,id)),total&limit=100`
        );
        return response.items || [];
      }
    );

    Spicetify.showNotification(
      `📊 Benchmark: Scanned ${tracks.length} tracks\nDuration: ${this.results[this.results.length - 1].duration}ms`,
      false,
      3000
    );

    // Test duplicate check with first track
    if (tracks.length > 0) {
      const testTrack = tracks[0].track.uri;

      await this.measure(
        'Duplicate Check (In Playlist)',
        async () => {
          // Simulate scanning through tracks
          for (const item of tracks) {
            if (item.track.uri === testTrack) {
              return true;
            }
          }
          return false;
        },
        tracks.length
      );
    }
  }

  /**
   * Test 3: Measure track addition latency
   */
  async benchmarkTrackAddition(playlistUri: string, trackUri: string): Promise<void> {
    this.log('Test 3: Track addition latency...');

    const playlistId = playlistUri.split(':')[2];

    try {
      await this.measure('Add Track to Playlist', async () => {
        await Spicetify.CosmosAsync.post(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          { uris: [trackUri] }
        );
      });

      Spicetify.showNotification(
        `📊 Benchmark: Added track\nDuration: ${this.results[this.results.length - 1].duration}ms`,
        false,
        3000
      );

      // Remove the track to clean up
      await Spicetify.CosmosAsync.del(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { tracks: [{ uri: trackUri }] }
      );
      this.log('Cleaned up test track');
    } catch (error) {
      this.log('Track addition failed:', error);
      Spicetify.showNotification('⚠️ Track addition failed - check console', true);
    }
  }

  /**
   * Test 4: Batch operations (add to multiple playlists)
   */
  async benchmarkBatchOperations(playlistUris: string[], trackUri: string): Promise<void> {
    this.log('Test 4: Batch operations...');

    const playlistIds = playlistUris.map(uri => uri.split(':')[2]);

    try {
      await this.measure(
        `Batch Add (${playlistIds.length} playlists)`,
        async () => {
          await Promise.all(
            playlistIds.map(id =>
              Spicetify.CosmosAsync.post(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
                uris: [trackUri],
              })
            )
          );
        },
        playlistIds.length
      );

      Spicetify.showNotification(
        `📊 Benchmark: Added to ${playlistIds.length} playlists\nDuration: ${this.results[this.results.length - 1].duration}ms`,
        false,
        3000
      );

      // Clean up
      await Promise.all(
        playlistIds.map(id =>
          Spicetify.CosmosAsync.del(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
            tracks: [{ uri: trackUri }],
          })
        )
      );
      this.log('Cleaned up test tracks');
    } catch (error) {
      this.log('Batch operation failed:', error);
      Spicetify.showNotification('⚠️ Batch operation failed - check console', true);
    }
  }

  /**
   * Test 5: Large playlist scan (1000+ tracks)
   */
  async benchmarkLargePlaylistScan(playlistUri: string): Promise<void> {
    this.log('Test 5: Large playlist scan...');

    const playlistId = playlistUri.split(':')[2];

    try {
      const { result: data } = await this.measure('Large Playlist Full Scan', async () => {
        let allTracks: any[] = [];
        let offset = 0;
        const limit = 100;
        let total = 0;

        do {
          const response = await Spicetify.CosmosAsync.get(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(uri)),total&limit=${limit}&offset=${offset}`
          );

          allTracks = allTracks.concat(response.items || []);
          total = response.total;
          offset += limit;
        } while (offset < total);

        return { tracks: allTracks, total };
      });

      Spicetify.showNotification(
        `📊 Benchmark: Scanned ${data.total} tracks\nDuration: ${this.results[this.results.length - 1].duration}ms\nThroughput: ${this.results[this.results.length - 1].throughput} tracks/sec`,
        false,
        4000
      );
    } catch (error) {
      this.log('Large playlist scan failed:', error);
      Spicetify.showNotification('⚠️ Large playlist scan failed', true);
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport(): BenchmarkReport {
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const fastest = this.results.reduce((min, r) => (r.duration < min.duration ? r : min));
    const slowest = this.results.reduce((max, r) => (r.duration > max.duration ? r : max));

    const report: BenchmarkReport = {
      timestamp: new Date(),
      results: this.results,
      summary: {
        totalTests: this.results.length,
        totalDuration: Math.round(totalDuration * 100) / 100,
        fastest: `${fastest.testName} (${fastest.duration}ms)`,
        slowest: `${slowest.testName} (${slowest.duration}ms)`,
      },
    };

    return report;
  }

  /**
   * Display results
   */
  displayResults(): void {
    const report = this.generateReport();

    console.group('📊 Playlist API Benchmark Results');
    console.log('Timestamp:', report.timestamp.toLocaleString());
    console.log('Total Tests:', report.summary.totalTests);
    console.log('Total Duration:', report.summary.totalDuration + 'ms');
    console.log('Fastest:', report.summary.fastest);
    console.log('Slowest:', report.summary.slowest);
    console.log('\nDetailed Results:');
    console.table(
      report.results.map(r => ({
        Test: r.testName,
        'Duration (ms)': r.duration,
        Items: r.itemCount || '-',
        'Throughput (items/s)': r.throughput || '-',
      }))
    );
    console.groupEnd();

    Spicetify.showNotification(
      `📊 Benchmark Complete!\n${report.summary.totalTests} tests in ${report.summary.totalDuration}ms\nCheck console for details`,
      false,
      5000
    );
  }

  /**
   * Reset results
   */
  reset(): void {
    this.results = [];
    this.log('Results reset');
  }
}

// Initialize and expose globally
(async () => {
  while (!Spicetify?.CosmosAsync || !Spicetify?.showNotification) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const benchmarker = new PlaylistBenchmarker();

  // Expose API
  (window as any).PlaylistBenchmark = {
    // Quick run with current track
    run: async () => {
      benchmarker.reset();
      benchmarker.setDebug(true);

      const currentTrack = Spicetify.Player.data?.item?.uri;
      if (!currentTrack) {
        Spicetify.showNotification('⚠️ No track playing - start playback first', true);
        return;
      }

      Spicetify.showNotification('📊 Starting benchmark suite...', false, 2000);

      try {
        // Test 1: Fetch playlists
        await benchmarker.benchmarkPlaylistFetch();

        benchmarker.displayResults();
      } catch (error) {
        console.error('Benchmark failed:', error);
        Spicetify.showNotification('❌ Benchmark failed - check console', true);
      }
    },

    // Full benchmark suite (requires user-owned playlist URIs)
    runFull: async (testPlaylistUri?: string) => {
      benchmarker.reset();
      benchmarker.setDebug(true);

      const currentTrack = Spicetify.Player.data?.item?.uri;
      if (!currentTrack) {
        Spicetify.showNotification('⚠️ No track playing', true);
        return;
      }

      if (!testPlaylistUri) {
        Spicetify.showNotification(
          '⚠️ Usage: PlaylistBenchmark.runFull("spotify:playlist:YOUR_PLAYLIST_ID")',
          true
        );
        return;
      }

      Spicetify.showNotification('📊 Starting FULL benchmark suite...', false, 2000);

      try {
        await benchmarker.benchmarkPlaylistFetch();
        await benchmarker.benchmarkDuplicateDetection(testPlaylistUri);
        await benchmarker.benchmarkTrackAddition(testPlaylistUri, currentTrack);
        await benchmarker.benchmarkLargePlaylistScan(testPlaylistUri);

        benchmarker.displayResults();
      } catch (error) {
        console.error('Benchmark failed:', error);
        Spicetify.showNotification('❌ Benchmark failed - check console', true);
      }
    },

    // Individual tests
    fetchPlaylists: () => benchmarker.benchmarkPlaylistFetch(),

    checkDuplicates: (playlistUri: string) =>
      benchmarker.benchmarkDuplicateDetection(playlistUri),

    addTrack: (playlistUri: string, trackUri?: string) => {
      const uri = trackUri || Spicetify.Player.data?.item?.uri;
      if (!uri) {
        Spicetify.showNotification('⚠️ No track URI provided or playing', true);
        return;
      }
      return benchmarker.benchmarkTrackAddition(playlistUri, uri);
    },

    batchAdd: (playlistUris: string[], trackUri?: string) => {
      const uri = trackUri || Spicetify.Player.data?.item?.uri;
      if (!uri) {
        Spicetify.showNotification('⚠️ No track URI provided or playing', true);
        return;
      }
      return benchmarker.benchmarkBatchOperations(playlistUris, uri);
    },

    largeScan: (playlistUri: string) =>
      benchmarker.benchmarkLargePlaylistScan(playlistUri),

    // Utilities
    results: () => benchmarker.generateReport(),
    reset: () => benchmarker.reset(),
    debug: (enabled: boolean) => benchmarker.setDebug(enabled),
  };

  console.log('[PlaylistBenchmark] Extension loaded');
  console.log('Available commands:');
  console.log('  PlaylistBenchmark.run() - Quick benchmark (playlist fetch only)');
  console.log('  PlaylistBenchmark.runFull("spotify:playlist:ID") - Full suite');
  console.log('  PlaylistBenchmark.results() - View results');
  console.log('  PlaylistBenchmark.reset() - Clear results');

  Spicetify.showNotification(
    '📊 Benchmark Tool Loaded\nConsole: PlaylistBenchmark.run()',
    false,
    5000
  );
})();
