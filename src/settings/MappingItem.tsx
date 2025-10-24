/**
 * Mapping Item Component
 * Individual hotkey mapping editor (combo + playlists)
 */

import React from 'react';
import { HotkeyCapture } from './HotkeyCapture';
import { PlaylistSelector } from './PlaylistSelector';
import type { HotkeyMapping, PlaylistInfo } from '../types/settings';

interface MappingItemProps {
  mapping: HotkeyMapping;
  playlists: PlaylistInfo[];
  onChange: (mapping: HotkeyMapping) => void;
  onRemove: () => void;
}

export const MappingItem: React.FC<MappingItemProps> = ({
  mapping,
  playlists,
  onChange,
  onRemove,
}) => {
  return (
    <div
      style={{
        border: '1px solid var(--spice-button)',
        padding: '12px',
        marginBottom: '12px',
        borderRadius: '4px',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
        <HotkeyCapture
          combo={mapping.combo}
          onChange={(combo) => onChange({ ...mapping, combo })}
        />
        <PlaylistSelector
          playlists={playlists}
          selectedIds={mapping.playlistIds}
          onAdd={(id) => onChange({ ...mapping, playlistIds: [...mapping.playlistIds, id] })}
          onRemove={(id) =>
            onChange({ ...mapping, playlistIds: mapping.playlistIds.filter((pid) => pid !== id) })
          }
        />
        <button
          onClick={onRemove}
          style={{
            padding: '4px 8px',
            background: 'var(--spice-notification-error)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
};
