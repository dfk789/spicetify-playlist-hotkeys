
const DEBUG_STORAGE_KEY = 'playlist-hotkeys-debug';

export class DebugManager {
  private debugEnabled: boolean;

  constructor() {
    this.debugEnabled = this.loadDebugFlag();
  }

  private loadDebugFlag(): boolean {
    return Spicetify.LocalStorage?.get(DEBUG_STORAGE_KEY) === 'true';
  }

  setDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
    Spicetify.LocalStorage?.set(DEBUG_STORAGE_KEY, String(enabled));
  }

  isEnabled(): boolean {
    return this.debugEnabled;
  }

  log(prefix: string, ...args: unknown[]): void {
    if (!this.debugEnabled) return;
    console.log(`[${prefix}]`, ...args);
  }

  warn(prefix: string, ...args: unknown[]): void {
    if (!this.debugEnabled) return;
    console.warn(`[${prefix}]`, ...args);
  }

  error(prefix: string, ...args: unknown[]): void {
    if (!this.debugEnabled) return;
    console.error(`[${prefix}]`, ...args);
  }
}

// Global debug instance
export const debugManager = new DebugManager();

// Global debug functions for easy access
export const debug = (prefix: string, ...args: unknown[]) => debugManager.log(prefix, ...args);
export const debugWarn = (prefix: string, ...args: unknown[]) => debugManager.warn(prefix, ...args);
export const debugError = (prefix: string, ...args: unknown[]) => debugManager.error(prefix, ...args);