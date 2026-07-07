# Changelog — Spicetify Playlist Hotkeys

Release history for the Spicetify Playlist Hotkeys extension. Active development work is tracked in GitHub Issues, not in this file.

---

## Modernization (2025-10-24 through 2025-10-25)

### Phase 0: Research & Planning
- Comprehensive project audit and Spicetify API research (Oct 2024)
- Confirmed `Spicetify.Keyboard.registerShortcut` is focus-only (Mousetrap wrapper)
- Verified CosmosAsync playlist API best practices
- Created keyboard test extension and playlist API benchmarking tool
- Analyzed reference extensions (Seek Song, Power Search Bar, Context Menu API)
- Documented architectural patterns in `docs/experiments/EXTENSION_PATTERNS.md`

### Phase 1: Hotkey Handling Simplification
- Implemented focus-only mode with `Spicetify.Keyboard.registerShortcut()`
- Extracted helper logic into dedicated `helperConnection.ts` module
- Created shared `comboUtils.ts` for normalization
- Refactored `hotkeys.ts` from 376 to 222 lines (-41% complexity)
- Added input field protection pattern

### Phase 2: Helper UX Improvements
- Enhanced settings UI with color-coded status banners
- Added 4 visual status states: Focused Mode, Global Mode Active, Connecting, Helper Not Running
- Implemented dynamic mode explanation text (Focused vs System-Wide)
- Added inline onboarding with expandable helper setup instructions

### Phase 3: Settings UI Modernization (React Migration)
- Migrated to Spicetify Creator build system
- Created 10 modular React components (682 lines total)
- Implemented 3 custom hooks (useSettings, useHelperStatus, usePlaylists)
- Built searchable PlaylistSelector with keyboard navigation
- Created HotkeyCapture component with event handling
- Removed legacy DOM-based settings-ui.ts (904 lines)
- React/ReactDOM externalized (provided by Spicetify)

### Phase 4: Playlist Manager Optimization
- Documented and validated duplicate check strategy (pre-scan retained)
- Implemented batch processing with rate limiting (5 playlists per batch, 150ms delay)
- Researched CosmosAsync.sub for real-time playlist updates (see `docs/COSMOS_SUB_RESEARCH.md`)
- Enhanced error messaging with categorized, user-friendly notifications

### Phase 5: Enhanced Notifications
- Created NotificationService with automatic type selection
- Implemented stacked toasts for 2-5 playlists (using Spicetify.Notistack)
- Built ResultModal component for 6+ playlist operations
- Integrated notification service into app.tsx

### Key Research Notes
- **Spicetify.Keyboard**: Focus-only, returns `void`, must use `_deregisterShortcut(keys)` to unregister
- **Helper Requirement**: Confirmed necessary for OS-level global hotkeys
- **CosmosAsync**: Stable, use `sp://core-playlist/v1/rootlist` endpoint
- **React**: Must use React 17 patterns for Spotify compatibility (functional components + hooks recommended)
- **Build Tools**: Spicetify Creator recommended for React projects

### Remaining Work
Active development work is tracked in GitHub Issues:
- Manual hotkey verification (issue #1)
- Marketplace manifest and submission (issue #3)
- Context menu feature spike (issue #4)
- Playback control hotkeys spike (issue #5)