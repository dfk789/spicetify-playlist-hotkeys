/**
 * Spicetify Playlist Hotkeys Extension
 * Add current track to playlists via configurable hotkeys
 */

import { HotkeyManager } from './hotkeys';
import { PlaylistManager } from './playlists';
import { SettingsUI } from './settings-ui';

interface HotkeyMapping {
  combo: string;
  playlistIds: string[];
}

interface ExtensionConfig {
  globalMode: boolean;
  mappings: HotkeyMapping[];
  helperScriptPath?: string;
  helperAutoStart?: boolean;
}

class PlaylistHotkeyExtension {
  private config: ExtensionConfig;
  private hotkeyManager: HotkeyManager;
  private playlistManager: PlaylistManager;
  private settingsUI: SettingsUI;

  constructor() {
    this.config = this.loadConfig();
    this.hotkeyManager = new HotkeyManager();
    this.playlistManager = new PlaylistManager();
    this.settingsUI = new SettingsUI(this.config, this.onConfigChange.bind(this), this.hotkeyManager);
  }

  async initialize(): Promise<void> {
    while (!Spicetify?.showNotification || !Spicetify?.CosmosAsync) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await this.setupHotkeys();
    this.settingsUI.initialize();
  }

  private async setupHotkeys(): Promise<void> {
    this.hotkeyManager.clearAll();
    
    // Set global hotkeys mode
    this.hotkeyManager.setGlobalHotkeysEnabled(this.config.globalMode);
    
    for (const mapping of this.config.mappings) {
      this.hotkeyManager.register(mapping.combo, async () => {
        await this.handleHotkey(mapping.playlistIds);
      }, this.config.globalMode);
    }

    // Ensure helper receives current combos
    void this.hotkeyManager.syncGlobalHelperCombos();
  }

  private async handleHotkey(playlistIds: string[]): Promise<void> {
    try {
      const currentUri = Spicetify.Player.data?.item?.uri;
      
      if (!currentUri) {
        Spicetify.showNotification('No track currently playing', true);
        return;
      }

      await this.playlistManager.addToPlaylists(currentUri, playlistIds);
      
      // Ensure playlists are loaded before getting names
      await this.playlistManager.getUserPlaylists();
      
      // Get playlist names for notification
      const playlistNames = playlistIds.map(id => {
        const playlist = this.playlistManager.getPlaylistById(id);
        return playlist?.name || `Playlist ${id.substring(0, 8)}`;
      });
      
      const notificationMessage = this.formatPlaylistNotification(playlistNames);
      Spicetify.showNotification(notificationMessage);
    } catch (error) {
      console.error('Failed to add track to playlists:', error);
      Spicetify.showNotification('Failed to add track to playlists', true);
    }
  }

  private formatPlaylistNotification(playlistNames: string[]): string {
    const maxDisplayed = 4;
    let message = '💚 Liked + added to:\n';
    
    if (playlistNames.length <= maxDisplayed) {
      message += playlistNames.map(name => `• ${name}`).join('\n');
    } else {
      const displayed = playlistNames.slice(0, maxDisplayed);
      const remaining = playlistNames.length - maxDisplayed;
      message += displayed.map(name => `• ${name}`).join('\n');
      message += `\n• and ${remaining} more playlist${remaining === 1 ? '' : 's'}`;
    }
    
    return message;
  }

  private onConfigChange(newConfig: ExtensionConfig): void {
    this.config = newConfig;
    this.saveConfig(newConfig);
    this.setupHotkeys();
  }

  private loadConfig(): ExtensionConfig {
    const stored = Spicetify.LocalStorage?.get('playlist-hotkeys-config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored config:', e);
      }
    }

    return {
      globalMode: false,
      mappings: [],
      helperScriptPath: undefined,
      helperAutoStart: false
    };
  }

  private saveConfig(config: ExtensionConfig): void {
    Spicetify.LocalStorage?.set('playlist-hotkeys-config', JSON.stringify(config));
  }
}

(async () => {
  const extension = new PlaylistHotkeyExtension();
  await extension.initialize();
})();