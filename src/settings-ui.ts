/**
 * Settings UI for Spicetify Extension
 * Simple panel to manage hotkey mappings and global toggle
 */

import { PlaylistManager } from './playlists';
import { HotkeyManager } from './hotkeys';

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

interface PlaylistInfo {
  id: string;
  name: string;
  uri: string;
  owner?: string;
}

export class SettingsUI {
  private config: ExtensionConfig;
  private onConfigChange: (config: ExtensionConfig) => void;
  private playlistManager: PlaylistManager;
  private hotkeyManager: HotkeyManager;
  private settingsModal: HTMLElement | null = null;
  private currentPlaylists: PlaylistInfo[] = [];

  constructor(config: ExtensionConfig, onConfigChange: (config: ExtensionConfig) => void, hotkeyManager: HotkeyManager) {
    this.config = { ...config };
    this.onConfigChange = onConfigChange;
    this.playlistManager = new PlaylistManager();
    this.hotkeyManager = hotkeyManager;
  }

  initialize(): void {
    this.waitForPlayerAndAddButton();
  }

  private waitForPlayerAndAddButton(): void {
    const checkForAddToPlaylistButton = () => {
      // More comprehensive search for add to playlist button
      const selectors = [
        '[data-testid="add-button"]',
        '[aria-label*="Add to playlist"]', 
        '[aria-label*="Add to Playlist"]',
        '[aria-label*="Add to liked songs"]',
        '[data-testid="add-to-liked-songs-button"]',
        'button[title*="Add to"]',
        'button[aria-label*="Add to"]',
        '.control-button[data-testid*="add"]',
        '[data-testid="heart-button"]',
        '.player-controls button[data-testid]',
        '[class*="control"][class*="button"]',
        '.now-playing-bar button[aria-label*="Add"]'
      ];
      
      let addToPlaylistButton = null;
      for (const selector of selectors) {
        addToPlaylistButton = document.querySelector(selector);
        if (addToPlaylistButton) {
          console.log(`Found add button with selector: ${selector}`, addToPlaylistButton);
          break;
        }
      }
      
      if (addToPlaylistButton) {
        this.createHotkeyButtonNearAddButton(addToPlaylistButton as HTMLElement);
      } else {
        console.log('Add to playlist button not found with any selector, trying player controls area...');
        this.tryPlayerControlsArea();
      }
    };
    
    checkForAddToPlaylistButton();
  }

  private tryPlayerControlsArea(): void {
    // Look for player controls area to insert button
    const controlsSelectors = [
      '[data-testid="player-controls"]',
      '.player-controls', 
      '[data-testid="now-playing-bar"] .player-controls',
      '[class*="player-controls"]',
      '[class*="control"][class*="bar"]'
    ];
    
    let controlsArea = null;
    for (const selector of controlsSelectors) {
      controlsArea = document.querySelector(selector);
      if (controlsArea) {
        console.log(`Found player controls area with: ${selector}`, controlsArea);
        break;
      }
    }
    
    if (controlsArea) {
      this.createHotkeyButtonInControls(controlsArea as HTMLElement);
    } else {
      console.log('Player controls not found either, using fallback positioning...');
      setTimeout(() => this.waitForPlayerAndAddButton(), 1000);
    }
  }

  private createHotkeyButtonNearAddButton(addButton: HTMLElement): void {
    // Check if button already exists
    if (document.querySelector('.playlist-hotkeys-settings-btn')) {
      console.log('Button already exists, skipping');
      return;
    }

    console.log('Creating hotkey button near add button:', addButton);

    const button = this.createButton();
    
    // Try to find the parent container and insert after the add button
    const parent = addButton.parentElement;
    if (parent) {
      // Insert right after the add button
      parent.insertBefore(button, addButton.nextSibling);
      console.log('Hotkey button added after add button in parent container');
    } else {
      // Fallback to positioning relative to add button
      const rect = addButton.getBoundingClientRect();
      button.style.position = 'fixed';
      button.style.left = `${rect.right + 8}px`;
      button.style.top = `${rect.top}px`;
      button.style.zIndex = '9999';
      document.body.appendChild(button);
      console.log('Hotkey button positioned relative to add button');
    }
  }
  
  private createHotkeyButtonInControls(controlsArea: HTMLElement): void {
    // Check if button already exists
    if (document.querySelector('.playlist-hotkeys-settings-btn')) {
      console.log('Button already exists, skipping');
      return;
    }

    console.log('Creating hotkey button in controls area:', controlsArea);

    const button = this.createButton();
    
    // Try to append to the controls area
    try {
      controlsArea.appendChild(button);
      console.log('Hotkey button added to controls area');
    } catch (error) {
      console.log('Failed to append to controls, using relative positioning:', error);
      const rect = controlsArea.getBoundingClientRect();
      button.style.position = 'fixed';
      button.style.left = `${rect.right + 8}px`;
      button.style.top = `${rect.top + (rect.height - 32) / 2}px`; // Center vertically
      button.style.zIndex = '9999';
      document.body.appendChild(button);
      console.log('Hotkey button positioned relative to controls area');
    }
  }
  
  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.innerText = 'HK';
    button.className = 'Button-buttonTertiary-textBrightAccent-small-iconOnly-useBrowserDefaultFocusStyle-condensed playlist-hotkeys-settings-btn';
    button.title = 'Configure Playlist Hotkeys';
    button.style.cssText = `
      min-inline-size: 24px !important;
      min-block-size: 24px !important;
      padding-inline: 6px !important;
      padding-block: 4px !important;
      font-size: 9px !important;
      font-weight: bold !important;
      margin-inline-start: 6px !important;
      background-color: transparent !important;
      color: var(--text-bright-accent, #107434) !important;
      box-shadow: none !important;
      border: none !important;
      outline: none !important;
    `;
    
    button.addEventListener('click', () => {
      this.openSettings();
    });
    
    return button;
  }

  private async openSettings(): Promise<void> {
    if (this.settingsModal) {
      this.settingsModal.style.display = 'block';
      return;
    }

    console.log('Opening settings UI and loading playlists...');

    try {
      console.log('Calling playlistManager.getUserPlaylists()...');
      const playlists = await this.playlistManager.getUserPlaylists();
      this.currentPlaylists = playlists;
      console.log(`Settings UI received ${playlists.length} playlists:`, playlists);
      
      if (playlists.length === 0) {
        console.warn('No playlists available for settings UI');
        Spicetify.showNotification('No playlists found. Make sure you have created some playlists in Spotify.', true);
        // Still create the modal, but with empty playlist list
        this.createSettingsModal(playlists);
      } else {
        console.log('Creating settings modal with playlists');
        this.createSettingsModal(playlists);
      }
    } catch (error) {
      console.error('Failed to load playlists for settings:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Detailed error info:', {
        error: errorMessage,
        type: typeof error,
        instance: error instanceof Error
      });

      // Show more detailed error message
      if (errorMessage.includes('Invalid response structure')) {
        Spicetify.showNotification('Failed to load playlists: API response format issue. Check console for details.', true);
      } else if (errorMessage.includes('No response')) {
        Spicetify.showNotification('Failed to load playlists: No response from Spotify API. Try again later.', true);
      } else {
        Spicetify.showNotification(`Failed to load playlists: ${errorMessage}`, true);
      }

      // Create modal anyway with empty playlists list so user can see the UI
      console.log('Creating settings modal with empty playlist list due to error');
      this.createSettingsModal([]);
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
    console.log(`Rendering settings HTML with ${playlists.length} playlists:`, playlists);
    
    const playlistOptions = playlists
      .map(p => {
        console.log(`Creating option for playlist: ${p.name} (${p.id})`);
        return `<option value="${p.id}">${p.name}</option>`;
      })
      .join('');

    console.log('Generated playlist options HTML:', playlistOptions);

    const mappingsHTML = this.config.mappings
      .map((mapping, index) => this.renderMappingHTML(mapping, index, playlists))
      .join('');

    return `
      <h2>Playlist Hotkeys Settings</h2>
      
      <div style="margin-bottom: 20px; padding: 8px; background: var(--spice-main); border-radius: 4px; font-size: 12px; color: var(--spice-subtext);">
        <strong>Debug Info:</strong> Found ${playlists.length} playlist(s).
        ${playlists.length === 0 ? 'If you have playlists in Spotify but none are showing here, check the browser console (F12) for error details.' : ''}
      </div>
      
      <div style="margin-bottom: 20px;">
        <label>
          <input type="checkbox" id="global-mode" ${this.config.globalMode ? 'checked' : ''}>
          Enable Global Hotkeys (works when Spotify is in background)
        </label>
        <div style="font-size: 12px; color: var(--spice-subtext); margin-top: 4px;">
          ${this.getGlobalHotkeyStatusText()}
        </div>
      </div>

      <!-- Helper settings simplified: rely on single status above. -->

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
      .map(p => `<span class="playlist-tag" data-id="${p.id}" style="display: inline-block; padding: 2px 6px; background: var(--spice-button); border-radius: 12px; font-size: 11px; cursor: pointer; margin-right: 4px;">${p.name} ×</span>`)
      .join('');

    return `
      <div class="mapping-item" data-index="${index}" style="border: 1px solid var(--spice-button); padding: 12px; margin-bottom: 12px; border-radius: 4px;">
        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px; overflow: hidden;">
          <button class="combo-capture" 
                  data-combo="${mapping.combo}"
                  style="padding: 8px 12px; background: var(--spice-main); color: var(--spice-text); border: 1px solid var(--spice-button); border-radius: 4px; cursor: pointer; min-width: 120px; text-align: left;">
            ${mapping.combo || 'Click to set hotkey...'}
          </button>
          <div class="playlist-search-container" style="position: relative; max-width: 200px;">
            <input class="playlist-search" 
                   type="text" 
                   placeholder="Search playlists..." 
                   style="padding: 4px 8px; background: var(--spice-main); color: var(--spice-text); border: 1px solid var(--spice-button); border-radius: 4px; width: 100%;">
          </div>
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
      
      if (target.classList.contains('combo-capture')) {
        this.startHotkeyCapture(target as HTMLButtonElement);
      }
      
      if (target.classList.contains('playlist-option')) {
        this.selectPlaylistFromSearch(target);
      }
    });

    this.settingsModal.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      
      if (target.classList.contains('playlist-search')) {
        this.handlePlaylistSearch(target);
      }
    });

    this.settingsModal.addEventListener('focus', (e) => {
      const target = e.target as HTMLInputElement;
      
      if (target.classList.contains('playlist-search')) {
        this.showPlaylistDropdown(target);
      }
    }, true);

    // Add click-outside handler to hide dropdown
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const dropdown = document.querySelector('.active-playlist-dropdown');
      const activeInput = document.querySelector('.active-search-input');
      
      if (dropdown && activeInput && 
          !dropdown.contains(target) && 
          !activeInput.contains(target)) {
        this.hidePlaylistDropdown();
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
          display: inline-block;
          padding: 2px 6px;
          background: var(--spice-button);
          border-radius: 12px;
          font-size: 11px;
          cursor: pointer;
          margin-right: 4px;
        `;
        selectedContainer.appendChild(tag);
      }
    }
    
    selectElement.value = '';
  }

  private handlePlaylistSearch(input: HTMLInputElement): void {
    const searchTerm = input.value.toLowerCase();
    const dropdown = document.querySelector('.active-playlist-dropdown') as HTMLElement;
    
    if (!dropdown) return;
    
    const options = dropdown.querySelectorAll('.playlist-option');
    let visibleCount = 0;
    
    options.forEach(option => {
      const optionElement = option as HTMLElement;
      const playlistName = optionElement.textContent?.toLowerCase() || '';
      
      if (playlistName.includes(searchTerm)) {
        optionElement.style.display = 'block';
        visibleCount++;
      } else {
        optionElement.style.display = 'none';
      }
    });
    
    // Show dropdown if there are visible options OR no search term (show all)
    dropdown.style.display = (visibleCount > 0 || searchTerm.length === 0) ? 'block' : 'none';
  }

  private selectPlaylistFromSearch(optionElement: HTMLElement): void {
    const playlistId = optionElement.dataset.id;
    const playlistName = optionElement.textContent || '';
    
    if (!playlistId) return;

    const activeInput = document.querySelector('.active-search-input') as HTMLInputElement;
    if (!activeInput) return;

    const mappingItem = activeInput.closest('.mapping-item');
    const selectedContainer = mappingItem?.querySelector('.selected-playlists');

    if (selectedContainer) {
      const existing = selectedContainer.querySelector(`[data-id="${playlistId}"]`);
      if (existing) {
        return;
      }

      const tag = document.createElement('span');
      tag.className = 'playlist-tag';
      tag.dataset.id = playlistId;
      tag.textContent = `${playlistName} ×`;
      tag.style.cssText = `
        display: inline-block;
        padding: 2px 6px;
        background: var(--spice-button);
        border-radius: 12px;
        font-size: 11px;
        cursor: pointer;
        margin-right: 4px;
      `;
      
      selectedContainer.appendChild(tag);
    }

    // Clear search and hide dropdown
    activeInput.value = '';
    this.hidePlaylistDropdown();
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
    const newElement = div.firstElementChild! as HTMLElement;
    container.appendChild(newElement);
    
    // Ensure event listeners are attached to the new element
    this.attachMappingEventListeners();
  }

  private saveSettings(): void {
    const globalMode = (this.settingsModal?.querySelector('#global-mode') as HTMLInputElement)?.checked || false;
    const helperScriptPath = (this.settingsModal?.querySelector('#helper-path') as HTMLInputElement)?.value || '';
    const mappings: HotkeyMapping[] = [];

    const mappingItems = this.settingsModal?.querySelectorAll('.mapping-item');
    console.log('Found mapping items:', mappingItems?.length);
    
    mappingItems?.forEach((item, index) => {
      const comboButton = item.querySelector('.combo-capture') as HTMLButtonElement;
      const combo = comboButton?.getAttribute('data-combo')?.trim() || '';
      const playlistTags = item.querySelectorAll('.playlist-tag');
      const playlistIds = Array.from(playlistTags).map(tag => tag.getAttribute('data-id')!).filter(Boolean);

      console.log(`Mapping ${index}: combo="${combo}", playlists=[${playlistIds.join(',')}]`);

      if (combo && playlistIds.length > 0) {
        mappings.push({ combo, playlistIds });
      }
    });

    console.log('Final mappings to save:', mappings);

    const newConfig: ExtensionConfig = {
      globalMode,
      mappings,
      helperScriptPath: helperScriptPath || undefined,
      helperAutoStart: this.config.helperAutoStart // Preserve existing value
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

  private startHotkeyCapture(button: HTMLButtonElement): void {
    const originalText = button.textContent;
    button.textContent = 'Press keys...';
    button.style.background = 'var(--spice-notification-info)';
    
    const handleKeydown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const combo = this.buildComboFromEvent(event);
      
      if (combo && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        button.textContent = combo;
        button.setAttribute('data-combo', combo);
        button.style.background = 'var(--spice-main)';
        document.removeEventListener('keydown', handleKeydown, true);
        console.log('Captured hotkey:', combo);
      }
    };
    
    const handleBlur = () => {
      // Check if we have a saved combo, otherwise use default text
      const savedCombo = button.getAttribute('data-combo');
      button.textContent = savedCombo || 'Click to set hotkey...';
      button.style.background = 'var(--spice-main)';
      document.removeEventListener('keydown', handleKeydown, true);
      document.removeEventListener('click', handleClickOutside, true);
    };
    
    const handleClickOutside = (event: Event) => {
      if (!button.contains(event.target as Node)) {
        handleBlur();
      }
    };
    
    document.addEventListener('keydown', handleKeydown, true);
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 100);
  }
  
  private buildComboFromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');  
    if (event.shiftKey) parts.push('Shift');
    
    const key = this.normalizeKey(event.key);
    if (key && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      parts.push(key);
    }
    
    return parts.join('+');
  }
  
  private normalizeKey(key: string): string {
    if (key.length === 1) {
      return key.toUpperCase();
    }
    
    const keyMap: Record<string, string> = {
      'ArrowUp': 'Up',
      'ArrowDown': 'Down', 
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      ' ': 'Space'
    };
    
    return keyMap[key] || key;
  }

  private showPlaylistDropdown(input: HTMLInputElement): void {
    // Clean up any existing dropdown
    this.hidePlaylistDropdown();
    
    // Mark this input as active
    document.querySelectorAll('.active-search-input').forEach(el => el.classList.remove('active-search-input'));
    input.classList.add('active-search-input');
    
    // Use stored playlists
    const playlists = this.currentPlaylists;
    
    if (!playlists || playlists.length === 0) {
      return;
    }
    
    // Get input position
    const rect = input.getBoundingClientRect();
    
    // Create dropdown attached to body
    const dropdown = document.createElement('div');
    dropdown.className = 'active-playlist-dropdown';
    dropdown.style.cssText = `
      position: fixed;
      top: ${rect.bottom}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      background: var(--spice-card);
      border: 1px solid var(--spice-button);
      border-top: none;
      border-radius: 0 0 4px 4px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    // Add playlist options
    playlists.forEach((p: PlaylistInfo) => {
      const option = document.createElement('div');
      option.className = 'playlist-option';
      option.dataset.id = p.id;
      option.textContent = p.name;
      option.style.cssText = `
        padding: 8px;
        cursor: pointer;
        border-bottom: 1px solid var(--spice-highlight);
      `;
      
      // Add click handler directly since it's attached to body
      option.addEventListener('click', () => {
        this.selectPlaylistFromSearch(option);
      });
      
      dropdown.appendChild(option);
    });
    
    document.body.appendChild(dropdown);
  }

  private hidePlaylistDropdown(): void {
    const dropdown = document.querySelector('.active-playlist-dropdown');
    if (dropdown) {
      dropdown.remove();
    }
    
    document.querySelectorAll('.active-search-input').forEach(el => el.classList.remove('active-search-input'));
  }

  private getGlobalHotkeyStatusText(): string {
    if (!this.config.globalMode) {
      return '⚠️ Global hotkeys disabled';
    }
    
    const status = this.hotkeyManager.getHelperStatus();
    if (status.available && status.ready) {
      return '✅ Global hotkeys active via helper';
    } else if (status.available) {
      return '🔄 Helper found, connecting...';
    } else {
      return '🔴 Helper not running - start helper (python or standalone)';
    }
  }

}




