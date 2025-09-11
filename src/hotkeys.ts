/**
 * Hotkey Management for Spicetify Extension
 * Handles in-app keyboard shortcuts with combo normalization
 */

type HotkeyCallback = () => void | Promise<void>;

interface HotkeyRegistration {
  combo: string;
  normalizedCombo: string;
  callback: HotkeyCallback;
}

export class HotkeyManager {
  private registrations: Map<string, HotkeyRegistration> = new Map();
  private globalRegistrations: Map<string, HotkeyRegistration> = new Map();
  private isListening = false;
  private isGlobalListening = false;
  private globalHotkeysEnabled = false;

  constructor() {
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  register(combo: string, callback: HotkeyCallback, isGlobal: boolean = false): void {
    const normalizedCombo = this.normalizeCombo(combo);
    
    const registration: HotkeyRegistration = {
      combo,
      normalizedCombo,
      callback
    };

    if (isGlobal && this.globalHotkeysEnabled) {
      this.globalRegistrations.set(normalizedCombo, registration);
      this.registerGlobalHotkey(normalizedCombo, callback);
    } else {
      // Always register as in-app hotkey when global is disabled or not requested
      this.registrations.set(normalizedCombo, registration);
      
      if (!this.isListening) {
        this.startListening();
      }
    }
    
    console.log(`🎹 Registered hotkey: ${combo} -> ${normalizedCombo} (${isGlobal && this.globalHotkeysEnabled ? 'global' : 'in-app'})`);
  }

  unregister(combo: string): void {
    const normalizedCombo = this.normalizeCombo(combo);
    this.registrations.delete(normalizedCombo);
    
    if (this.registrations.size === 0) {
      this.stopListening();
    }
  }

  clearAll(): void {
    this.registrations.clear();
    this.globalRegistrations.clear();
    this.stopListening();
    this.stopGlobalListening();
  }

  setGlobalHotkeysEnabled(enabled: boolean): void {
    console.log(`🌍 Global hotkeys ${enabled ? 'enabled' : 'disabled'}`);
    this.globalHotkeysEnabled = enabled;
    
    if (enabled) {
      this.startGlobalListening();
    } else {
      this.stopGlobalListening();
    }
  }

  private startListening(): void {
    if (this.isListening) return;
    
    document.addEventListener('keydown', this.handleKeydown, true);
    this.isListening = true;
  }

  private stopListening(): void {
    if (!this.isListening) return;
    
    document.removeEventListener('keydown', this.handleKeydown, true);
    this.isListening = false;
  }

  private async handleKeydown(event: KeyboardEvent): Promise<void> {
    const combo = this.buildComboFromEvent(event);
    const registration = this.registrations.get(combo);
    
    // Debug logging to see what keys are being pressed
    if (combo && (event.ctrlKey || event.altKey || event.shiftKey)) {
      console.log(`🎹 Key pressed: ${combo}, registered: ${!!registration}, available: [${Array.from(this.registrations.keys()).join(', ')}]`);
    }
    
    if (registration) {
      event.preventDefault();
      event.stopPropagation();
      
      try {
        await registration.callback();
      } catch (error) {
        console.error('Hotkey callback error:', error);
      }
    }
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

  private normalizeCombo(combo: string): string {
    return combo
      .split('+')
      .map(part => part.trim())
      .map(part => this.normalizeModifier(part))
      .sort((a, b) => {
        const order = ['Ctrl', 'Alt', 'Shift'];
        const aIndex = order.indexOf(a);
        const bIndex = order.indexOf(b);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      })
      .join('+');
  }

  private normalizeModifier(modifier: string): string {
    const normalized = modifier.toLowerCase();
    
    switch (normalized) {
      case 'ctrl':
      case 'control': 
      case 'cmd':
      case 'command':
        return 'Ctrl';
      case 'alt':
      case 'option':
        return 'Alt';
      case 'shift':
        return 'Shift';
      default:
        return this.normalizeKey(modifier);
    }
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

  getRegistrations(): HotkeyRegistration[] {
    return Array.from(this.registrations.values());
  }

  private registerGlobalHotkey(combo: string, callback: HotkeyCallback): void {
    try {
      let globalShortcut = null;
      
      // Try multiple ways to access Electron's globalShortcut
      if (typeof window !== 'undefined' && (window as any).require) {
        try {
          // Try new way first (Electron 14+)
          const { ipcRenderer } = (window as any).require('electron');
          if (ipcRenderer) {
            const electronCombo = this.convertToElectronCombo(combo);
            console.log(`🔧 Registering global hotkey via IPC: ${combo} -> ${electronCombo}`);
            
            ipcRenderer.invoke('register-global-shortcut', electronCombo).then((success: boolean) => {
              if (success) {
                console.log(`✅ Global hotkey registered successfully: ${combo}`);
              } else {
                console.warn(`⚠️ Failed to register global hotkey: ${combo}`);
                this.fallbackToInAppHotkey(combo, callback);
              }
            }).catch(() => {
              console.warn('⚠️ IPC method failed, trying remote...');
              this.tryRemoteGlobalShortcut(combo, callback);
            });
            return;
          }
        } catch (error) {
          console.warn('⚠️ IPC method not available, trying remote...');
        }
        
        this.tryRemoteGlobalShortcut(combo, callback);
      } else {
        console.warn('⚠️ Global shortcuts not available - Electron not found');
        this.fallbackToInAppHotkey(combo, callback);
      }
    } catch (error) {
      console.error('Failed to register global hotkey:', error);
      this.fallbackToInAppHotkey(combo, callback);
    }
  }
  
  private tryRemoteGlobalShortcut(combo: string, callback: HotkeyCallback): void {
    try {
      const { globalShortcut } = (window as any).require('electron').remote;
      
      const electronCombo = this.convertToElectronCombo(combo);
      console.log(`🔧 Registering global hotkey via remote: ${combo} -> ${electronCombo}`);
      
      const success = globalShortcut.register(electronCombo, async () => {
        console.log(`🌍 Global hotkey triggered: ${combo}`);
        try {
          await callback();
        } catch (error) {
          console.error('Global hotkey callback error:', error);
        }
      });
      
      if (success) {
        console.log(`✅ Global hotkey registered successfully: ${combo}`);
      } else {
        console.warn(`⚠️ Failed to register global hotkey: ${combo}`);
        this.fallbackToInAppHotkey(combo, callback);
      }
    } catch (error) {
      console.warn('⚠️ Remote method failed, falling back to in-app hotkey');
      this.fallbackToInAppHotkey(combo, callback);
    }
  }
  
  private fallbackToInAppHotkey(combo: string, callback: HotkeyCallback): void {
    console.log(`🔄 Falling back to in-app hotkey for: ${combo}`);
    const normalizedCombo = this.normalizeCombo(combo);
    const registration: HotkeyRegistration = {
      combo,
      normalizedCombo,
      callback
    };
    this.registrations.set(normalizedCombo, registration);
    
    if (!this.isListening) {
      this.startListening();
    }
  }

  private convertToElectronCombo(combo: string): string {
    // Convert our normalized format to Electron's format
    return combo
      .replace(/\+/g, '+')
      .replace('Ctrl', 'CommandOrControl')
      .replace('Alt', 'Alt')
      .replace('Shift', 'Shift');
  }

  private startGlobalListening(): void {
    if (this.isGlobalListening) return;
    
    console.log('🌍 Starting global hotkey listening...');
    this.isGlobalListening = true;
    
    // Re-register all global hotkeys
    for (const [combo, registration] of this.globalRegistrations.entries()) {
      this.registerGlobalHotkey(combo, registration.callback);
    }
  }

  private stopGlobalListening(): void {
    if (!this.isGlobalListening) return;
    
    console.log('🌍 Stopping global hotkey listening...');
    this.isGlobalListening = false;
    
    try {
      // Unregister all global hotkeys
      if (typeof window !== 'undefined' && (window as any).require) {
        const { globalShortcut } = (window as any).require('electron').remote;
        globalShortcut.unregisterAll();
        console.log('✅ All global hotkeys unregistered');
      }
    } catch (error) {
      console.error('Failed to unregister global hotkeys:', error);
    }
  }
}