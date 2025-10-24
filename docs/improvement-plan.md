# Improvement Plan — Spicetify Playlist Hotkeys

Last updated: 2025-10-24

This document captures the comprehensive audit, research, and implementation goals for the Spicetify Playlist Hotkeys extension. Update it whenever new findings emerge or priorities shift.

---

## 1. Overview

The extension maps keyboard shortcuts to playlist actions (add current track, optionally like). The current objective is a full audit and modernization focusing on simpler hotkey handling, a more maintainable UI, and readiness for broader distribution (e.g., Spicetify Marketplace).

---

## 2. Hotkey Management Simplification

### Current Approach
- `HotkeyManager` listens to `keydown` events in Spotify and normalizes combos.
- Global shortcuts rely on an external helper (Python or Node) that runs a local HTTP/SSE service. The extension pings `127.0.0.1:17976` and streams events to trigger callbacks.
- Two modes exist: “in-app” (when Spotify is focused) and “global” (requires helper). Both paths maintain their own logic, including execution locks to prevent rapid repeats.

### Issues
- Extra setup friction: users must install Python/Node and run a background process.
- Reliability: helper must be running; SSE/network could fail or be blocked by firewall/permissions.
- Duplication: Spicetify exposes `Spicetify.Keyboard` (wrapping Mousetrap) that should provide global shortcuts, making the custom infrastructure potentially redundant.
- Maintenance burden: supporting both helper and in-app modes increases complexity.

### Recommendations
1. **Adopt `Spicetify.Keyboard.registerShortcut`**  
   - Register each mapping with Spicetify’s keyboard API (e.g., `Spicetify.Keyboard.registerShortcut("ctrl+1", () => addToPlaylist(...))`).  
   - Remove `HotkeyManager.register`/`syncGlobalHelperCombos` logic if Spicetify handles combos globally.
   - Verify that Spicetify’s shortcuts truly fire when Spotify is unfocused; documentation claims “global,” but we must test on Windows/macOS/Linux since Mousetrap normally requires focus.
   ```ts
   Spicetify.Keyboard.registerShortcut("ctrl+1", async () => {
     await playlistManager.addToPlaylists(currentUri, ["playlist-id"]);
     Spicetify.showNotification("Added to Playlist");
   });
   ```

2. **Rethink Global Mode Toggle**  
   - If Spicetify’s API is always global, “global mode off” could mean not registering shortcuts via `Spicetify.Keyboard` and falling back to a focused listener.  
   - If always-global is acceptable, drop the toggle and simplify settings. Otherwise, conditionally register/deregister shortcuts based on user preference.

3. **Remove External Helper (If Tests Pass)**  
   - Delete helper scripts and SSE logic once confident in the Spicetify approach.  
   - Update status messaging: instead of “Helper not running,” display whether hotkeys are active or if the platform restricts background capture.

4. **Prevent Duplicate Triggers**  
   - Mousetrap generally guards against repeats, but confirm behavior.  
   - If needed, keep a lightweight lock (ignore `event.repeat` or use a short timeout) to avoid multi-fire when keys are held.

### Expected Benefits
- Major code reduction: no helper orchestration, SSE handling, or dual-mode maintenance.
- Simpler onboarding: users install extension only; no separate helper process.
- Improved reliability: fewer moving parts and less chance of helper misconfiguration.

### Research Notes
- Spicetify Keyboard is a wrapper around Mousetrap (`Spicetify.Mousetrap`). Confirm whether Spotify’s Electron shell captures keys while unfocused. If not, document limitations and keep helper optional.
- Track conflict handling: shortcuts are global across extensions, so collisions may occur. Expose customization to avoid clashes.

---

## 3. Settings UI & User Experience

### Current Approach
- A large (`~800` lines) imperative modal constructed via DOM manipulation in `src/settings-ui.ts`.
- Renders a “Playlist Hotkeys” button beside Spotify’s add-to-playlist icon and uses inline styles, manual event binding, and custom playlist search tags.
- Displays helper status text and toggles (some now outdated once helper is removed).

### Issues
- Difficult to maintain: monolithic file with mixed rendering, event handling, and state.
- UI polish: playlist dropdown persists after selection, limited keyboard navigation, and helper references that may become obsolete.
- DOM selectors are verbose to accommodate Spotify UI variations.

### Recommendations
1. **Modularize or Migrate to React/Creator**
   - Split logic into smaller modules (hotkey capture component, playlist search, status display).  
   - Consider Spicetify Creator + React for JSX components, mirroring community projects like Power Search Bar for maintainability.

2. **Leverage Spicetify UI Components**
   - `Spicetify.PopupModal.display` for modals instead of manual overlays.  
   - Snackbar/Notistack for stacked notifications (when appropriate).  
   - Reference `react_components.html` for available Spotify-styled React components.

3. **Improve Playlist Selection UX**
   - Auto-hide dropdown after selection, support arrow key navigation, highlight matches.  
   - Provide clear feedback when no playlists are available or search yields no results.

4. **Update Copy & Status Indicators**
   - Remove helper-specific text when deprecated.  
   - Show simple statuses like “✅ Global hotkeys enabled” / “⚠️ Works only when Spotify focused.”

5. **Optional: Context Menu Integration**
   - Use `Spicetify.ContextMenu.Item` or `SubMenu` to add “Add to Playlist (Hotkeys)” entries when right-clicking tracks.  
   - Option B (submenu per configured mapping) offers users direct control without remembering shortcuts.

6. **User Feedback Enhancements**
   - Consider summary modals or richer snackbars when multiple playlists are involved.  
   - Surface actionable error messages (e.g., “Playlist is read-only”).

### References for Study
- **Song Stats** (context menu, modal tables).  
- **Power Search Bar** (React UI, state management).  
- **Seek Song** (keyboard capture with Mousetrap).  
- Spicetify docs: PopupModal, Snackbar, React component wrappers (`react_components.html`, `playlistmenu_section.txt`).

---

## 4. Playlist Management & Performance

### Current Strengths
- Uses `Spicetify.CosmosAsync` for playlist operations and likes, handling authentication automatically.
- Duplicate avoidance via `isTrackInPlaylist`, scanning playlist contents and considering linked/local track IDs.
- Caches playlist metadata and track lists with TTL, reducing repeated API calls.
- Concurrency safeguards (`withTrackLock`, `pendingTrackOperations`) prevent race conditions when adding the same track repeatedly.
- Error handling covers Spotify responses for duplicates (409/400) and permission issues (403).

### Improvement Opportunities
1. **Evaluate Duplicate Check Strategy**
   - Optionally rely on API errors for duplicates, removing pre-scan for speed.  
   - Trade-off: lose detection for linked/local variants that API might not catch. Consider keeping scan but documenting latency implications for large playlist batches.

2. **Rate Limiting & Batching**
   - Current approach fires `Promise.all` for each playlist. Monitor for 429 “Too Many Requests.”  
   - If needed, throttle (e.g., 5 playlists per batch) or insert small delays.

3. **Cache Refresh Strategy**
   - After adding tracks, `getUserPlaylists()` refreshes cache. Investigate `Spicetify.CosmosAsync.sub` for real-time playlist updates (if available) to reduce polling.

4. **Error Messaging**
   - Expose user-friendly errors in notifications using existing formatted messages (e.g., “Playlist is read-only or you don’t have permission”).  
   - Log technical details via `debugManager`.

5. **Testing & Logging**
   - Keep debug toggles active to trace playlist operations during refactors.  
   - Document performance characteristics (e.g., time to add track to 10 playlists).

---

## 5. Refactoring & Maintainability

### Goals
- Remove dead helper code once deprecated (SSE listeners, ensureHelper, retry loops).
- Simplify or eliminate `hotkeys.ts` if Spicetify Keyboard handles everything.
- Keep configuration management straightforward (`Spicetify.LocalStorage` is sufficient; update defaults if fields are removed).
- Refresh comments and README documentation to reflect new behavior.
- Consider optional new features (playback controls) carefully—could be separate extension or opt-in settings.

### Suggested Steps
1. **Hotkey Module Cleanup**
   - Strip helper references, consolidate registration logic.  
   - Possibly move everything into `extension.ts` if lightweight enough.

2. **Settings UI Decomposition**
   - Introduce submodules or React components.  
   - Ensure `onConfigChange` flow remains intact, triggering re-registration of shortcuts.

3. **Documentation Updates**
   - Rewrite README installation (remove Python prerequisite).  
   - Add sections for new features (context menu, playback controls if implemented).  
   - Include troubleshooting notes for known limitations (e.g., OS-specific global capture).

4. **Testing Strategy**
   - Manual cross-platform testing (focused/unfocused Spotify).  
   - Validate liked songs behavior (emoji messaging) and duplicate notifications.

---

## 6. Optional Enhancements

1. **Playback Control Hotkeys**
   - Inspired by Seek Song: number keys for seek percentages, arrows for ±10s, custom combos for next/previous/Play-Pause.  
   - Use `Spicetify.Player` or relevant Cosmos endpoints (`sp://player/v2/...`).  
   - Make optional due to potential conflicts (e.g., Spacebar global).

2. **Context Menu**
   - Provide alternative interaction for users who forget shortcuts.  
   - Implement submenu listing configured playlists or a single “Add to configured playlists” item.

3. **Improved Notifications**
   - Swap `Spicetify.showNotification` for Snackbar/PopupModal when multiple playlists or errors occur.  
   - Possibly allow users to opt for compact vs. detailed summaries.

4. **UI Polish**
   - Focus playlist search input automatically when adding mappings.  
   - Add keyboard shortcuts for saving (Enter) or closing modals (Escape).

---

## 7. Implementation Roadmap

Update statuses as tasks progress.

1. **Hotkey Handling**
   - [ ] Experiment with `Spicetify.Keyboard.registerShortcut` on all platforms; record results.  
   - [ ] Decide on helper deprecation or fallback strategy based on tests.  
   - [ ] Refactor `src/hotkeys.ts` / `extension.ts` to centralize shortcut registration and cleanup helper logic.  
   - [ ] Update debug messaging and settings UI to reflect new behavior.

2. **Settings UI Modernization**
   - [ ] Outline modular structure or Creator migration plan.  
   - [ ] Implement playlist search improvements and status indicators.  
   - [ ] Integrate Spicetify UI components where practical.  
   - [ ] Remove helper-specific configs if deprecated.

3. **Playlist Manager Optimization**
   - [ ] Benchmark current duplicate scanning for large playlists.  
   - [ ] Prototype alternative (optimistic add + error handling) and evaluate.  
   - [ ] Document rate-limit behavior and add throttling if necessary.  
   - [ ] Investigate Cosmos subscriptions for playlist updates.

4. **Notifications & Feedback**
   - [ ] Design enhanced feedback flow (Snackbar/modal).  
   - [ ] Ensure errors bubble up with actionable messages.  
   - [ ] Keep debug logs for troubleshooting.

5. **Documentation & Packaging**
   - [ ] Update README and demo assets post-refactor.  
   - [ ] Draft Marketplace manifest and submission checklist.  
   - [ ] Credit external inspirations (Song Stats, Seek Song, etc.).  
   - [ ] Announce updates via community channels (Reddit/Discord) once stable.

---

## 8. Research Tracker

Use this section to log experiments. Add dated bullet points as results come in.

### Keyboard Capture Experiments
- _Pending_ — Need verification that Mousetrap via Spicetify captures keys when Spotify is unfocused on Windows/macOS/Linux.
- _Action_ — Build minimal extension snippet registering `ctrl+shift+1`, test in background, record behavior.
- _Fallback_ — If global capture fails, define helper retention plan (optional toggle, improved messaging, simplified setup guide).

### UI Reference Notes
- _To do_ — Audit Song Stats (context menus), Power Search Bar (React + Creator), Seek Song (keyboard handling).  
- Capture key files, patterns, and potential reusable snippets.

### Playlist API Experiments
- _To do_ — Evaluate `Spicetify.CosmosAsync.sub` for playlist events.  
- Monitor API response times when adding to 10+ playlists; log metrics.  
- Assess optimistic add vs. pre-scan performance.

### Additional Research
- Investigate Snackbar/Notistack usage in other extensions for rich notifications.  
- Survey playlist-centric extensions for best-in-class UX (e.g., collaborative playlist managers).

---

## 9. Manual Verification Suite

Run these checks after substantial changes and document outcomes.

1. **Hotkeys (Spotify focused)** — combos add current track, avoid duplicates, honor auto-like preference.
2. **Hotkeys (Spotify unfocused)** — validate chosen global strategy on each OS; record limitations.
3. **Helper Lifecycle** — if helper persists, confirm connection/retry messaging works.
4. **Multi-Playlist Batch** — map a hotkey to 5–10 playlists; observe performance, notifications, cache refresh.
5. **Settings Modal** — add/remove mapping, search, toggle options, save/cancel, reload (persistence via `Spicetify.LocalStorage`).
6. **Error Handling** — simulate read-only playlists, duplicate tracks, no playback context, helper offline; notifications must guide the user.

---

## 10. Open Questions

Maintain this list; replace entries with conclusions (include dates) once resolved.

- Can Spicetify Keyboard fully replace the helper across platforms?  
- Should global hotkeys always be on, or should users retain a toggle?  
- Is duplicate scanning worth the latency compared to API-only detection?  
- What UI approach best scales for users with hundreds of playlists (search improvements, virtualization)?  
- Does migrating to Spicetify Creator/React pay off in maintainability vs. added build complexity?  
- Should playback controls or other features live in this extension or a separate one?

---

## 11. Logging Discoveries

When completing research or major tasks:
- Add a dated note summarizing the outcome in the relevant section above.
- Update `README.md`, `AGENTS.md`, and helper scripts to reflect new behavior.
- Cross-link commits or code locations when referencing specific implementations.

Keep this plan living; prune outdated information and expand with new insights as the project evolves.
