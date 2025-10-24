/**
 * Playlist Selector Component
 * Searchable dropdown for selecting playlists
 */

import React, { useState, useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredPlaylists = playlists.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedIds.includes(p.id)
  );

  const selectedPlaylists = playlists.filter((p) => selectedIds.includes(p.id));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPlaylist = (playlistId: string) => {
    onAdd(playlistId);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
      <input
        type="text"
        placeholder="Search playlists..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
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

      {/* Dropdown */}
      {isOpen && filteredPlaylists.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--spice-card)',
            border: '1px solid var(--spice-button)',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {filteredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => handleSelectPlaylist(playlist.id)}
              style={{
                padding: '8px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--spice-highlight)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--spice-highlight)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {playlist.name}
            </div>
          ))}
        </div>
      )}

      {/* Selected playlist tags */}
      {selectedPlaylists.length > 0 && (
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
      )}
    </div>
  );
};
