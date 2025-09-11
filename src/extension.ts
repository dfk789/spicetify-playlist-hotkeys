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
    this.settingsUI = new SettingsUI(this.config, this.onConfigChange.bind(this));
  }

  async initialize(): Promise<void> {
    while (!Spicetify?.showNotification || !Spicetify?.CosmosAsync) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await this.setupHotkeys();
    this.settingsUI.initialize();
    
    Spicetify.showNotification('Playlist Hotkeys extension loaded!');
  }

  private async setupHotkeys(): Promise<void> {
    this.hotkeyManager.clearAll();
    
    for (const mapping of this.config.mappings) {
      this.hotkeyManager.register(mapping.combo, async () => {
        await this.handleHotkey(mapping.playlistIds);
      });
    }
  }

  private async handleHotkey(playlistIds: string[]): Promise<void> {
    try {
      const currentUri = Spicetify.Player.data?.item?.uri;
      
      if (!currentUri) {
        Spicetify.showNotification('No track currently playing', true);
        return;
      }

      await this.playlistManager.addToPlaylists(currentUri, playlistIds);
      
      const playlistCount = playlistIds.length;
      Spicetify.showNotification(
        `Added to ${playlistCount} playlist${playlistCount === 1 ? '' : 's'}`
      );
    } catch (error) {
      console.error('Failed to add track to playlists:', error);
      Spicetify.showNotification('Failed to add track to playlists', true);
    }
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
      mappings: []
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