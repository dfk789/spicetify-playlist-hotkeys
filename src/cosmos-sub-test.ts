/**
 * CosmosAsync.sub Experimental Test Script
 *
 * Purpose: Probe Spotify internal endpoints for playlist subscription support
 * Phase: 4.3 (Research)
 *
 * Usage:
 * 1. Build: npm run build:test
 * 2. Load in Spotify developer console or via custom app
 * 3. Run: CosmosSubTest.start()
 * 4. Modify a playlist (add/remove track, rename)
 * 5. Check console for any subscription events
 * 6. Run: CosmosSubTest.stop()
 *
 * Safety: Read-only testing, no playlist modifications
 */

interface SubscriptionTest {
  endpoint: string;
  description: string;
  playlistId?: string;
}

class CosmosSubTestRunner {
  private subscriptions: Promise<any>[] = [];
  private callbackCounts = new Map<string, number>();
  private receivedEvents = new Map<string, any[]>();

  /**
   * Start subscription tests on user's first playlist
   */
  async start(): Promise<void> {
    console.log('[CosmosSubTest] Starting subscription endpoint tests...');

    // Get user's first playlist for testing
    const playlistId = await this.getTestPlaylistId();
    if (!playlistId) {
      console.error('[CosmosSubTest] No playlists found. Create a playlist first.');
      return;
    }

    console.log(`[CosmosSubTest] Testing with playlist ID: ${playlistId}`);

    // Define test endpoints
    const tests: SubscriptionTest[] = [
      // Rootlist updates (user's playlist collection changes)
      {
        endpoint: 'sp://core-playlist/v1/rootlist/updates',
        description: 'Rootlist updates (playlist added/removed)',
      },
      {
        endpoint: 'wg://playlist/v1/rootlist/updates',
        description: 'Rootlist updates (alternative endpoint)',
      },

      // Playlist-specific updates
      {
        endpoint: `sp://core-playlist/v1/playlist/${playlistId}/updates`,
        description: 'Playlist metadata updates (name, description)',
        playlistId,
      },
      {
        endpoint: `sp://core-playlist/v1/playlist/${playlistId}/tracks/subscribe`,
        description: 'Playlist track changes (add/remove)',
        playlistId,
      },
      {
        endpoint: `wg://playlist/v1/playlist/${playlistId}/subscribe`,
        description: 'Playlist changes (alternative endpoint)',
        playlistId,
      },
      {
        endpoint: `hm://playlist/v2/${playlistId}/subscribe`,
        description: 'Playlist subscription (hermes protocol)',
        playlistId,
      },

      // Metadata service
      {
        endpoint: `sp://metadata/v1/playlist/${playlistId}/subscribe`,
        description: 'Metadata service subscription',
        playlistId,
      },

      // Collection updates
      {
        endpoint: 'sp://collection/v1/updates',
        description: 'Collection updates (likes, playlists)',
      },
    ];

    // Attempt each subscription
    for (const test of tests) {
      await this.testSubscription(test);
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n[CosmosSubTest] All subscription attempts completed');
    console.log('[CosmosSubTest] Now modify a playlist and watch for events...');
    console.log('[CosmosSubTest] Run CosmosSubTest.getResults() to see findings');
  }

  /**
   * Stop all subscriptions
   */
  stop(): void {
    console.log('[CosmosSubTest] Stopping all subscriptions...');
    this.subscriptions = [];
    console.log('[CosmosSubTest] Stopped');
  }

  /**
   * Get test results summary
   */
  getResults(): void {
    console.log('\n=== CosmosSubTest Results ===\n');

    if (this.callbackCounts.size === 0) {
      console.log('❌ No subscription callbacks received');
      console.log('   This likely means none of the tested endpoints support subscriptions');
      console.log('   or the endpoint format is different than expected.\n');
      return;
    }

    console.log('✅ Received events from:');
    this.callbackCounts.forEach((count, endpoint) => {
      console.log(`\n  ${endpoint}`);
      console.log(`  Events received: ${count}`);

      const events = this.receivedEvents.get(endpoint) || [];
      if (events.length > 0) {
        console.log(`  Sample event:`, events[0]);
      }
    });

    console.log('\n=== End Results ===\n');
  }

  /**
   * Get user's first playlist ID for testing
   */
  private async getTestPlaylistId(): Promise<string | null> {
    try {
      // Try rootlist endpoint
      const response = await Spicetify.CosmosAsync.get('sp://core-playlist/v1/rootlist');

      if (response?.rows && Array.isArray(response.rows)) {
        // Find first playlist (not folder)
        for (const item of response.rows) {
          if (item.type === 'playlist' && item.uri) {
            const match = item.uri.match(/spotify:playlist:([a-zA-Z0-9]+)/);
            if (match) {
              return match[1];
            }
          }
        }
      }

      // Fallback: Try Web API
      const webResponse = await Spicetify.CosmosAsync.get('https://api.spotify.com/v1/me/playlists?limit=1');
      if (webResponse?.items && webResponse.items.length > 0) {
        return webResponse.items[0].id;
      }

      return null;
    } catch (error) {
      console.error('[CosmosSubTest] Failed to get playlist ID:', error);
      return null;
    }
  }

  /**
   * Test a single subscription endpoint
   */
  private async testSubscription(test: SubscriptionTest): Promise<void> {
    console.log(`\n[CosmosSubTest] Testing: ${test.endpoint}`);
    console.log(`[CosmosSubTest] Description: ${test.description}`);

    try {
      const subscription = Spicetify.CosmosAsync.sub(
        test.endpoint,
        (body: any) => {
          // Subscription callback - event received!
          console.log(`\n✅ [CosmosSubTest] Event from ${test.endpoint}:`, body);

          // Track callback count
          const count = this.callbackCounts.get(test.endpoint) || 0;
          this.callbackCounts.set(test.endpoint, count + 1);

          // Store event
          const events = this.receivedEvents.get(test.endpoint) || [];
          events.push(body);
          this.receivedEvents.set(test.endpoint, events);
        },
        (error: Error) => {
          // Error handler
          console.log(`❌ [CosmosSubTest] Error from ${test.endpoint}:`, error.message);
        }
      );

      this.subscriptions.push(subscription);
      console.log(`[CosmosSubTest] ✓ Subscription attempt registered`);

    } catch (error: any) {
      console.log(`[CosmosSubTest] ✗ Subscription failed: ${error.message || error}`);
    }
  }
}

// Global instance
const CosmosSubTest = new CosmosSubTestRunner();

// Expose to window for console access
(window as any).CosmosSubTest = CosmosSubTest;

// Auto-start on load (can be disabled by commenting out)
async function main() {
  while (!Spicetify?.CosmosAsync) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n==============================================');
  console.log('CosmosAsync.sub Test Script Loaded');
  console.log('==============================================');
  console.log('Commands:');
  console.log('  CosmosSubTest.start()      - Start subscription tests');
  console.log('  CosmosSubTest.stop()       - Stop all subscriptions');
  console.log('  CosmosSubTest.getResults() - Show results summary');
  console.log('==============================================\n');

  // Uncomment to auto-start:
  // await CosmosSubTest.start();
}

export default main;
