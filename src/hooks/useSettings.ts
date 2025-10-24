/**
 * useSettings Hook
 * Manages settings state and persistence
 */

import { useState, useEffect } from 'react';
import type { ExtensionConfig } from '../types/settings';

const DEFAULT_CONFIG: ExtensionConfig = {
  globalMode: false,
  mappings: [],
  helperScriptPath: undefined,
  helperAutoStart: false,
};

export function useSettings() {
  const [config, setConfig] = useState<ExtensionConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Load config from LocalStorage
  useEffect(() => {
    try {
      const stored = Spicetify.LocalStorage?.get('playlist-hotkeys-config');
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[useSettings] Failed to load config:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save config to LocalStorage
  const saveConfig = (newConfig: ExtensionConfig) => {
    try {
      Spicetify.LocalStorage?.set('playlist-hotkeys-config', JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (error) {
      console.error('[useSettings] Failed to save config:', error);
    }
  };

  return {
    config,
    isLoading,
    saveConfig,
  };
}
