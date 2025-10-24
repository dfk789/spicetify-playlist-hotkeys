/**
 * Settings Modal Component
 * Main modal container for all settings
 */

import React from 'react';
import { HelperStatusBanner } from './HelperStatusBanner';
import { ModeToggle } from './ModeToggle';
import { MappingList } from './MappingList';
import type { ExtensionConfig, PlaylistInfo, HelperStatus } from '../types/settings';

interface SettingsModalProps {
  config: ExtensionConfig;
  playlists: PlaylistInfo[];
  helperStatus: HelperStatus;
  onSave: (config: ExtensionConfig) => void;
  onCancel: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  playlists,
  helperStatus,
  onSave,
  onCancel,
}) => {
  const [currentConfig, setCurrentConfig] = React.useState<ExtensionConfig>(config);

  const handleSave = () => {
    onSave(currentConfig);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: 'var(--spice-card)',
          color: 'var(--spice-text)',
          padding: '24px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <h2>Playlist Hotkeys Settings</h2>

        <HelperStatusBanner status={helperStatus} isGlobalMode={currentConfig.globalMode} />

        <ModeToggle
          globalMode={currentConfig.globalMode}
          onChange={(globalMode) => setCurrentConfig({ ...currentConfig, globalMode })}
        />

        <MappingList
          mappings={currentConfig.mappings}
          playlists={playlists}
          onChange={(mappings) => setCurrentConfig({ ...currentConfig, mappings })}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              background: 'var(--spice-button)',
              color: 'var(--spice-text)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              background: 'var(--spice-card)',
              color: 'var(--spice-text)',
              border: '1px solid var(--spice-button)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
