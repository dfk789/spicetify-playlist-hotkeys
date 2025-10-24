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
- ✅ Source code review complete

### Research Notes
- **Spicetify.Keyboard**: Focus-only, returns `void` (not unregister fn), must use `_deregisterShortcut(keys)` to unregister
- **Helper Requirement**: Confirmed necessary for OS-level global hotkeys
- **CosmosAsync**: Stable, use `sp://core-playlist/v1/rootlist` endpoint
- **UI Components**: PopupModal stable, Notistack available, some breaking changes in May 2025

### Source Code Architecture (Review Complete)
**File Structure**:
- `extension.ts` (213 lines): Main entry, config, notifications
- `hotkeys.ts` (377 lines): Dual-mode hotkey manager (in-app + helper)
- `playlists.ts` (933 lines): Comprehensive playlist operations with caching
- `debug.ts` (46 lines): Debug manager with localStorage
- `settings-ui.ts` (800+ lines): DOM-based modal UI (needs refactor)

**Strengths**:
- Clean class-based architecture with good separation of concerns
- Robust error handling and defensive coding patterns
- Sophisticated caching (playlist metadata 5min, tracks 2min)
- Concurrency controls prevent race conditions
- Rich user feedback with emoji indicators

**Technical Debt Confirmed**:
- Dual hotkey registration paths (in-app keydown + helper SSE)
- Not leveraging `Spicetify.Keyboard.registerShortcut` API
- Monolithic settings UI (800+ lines of DOM manipulation)
- Helper connection status not clearly surfaced to users
- Playlist pre-scan for duplicates adds latency (opportunity for optimization)

**Quick Wins**:
1. Adopt `Spicetify.Keyboard.registerShortcut` for focused mode
2. Extract helper logic to `helperConnection.ts` module
3. Surface helper status with clear UI indicators
4. Evaluate optimistic add vs pre-scan performance

---

## Implementation Progress Tracker

### Phase 0: Research & Planning (0/3 complete)
- [ ] Verify Spicetify.Keyboard focus-only behavior per platform
- [ ] Audit reference extensions (Song Stats, Power Search Bar, Seek Song)
- [ ] Benchmark current playlist API performance with large playlists

### Phase 1: Hotkey Handling Simplification (0/4 complete)
- [ ] Implement focus-only mode with Spicetify.Keyboard.registerShortcut
- [ ] Refactor helper integration into dedicated module
- [ ] Centralize combo normalization between focused and helper modes
- [ ] Add duplicate trigger prevention logic

### Phase 2: Helper UX Improvements (0/4 complete)
- [ ] Implement connection diagnostics with retry logic
- [ ] Add helper status indicators in settings UI
- [ ] Update messaging for focused vs system-wide modes
- [ ] Add inline onboarding guidance for helper setup

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
