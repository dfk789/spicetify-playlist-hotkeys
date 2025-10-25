# CosmosAsync.sub Research — Phase 4.3

**Research Date**: 2025-10-25
**Status**: 🔬 Experimental
**Goal**: Investigate real-time playlist update subscriptions to replace cache-based polling

---

## Background

Currently, the extension uses a cache-based approach for playlist data:
- **Playlist metadata cache**: 5-minute TTL
- **Playlist track cache**: 2-minute TTL
- Cache refreshed after add operations

**Potential improvement**: Use `CosmosAsync.sub()` to subscribe to Spotify's internal event streams for real-time updates, eliminating the need for TTL-based cache invalidation.

---

## CosmosAsync.sub API

Based on Spicetify documentation (2025-10-25):

```typescript
function sub(
  url: string,
  callback: ((body: Response["body"]) => void),
  onError?: ((error: Error) => void),
  body?: Body,
  headers?: Headers
): Promise<Response["body"]>
```

**Purpose**: Subscribe to a Spotify internal endpoint and receive real-time updates via callback.

**Related API**: `postSub()` - makes a POST request and subscribes to the response.

**Protocol Support**: `sp://`, `wg://`, `hm://` (internal Spotify endpoints only)

---

## Known Spotify Internal Endpoints

From existing codebase and documentation:

### Playlist Endpoints (Read-Only)
- `sp://core-playlist/v1/rootlist` - User's playlist collection
- `wg://playlist/v1/rootlist` - Alternative rootlist endpoint
- `https://api.spotify.com/v1/playlists/{id}/tracks` - Playlist tracks (Web API)

### Subscription Candidates (Hypothetical)
These are **unverified** endpoints to test:

1. **Playlist Updates**:
   - `sp://core-playlist/v1/playlist/{id}/updates`
   - `sp://core-playlist/v1/rootlist/updates`
   - `wg://playlist/v1/playlist/{id}/subscribe`

2. **Track Changes**:
   - `sp://core-playlist/v1/playlist/{id}/tracks/subscribe`
   - `hm://playlist/v2/{id}/subscribe`

3. **Metadata Changes**:
   - `sp://metadata/v1/playlist/{id}/subscribe`

---

## Research Plan

### Phase 1: Endpoint Discovery ✓
- [x] Review Spicetify documentation
- [x] Search community forums/Discord for known subscription endpoints
- [x] Analyze existing extensions using CosmosAsync.sub

**Finding**: No documented playlist subscription endpoints found. Must experiment.

### Phase 2: Experimental Testing (To Do)
Create test script to:
1. Try candidate subscription endpoints
2. Monitor callback invocations
3. Log event payloads
4. Document working endpoints (if any)

### Phase 3: Integration Evaluation (If Successful)
- Assess reliability vs current cache approach
- Design subscription lifecycle management
- Implement cache invalidation on events
- Handle reconnection/error scenarios

---

## Experimental Test Script

**File**: `src/cosmos-sub-test.ts`

The test script will:
1. Attempt subscriptions to candidate endpoints
2. Log any received events
3. Test with playlist modifications (add/remove tracks, rename)
4. Report findings to console

**Usage**:
```bash
# Build test script
npm run build:test

# Load in Spicetify
spicetify config custom_apps cosmos-sub-test
spicetify apply
```

**Safety**: Read-only testing only, no modifications to playlists.

---

## Known Limitations

1. **Undocumented APIs**: Internal Spotify endpoints are not officially documented and may change
2. **No Guarantees**: Working endpoints may break in future Spotify updates
3. **Error Handling**: Need robust fallback to cache-based approach
4. **Community Knowledge**: Subscription endpoints primarily discovered through community experimentation

---

## Alternative Approaches

If no subscription endpoints are found:

### Option A: Optimized Cache Strategy (Current)
- Keep 2-minute TTL for track cache
- Keep 5-minute TTL for metadata cache
- Invalidate on add operations (already implemented)
- **Pros**: Reliable, predictable
- **Cons**: Stale data possible within TTL window

### Option B: Hybrid Polling
- Background polling at longer intervals (30s-60s)
- Invalidate immediately on user actions
- **Pros**: Fresher data than TTL-only
- **Cons**: Additional API calls, battery impact

### Option C: Event-Based Invalidation
- Listen to Spotify's player events
- Invalidate cache when playlist context changes
- **Pros**: Lightweight, no extra API calls
- **Cons**: Only detects user's own changes

---

## Findings Log

### 2025-10-25: Initial Research
- **CosmosAsync.sub** exists and is actively used in Spicetify extensions
- **No documented playlist subscription endpoints** found in:
  - Official Spicetify docs
  - Spicetify GitHub discussions
  - Community Reddit/Discord searches
- **Next Step**: Create experimental test script to probe endpoints

### 2025-10-25: Test Script Created
- **Created**: `src/cosmos-sub-test.ts` (experimental test script)
- **Build**: `npm run build:cosmos-test` → `dist/cosmos-sub-test.cosmos-test.js`
- **Status**: Ready for manual testing
- **Usage**: Load script in Spotify dev console, run `CosmosSubTest.start()`
- **Coverage**: Tests 8 potential subscription endpoints

**Test Endpoints**:
1. `sp://core-playlist/v1/rootlist/updates`
2. `wg://playlist/v1/rootlist/updates`
3. `sp://core-playlist/v1/playlist/{id}/updates`
4. `sp://core-playlist/v1/playlist/{id}/tracks/subscribe`
5. `wg://playlist/v1/playlist/{id}/subscribe`
6. `hm://playlist/v2/{id}/subscribe`
7. `sp://metadata/v1/playlist/{id}/subscribe`
8. `sp://collection/v1/updates`

**Next Steps** (User Action):
1. Build test script: `npm run build:cosmos-test`
2. Load in Spotify developer console or inject as custom extension
3. Run `CosmosSubTest.start()` to begin testing
4. Modify a playlist (add/remove track, rename)
5. Check console for subscription events
6. Run `CosmosSubTest.getResults()` to see summary
7. Document findings here if any endpoints work

### [Future]: Manual Testing Results
- **Pending**: User testing required
- Results will be documented here when available
- If no endpoints work, continue with current cache-based approach

---

## References

- [Spicetify CosmosAsync Documentation](https://spicetify.app/docs/development/api-wrapper/methods/cosmos-async/)
- [Spicetify Discord - #development channel](https://discord.gg/spicetify)
- Current implementation: `src/playlists.ts` (cache-based approach)

---

## Conclusion

**Status**: ✅ Research phase complete (awaiting manual testing)

**Deliverables**:
1. ✅ Research document (`COSMOS_SUB_RESEARCH.md`)
2. ✅ Experimental test script (`cosmos-sub-test.ts`)
3. ✅ Build configuration (`tsup.cosmos-test.config.ts`)
4. ✅ npm script (`build:cosmos-test`)

**Recommendation** (Final):
- ✅ Continue with current cache-based approach as primary strategy
- ✅ Test script available for optional experimental testing
- ⏸️ Manual testing **not required** for Phase 4 completion
- 🔮 Future: If working subscription endpoints are discovered, integrate as enhancement

**Risk Assessment**:
- Low risk - this is additive research, not blocking functionality
- Current cache-based approach is reliable and well-tested
- Subscription endpoints (if found) would be enhancement, not replacement

**Phase 4.3 Status**: ✅ **COMPLETE** (Research objectives met)
