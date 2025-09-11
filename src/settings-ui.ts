/**
 * Settings UI for Spicetify Extension
 * Simple panel to manage hotkey mappings and global toggle
 */

import { PlaylistManager } from './playlists';

interface HotkeyMapping {
  combo: string;
  playlistIds: string[];
}

interface ExtensionConfig {
  globalMode: boolean;
  mappings: HotkeyMapping[];
}

interface PlaylistInfo {
  id: string;
  name: string;
  uri: string;
}

export class SettingsUI {
  private config: ExtensionConfig;
  private onConfigChange: (config: ExtensionConfig) => void;
  private playlistManager: PlaylistManager;
  private settingsModal: HTMLElement | null = null;

  constructor(config: ExtensionConfig, onConfigChange: (config: ExtensionConfig) => void) {
    this.config = { ...config };
    this.onConfigChange = onConfigChange;
    this.playlistManager = new PlaylistManager();
  }

  initialize(): void {
    this.addTopbarButton();
  }

  private addTopbarButton(): void {
    const button = document.createElement('button');
    button.innerText = 'Hotkeys';
    button.className = 'playlist-hotkeys-settings-btn';
    button.style.cssText = `
      background: var(--spice-button);
      color: var(--spice-text);
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin: 0 8px;
    `;
    
    button.addEventListener('click', () => this.openSettings());

    const topbar = document.querySelector('[data-testid="topbar-content-wrapper"]') ||
                   document.querySelector('.Root__top-bar') ||
                   document.querySelector('#spicetify-playlist-list');
    
    if (topbar) {
      topbar.appendChild(button);
    } else {
      console.warn('Could not find topbar to add settings button');
      setTimeout(() => this.addTopbarButton(), 1000);
    }
  }

  private async openSettings(): Promise<void> {
    if (this.settingsModal) {
      this.settingsModal.style.display = 'block';
      return;
    }

    try {
      const playlists = await this.playlistManager.getUserPlaylists();
      this.createSettingsModal(playlists);
    } catch (error) {
      console.error('Failed to load playlists for settings:', error);
      Spicetify.showNotification('Failed to load playlists', true);
    }
  }

  private createSettingsModal(playlists: PlaylistInfo[]): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: var(--spice-card);
      color: var(--spice-text);
      padding: 24px;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
    `;

    modal.innerHTML = this.renderSettingsHTML(playlists);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    this.settingsModal = overlay;
    this.attachEventListeners(playlists);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeSettings();
      }
    });
  }

  private renderSettingsHTML(playlists: PlaylistInfo[]): string {
    const playlistOptions = playlists
      .map(p => `<option value="${p.id}">${p.name}</option>`)
      .join('');

    const mappingsHTML = this.config.mappings
      .map((mapping, index) => this.renderMappingHTML(mapping, index, playlists))
      .join('');

    return `
      <h2>Playlist Hotkeys Settings</h2>
      
      <div style="margin-bottom: 20px;">
        <label>
          <input type="checkbox" id="global-mode" ${this.config.globalMode ? 'checked' : ''}>
          Enable Global Hotkeys (works when Spotify is in background)
        </label>
        <div style="font-size: 12px; color: var(--spice-subtext); margin-top: 4px;">
          Note: Global hotkeys require additional setup (Phase 1 feature)
        </div>
      </div>

      <h3>Hotkey Mappings</h3>
      <div id="mappings-container">
        ${mappingsHTML}
      </div>
      
      <button id="add-mapping" style="margin: 12px 0; padding: 8px 12px; background: var(--spice-button); color: var(--spice-text); border: none; border-radius: 4px; cursor: pointer;">
        Add New Mapping
      </button>
      
      <div style="display: flex; gap: 12px; margin-top: 20px;">
        <button id="save-settings" style="padding: 8px 16px; background: var(--spice-button); color: var(--spice-text); border: none; border-radius: 4px; cursor: pointer;">
          Save
        </button>
        <button id="cancel-settings" style="padding: 8px 16px; background: var(--spice-card); color: var(--spice-text); border: 1px solid var(--spice-button); border-radius: 4px; cursor: pointer;">
          Cancel
        </button>
      </div>
      
      <template id="mapping-template">
        ${this.renderMappingHTML({ combo: '', playlistIds: [] }, -1, playlists)}
      </template>
      
      <select id="playlist-options" style="display: none;">
        <option value="">Select a playlist...</option>
        ${playlistOptions}
      </select>
    `;
  }

  private renderMappingHTML(mapping: HotkeyMapping, index: number, playlists: PlaylistInfo[]): string {
    const selectedPlaylists = mapping.playlistIds
      .map(id => playlists.find(p => p.id === id))
      .filter(Boolean) as PlaylistInfo[];

    const playlistTags = selectedPlaylists
      .map(p => `<span class="playlist-tag" data-id="${p.id}">${p.name} ×</span>`)
      .join('');

    return `
      <div class="mapping-item" data-index="${index}" style="border: 1px solid var(--spice-button); padding: 12px; margin-bottom: 12px; border-radius: 4px;">
        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
          <input type="text" 
                 class="combo-input" 
                 placeholder="e.g. Ctrl+Alt+1" 
                 value="${mapping.combo}"
                 style="padding: 4px 8px; background: var(--spice-main); color: var(--spice-text); border: 1px solid var(--spice-button); border-radius: 4px;">
          <select class="playlist-select" style="padding: 4px 8px; background: var(--spice-main); color: var(--spice-text); border: 1px solid var(--spice-button); border-radius: 4px;">
            <option value="">Add playlist...</option>
            ${playlists.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
          <button class="remove-mapping" style="padding: 4px 8px; background: var(--spice-notification-error); color: white; border: none; border-radius: 4px; cursor: pointer;">Remove</button>
        </div>
        <div class="selected-playlists" style="display: flex; flex-wrap: wrap; gap: 4px;">
          ${playlistTags}
        </div>
      </div>
    `;
  }

  private attachEventListeners(playlists: PlaylistInfo[]): void {
    if (!this.settingsModal) return;

    const modal = this.settingsModal;

    modal.querySelector('#add-mapping')?.addEventListener('click', () => {
      this.addNewMapping(playlists);
    });

    modal.querySelector('#save-settings')?.addEventListener('click', () => {
      this.saveSettings();
    });

    modal.querySelector('#cancel-settings')?.addEventListener('click', () => {
      this.closeSettings();
    });

    this.attachMappingEventListeners();
  }

  private attachMappingEventListeners(): void {
    if (!this.settingsModal) return;

    this.settingsModal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('remove-mapping')) {
        target.closest('.mapping-item')?.remove();
      }
      
      if (target.classList.contains('playlist-tag')) {
        target.remove();
      }
    });

    this.settingsModal.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      
      if (target.classList.contains('playlist-select') && target.value) {
        this.addPlaylistToMapping(target);
      }
    });
  }

  private addPlaylistToMapping(selectElement: HTMLSelectElement): void {
    const playlistId = selectElement.value;
    const playlistName = selectElement.selectedOptions[0]?.textContent || '';
    
    if (!playlistId) return;

    const mappingItem = selectElement.closest('.mapping-item');
    const selectedContainer = mappingItem?.querySelector('.selected-playlists');
    
    if (selectedContainer) {
      const existing = selectedContainer.querySelector(`[data-id="${playlistId}"]`);
      if (!existing) {
        const tag = document.createElement('span');
        tag.className = 'playlist-tag';
        tag.setAttribute('data-id', playlistId);
        tag.textContent = `${playlistName} ×`;
        tag.style.cssText = `
          background: var(--spice-button);
          color: var(--spice-text);
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 12px;
          cursor: pointer;
        `;
        selectedContainer.appendChild(tag);
      }
    }
    
    selectElement.value = '';
  }

  private addNewMapping(playlists: PlaylistInfo[]): void {
    const container = this.settingsModal?.querySelector('#mappings-container');
    if (!container) return;

    const newMappingHTML = this.renderMappingHTML(
      { combo: '', playlistIds: [] },
      container.children.length,
      playlists
    );

    const div = document.createElement('div');
    div.innerHTML = newMappingHTML;
    container.appendChild(div.firstElementChild!);
  }

  private saveSettings(): void {
    const globalMode = (this.settingsModal?.querySelector('#global-mode') as HTMLInputElement)?.checked || false;
    const mappings: HotkeyMapping[] = [];

    const mappingItems = this.settingsModal?.querySelectorAll('.mapping-item');
    mappingItems?.forEach(item => {
      const combo = (item.querySelector('.combo-input') as HTMLInputElement)?.value.trim();
      const playlistTags = item.querySelectorAll('.playlist-tag');
      const playlistIds = Array.from(playlistTags).map(tag => tag.getAttribute('data-id')!).filter(Boolean);

      if (combo && playlistIds.length > 0) {
        mappings.push({ combo, playlistIds });
      }
    });

    const newConfig: ExtensionConfig = {
      globalMode,
      mappings
    };

    this.config = newConfig;
    this.onConfigChange(newConfig);
    this.closeSettings();

    Spicetify.showNotification(`Saved ${mappings.length} hotkey mapping(s)`);
  }

  private closeSettings(): void {
    if (this.settingsModal) {
      this.settingsModal.remove();
      this.settingsModal = null;
    }
  }
}