/**
 * Helper Connection Module
 *
 * Manages connection to external Python/Node helper for OS-level global hotkeys.
 * Separated from main hotkey logic for cleaner architecture.
 *
 * Responsibilities:
 * - Establish and maintain connection to helper
 * - Handle SSE event stream
 * - Retry logic with exponential backoff
 * - Sync registered combos to helper
 * - Connection status tracking
 */

const HELPER_ORIGIN = 'http://127.0.0.1:17976';
const RETRY_INTERVAL = 3000; // 3 seconds
const SYNC_DEBOUNCE = 200; // 200ms

export interface HelperStatus {
  available: boolean;
  ready: boolean;
  connected: boolean;
  token: string | null;
}

export type HelperEventCallback = (combo: string) => void | Promise<void>;

export class HelperConnection {
  private token: string | null = null;
  private eventSource: EventSource | null = null;
  private available = false;
  private ready = false;
  private retryTimer?: number;
  private syncDebounceTimer?: number;
  private eventCallbacks: Map<string, HelperEventCallback> = new Map();

  constructor() {
    // Constructor is lightweight - connection happens on-demand
  }

  /**
   * Check if helper is available and get auth token
   */
  async ensureConnection(): Promise<boolean> {
    if (this.available && this.token) return true;

    try {
      const response = await fetch(`${HELPER_ORIGIN}/hello`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.token = String(data.token || '');
      this.available = !!this.token;

      if (this.available) {
        console.log('[HelperConnection] Connected to helper');
      }

      return this.available;
    } catch (error) {
      this.available = false;
      this.token = null;
      return false;
    }
  }

  /**
   * Start listening to helper events via SSE
   */
  startEventStream(): void {
    if (!this.available || this.eventSource) return;

    try {
      const tokenParam = this.token ? `?token=${encodeURIComponent(this.token)}` : '';
      const es = new EventSource(`${HELPER_ORIGIN}/events${tokenParam}`);

      es.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);

          // Helper ready signal
          if (message.ready) {
            this.ready = true;
            console.log('[HelperConnection] Helper ready');
            // Sync registered combos now that helper is ready
            void this.syncCombos();
            return;
          }

          // Hotkey event
          if (message.combo) {
            const combo = String(message.combo);
            const callback = this.eventCallbacks.get(combo);
            if (callback) {
              await callback(combo);
            }
          }
        } catch (error) {
          console.error('[HelperConnection] Message parse error:', error);
        }
      };

      es.onerror = () => {
        console.warn('[HelperConnection] SSE connection lost');
        this.disconnect();
        this.startRetry();
      };

      this.eventSource = es;
      console.log('[HelperConnection] Event stream started');
    } catch (error) {
      console.error('[HelperConnection] Failed to start event stream:', error);
    }
  }

  /**
   * Stop event stream
   */
  stopEventStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('[HelperConnection] Event stream stopped');
    }
    this.ready = false;
  }

  /**
   * Register a combo handler
   */
  registerCombo(combo: string, callback: HelperEventCallback): void {
    this.eventCallbacks.set(combo, callback);
    // Trigger sync after registration
    void this.syncCombos();
  }

  /**
   * Unregister a combo handler
   */
  unregisterCombo(combo: string): void {
    this.eventCallbacks.delete(combo);
    void this.syncCombos();
  }

  /**
   * Clear all registered combos
   */
  clearAllCombos(): void {
    this.eventCallbacks.clear();
    void this.syncCombos();
  }

  /**
   * Sync registered combos to helper (debounced)
   */
  async syncCombos(): Promise<void> {
    if (!this.available || !this.token || !this.ready) {
      return;
    }

    // Debounce sync calls
    if (this.syncDebounceTimer) {
      window.clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = window.setTimeout(async () => {
      const combos = Array.from(this.eventCallbacks.keys());
      const body = { combos };
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      };

      try {
        const response = await fetch(`${HELPER_ORIGIN}/config`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          console.error('[HelperConnection] Config sync failed:', response.status);
        } else {
          console.log('[HelperConnection] Synced', combos.length, 'combos');
        }
      } catch (error) {
        console.error('[HelperConnection] Config sync error:', error);
      }
    }, SYNC_DEBOUNCE);
  }

  /**
   * Start retry loop for reconnection
   */
  private startRetry(): void {
    if (this.retryTimer) return;

    console.log('[HelperConnection] Starting retry loop');
    const attemptReconnect = async () => {
      const connected = await this.ensureConnection();
      if (connected) {
        this.stopRetry();
        this.startEventStream();
        void this.syncCombos();
      }
    };

    void attemptReconnect();
    this.retryTimer = window.setInterval(attemptReconnect, RETRY_INTERVAL);
  }

  /**
   * Stop retry loop
   */
  private stopRetry(): void {
    if (this.retryTimer) {
      window.clearInterval(this.retryTimer);
      this.retryTimer = undefined;
      console.log('[HelperConnection] Retry loop stopped');
    }
  }

  /**
   * Disconnect and clean up
   */
  disconnect(): void {
    this.stopEventStream();
    this.stopRetry();
    this.available = false;
    this.token = null;
  }

  /**
   * Get current connection status
   */
  getStatus(): HelperStatus {
    return {
      available: this.available,
      ready: this.ready,
      connected: !!this.eventSource,
      token: this.token,
    };
  }

  /**
   * Enable or disable global hotkeys
   */
  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      const connected = await this.ensureConnection();
      if (connected) {
        this.stopRetry();
        this.startEventStream();
        void this.syncCombos();
      } else {
        this.startRetry();
      }
    } else {
      this.disconnect();
    }
  }
}
