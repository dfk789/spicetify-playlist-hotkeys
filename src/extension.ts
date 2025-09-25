import { HotkeyManager } from './hotkeys';
import { PlaylistManager } from './playlists';
import { SettingsUI } from './settings-ui';
import { debugManager } from './debug';

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

interface NotificationSummary {
  likedStatus: 'added' | 'already-liked' | 'failed';
  added: string[];
  already: string[];
  failed: { name: string; error: string }[];
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

    this.playlistManager.setDebug(debugManager.isEnabled());
    (window as any).PlaylistHotkeysDebug = (enabled: unknown = true) => {
      const normalized = typeof enabled === 'string'
        ? enabled.toLowerCase() === 'true'
        : Boolean(enabled);
      debugManager.setDebug(normalized);
      this.playlistManager.setDebug(normalized);
    };
    (window as any).PlaylistHotkeysDebugState = () => debugManager.isEnabled();
    debugManager.log('PlaylistHotkeys', 'constructor:init');
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

    debugManager.log('PlaylistHotkeys', 'setupHotkeys', { mappingCount: this.config.mappings.length, globalMode: this.config.globalMode });

    this.hotkeyManager.setGlobalHotkeysEnabled(this.config.globalMode);

    for (const mapping of this.config.mappings) {
      debugManager.log('PlaylistHotkeys', 'setupHotkeys:register', { combo: mapping.combo, playlists: mapping.playlistIds });
      this.hotkeyManager.register(mapping.combo, async () => {
        await this.handleHotkey(mapping.playlistIds);
      }, this.config.globalMode);
    }

    void this.hotkeyManager.syncGlobalHelperCombos();
  }

  private async handleHotkey(playlistIds: string[]): Promise<void> {
    try {
      debugManager.log('PlaylistHotkeys', 'handleHotkey:trigger', { playlistIds });

      const currentUri = Spicetify.Player.data?.item?.uri;
      debugManager.log('PlaylistHotkeys', 'handleHotkey:currentTrack', { currentUri });

      if (!currentUri) {
        Spicetify.showNotification('No track currently playing', true);
        return;
      }

      const result = await this.playlistManager.addToPlaylists(currentUri, playlistIds);
      debugManager.log('PlaylistHotkeys', 'handleHotkey:addResult', result);

      try {
        await this.playlistManager.getUserPlaylists();
      } catch (error) {
        debugManager.log('PlaylistHotkeys', 'handleHotkey:playlistRefreshFailed', error);
        console.warn('Failed to refresh playlist cache after add', error);
      }

      const getPlaylistName = (id: string): string => {
        const playlist = this.playlistManager.getPlaylistById(id);
        return playlist?.name || `Playlist ${id.substring(0, 8)}`;
      };

      const summary: NotificationSummary = {
        likedStatus: result.likedStatus,
        added: result.added.map(getPlaylistName),
        already: result.alreadyPresent.map(getPlaylistName),
        failed: result.failed.map(entry => ({
          name: getPlaylistName(entry.playlistId),
          error: entry.error,
        })),
      };
      debugManager.log('PlaylistHotkeys', 'handleHotkey:notificationSummary', summary);

      const notificationMessage = this.formatPlaylistNotification(summary);
      Spicetify.showNotification(notificationMessage);
    } catch (error) {
      debugManager.log('PlaylistHotkeys', 'handleHotkey:error', error);
      console.error('Failed to add track to playlists:', error);
      Spicetify.showNotification('Failed to add track to playlists', true);
    }
  }

  private formatPlaylistNotification(summary: NotificationSummary): string {
    const maxDisplayed = 4;
    let message = '';

    // Liked status with emoji
    if (summary.likedStatus === 'added') {
      message += '💚 Liked + ';
    } else if (summary.likedStatus === 'already-liked') {
      message += '💚 Already liked + ';
    } else {
      message += '❌ Failed to like + ';
    }

    // Main playlist addition summary
    const totalPlaylists = summary.added.length + summary.already.length;
    if (totalPlaylists === 0) {
      message += 'no playlists';
    } else {
      message += `🎵 added to ${totalPlaylists} playlist${totalPlaylists === 1 ? '' : 's'}`;
    }

    // Show added playlists (most important)
    if (summary.added.length > 0) {
      message += '\n\n✅ Added:\n';
      if (summary.added.length <= maxDisplayed) {
        message += summary.added.map(name => `• ${name}`).join('\n');
      } else {
        const displayed = summary.added.slice(0, maxDisplayed);
        const remaining = summary.added.length - maxDisplayed;
        message += displayed.map(name => `• ${name}`).join('\n');
        message += `\n• and ${remaining} more`;
      }
    }

    // Show already present playlists (secondary)
    if (summary.already.length > 0) {
      message += '\n\n🔁 Already in:\n';
      if (summary.already.length <= maxDisplayed) {
        message += summary.already.map(name => `• ${name}`).join('\n');
      } else {
        const displayed = summary.already.slice(0, maxDisplayed);
        const remaining = summary.already.length - maxDisplayed;
        message += displayed.map(name => `• ${name}`).join('\n');
        message += `\n• and ${remaining} more`;
      }
    }

    // Show failed playlists (only if there are any)
    if (summary.failed.length > 0) {
      message += '\n\n❌ Failed:\n';
      if (summary.failed.length <= maxDisplayed) {
        message += summary.failed.map(entry => `• ${entry.name}`).join('\n');
      } else {
        const displayed = summary.failed.slice(0, maxDisplayed);
        const remaining = summary.failed.length - maxDisplayed;
        message += displayed.map(entry => `• ${entry.name}`).join('\n');
        message += `\n• and ${remaining} more`;
      }
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