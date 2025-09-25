
export interface PlaylistInfo {
  id: string;
  name: string;
  uri: string;
  owner?: string;
}

const DEBUG_STORAGE_KEY = 'playlist-hotkeys-debug';

export interface PlaylistAddResult {
  added: string[];
  alreadyPresent: string[];
  failed: { playlistId: string; error: string }[];
  likedStatus: 'added' | 'already-liked' | 'failed';
}

interface PlaylistTrackCacheEntry {
  uris: Set<string>;
  trackIds: Set<string>;
  timestamp: number;
  complete: boolean;
}

export class PlaylistManager {
  private playlistCache = new Map<string, PlaylistInfo>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;
  private playlistTrackCache = new Map<string, PlaylistTrackCacheEntry>();
  private playlistTrackCacheTTL = 2 * 60 * 1000; // 2 minutes
  private pendingTrackOperations = new Map<string, Promise<void>>();

  private debugEnabled = Spicetify.LocalStorage?.get(DEBUG_STORAGE_KEY) === 'true';
  private debug(...args: unknown[]): void {
    if (!this.debugEnabled) {
      return;
    }
    console.log('[PlaylistManager]', ...args);
  }

  public setDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
    console.log('[PlaylistManager] Debug', enabled ? 'enabled' : 'disabled');
  }

  async addToPlaylists(trackUri: string, playlistIds: string[]): Promise<PlaylistAddResult> {
    if (!trackUri || playlistIds.length === 0) {
      throw new Error('Invalid track URI or empty playlist list');
    }

    const uniquePlaylistIds = Array.from(new Set(playlistIds.filter(Boolean)));
    if (uniquePlaylistIds.length === 0) {
      throw new Error('No valid playlist identifiers provided');
    }

    this.debug('addToPlaylists:start', { trackUri, playlistIds, uniquePlaylistIds });

    const added: string[] = [];
    const alreadyPresent: string[] = [];
    const failed: { playlistId: string; error: string }[] = [];

    const likedStatus = await this.addToLikedSongs(trackUri);
    this.debug('addToPlaylists:likedStatus', { trackUri, likedStatus });

    await Promise.all(
      uniquePlaylistIds.map(async playlistId => {
        try {
          const outcome = await this.addToSinglePlaylist(trackUri, playlistId);
          this.debug('addToPlaylists:playlistOutcome', { playlistId, outcome });
          if (outcome === 'already-present') {
            alreadyPresent.push(playlistId);
          } else {
            added.push(playlistId);
          }
        } catch (error: any) {
          const message = error instanceof Error ? error.message : String(error);
          this.debug('addToPlaylists:playlistFailed', { playlistId, error: message });
          failed.push({ playlistId, error: message || 'Unknown error' });
        }
      })
    );

    if (added.length === 0 && alreadyPresent.length === 0 && failed.length === uniquePlaylistIds.length) {
      const errorMessages = failed.map(entry => entry.error).join(', ');
      throw new Error(`Failed to add to all ${failed.length} playlist(s): ${errorMessages}`);
    }

    const summary = {
      added,
      alreadyPresent,
      failed,
      likedStatus,
    };

    this.debug('addToPlaylists:summary', summary);

    return summary;
  }

  private async addToSinglePlaylist(trackUri: string, playlistId: string): Promise<'added' | 'already-present'> {
    return this.withTrackLock(playlistId, trackUri, async () => {
      this.debug('addToSinglePlaylist:start', { playlistId, trackUri });

      try {
        const alreadyInPlaylist = await this.isTrackInPlaylist(trackUri, playlistId);
        this.debug('addToSinglePlaylist:isTrackInPlaylist', { playlistId, trackUri, alreadyInPlaylist });
        if (alreadyInPlaylist) {
          return 'already-present';
        }

        const response = await Spicetify.CosmosAsync.post(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          { uris: [trackUri] }
        );
        this.debug('addToSinglePlaylist:postResponse', { playlistId, trackUri, response });

        await this.addTrackToCache(playlistId, trackUri);
        return 'added';
      } catch (error: any) {
        this.debug('addToSinglePlaylist:error', { playlistId, trackUri, error });

        if (this.isDuplicateTrackError(error)) {
          this.debug('addToSinglePlaylist:duplicateDetected', { playlistId, trackUri, error });
          await this.addTrackToCache(playlistId, trackUri);
          return 'already-present';
        }

        if (error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
          throw new Error(`Playlist is read-only or you don't have permission to add tracks`);
        }

        const errorDetails = error instanceof Error ?
          `${error.message} (status: ${error.status || 'unknown'})` :
          `Unknown error: ${String(error)}`;
        throw new Error(`Failed to add to playlist ${playlistId}: ${errorDetails}`);
      }
    });
  }

  private async withTrackLock<T>(playlistId: string, trackUri: string, task: () => Promise<T>): Promise<T> {
    const key = `${playlistId}:${trackUri}`;
    const previous = this.pendingTrackOperations.get(key) ?? Promise.resolve();

    const execution = (async () => {
      await previous.catch(() => undefined);
      return task();
    })();

    const completion = execution.then(() => undefined, () => undefined);
    this.pendingTrackOperations.set(key, completion);

    try {
      return await execution;
    } finally {
      const current = this.pendingTrackOperations.get(key);
      if (current === completion) {
        this.pendingTrackOperations.delete(key);
      }
    }
  }

  private isDuplicateTrackError(error: any): boolean {
    if (!error) {
      return false;
    }

    const status = Number(error.status);
    if (status !== 400 && status !== 409) {
      return false;
    }

    const reason = (error?.body?.error?.reason ?? error?.reason ?? '').toString().toLowerCase();
    const message = (error?.message ?? '').toString().toLowerCase();

    return reason.includes('duplicate') || message.includes('duplicate');
  }

  private async addToLikedSongs(trackUri: string): Promise<'added' | 'already-liked' | 'failed'> {
    this.debug('addToLikedSongs:start', { trackUri });

    try {
      const trackId = this.extractTrackId(trackUri);
      if (!trackId) {
        this.debug('addToLikedSongs:invalidTrackUri', { trackUri });
        return 'failed';
      }

      const isLiked = await this.isTrackLiked(trackUri);
      if (isLiked) {
        this.debug('addToLikedSongs:alreadyLiked', { trackUri });
        return 'already-liked';
      }

      await Spicetify.CosmosAsync.put(
        `https://api.spotify.com/v1/me/tracks`,
        { ids: [trackId] }
      );

      this.debug('addToLikedSongs:succeeded', { trackUri });
      return 'added';
    } catch (error) {
      this.debug('addToLikedSongs:error', { trackUri, error });

      if (error instanceof SyntaxError || (error as any)?.name === 'SyntaxError') {
        this.debug('addToLikedSongs:ignoringSyntaxError', { trackUri });
        return 'added';
      }

      console.error('Failed to like track:', error);
      return 'failed';
    }
  }

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

  private async getTrackIdCandidates(trackUri: string): Promise<{ ids: string[]; uris: string[] }> {
    const uris = new Set<string>();
    const ids = new Set<string>();

    this.debug('getTrackIdCandidates:start', { trackUri });

    if (trackUri) {
      uris.add(trackUri);
    }

    const isSpotifyTrack = trackUri.startsWith('spotify:track:');
    if (isSpotifyTrack) {
      const baseId = this.extractTrackId(trackUri);
      if (baseId) {
        ids.add(baseId);
      }

      try {
        const trackResponse = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${baseId}`);

        const addUri = (uri?: string) => {
          if (!uri) {
            return;
          }
          uris.add(uri);
          const derivedId = this.extractTrackId(uri);
          if (derivedId) {
            ids.add(derivedId);
          }
        };

        const addId = (id?: string) => {
          if (id) {
            ids.add(id);
          }
        };

        addUri(typeof trackResponse?.uri === 'string' ? trackResponse.uri : undefined);
        addId(typeof trackResponse?.id === 'string' ? trackResponse.id : undefined);

        const linkedFrom = trackResponse?.linked_from;
        addUri(typeof linkedFrom?.uri === 'string' ? linkedFrom.uri : undefined);
        addId(typeof linkedFrom?.id === 'string' ? linkedFrom.id : undefined);
      } catch (error) {
        // Ignore lookup failures and fall back to the base track ID.
      }
    }

    const result = { ids: Array.from(ids), uris: Array.from(uris) };
    this.debug('getTrackIdCandidates:result', { trackUri, ids: result.ids.length, uris: result.uris.length });
    return result;
  }

  private async isTrackInPlaylist(trackUri: string, playlistId: string): Promise<boolean> {
    const { ids, uris } = await this.getTrackIdCandidates(trackUri);
    const candidateUris = new Set<string>(uris);
    candidateUris.add(trackUri);

    const candidateIdSet = new Set<string>(ids);
    this.debug('isTrackInPlaylist:candidates', {
      playlistId,
      trackUri,
      candidateUriCount: candidateUris.size,
      candidateIdCount: candidateIdSet.size,
    });

    const cacheEntry = this.getFreshPlaylistTrackCache(playlistId);
    if (cacheEntry) {
      this.debug('isTrackInPlaylist:cacheHit', {
        playlistId,
        trackUri,
        cacheUris: cacheEntry.uris.size,
        cacheIds: cacheEntry.trackIds.size,
        cacheComplete: cacheEntry.complete,
      });

      if (this.cacheHasCandidate(cacheEntry, candidateUris, candidateIdSet)) {
        this.debug('isTrackInPlaylist:cacheMatch', { playlistId, trackUri });
        return true;
      }

      if (cacheEntry.complete) {
        this.debug('isTrackInPlaylist:cacheCompleteNoMatch', { playlistId, trackUri });
        return false;
      }
    }

    const found = await this.scanPlaylistForTrack(playlistId, candidateUris, candidateIdSet);
    this.debug('isTrackInPlaylist:scanResult', { playlistId, trackUri, found });

    return found;
  }

  private getFreshPlaylistTrackCache(playlistId: string): PlaylistTrackCacheEntry | undefined {
    const entry = this.playlistTrackCache.get(playlistId);
    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.timestamp > this.playlistTrackCacheTTL) {
      this.playlistTrackCache.delete(playlistId);
      return undefined;
    }

    return entry;
  }

  private cacheHasCandidate(
    entry: PlaylistTrackCacheEntry,
    candidateUris: Set<string>,
    candidateIds: Set<string>
  ): boolean {
    for (const uri of candidateUris) {
      if (entry.uris.has(uri)) {
        return true;
      }
    }

    if (candidateIds.size > 0) {
      for (const id of candidateIds) {
        if (entry.trackIds.has(id)) {
          return true;
        }
      }
    }

    return false;
  }

  private updatePlaylistCacheWithTrack(
    playlistId: string,
    uris: Iterable<string>,
    ids: Iterable<string>,
    complete: boolean
  ): void {
    const now = Date.now();
    let entry = this.playlistTrackCache.get(playlistId);

    if (!entry) {
      entry = {
        uris: new Set<string>(),
        trackIds: new Set<string>(),
        timestamp: now,
        complete,
      };
      this.playlistTrackCache.set(playlistId, entry);
    }

    for (const uri of uris) {
      if (uri) {
        entry.uris.add(uri);
      }
    }

    for (const id of ids) {
      if (id) {
        entry.trackIds.add(id);
      }
    }

    entry.timestamp = now;
    if (complete) {
      entry.complete = true;
    }
  }

  private replacePlaylistCacheEntry(
    playlistId: string,
    uris: Set<string>,
    ids: Set<string>,
    complete: boolean
  ): void {
    this.playlistTrackCache.set(playlistId, {
      uris: new Set(uris),
      trackIds: new Set(ids),
      timestamp: Date.now(),
      complete,
    });
  }

  private splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
    if (batchSize <= 0) {
      return [items];
    }

    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async addTrackToCache(playlistId: string, trackUri: string): Promise<void> {
    const { ids, uris } = await this.getTrackIdCandidates(trackUri);
    const uriSet = new Set<string>(uris);
    uriSet.add(trackUri);
    const idSet = new Set<string>(ids);

    this.updatePlaylistCacheWithTrack(playlistId, uriSet, idSet, false);
  }

  private async scanPlaylistForTrack(
    playlistId: string,
    candidateUris: Set<string>,
    candidateIds: Set<string>
  ): Promise<boolean> {
    this.debug('scanPlaylistForTrack:start', {
      playlistId,
      candidateUriCount: candidateUris.size,
      candidateIdCount: candidateIds.size,
    });

    const limit = 100;
    const aggregatedUris = new Set<string>();
    const aggregatedIds = new Set<string>();
    let complete = true;

    const addUriCandidate = (uri?: string): boolean => {
      if (!uri) {
        return false;
      }
      aggregatedUris.add(uri);
      return candidateUris.has(uri);
    };

    const addIdCandidate = (id?: string): boolean => {
      if (!id) {
        return false;
      }
      aggregatedIds.add(id);
      return candidateIds.has(id);
    };

    const processItems = (items: any[]): boolean => {
      for (const item of items) {
        const track = item?.track;
        if (!track) {
          continue;
        }

        const uriCandidates = new Set<string>();
        if (typeof track.uri === 'string') {
          uriCandidates.add(track.uri);
        }
        if (typeof track.linked_from?.uri === 'string') {
          uriCandidates.add(track.linked_from.uri);
        }

        for (const uri of uriCandidates) {
          if (addUriCandidate(uri)) {
            this.debug('scanPlaylistForTrack:matchUri', { playlistId, uri });
            return true;
          }
        }

        const idCandidates = new Set<string>();
        if (typeof track.id === 'string') {
          idCandidates.add(track.id);
        }
        if (typeof track.linked_from?.id === 'string') {
          idCandidates.add(track.linked_from.id);
        }
        for (const uri of uriCandidates) {
          const derivedId = this.extractTrackId(uri);
          if (derivedId) {
            idCandidates.add(derivedId);
          }
        }

        const directId = this.extractTrackId(typeof track.uri === 'string' ? track.uri : '');
        if (directId) {
          idCandidates.add(directId);
        }

        for (const id of idCandidates) {
          if (addIdCandidate(id)) {
            this.debug('scanPlaylistForTrack:matchId', { playlistId, id });
            return true;
          }
        }
      }

      return false;
    };

    const fetchPage = async (offset: number) => {
      const pageParams = new URLSearchParams({
        fields: 'items(track(uri,id,linked_from(uri,id))),total',
        limit: limit.toString(),
        offset: offset.toString(),
      });

      return Spicetify.CosmosAsync.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?${pageParams.toString()}`
      );
    };

    let response: any;
    try {
      response = await fetchPage(0);
    } catch (error) {
      return false;
    }

    const firstItems = Array.isArray(response?.items) ? response.items : [];
    this.debug('scanPlaylistForTrack:firstPage', {
      playlistId,
      items: firstItems.length,
      total: response?.total,
    });
    if (processItems(firstItems)) {
      this.updatePlaylistCacheWithTrack(playlistId, aggregatedUris, aggregatedIds, false);
      this.updatePlaylistCacheWithTrack(playlistId, candidateUris, candidateIds, false);
      return true;
    }

    const total = typeof response?.total === 'number' ? response.total : undefined;

    if (total === undefined) {
      let offset = firstItems.length;
      let lastFetched = firstItems.length;

      while (lastFetched === limit) {
        try {
          const page = await fetchPage(offset);
          const items = Array.isArray(page?.items) ? page.items : [];
          this.debug('scanPlaylistForTrack:page', { playlistId, offset, items: items.length });
          lastFetched = items.length;
          offset += items.length;

          if (processItems(items)) {
            this.updatePlaylistCacheWithTrack(playlistId, aggregatedUris, aggregatedIds, false);
            this.updatePlaylistCacheWithTrack(playlistId, candidateUris, candidateIds, false);
            return true;
          }

          if (items.length < limit) {
            break;
          }
        } catch (error) {
          complete = false;
          break;
        }
      }

      if (complete) {
        this.replacePlaylistCacheEntry(playlistId, aggregatedUris, aggregatedIds, lastFetched < limit);
      } else {
        this.updatePlaylistCacheWithTrack(playlistId, aggregatedUris, aggregatedIds, false);
      }

      return false;
    }

    const remainingOffsets: number[] = [];
    for (let next = limit; next < total; next += limit) {
      remainingOffsets.push(next);
    }

    if (remainingOffsets.length === 0) {
      this.replacePlaylistCacheEntry(playlistId, aggregatedUris, aggregatedIds, true);
      return false;
    }

    const concurrency = Math.min(5, remainingOffsets.length);
    let found = false;
    let encounteredError = false;

    const runWorker = async () => {
      while (!found) {
        const nextOffset = remainingOffsets.shift();
        if (nextOffset === undefined) {
          break;
        }

        let page: any;
        try {
          page = await fetchPage(nextOffset);
        } catch (error) {
          encounteredError = true;
          this.debug('scanPlaylistForTrack:pageError', { playlistId, offset: nextOffset, error });
          return;
        }

        const items = Array.isArray(page?.items) ? page.items : [];
        this.debug('scanPlaylistForTrack:page', { playlistId, offset: nextOffset, items: items.length });
        if (processItems(items)) {
          this.debug('scanPlaylistForTrack:matchInPage', { playlistId, offset: nextOffset });
          found = true;
          return;
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => runWorker()));

    if (found) {
      this.updatePlaylistCacheWithTrack(playlistId, aggregatedUris, aggregatedIds, false);
      this.updatePlaylistCacheWithTrack(playlistId, candidateUris, candidateIds, false);
      return true;
    }

    if (encounteredError) {
      this.updatePlaylistCacheWithTrack(playlistId, aggregatedUris, aggregatedIds, false);
    } else {
      this.replacePlaylistCacheEntry(playlistId, aggregatedUris, aggregatedIds, true);
    }

    this.debug('scanPlaylistForTrack:completed', {
      playlistId,
      found,
      encounteredError,
      aggregatedUriCount: aggregatedUris.size,
      aggregatedIdCount: aggregatedIds.size,
    });

    return false;
  }

  async getUserPlaylists(): Promise<PlaylistInfo[]> {
    const now = Date.now();
    if (this.playlistCache.size > 0 && (now - this.lastCacheUpdate) < this.cacheExpiry) {
      return Array.from(this.playlistCache.values());
    }

    let currentUser;
    try {
      currentUser = await this.getCurrentUser();
    } catch (error) {
      currentUser = null;
    }

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
        
        const userPlaylists = allPlaylists.filter(playlist => {
          return this.isUserOwnedPlaylist(playlist, currentUser);
        });

        if (userPlaylists.length > 0) {
          this.playlistCache.clear();
          userPlaylists.forEach(playlist => {
            this.playlistCache.set(playlist.id, playlist);
          });
          this.lastCacheUpdate = now;

          return userPlaylists;
        }
        
      } catch (error) {
        continue;
      }
    }

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
    this.playlistTrackCache.clear();
    this.lastCacheUpdate = 0;
  }
}
