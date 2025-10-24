/**
 * Hotkey Manager - Refactored for Phase 1
 *
 * Simplified hotkey management using official Spicetify APIs:
 * - Focused mode: Spicetify.Keyboard.registerShortcut()
 * - Global mode: HelperConnection module
 *
 * Key improvements:
 * - Reduced complexity (~200 lines vs 377)
 * - Uses official Spicetify.Keyboard API
 * - Input field protection
 * - Helper logic extracted to separate module
 * - Execution locks retained (working well)
 */

import { HelperConnection } from './helperConnection';
import { normalizeCombo, shouldIgnoreEvent } from './comboUtils';

type HotkeyCallback = () => void | Promise<void>;

interface HotkeyRegistration {
  combo: string;
  normalizedCombo: string;
  callback: HotkeyCallback;
  spicetifyUnregister?: () => void; // Cleanup function from Spicetify.Keyboard
}

export class HotkeyManager {
  private registrations: Map<string, HotkeyRegistration> = new Map();
  private helperConnection: HelperConnection;
  private globalHotkeysEnabled = false;

  // Execution locks prevent duplicate triggers
  private executionLocks: Map<string, boolean> = new Map();
  private lockTimeout = 500;

  constructor() {
    this.helperConnection = new HelperConnection();
  }

  /**
   * Register a hotkey
   *
   * @param combo - Key combination (e.g., "ctrl+1", "shift+a")
   * @param callback - Function to execute when hotkey is triggered
   * @param isGlobal - If true, register with helper for OS-level capture
   */
  register(combo: string, callback: HotkeyCallback, isGlobal: boolean = false): void {
    const normalizedCombo = normalizeCombo(combo);

    const registration: HotkeyRegistration = {
      combo,
      normalizedCombo,
      callback,
    };

    // Register for focused mode using Spicetify.Keyboard
    if (this.canUseSpicetifyKeyboard()) {
      try {
        // Wrap callback with protection and locks
        const wrappedCallback = async (event: KeyboardEvent) => {
          // Input field protection (from Power Bar pattern)
          if (shouldIgnoreEvent(event)) return;

          // Execution lock
          if (!this.acquireLock(normalizedCombo)) return;

          try {
            await callback();
          } catch (error) {
            console.error('[HotkeyManager] Callback error:', error);
          } finally {
            this.releaseLock(normalizedCombo);
          }
        };

        Spicetify.Keyboard.registerShortcut(normalizedCombo, wrappedCallback);

        // Store registration
        this.registrations.set(normalizedCombo, registration);

        console.log(`[HotkeyManager] Registered focused shortcut: ${normalizedCombo}`);
      } catch (error) {
        console.error(`[HotkeyManager] Failed to register shortcut ${normalizedCombo}:`, error);
      }
    } else {
      console.warn('[HotkeyManager] Spicetify.Keyboard not available');
    }

    // Register for global mode using helper
    if (isGlobal && this.globalHotkeysEnabled) {
      // Wrap callback with execution lock
      const wrappedCallback = async () => {
        if (!this.acquireLock(normalizedCombo)) return;

        try {
          await callback();
        } catch (error) {
          console.error('[HotkeyManager] Global callback error:', error);
        } finally {
          this.releaseLock(normalizedCombo);
        }
      };

      this.helperConnection.registerCombo(normalizedCombo, wrappedCallback);
      console.log(`[HotkeyManager] Registered global shortcut: ${normalizedCombo}`);
    }
  }

  /**
   * Unregister a hotkey
   */
  unregister(combo: string): void {
    const normalizedCombo = normalizeCombo(combo);
    const registration = this.registrations.get(normalizedCombo);

    if (registration) {
      // Unregister from Spicetify.Keyboard
      if (this.canUseSpicetifyKeyboard()) {
        try {
          Spicetify.Keyboard._deregisterShortcut(normalizedCombo);
        } catch (error) {
          console.error('[HotkeyManager] Failed to deregister:', error);
        }
      }

      // Unregister from helper
      this.helperConnection.unregisterCombo(normalizedCombo);

      this.registrations.delete(normalizedCombo);
      console.log(`[HotkeyManager] Unregistered: ${normalizedCombo}`);
    }
  }

  /**
   * Clear all registered hotkeys
   */
  clearAll(): void {
    // Unregister all from Spicetify.Keyboard
    if (this.canUseSpicetifyKeyboard()) {
      for (const normalizedCombo of this.registrations.keys()) {
        try {
          Spicetify.Keyboard._deregisterShortcut(normalizedCombo);
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    }

    // Clear helper
    this.helperConnection.clearAllCombos();

    this.registrations.clear();
    console.log('[HotkeyManager] All shortcuts cleared');
  }

  /**
   * Enable or disable global hotkeys (helper-based)
   */
  async setGlobalHotkeysEnabled(enabled: boolean): Promise<void> {
    this.globalHotkeysEnabled = enabled;
    await this.helperConnection.setEnabled(enabled);

    console.log(`[HotkeyManager] Global hotkeys ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Re-sync global hotkeys with helper
   * Call this after registration changes when global mode is active
   */
  async syncGlobalHelperCombos(): Promise<void> {
    if (this.globalHotkeysEnabled) {
      await this.helperConnection.syncCombos();
    }
  }

  /**
   * Get helper connection status
   */
  getHelperStatus() {
    return this.helperConnection.getStatus();
  }

  /**
   * Check helper availability manually
   */
  async checkHelper(): Promise<boolean> {
    return await this.helperConnection.ensureConnection();
  }

  /**
   * Get all registered hotkeys
   */
  getRegistrations(): HotkeyRegistration[] {
    return Array.from(this.registrations.values());
  }

  // Execution lock methods (unchanged - working well)

  private acquireLock(combo: string): boolean {
    if (this.executionLocks.get(combo)) {
      return false;
    }

    this.executionLocks.set(combo, true);
    setTimeout(() => {
      this.executionLocks.delete(combo);
    }, this.lockTimeout);

    return true;
  }

  private releaseLock(combo: string): void {
    this.executionLocks.delete(combo);
  }

  // Utility methods

  private canUseSpicetifyKeyboard(): boolean {
    return typeof Spicetify?.Keyboard?.registerShortcut === 'function';
  }
}
