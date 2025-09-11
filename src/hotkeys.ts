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
  private isListening = false;

  constructor() {
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  register(combo: string, callback: HotkeyCallback): void {
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

  unregister(combo: string): void {
    const normalizedCombo = this.normalizeCombo(combo);
    this.registrations.delete(normalizedCombo);
    
    if (this.registrations.size === 0) {
      this.stopListening();
    }
  }

  clearAll(): void {
    this.registrations.clear();
    this.stopListening();
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
}