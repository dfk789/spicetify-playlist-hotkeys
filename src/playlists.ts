/**
 * Playlist Management for Spicetify Extension  
 * Handles adding tracks to playlists and deduplication
 */

interface PlaylistInfo {
  id: string;
  name: string;
  uri: string;
}

export class PlaylistManager {
  private playlistCache: Map<string, PlaylistInfo> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  async addToPlaylists(trackUri: string, playlistIds: string[]): Promise<void> {
    if (!trackUri || playlistIds.length === 0) {
      throw new Error('Invalid track URI or empty playlist list');
    }

    const promises = playlistIds.map(playlistId => 
      this.addToSinglePlaylist(trackUri, playlistId)
    );

    const results = await Promise.allSettled(promises);
    
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      const failureReasons = failures
        .map(f => (f as PromiseRejectedResult).reason?.message || 'Unknown error')
        .join(', ');
      throw new Error(`Failed to add to ${failures.length} playlist(s): ${failureReasons}`);
    }
  }

  private async addToSinglePlaylist(trackUri: string, playlistId: string): Promise<void> {
    try {
      const isAlreadyAdded = await this.isTrackInPlaylist(trackUri, playlistId);
      
      if (isAlreadyAdded) {
        console.log(`Track ${trackUri} already in playlist ${playlistId}, skipping`);
        return;
      }

      await Spicetify.CosmosAsync.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { uris: [trackUri] }
      );
    } catch (error) {
      console.error(`Failed to add track to playlist ${playlistId}:`, error);
      throw new Error(`Failed to add to playlist ${playlistId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async isTrackInPlaylist(trackUri: string, playlistId: string): Promise<boolean> {
    try {
      const response = await Spicetify.CosmosAsync.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        undefined,
        { 
          'fields': 'items(track(uri))',
          'limit': '50' 
        }
      );

      if (!response || !response.items) {
        return false;
      }

      return response.items.some((item: any) => item.track?.uri === trackUri);
    } catch (error) {
      console.warn(`Failed to check if track is in playlist ${playlistId}:`, error);
      return false;
    }
  }

  async getUserPlaylists(): Promise<PlaylistInfo[]> {
    const now = Date.now();
    if (this.playlistCache.size > 0 && (now - this.lastCacheUpdate) < this.cacheExpiry) {
      return Array.from(this.playlistCache.values());
    }

    try {
      const response = await Spicetify.CosmosAsync.get('sp://core-playlist/v1/rootlist');
      
      if (!response || !response.rows) {
        throw new Error('Invalid response from playlist API');
      }

      const playlists: PlaylistInfo[] = response.rows
        .filter((row: any) => row.type === 'playlist')
        .map((row: any) => ({
          id: this.extractPlaylistId(row.uri),
          name: row.attributes?.name || 'Unknown Playlist',
          uri: row.uri
        }))
        .filter((playlist: PlaylistInfo) => playlist.id);

      this.playlistCache.clear();
      playlists.forEach(playlist => {
        this.playlistCache.set(playlist.id, playlist);
      });
      
      this.lastCacheUpdate = now;
      return playlists;
    } catch (error) {
      console.error('Failed to fetch user playlists:', error);
      throw new Error('Failed to fetch playlists');
    }
  }

  private extractPlaylistId(uri: string): string {
    if (!uri) return '';
    
    const parts = uri.split(':');
    return parts.length >= 3 ? parts[2] : '';
  }

  getPlaylistById(id: string): PlaylistInfo | undefined {
    return this.playlistCache.get(id);
  }

  clearCache(): void {
    this.playlistCache.clear();
    this.lastCacheUpdate = 0;
  }
}