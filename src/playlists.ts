/**
 * Playlist Manager for Spicetify Extension
 * Handles adding tracks to playlists and fetching user playlists
 */

export interface PlaylistInfo {
  id: string;
  name: string;
  uri: string;
  owner?: string;
}

export class PlaylistManager {
  private playlistCache = new Map<string, PlaylistInfo>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  /**
   * Add a track to multiple playlists and automatically like it
   */
  async addToPlaylists(trackUri: string, playlistIds: string[]): Promise<void> {
    if (!trackUri || playlistIds.length === 0) {
      throw new Error('Invalid track URI or empty playlist list');
    }

    // First, add to liked songs
    try {
      await this.addToLikedSongs(trackUri);
    } catch (error) {
      // Don't throw error here - continue with playlists even if like fails
    }

    // Then add to playlists
    const promises = playlistIds.map(id => this.addToSinglePlaylist(trackUri, id));
    const results = await Promise.allSettled(promises);
    
    const failures = results.filter(result => result.status === 'rejected') as PromiseRejectedResult[];
    const successes = results.filter(result => result.status === 'fulfilled');
    
    // Only throw error if ALL playlists failed
    if (failures.length > 0 && successes.length === 0) {
      const errorMessages = failures.map(f => f.reason?.message || 'Unknown error').join(', ');
      throw new Error(`Failed to add to all ${failures.length} playlist(s): ${errorMessages}`);
    }
  }

  /**
   * Add a track to a single playlist
   */
  private async addToSinglePlaylist(trackUri: string, playlistId: string): Promise<void> {
    try {
      // Check if track is already in playlist to avoid duplicates
      if (await this.isTrackInPlaylist(trackUri, playlistId)) {
        return;
      }

      await Spicetify.CosmosAsync.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { uris: [trackUri] }
      );
    } catch (error: any) {
      // Handle 403 Forbidden errors (read-only playlists)
      if (error.status === 403 || error.message?.includes('403') || error.message?.includes('Forbidden')) {
        throw new Error(`Playlist is read-only or you don't have permission to add tracks`);
      }
      
      throw new Error(`Failed to add to playlist ${playlistId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a track to liked songs
   */
  private async addToLikedSongs(trackUri: string): Promise<void> {
    try {
      const trackId = this.extractTrackId(trackUri);
      if (!trackId) {
        throw new Error('Invalid track URI format');
      }

      // Check if already liked to avoid unnecessary API calls
      const isLiked = await this.isTrackLiked(trackUri);
      if (isLiked) {
        return;
      }

      await Spicetify.CosmosAsync.put(
        `https://api.spotify.com/v1/me/tracks`,
        { ids: [trackId] }
      );
    } catch (error) {
      throw new Error(`Failed to like track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a track is already liked
   */
  private async isTrackLiked(trackUri: string): Promise<boolean> {
    try {
      const trackId = this.extractTrackId(trackUri);
      if (!trackId) return false;

      const response = await Spicetify.CosmosAsync.get(
        `https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`
      );

      return response && Array.isArray(response) && response[0] === true;
    } catch (error) {
      return false;
    }
  }

  private async getTrackIdCandidates(trackUri: string): Promise<string[]> {
    if (!trackUri || !trackUri.startsWith('spotify:track:')) {
      return [];
    }

    const baseId = this.extractTrackId(trackUri);
    if (!baseId) {
      return [];
    }

    const ids = new Set<string>([baseId]);

    try {
      const trackResponse = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${baseId}`);

      const linkedFrom = trackResponse?.linked_from;
      const linkedFromId = typeof linkedFrom?.id === 'string' ? linkedFrom.id : undefined;
      const linkedFromUri = typeof linkedFrom?.uri === 'string' ? linkedFrom.uri : undefined;

      if (linkedFromId) {
        ids.add(linkedFromId);
      }

      if (linkedFromUri) {
        const linkedId = this.extractTrackId(linkedFromUri);
        if (linkedId) {
          ids.add(linkedId);
        }
      }
    } catch (error) {
      // Ignore lookup failures and fall back to the base track ID.
    }

    return Array.from(ids);
  }

  /**
   * Check if a track is already in a playlist
   */
  private async isTrackInPlaylist(trackUri: string, playlistId: string): Promise<boolean> {
    const candidateIds = await this.getTrackIdCandidates(trackUri);
    const targetTrackId = this.extractTrackId(trackUri);

    const idSet = new Set<string>(candidateIds);
    const isSpotifyTrack = trackUri.startsWith('spotify:track:');
    if (isSpotifyTrack && targetTrackId) {
      idSet.add(targetTrackId);
    }

    const idList = isSpotifyTrack ? Array.from(idSet) : [];
    const batchSize = 50;
    let containsCheckSucceeded = idList.length > 0;

    for (let i = 0; i < idList.length; i += batchSize) {
      const batch = idList.slice(i, i + batchSize);
      const containsParams = new URLSearchParams({ ids: batch.join(',') });

      try {
        const response = await Spicetify.CosmosAsync.get(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks/contains?${containsParams.toString()}`
        );

        if (!Array.isArray(response)) {
          containsCheckSucceeded = false;
          break;
        }

        if (response.some(Boolean)) {
          return true;
        }
      } catch (error) {
        containsCheckSucceeded = false;
        break;
      }
    }

    if (containsCheckSucceeded && idList.length > 0) {
      return false;
    }

    const limit = 100;
    let offset = 0;

    while (true) {
      const pageParams = new URLSearchParams({
        fields: 'items(track(uri,id,linked_from(uri,id))),total',
        limit: limit.toString(),
        offset: offset.toString(),
      });

      let response: any;
      try {
        response = await Spicetify.CosmosAsync.get(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?${pageParams.toString()}`
        );
      } catch (error) {
        return false;
      }

      const items = Array.isArray(response?.items) ? response.items : [];
      const found = items.some((item: any) => {
        const track = item?.track;
        if (!track) {
          return false;
        }

        const candidateUris = [track.uri, track.linked_from?.uri].filter(Boolean) as string[];
        if (candidateUris.includes(trackUri)) {
          return true;
        }

        const idsInPlaylist = new Set<string>();
        if (typeof track.id === 'string' && track.id) {
          idsInPlaylist.add(track.id);
        }
        if (typeof track.linked_from?.id === 'string' && track.linked_from.id) {
          idsInPlaylist.add(track.linked_from.id);
        }

        for (const uri of candidateUris) {
          const candidateId = this.extractTrackId(uri);
          if (candidateId) {
            idsInPlaylist.add(candidateId);
          }
        }

        for (const id of idsInPlaylist) {
          if (idSet.has(id)) {
            return true;
          }
        }

        return false;
      });

      if (found) {
        return true;
      }

      const fetchedCount = items.length;
      if (fetchedCount === 0) {
        break;
      }

      offset += fetchedCount;

      const total = typeof response?.total === 'number' ? response.total : undefined;
      if (typeof total === 'number' && offset >= total) {
        break;
      }

      if (fetchedCount < limit) {
        break;
      }
    }

    return false;
  }

  /**
   * Get all user playlists with multiple endpoint fallbacks and pagination
   */
  async getUserPlaylists(): Promise<PlaylistInfo[]> {
    const now = Date.now();
    if (this.playlistCache.size > 0 && (now - this.lastCacheUpdate) < this.cacheExpiry) {
      return Array.from(this.playlistCache.values());
    }

    // Get current user info for filtering (non-blocking)
    let currentUser;
    try {
      currentUser = await this.getCurrentUser();
    } catch (error) {
      currentUser = null;
    }

    // Try multiple endpoints to get playlists
    const endpoints = [
      { url: 'sp://core-playlist/v1/rootlist', type: 'rootlist' },
      { url: 'https://api.spotify.com/v1/me/playlists?limit=50', type: 'webapi' },
      { url: 'wg://playlist/v1/rootlist', type: 'rootlist' }
    ];

    for (const endpoint of endpoints) {
      try {
        let allPlaylists: PlaylistInfo[] = [];

        if (endpoint.type === 'webapi') {
          allPlaylists = await this.fetchAllPlaylistPages();
        } else {
          const response = await Spicetify.CosmosAsync.get(endpoint.url);
          if (!response) {
            continue;
          }
          allPlaylists = this.parsePlaylistResponse(response, endpoint);
        }
        
        // Filter to only user-owned playlists
        const userPlaylists = allPlaylists.filter(playlist => {
          return this.isUserOwnedPlaylist(playlist, currentUser);
        });
        
        if (userPlaylists.length > 0) {
          // Update cache
          this.playlistCache.clear();
          userPlaylists.forEach(playlist => {
            this.playlistCache.set(playlist.id, playlist);
          });
          this.lastCacheUpdate = now;
          
          return userPlaylists;
        }
        
      } catch (error) {
        continue; // Try next endpoint
      }
    }
    
    // If all endpoints failed
    this.clearCache();
    throw new Error('Failed to fetch playlists from all available endpoints.');
  }

  /**
   * Fetch all pages of playlists from Web API
   */
  private async fetchAllPlaylistPages(): Promise<PlaylistInfo[]> {
    let allPlaylists: PlaylistInfo[] = [];
    let url = 'https://api.spotify.com/v1/me/playlists?limit=50';
    
    while (url) {
      try {
        const response = await Spicetify.CosmosAsync.get(url);
        
        if (!response || !response.items) {
          break;
        }
        
        // Parse this page's playlists
        const pagePlaylistsRaw = response.items.map((item: any) => ({
          type: 'playlist',
          uri: item.uri,
          name: item.name,
          id: item.id,
          owner: item.owner
        }));
        
        const pagePlaylists = this.parsePlaylistResponse({ items: pagePlaylistsRaw }, { url, type: 'webapi' });
        allPlaylists.push(...pagePlaylists);
        
        // Get next page URL
        url = response.next;
        
      } catch (error) {
        break;
      }
    }
    
    return allPlaylists;
  }

  /**
   * Get current user information
   */
  private async getCurrentUser(): Promise<any> {
    try {
      const response = await Spicetify.CosmosAsync.get('https://api.spotify.com/v1/me');
      return response;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a playlist is owned by the current user
   */
  private isUserOwnedPlaylist(playlist: PlaylistInfo, currentUser: any): boolean {
    // If playlist owner is marked as 'self', it's user-owned
    if (playlist.owner === 'self') {
      return true;
    }
    
    // If playlist is marked as 'not-owned', reject it
    if (playlist.owner === 'not-owned') {
      return false;
    }
    
    // If we can't get user info, include all playlists as fallback
    if (!currentUser) {
      return true;
    }
    
    // If playlist has no owner info, assume it's user-owned (for backwards compatibility)
    if (!playlist.owner) {
      return true;
    }
    
    // Use ACTUAL user data from API response
    const userIdentifiers = [];
    if (currentUser.id) userIdentifiers.push(currentUser.id);
    if (currentUser.display_name) userIdentifiers.push(currentUser.display_name);
    if (currentUser.username) userIdentifiers.push(currentUser.username);
    
    const playlistOwner = playlist.owner;
    
    const isOwned = userIdentifiers.some(userId => 
      userId && (userId === playlistOwner || userId.toLowerCase() === playlistOwner.toLowerCase())
    );
    
    return isOwned;
  }

  /**
   * Parse playlist response based on endpoint type
   */
  private parsePlaylistResponse(response: any, endpoint: { url: string, type: string }): PlaylistInfo[] {
    let playlistItems: any[] = [];
    
    if (endpoint.type === 'rootlist') {
      // Handle sp:// and wg:// rootlist format
      if (response.rows && Array.isArray(response.rows)) {
        // Function to recursively extract playlists from folders
        const extractPlaylistsRecursively = (items: any[]): any[] => {
          const playlists: any[] = [];
          
          for (const item of items) {
            if (item.type === 'playlist') {
              playlists.push(item);
            } else if (item.type === 'folder' && item.rows && Array.isArray(item.rows)) {
              // Recursively search folder contents
              const folderPlaylists = extractPlaylistsRecursively(item.rows);
              playlists.push(...folderPlaylists);
            }
          }
          
          return playlists;
        };
        
        const allPlaylists = extractPlaylistsRecursively(response.rows);
        
        playlistItems = allPlaylists.map((row: any) => {
          // Extract URI - try multiple fields
          let uri = row.uri;
          if (!uri && row.link) {
            uri = row.link;
          }
          if (!uri && row.name) {
            // Generate URI if we have name but no URI
            uri = `spotify:playlist:unknown`;
          }
          
          return {
            ...row,
            uri: uri,
            // Preserve all the rootlist-specific fields
            ownedBySelf: row.ownedBySelf,
            owner: row.owner,
            collaborative: row.collaborative
          };
        });
      } else {
        return [];
      }
    } else if (endpoint.type === 'webapi') {
      // Handle Spotify Web API format
      if (response.items && Array.isArray(response.items)) {
        playlistItems = response.items.map((item: any) => ({
          type: 'playlist',
          uri: item.uri,
          name: item.name,
          id: item.id
        }));
      } else {
        return [];
      }
    }

    const playlists: PlaylistInfo[] = playlistItems
      .map((row: any) => {
        const id = row.id || this.extractPlaylistId(row.uri);
        const name = row.name || row.attributes?.name || 'Unknown Playlist';
        
        // Extract owner information - try multiple possible formats
        let owner = '';
        
        // Check if this is a rootlist item with ownedBySelf field
        if (row.ownedBySelf !== undefined) {
          if (row.ownedBySelf) {
            owner = 'self'; // Mark as self-owned
          } else {
            owner = 'not-owned'; // Mark as not owned by user
          }
        } else if (row.owner) {
          // Web API format
          if (typeof row.owner === 'string') {
            owner = row.owner;
          } else if (row.owner.display_name) {
            owner = row.owner.display_name;
          } else if (row.owner.id) {
            owner = row.owner.id;
          }
        }
        
        return {
          id,
          name,
          uri: row.uri,
          owner
        };
      })
      .filter((playlist: PlaylistInfo & { owner?: string }) => {
        const isValid = playlist.id && playlist.id.length > 0 && playlist.name && playlist.uri;
        return isValid;
      });

    return playlists;
  }

  /**
   * Extract playlist ID from URI
   */
  private extractPlaylistId(uri: string): string {
    if (!uri) return '';
    const parts = uri.split(':');
    return parts.length >= 3 ? parts[2] : '';
  }

  /**
   * Extract track ID from URI
   */
  private extractTrackId(uri: string): string {
    if (!uri) return '';
    const parts = uri.split(':');
    return parts.length >= 3 ? parts[2] : '';
  }

  /**
   * Get a specific playlist by ID from cache
   */
  getPlaylistById(id: string): PlaylistInfo | undefined {
    return this.playlistCache.get(id);
  }

  /**
   * Clear the playlist cache
   */
  clearCache(): void {
    this.playlistCache.clear();
    this.lastCacheUpdate = 0;
  }
}
