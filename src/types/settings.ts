/**
 * Shared types for settings UI
 */

export interface HotkeyMapping {
  combo: string;
  playlistIds: string[];
}

export interface ExtensionConfig {
  globalMode: boolean;
  mappings: HotkeyMapping[];
  helperScriptPath?: string;
  helperAutoStart?: boolean;
}

export interface PlaylistInfo {
  id: string;
  name: string;
  uri: string;
  owner?: string;
}

export interface HelperStatus {
  available: boolean;
  ready: boolean;
  connected: boolean;
  token: string | null;
}

export type HelperStatusState =
  | 'focused'      // Global mode disabled
  | 'active'       // Global mode + helper connected
  | 'connecting'   // Global mode + helper found but not ready
  | 'offline';     // Global mode + helper not available
