/**
 * Settings Button Component
 * Renders the playlist hotkeys settings button in the player controls
 */

import React from 'react';
import { hkPlaylistIcon } from '../icon';

interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  return (
    <button
      className="playlist-hotkeys-settings-btn"
      title="Configure Playlist Hotkeys"
      aria-label="Configure Playlist Hotkeys"
      onClick={onClick}
      style={{
        inlineSize: '40px',
        marginInlineStart: '4px',
        backgroundColor: 'transparent',
        color: 'var(--text-bright-accent, currentColor)',
        border: '0',
        boxShadow: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: '0',
        transform: 'translateY(5px)',
        cursor: 'pointer',
      }}
    >
      <span
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: hkPlaylistIcon }}
      />
    </button>
  );
};
