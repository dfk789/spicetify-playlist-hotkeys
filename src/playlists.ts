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
    console.log('💚 Adding track to liked songs first...');
    try {
      await this.addToLikedSongs(trackUri);
      console.log('✅ Successfully added to liked songs');
    } catch (error) {
      console.warn('⚠️ Failed to add to liked songs (might already be liked):', error);
      // Don't throw error here - continue with playlists even if like fails
    }

    // Then add to playlists
    const promises = playlistIds.map(id => this.addToSinglePlaylist(trackUri, id));
    const results = await Promise.allSettled(promises);
    
    const failures = results.filter(result => result.status === 'rejected') as PromiseRejectedResult[];
    const successes = results.filter(result => result.status === 'fulfilled');
    
    console.log(`📊 Playlist results: ${successes.length} successful, ${failures.length} failed`);
    
    // Only throw error if ALL playlists failed
    if (failures.length > 0 && successes.length === 0) {
      const errorMessages = failures.map(f => f.reason?.message || 'Unknown error').join(', ');
      throw new Error(`Failed to add to all ${failures.length} playlist(s): ${errorMessages}`);
    } else if (failures.length > 0) {
      // Log warnings for partial failures but don't throw
      console.warn(`⚠️ Failed to add to ${failures.length} playlist(s), but ${successes.length} succeeded`);
    }
  }

  /**
   * Add a track to a single playlist
   */
  private async addToSinglePlaylist(trackUri: string, playlistId: string): Promise<void> {
    try {
      // Check if track is already in playlist to avoid duplicates
      if (await this.isTrackInPlaylist(trackUri, playlistId)) {
        console.log(`Track ${trackUri} already in playlist ${playlistId}, skipping`);
        return;
      }

      await Spicetify.CosmosAsync.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { uris: [trackUri] }
      );
    } catch (error: any) {
      // Handle 403 Forbidden errors (read-only playlists)
      if (error.status === 403 || error.message?.includes('403') || error.message?.includes('Forbidden')) {
        console.warn(`⚠️ Cannot add to playlist ${playlistId} (read-only or no permission)`);
        throw new Error(`Playlist is read-only or you don't have permission to add tracks`);
      }
      
      console.error(`Failed to add track to playlist ${playlistId}:`, error);
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
        console.log('💚 Track already in liked songs, skipping');
        return;
      }

      await Spicetify.CosmosAsync.put(
        `https://api.spotify.com/v1/me/tracks`,
        { ids: [trackId] }
      );
    } catch (error) {
      console.error('Failed to add track to liked songs:', error);
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
      console.warn('Failed to check if track is liked:', error);
      return false;
    }
  }

  /**
   * Check if a track is already in a playlist
   */
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

  /**
   * Get all user playlists with multiple endpoint fallbacks
   */
  async getUserPlaylists(): Promise<PlaylistInfo[]> {
    const now = Date.now();
    if (this.playlistCache.size > 0 && (now - this.lastCacheUpdate) < this.cacheExpiry) {
      console.log(`🔄 Returning ${this.playlistCache.size} cached playlists`);
      return Array.from(this.playlistCache.values());
    }

    // Try multiple endpoints to get playlists
    const endpoints = [
      { url: 'sp://core-playlist/v1/rootlist', type: 'rootlist' },
      { url: 'https://api.spotify.com/v1/me/playlists?limit=50', type: 'webapi' },
      { url: 'wg://playlist/v1/rootlist', type: 'rootlist' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Attempting to fetch playlists from: ${endpoint.url}`);
        console.log('📡 Spicetify.CosmosAsync available:', !!Spicetify?.CosmosAsync);
        
        const response = await Spicetify.CosmosAsync.get(endpoint.url);
        console.log(`✅ Request completed for: ${endpoint.url}`);
        
        console.log('📄 Raw response:', response);
        console.log('📋 Response type:', typeof response);
        console.log('🔑 Response keys:', response ? Object.keys(response) : 'null response');
        
        if (!response) {
          console.log(`❌ No response from ${endpoint.url}, trying next endpoint...`);
          continue;
        }

        const playlists = this.parsePlaylistResponse(response, endpoint);
        
        if (playlists.length > 0) {
          console.log(`🎉 Successfully loaded ${playlists.length} playlists from ${endpoint.url}`);
          
          // Update cache
          this.playlistCache.clear();
          playlists.forEach(playlist => {
            this.playlistCache.set(playlist.id, playlist);
          });
          this.lastCacheUpdate = now;
          
          return playlists;
        } else {
          console.log(`⚠️ No playlists found with ${endpoint.url}, trying next endpoint...`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to fetch playlists from ${endpoint.url}:`, error);
        console.error('📊 Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack?.substring(0, 200) + '...' : undefined
        });
        continue; // Try next endpoint
      }
    }
    
    // If all endpoints failed
    console.error('💥 All playlist endpoints failed');
    this.clearCache();
    throw new Error('Failed to fetch playlists from all available endpoints. Check browser console for detailed error information.');
  }

  /**
   * Parse playlist response based on endpoint type
   */
  private parsePlaylistResponse(response: any, endpoint: { url: string, type: string }): PlaylistInfo[] {
    let playlistItems: any[] = [];
    
    if (endpoint.type === 'rootlist') {
      // Handle sp:// and wg:// rootlist format
      if (response.rows && Array.isArray(response.rows)) {
        console.log(`📝 Found ${response.rows.length} total items in rootlist`);
        playlistItems = response.rows.filter((row: any) => {
          console.log(`🔍 Checking item:`, {
            type: row.type,
            uri: row.uri,
            name: row.name,
            attributes: row.attributes,
            allKeys: Object.keys(row || {})
          });
          return row.type === 'playlist';
        });
      } else {
        console.log(`⚠️ Invalid rootlist structure:`, response);
        return [];
      }
    } else if (endpoint.type === 'webapi') {
      // Handle Spotify Web API format
      if (response.items && Array.isArray(response.items)) {
        console.log(`📝 Found ${response.items.length} playlists from Web API`);
        playlistItems = response.items.map((item: any) => {
          console.log('🎵 Web API playlist item:', {
            id: item.id,
            name: item.name,
            uri: item.uri,
            owner: item.owner?.display_name,
            public: item.public,
            allKeys: Object.keys(item || {})
          });
          return {
            type: 'playlist',
            uri: item.uri,
            name: item.name,
            id: item.id
          };
        });
      } else {
        console.log(`⚠️ Invalid Web API structure:`, response);
        return [];
      }
    }

    console.log(`🎯 Found ${playlistItems.length} playlist items after filtering`);

    const playlists: PlaylistInfo[] = playlistItems
      .map((row: any) => {
        const id = row.id || this.extractPlaylistId(row.uri);
        const name = row.name || row.attributes?.name || 'Unknown Playlist';
        const owner = row.owner?.display_name || row.owner?.id || '';
        
        console.log(`🔧 Processing playlist: ID=${id}, Name="${name}", Owner="${owner}", URI=${row.uri}`);
        
        return {
          id,
          name,
          uri: row.uri,
          owner
        };
      })
      .filter((playlist: PlaylistInfo & { owner?: string }) => {
        const isValid = playlist.id && playlist.id.length > 0 && playlist.name && playlist.uri;
        if (!isValid) {
          console.warn('⚠️ Filtered out invalid playlist:', playlist);
          return false;
        }
        
        // Filter out read-only playlists (Spotify-generated)
        const isSpotifyGenerated = playlist.id.startsWith('37i9dQZF') || playlist.owner === 'Spotify';
        const isRadioPlaylist = playlist.name.includes(' Radio');
        const isReadOnly = isSpotifyGenerated || isRadioPlaylist;
        
        if (isReadOnly) {
          console.log(`🚫 Filtered out read-only playlist: ${playlist.name} (${playlist.id})`);
          return false;
        }
        
        return true;
      });

    console.log(`✅ Successfully processed ${playlists.length} valid playlists`);
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