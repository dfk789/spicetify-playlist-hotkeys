# Change Log — Spicetify Playlist Hotkeys

This document tracks all changes made during the modernization and improvement project. Update after completing each significant task.

---

## [Unreleased] - 2025-10-24

### Planning & Setup
- ✅ Conducted comprehensive project audit (README, AGENTS.md, improvement-plan.md, experiments)
- ✅ Researched latest Spicetify APIs (Oct 2024):
  - Confirmed `Spicetify.Keyboard.registerShortcut` is focus-only (Mousetrap wrapper)
  - Verified CosmosAsync playlist API best practices
  - Explored PopupModal and Notistack for enhanced UI
  - Reviewed React component availability in Creator
- ✅ Created 32-task implementation roadmap across 6 phases
- ✅ Updated `docs/improvement-plan.md` with research findings dated 2025-10-24
- ✅ Established change tracking system (this file + SESSION_NOTES.md)
- ✅ Branch cleanup complete (commit: eb7f538)
- ✅ Source code review complete (commit: 78d32c4)
- ✅ Created Spicetify.Keyboard test extension (commit: 0570dc3)
- ✅ Analyzed reference extensions for patterns (commit: c562e87)
- ✅ Created playlist API benchmarking tool (commit: ec67994)

### Phase 1: Hotkey Handling Simplification ✅
**Date**: 2025-10-24
**Commit**: 29939b8

**Changes**:
- Implemented focus-only mode with `Spicetify.Keyboard.registerShortcut()`
- Extracted helper logic into dedicated `helperConnection.ts` module (266 lines)
- Created shared `comboUtils.ts` for normalization (137 lines)
- Refactored `hotkeys.ts` from 376 → 222 lines (-41% complexity)
- Added input field protection pattern from Power Search Bar research
- Maintained execution locks (working well)

**Build**: 40.50 KB ✅

**See**: `docs/PHASE_1_SUMMARY.md` for details

### Phase 2: Helper UX Improvements ✅
**Date**: 2025-10-24
**Commit**: [pending]

**Changes**:
- Enhanced `settings-ui.ts` with color-coded status banners (+99 lines)
- Added 4 visual status states:
  - 🔵 Focused Mode (blue) - Spotify active only
  - 🟢 Global Mode Active (green) - Helper connected
  - 🟠 Connecting (orange) - Establishing connection
  - 🔴 Helper Not Running (red) - Helper offline
- Implemented dynamic mode explanation text (Focused vs System-Wide)
- Added inline onboarding with expandable `<details>` section
- Shows helper setup instructions (Python script + standalone exe)
- Connection diagnostics already implemented in Phase 1

**Build**: 43.04 KB (+2.54 KB for UX improvements) ✅

**See**: `docs/PHASE_2_SUMMARY.md` for details

### Research Notes
- **Spicetify.Keyboard**: Focus-only, returns `void` (not unregister fn), must use `_deregisterShortcut(keys)` to unregister
- **Helper Requirement**: Confirmed necessary for OS-level global hotkeys
- **CosmosAsync**: Stable, use `sp://core-playlist/v1/rootlist` endpoint
- **UI Components**: PopupModal stable, Notistack available, some breaking changes in May 2025
- **Reference Extensions**: Seek Song (Mousetrap patterns), Power Bar (React 17 + Creator), Context Menu API documented
- **Key Pattern**: Use `Spicetify.Keyboard.registerShortcut()` with input field protection
- **React Migration**: Must use React 17 patterns (Spotify compatibility), functional components + hooks recommended
- **Build Tools**: Spicetify Creator recommended for React projects, spcr-settings for configuration UI

### Source Code Architecture (Review Complete)
**File Structure** (as of Phase 2):
- `extension.ts` (213 lines): Main entry, config, notifications
- `hotkeys.ts` (222 lines): Simplified hotkey manager using Spicetify.Keyboard ✅
- `helperConnection.ts` (266 lines): Helper connection module ✅ NEW
- `comboUtils.ts` (137 lines): Normalization utilities ✅ NEW
- `playlists.ts` (933 lines): Comprehensive playlist operations with caching
- `debug.ts` (46 lines): Debug manager with localStorage
- `settings-ui.ts` (904 lines): DOM-based modal UI with enhanced status indicators ✅

**Strengths**:
- Clean class-based architecture with good separation of concerns
- Robust error handling and defensive coding patterns
- Sophisticated caching (playlist metadata 5min, tracks 2min)
- Concurrency controls prevent race conditions
- Rich user feedback with emoji indicators

**Technical Debt Status** (Phase 2):
- ~~Dual hotkey registration paths~~ ✅ **FIXED** (Phase 1)
- ~~Not leveraging `Spicetify.Keyboard.registerShortcut` API~~ ✅ **FIXED** (Phase 1)
- ~~Helper connection status not clearly surfaced~~ ✅ **FIXED** (Phase 2)
- Monolithic settings UI (900+ lines of DOM manipulation) - ⏳ Phase 3
- Playlist pre-scan for duplicates adds latency - ⏳ Phase 4

**Phase 1 & 2 Achievements**:
1. ✅ Adopted `Spicetify.Keyboard.registerShortcut` for focused mode
2. ✅ Extracted helper logic to `helperConnection.ts` module
3. ✅ Surfaced helper status with color-coded banners and inline onboarding
4. ⏳ Evaluate optimistic add vs pre-scan performance (Phase 4)

---

## Implementation Progress Tracker

### Phase 0: Research & Planning (3.5/4 complete) ✅ Ready for Phase 1
- [x] Create test infrastructure for Spicetify.Keyboard verification
- [x] Audit reference extensions (Seek Song, Power Search Bar, Context Menu API)
- [x] Document architectural patterns and recommendations (EXTENSION_PATTERNS.md)
- [x] Create playlist API benchmarking tool
- [ ] USER ACTION: Run keyboard test and document focus-only behavior
- [ ] USER ACTION: Run benchmarks and document performance metrics

### Phase 1: Hotkey Handling Simplification (4/4 complete) ✅ COMPLETE
- [x] Implement focus-only mode with Spicetify.Keyboard.registerShortcut
- [x] Refactor helper integration into dedicated module
- [x] Centralize combo normalization between focused and helper modes
- [x] Add duplicate trigger prevention logic

### Phase 2: Helper UX Improvements (4/4 complete) ✅ COMPLETE
- [x] Implement connection diagnostics with retry logic (from Phase 1)
- [x] Add helper status indicators in settings UI
- [x] Update messaging for focused vs system-wide modes
- [x] Add inline onboarding guidance for helper setup

### Phase 3: Settings UI Modernization (0/7 complete)
- [ ] Set up Spicetify Creator with React/TypeScript
- [ ] Create modular component structure (modal, list, form, selector)
- [ ] Implement HotkeyMappingList component with edit/delete controls
- [ ] Build PlaylistSelector with search and keyboard navigation
- [ ] Integrate HelperStatusBanner component
- [ ] Migrate PopupModal to use Spicetify.PopupModal.display
- [ ] Remove legacy DOM-based settings UI code

### Phase 4: Playlist Manager Optimization (0/4 complete)
- [ ] Evaluate duplicate check strategy (pre-scan vs optimistic)
- [ ] Implement rate limiting for batch playlist operations
- [ ] Research CosmosAsync.sub for real-time playlist updates
- [ ] Enhance error messaging with user-friendly notifications

### Phase 5: Enhanced Notifications (0/2 complete)
- [ ] Implement Notistack for stacked notifications
- [ ] Add summary modals for multi-playlist operations

### Phase 6: Optional Features (0/2 complete)
- [ ] Implement context menu integration for playlist actions
- [ ] Add playback control hotkeys (seek, next/prev, play/pause)

### Documentation & Testing (0/4 complete)
- [ ] Update README with new features and setup instructions
- [ ] Update AGENTS.md with new architectural decisions
- [ ] Perform manual cross-platform testing (Windows/macOS/Linux)
- [ ] Run full verification suite from improvement-plan.md Section 9

### Marketplace Preparation (0/2 complete)
- [ ] Draft Spicetify Marketplace manifest
- [ ] Create submission checklist and prepare assets

---

## Template for New Entries

When completing a task, add an entry following this format:

```markdown
### [Date] - Task Name

**Status**: ✅ Completed / ⚠️ Partial / ❌ Blocked

**Changes**:
- Bullet list of files modified
- Key implementation details

**Files Modified**:
- `path/to/file.ts` - description of changes

**Testing**:
- Manual testing performed
- Issues discovered

**Next Steps**:
- What needs to happen next
- Any blockers or dependencies

**References**:
- Related docs/commits
- External resources consulted
```

---

## Conventions

- **✅** = Completed
- **⏳** = In Progress
- **⚠️** = Blocked/Partial
- **❌** = Cancelled/Deprecated
- **📝** = Documentation change
- **🐛** = Bug fix
- **✨** = New feature
- **♻️** = Refactor
- **🚀** = Performance improvement
- **🎨** = UI/UX improvement
