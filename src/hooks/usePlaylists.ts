/**
 * usePlaylists Hook
 * Loads and manages playlist data
 */

import { useState, useEffect } from 'react';
import type { PlaylistInfo } from '../types/settings';

export function usePlaylists(playlistManager: any) {
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistManager) return;

    const loadPlaylists = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedPlaylists = await playlistManager.getUserPlaylists();
        setPlaylists(loadedPlaylists);
      } catch (err) {
        console.error('[usePlaylists] Failed to load playlists:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPlaylists([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlaylists();
  }, [playlistManager]);

  return {
    playlists,
    isLoading,
    error,
  };
}
