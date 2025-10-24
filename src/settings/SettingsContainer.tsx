/**
 * Settings Container
 * Top-level React component that manages settings state and renders button + modal
 */

import React, { useState } from 'react';
import { SettingsButton } from './SettingsButton';
import { SettingsModal } from './SettingsModal';
import { usePlaylists } from '../hooks/usePlaylists';
import { useHelperStatus } from '../hooks/useHelperStatus';
import type { ExtensionConfig } from '../types/settings';

interface SettingsContainerProps {
  config: ExtensionConfig;
  onConfigChange: (config: ExtensionConfig) => void;
  playlistManager: any;
  hotkeyManager: any;
}

export const SettingsContainer: React.FC<SettingsContainerProps> = ({
  config,
  onConfigChange,
  playlistManager,
  hotkeyManager,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { playlists, isLoading, error } = usePlaylists(playlistManager);
  const helperStatus = useHelperStatus(hotkeyManager.getHelperConnection());

  const handleSave = (newConfig: ExtensionConfig) => {
    onConfigChange(newConfig);
    setIsModalOpen(false);

    // Show notification
    Spicetify.showNotification(
      `Saved ${newConfig.mappings.length} hotkey mapping(s)`,
      false
    );
  };

  return (
    <>
      <SettingsButton onClick={() => setIsModalOpen(true)} />

      {isModalOpen && (
        <SettingsModal
          config={config}
          playlists={playlists}
          helperStatus={helperStatus}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
