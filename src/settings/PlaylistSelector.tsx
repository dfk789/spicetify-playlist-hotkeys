/**
 * Playlist Selector Component
 * Searchable dropdown for selecting playlists
 */

import React, { useState } from 'react';
import type { PlaylistInfo } from '../types/settings';

interface PlaylistSelectorProps {
  playlists: PlaylistInfo[];
  selectedIds: string[];
  onAdd: (playlistId: string) => void;
  onRemove: (playlistId: string) => void;
}

export const PlaylistSelector: React.FC<PlaylistSelectorProps> = ({
  playlists,
  selectedIds,
  onAdd,
  onRemove,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPlaylists = playlists.filter((p) => selectedIds.includes(p.id));

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Search playlists..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsOpen(true)}
        style={{
          padding: '4px 8px',
          background: 'var(--spice-main)',
          color: 'var(--spice-text)',
          border: '1px solid var(--spice-button)',
          borderRadius: '4px',
          width: '100%',
        }}
      />

      {/* Selected playlist tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
        {selectedPlaylists.map((playlist) => (
          <span
            key={playlist.id}
            onClick={() => onRemove(playlist.id)}
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              background: 'var(--spice-button)',
              borderRadius: '12px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            {playlist.name} ×
          </span>
        ))}
      </div>

      {/* Dropdown - full implementation in Phase 3.4 */}
    </div>
  );
};
