/**
 * Mapping List Component
 * List of all hotkey mappings with add/edit/remove controls
 */

import React from 'react';
import { MappingItem } from './MappingItem';
import type { HotkeyMapping, PlaylistInfo } from '../types/settings';

interface MappingListProps {
  mappings: HotkeyMapping[];
  playlists: PlaylistInfo[];
  onChange: (mappings: HotkeyMapping[]) => void;
}

export const MappingList: React.FC<MappingListProps> = ({ mappings, playlists, onChange }) => {
  const handleAdd = () => {
    onChange([...mappings, { combo: '', playlistIds: [] }]);
  };

  const handleChange = (index: number, mapping: HotkeyMapping) => {
    const newMappings = [...mappings];
    newMappings[index] = mapping;
    onChange(newMappings);
  };

  const handleRemove = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h3>Hotkey Mappings</h3>
      <div>
        {mappings.map((mapping, index) => (
          <MappingItem
            key={index}
            mapping={mapping}
            playlists={playlists}
            onChange={(m) => handleChange(index, m)}
            onRemove={() => handleRemove(index)}
          />
        ))}
      </div>
      <button
        onClick={handleAdd}
        style={{
          margin: '12px 0',
          padding: '8px 12px',
          background: 'var(--spice-button)',
          color: 'var(--spice-text)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Add New Mapping
      </button>
    </div>
  );
};
