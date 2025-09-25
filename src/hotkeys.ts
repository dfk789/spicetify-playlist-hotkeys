const HELPER_ORIGIN = "http://127.0.0.1:17976";

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
  private globalHotkeysEnabled = false;

  private helperToken: string | null = null;
  private helperES: EventSource | null = null;
  private helperAvailable = false;
  private helperReady = false;
  private helperSyncDebounce?: number;
  private helperRetryTimer?: number;

  private executionLocks: Map<string, boolean> = new Map();
  private lockTimeout = 500;

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

      this.ensureHelper().then((ok) => {
        if (ok) {
          this.startHelperEvents();
          void this.syncGlobalHelperCombos();
        }
      });
    }
    
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
    this.globalRegistrations.clear();
    this.stopListening();
    this.stopHelperEvents();
    this.stopHelperRetry();
  }

  setGlobalHotkeysEnabled(enabled: boolean): void {
    this.globalHotkeysEnabled = enabled;

    if (enabled) {
      this.ensureHelper().then((ok) => {
        if (ok) {
          this.stopHelperRetry();
          this.startHelperEvents();
          void this.syncGlobalHelperCombos();
        } else {
          this.startHelperRetry();
        }
      });
    } else {
      this.stopHelperEvents();
      this.stopHelperRetry();
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

    if (registration) {
      event.preventDefault();
      event.stopPropagation();

      if (!this.acquireLock(combo)) {
        return;
      }

      try {
        await registration.callback();
      } catch (error) {
        console.error('Hotkey callback error:', error);
      } finally {
        this.releaseLock(combo);
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

  // Execution lock methods to prevent double triggers
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

  getRegistrations(): HotkeyRegistration[] {
    return Array.from(this.registrations.values());
  }

  // All global hotkey functionality is now handled by the helper script
  // No Electron methods needed

  // Helper client methods
  private async ensureHelper(): Promise<boolean> {
    if (this.helperAvailable && this.helperToken) return true;
    try {
      const res = await fetch(`${HELPER_ORIGIN}/hello`, {
        method: "GET",
        signal: AbortSignal.timeout(2000)
      });
      if (!res.ok) return false;
      const j = await res.json();
      this.helperToken = String(j.token || "");
      this.helperAvailable = !!this.helperToken;
      if (this.helperAvailable) {
        console.log('?? Global hotkey helper connected');
      }
      return this.helperAvailable;
    } catch (error: any) {
      this.helperAvailable = false;
      this.helperToken = null;
      return false;
    }
  }

  private startHelperEvents(): void {
    if (!this.helperAvailable || this.helperES) return;
    try {
      const tokenParam = this.helperToken ? `?token=${encodeURIComponent(this.helperToken)}` : "";
      const es = new EventSource(`${HELPER_ORIGIN}/events${tokenParam}`);
      es.onmessage = async (ev) => {
        try {
          const msg = JSON.parse(ev.data);

          if (msg.ready) {
            this.helperReady = true;
            void this.syncGlobalHelperCombos();
            return;
          }
          if (msg.combo) {
            const normalized = this.normalizeCombo(String(msg.combo));
            const reg = this.globalRegistrations.get(normalized);
            if (reg) {
              if (!this.acquireLock(normalized)) {
                return;
              }

              try {
                await reg.callback();
              } catch (err) {
                console.error("Global hotkey helper callback error:", err);
              } finally {
                this.releaseLock(normalized);
              }
            }
          }
        } catch (e) {
          console.error('Helper message parse error:', e);
        }
      };
      es.onerror = () => {
        try { es.close(); } catch {}
        this.helperES = null;
        this.helperReady = false;
        this.helperAvailable = false;
        this.helperToken = null;
        this.startHelperRetry();
      };
      this.helperES = es;
    } catch (e) {
      console.warn("Failed to open helper SSE:", e);
    }
  }

  private stopHelperEvents(): void {
    if (this.helperES) {
      this.helperES.close();
      this.helperES = null;
    }
    this.helperReady = false;
  }

  public async syncGlobalHelperCombos(): Promise<void> {
    if (!this.helperAvailable || !this.helperToken || !this.globalHotkeysEnabled) {
      return;
    }
    if (!this.helperReady) {
      return;
    }

    const combos = Array.from(this.globalRegistrations.keys());
    const body = { combos };
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.helperToken}`,
    };

    try {
      if (this.helperSyncDebounce) window.clearTimeout(this.helperSyncDebounce);
      this.helperSyncDebounce = window.setTimeout(async () => {
        try {
          const response = await fetch(`${HELPER_ORIGIN}/config`, {
            method: "POST",
            headers,
            body: JSON.stringify(body)
          });

          if (!response.ok) {
            console.error('Helper config failed:', response.status, response.statusText);
          }
        } catch (e) {
          console.error('Helper config error:', e);
        }
      }, 200);
    } catch (e) {
      console.warn("Failed to sync combos to helper:", e);
    }
  }

  private startHelperRetry(): void {
    if (this.helperRetryTimer) return;
    const attempt = async () => {
      if (!this.globalHotkeysEnabled) {
        this.stopHelperRetry();
        return;
      }
      const ok = await this.ensureHelper();
      if (ok) {
        this.stopHelperRetry();
        this.startHelperEvents();
        void this.syncGlobalHelperCombos();
      }
    };
    void attempt();
    this.helperRetryTimer = window.setInterval(attempt, 3000);
  }

  private stopHelperRetry(): void {
    if (this.helperRetryTimer) {
      window.clearInterval(this.helperRetryTimer);
      this.helperRetryTimer = undefined;
    }
  }

  public getHelperStatus(): { available: boolean; ready: boolean; connected: boolean } {
    return {
      available: this.helperAvailable,
      ready: this.helperReady,
      connected: !!this.helperES
    };
  }

  public async checkHelper(): Promise<boolean> {
    return await this.ensureHelper();
  }
}
