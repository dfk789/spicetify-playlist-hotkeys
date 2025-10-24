# Phase 3 Migration Plan — React + Spicetify Creator

**Status**: 🔍 **PLANNING**
**Complexity**: ⚠️ **HIGH**
**Estimated Impact**: Major architectural change

---

## 🎯 Phase 3 Objectives

Modernize the 904-line DOM-based settings UI to use React components with Spicetify Creator.

**Goals**:
1. Set up Spicetify Creator with React/TypeScript
2. Create modular component structure (modal, list, form, selector)
3. Implement HotkeyMappingList component with edit/delete controls
4. Build PlaylistSelector with search and keyboard navigation
5. Integrate HelperStatusBanner component
6. Migrate to Spicetify.PopupModal.display
7. Remove legacy DOM-based settings UI code

---

## ⚠️ Risk Assessment

### High-Risk Factors

1. **Build System Change**: tsup → spicetify-creator
   - Different bundling approach
   - Different configuration
   - May affect existing builds

2. **React Version Constraint**: Must use React 17 (not 18)
   - Spotify still uses React 17
   - Must use `ReactDOM.render()` not `createRoot()`
   - Class-based patterns in reference (but we can use hooks)

3. **Full UI Rewrite**: 904 lines of DOM code → React components
   - Must maintain feature parity
   - Risk of introducing bugs
   - Extensive testing required

4. **External Dependencies**: Adding runtime dependencies
   - `react` and `react-dom` (externals)
   - `spcr-settings` (settings management)
   - `classnames` (utility)
   - Increases bundle complexity

5. **File Structure Change**: Current flat structure → component hierarchy
   - May affect imports
   - May require path changes
   - Could break existing code

### Medium-Risk Factors

1. **TypeScript Configuration**: May need updates for JSX
2. **SVG Loader**: Currently uses `?raw`, may need different approach
3. **State Management**: Need to decide on approach (Context, props, etc.)
4. **Testing Gap**: No automated tests to verify feature parity

---

## 🔍 Current State Analysis

###File Structure (Current)
```
src/
├── extension.ts        (213 lines) - Entry point
├── hotkeys.ts          (222 lines) - Hotkey manager
├── helperConnection.ts (266 lines) - Helper module
├── comboUtils.ts       (137 lines) - Utilities
├── playlists.ts        (933 lines) - Playlist operations
├── debug.ts            (46 lines)  - Debug manager
└── settings-ui.ts      (904 lines) - DOM-based UI ⚠️ TARGET
```

### Settings UI Responsibilities (settings-ui.ts)

**Current Implementation** (DOM-based):
1. Settings button rendering and placement (lines 48-229)
2. Modal overlay and container (lines 232-319)
3. HTML string generation (lines 321-384)
4. Mapping item rendering (lines 386-416)
5. Event listeners (lines 418-489)
6. Playlist search and dropdown (lines 523-789)
7. Helper status banner (Phase 2) (lines 789-877)
8. Mode explanation text (lines 882-902)
9. Hotkey capture interface (lines 651-721)
10. Save/cancel logic (lines 607-642)

**Complexity**:
- 904 lines (largest file in src/)
- Manual DOM manipulation throughout
- Event delegation for dynamic elements
- String-based HTML generation
- Inline styles everywhere

---

## 🎨 Proposed Architecture

### New File Structure

```
src/
├── extension.ts            # Entry point (minimal changes)
├── hotkeys.ts              # Unchanged
├── helperConnection.ts     # Unchanged
├── comboUtils.ts           # Unchanged
├── playlists.ts            # Unchanged
├── debug.ts                # Unchanged
│
├── settings/
│   ├── SettingsButton.tsx      # Button in player controls
│   ├── SettingsModal.tsx       # Main modal container
│   ├── HelperStatusBanner.tsx  # Status indicator (from Phase 2)
│   ├── ModeToggle.tsx          # Global/focused toggle
│   ├── MappingList.tsx         # List of hotkey mappings
│   ├── MappingItem.tsx         # Single mapping editor
│   ├── HotkeyCapture.tsx       # Hotkey capture component
│   ├── PlaylistSelector.tsx    # Searchable playlist dropdown
│   └── index.ts                # Export barrel
│
├── hooks/
│   ├── useSettings.ts          # Settings state management
│   ├── useHelperStatus.ts      # Helper connection status
│   └── usePlaylists.ts         # Playlist loading
│
├── types/
│   └── settings.ts             # Shared types
│
└── styles/
    └── settings.scss           # Component styles
```

### Component Hierarchy

```
SettingsModal
├── HelperStatusBanner
│   └── OnboardingDetails (collapsible)
├── ModeToggle
│   └── ModeExplanationText
└── MappingList
    ├── MappingItem (multiple)
    │   ├── HotkeyCapture
    │   └── PlaylistSelector
    │       └── PlaylistDropdown
    └── AddMappingButton
```

---

## 📦 Dependencies to Add

### package.json Changes

**Add to dependencies**:
```json
{
  "spcr-settings": "^1.3.1",
  "classnames": "^2.5.1"
}
```

**Add to devDependencies**:
```json
{
  "spicetify-creator": "^1.0.17",
  "@types/react": "^18.3.12",
  "@types/react-dom": "^18.3.12",
  "sass": "^1.77.0"
}
```

**Note**: React and ReactDOM are provided by Spicetify as externals, not bundled.

---

## 🔧 Build Configuration Changes

### Current (tsup.config.ts)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'hotkey-playlist': 'src/extension.ts' },
  loader: { '.svg': 'text' },
  format: ['iife'],
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  minify: true,
  sourcemap: true,
  globalName: 'SpicetifyPlaylistHotkeys',
  clean: true,
});
```

### Proposed (creator.config.js or similar)

**Note**: Spicetify Creator uses its own config format. Need to research exact structure.

```javascript
// Proposed structure (TBD)
module.exports = {
  entry: 'src/extension.tsx',
  output: 'dist',
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  },
  // ... additional Creator config
};
```

**Research Needed**:
- Exact Spicetify Creator configuration format
- How to handle SVG imports in Creator
- How to maintain test/benchmark builds

---

## 🚨 Critical Questions Before Proceeding

### 1. Can We Keep Test/Benchmark Extensions?

Current setup has 3 build configs:
- `tsup.config.ts` - Main extension
- `tsup.test.config.ts` - Keyboard test
- `tsup.benchmark.config.ts` - Performance test

**Question**: If we migrate to Spicetify Creator, can we:
- A) Keep tsup for test extensions only?
- B) Migrate all builds to Creator?
- C) Use hybrid approach?

### 2. TypeScript + JSX Configuration

Current `tsconfig.json` may need updates for JSX.

**Required Changes**:
```json
{
  "compilerOptions": {
    "jsx": "react",  // Or "react-jsx" for new transform
    "jsxFactory": "React.createElement",  // May be needed
    "jsxFragmentFactory": "React.Fragment"
  }
}
```

### 3. React Version Compatibility

Power Search Bar uses React 17 patterns with `ReactDOM.render()`.

**Decision Needed**:
- Follow Power Bar patterns exactly (safer)
- Modernize to hooks + functional components (better, but untested)

**Recommendation**: Use functional components + hooks (more maintainable), but test thoroughly.

### 4. State Management Approach

**Options**:
1. **Local State + Props**: Simple, works for small apps
2. **React Context**: Better for cross-component state
3. **External Store**: Overkill for this use case

**Recommendation**: React Context for settings state, local state for UI interactions.

### 5. Migration Strategy

**Option A: Big Bang** (Replace everything at once)
- ✅ Clean break, no legacy code
- ❌ High risk, hard to test incrementally
- ❌ Long development time

**Option B: Incremental** (Render React inside existing DOM)
- ✅ Lower risk, can test piece by piece
- ✅ Can fall back if issues arise
- ❌ Messy hybrid period
- ❌ Extra complexity

**Recommendation**: **Option A** (Big Bang) because:
- Settings UI is isolated (only used in modal)
- No gradual transition needed
- Cleaner end result
- Can test in development before shipping

---

## 📋 Detailed Implementation Steps

### Step 1: Prepare Build System (1-2 hours)

1. Research Spicetify Creator exact configuration
2. Install Creator and dependencies
3. Create new build config
4. Test basic build (no React yet)
5. Verify test/benchmark builds still work

**Validation**: `npm run build` succeeds, extension loads in Spotify

### Step 2: Set Up React Infrastructure (1 hour)

1. Update TypeScript config for JSX
2. Create component folder structure
3. Create basic SettingsModal.tsx shell
4. Test React rendering in Spotify context
5. Verify React DevTools detection

**Validation**: Empty modal renders, React DevTools works

### Step 3: Port Helper Status Banner (2 hours)

1. Create HelperStatusBanner.tsx
2. Port Phase 2 logic (already defined)
3. Create useHelperStatus hook
4. Add OnboardingDetails component
5. Style with SCSS

**Validation**: Banner displays all 4 states correctly

### Step 4: Port Mode Toggle (1 hour)

1. Create ModeToggle.tsx
2. Create ModeExplanationText component
3. Connect to settings state
4. Test mode switching

**Validation**: Toggle works, explanation updates

### Step 5: Port Hotkey Capture (2-3 hours)

1. Create HotkeyCapture.tsx
2. Implement keyboard event handling
3. Port normalization logic (use comboUtils)
4. Add visual feedback
5. Test with various key combos

**Validation**: All hotkey combinations capture correctly

### Step 6: Port Playlist Selector (3-4 hours)

1. Create PlaylistSelector.tsx
2. Implement search functionality
3. Create dropdown component
4. Add keyboard navigation
5. Port playlist loading logic
6. Create usePlaylists hook

**Validation**: Search works, dropdown displays, keyboard nav functional

### Step 7: Port Mapping List (2-3 hours)

1. Create MappingList.tsx
2. Create MappingItem.tsx
3. Integrate HotkeyCapture
4. Integrate PlaylistSelector
5. Add/remove functionality
6. Drag-to-reorder (optional)

**Validation**: Can add, edit, delete mappings

### Step 8: Port Modal Container (1-2 hours)

1. Create SettingsModal.tsx
2. Integrate all components
3. Add save/cancel logic
4. Port to Spicetify.PopupModal.display
5. Handle modal open/close

**Validation**: Modal opens/closes, saves persist

### Step 9: Create Settings Button (1 hour)

1. Create SettingsButton.tsx
2. Port SVG icon handling
3. Find placement in player controls
4. Connect to modal

**Validation**: Button appears, opens modal

### Step 10: Remove Legacy Code (1 hour)

1. Delete settings-ui.ts
2. Remove DOM manipulation code
3. Update extension.ts imports
4. Clean up unused utilities

**Validation**: Extension still works without legacy file

### Step 11: Testing & Polish (2-3 hours)

1. Test all hotkey combinations
2. Test all playlist operations
3. Test helper status transitions
4. Test save/cancel/reset
5. Cross-browser testing (if applicable)
6. Performance testing

**Validation**: Feature parity with legacy UI

**Total Estimated Time**: 18-25 hours

---

## 🎯 Success Criteria

### Must Have ✅

1. ✅ All existing features work (feature parity)
2. ✅ Helper status banner displays correctly
3. ✅ Hotkey capture works for all key combinations
4. ✅ Playlist search and selection functional
5. ✅ Settings persist correctly
6. ✅ Build succeeds without errors
7. ✅ Extension loads in Spotify

### Should Have 🎨

1. ✅ Improved visual design (React components)
2. ✅ Better accessibility (semantic HTML)
3. ✅ Keyboard navigation throughout
4. ✅ Loading states for async operations
5. ✅ Error boundaries for React errors

### Nice to Have 🌟

1. ⭐ Drag-to-reorder mappings
2. ⭐ Hotkey conflict detection
3. ⭐ Import/export settings
4. ⭐ Settings validation
5. ⭐ Undo/redo support

---

## 🚧 Potential Blockers

### Technical Blockers

1. **Spicetify Creator Configuration**: May have undocumented quirks
2. **React Version Issues**: If Spotify updates React, may break
3. **Build Performance**: Creator may be slower than tsup
4. **SVG Handling**: May need different loader approach

### Development Blockers

1. **Time Investment**: 18-25 hours estimated
2. **Testing Burden**: No automated tests, all manual
3. **Context Switching**: Large refactor may span multiple sessions
4. **Documentation Gap**: Spicetify Creator has limited docs

---

## ✅ Research Findings: React in Spicetify

### How Spicetify Exposes React

**Confirmed** (from official Spicetify docs):
- ✅ `Spicetify.React` - Main React library
- ✅ `Spicetify.ReactDOM` - ReactDOM for rendering
- ✅ `Spicetify.ReactDOMServer` - Server-side rendering
- ✅ Stock React components available
- ✅ React hooks exposed

### React Version

**Important**: Spotify React version depends on client version:
- Spotify **< 1.2.26**: React **17.0.2**
- Spotify **≥ 1.2.26**: React **18.2.0**

**Decision**: Target React 18 (most users on recent Spotify versions)

### React Component Availability

Spicetify provides:
- Stock Spotify UI components
- React Query v3
- Custom hooks used by Spotify client

## 🤔 Alternative Approach: Keep tsup + Add React

**What if we DON'T switch to Spicetify Creator?**

### Pros of Keeping tsup
- ✅ Familiar build system
- ✅ Faster builds (esbuild via tsup)
- ✅ No build system migration risk
- ✅ Can add React as external (confirmed possible)
- ✅ Test/benchmark builds unchanged
- ✅ More control over configuration
- ✅ Simpler setup (one less tool to learn)

### Cons of Keeping tsup
- ❌ Not the "official" approach
- ❌ May miss Creator-specific optimizations
- ❌ Less community examples to follow
- ❌ Need manual React external config
- ❌ May need additional loaders for SCSS

### Configuration with tsup + React (VALIDATED)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'hotkey-playlist': 'src/extension.tsx' },
  loader: {
    '.svg': 'text',
    '.scss': 'css'  // Or use esbuild-sass-plugin
  },
  format: ['iife'],
  external: ['react', 'react-dom'],  // Don't bundle React
  globals: {
    'react': 'Spicetify.React',        // ✅ CONFIRMED
    'react-dom': 'Spicetify.ReactDOM'  // ✅ CONFIRMED
  },
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  minify: true,
  sourcemap: true,
  globalName: 'SpicetifyPlaylistHotkeys',
  clean: true,
  esbuildOptions(options) {
    options.jsx = 'transform';
    options.jsxFactory = 'Spicetify.React.createElement';
    options.jsxFragment = 'Spicetify.React.Fragment';
  }
});
```

**Status**: ✅ Validated - Spicetify.React and Spicetify.ReactDOM confirmed available

---

## 💡 Recommendation

### Proposed Path Forward

**Phase 3A: Investigate & Decide** (Current Task)
1. ✅ Create this planning document
2. Research Spicetify Creator documentation
3. Research how Spicetify exposes React
4. Create proof-of-concept with both approaches:
   - A) Spicetify Creator + React
   - B) tsup + React external
5. Compare build sizes, dev experience, complexity
6. Make final decision with user input

**Phase 3B: Implement React Migration**
1. Set up chosen build system
2. Create component structure
3. Port components incrementally
4. Test thoroughly
5. Remove legacy code

**Phase 3C: Documentation & Testing**
1. Document new architecture
2. Update AGENTS.md
3. Update README
4. Create Phase 3 summary

---

## 🎬 Next Actions

**Immediate** (Before continuing):
1. 🔍 Research Spicetify Creator configuration
2. 🔍 Research Spicetify React exposure
3. 🧪 Create proof-of-concept builds
4. 📊 Compare approaches
5. 🗣️ Present findings to user for decision

**After Decision**:
- If **Creator**: Follow Step 1-11 above
- If **tsup**: Adapt steps for tsup configuration
- If **Defer**: Move to Phase 4 (Playlist Optimization) instead

---

## 📊 Risk Mitigation

### Backup Plan

If React migration proves too risky or complex:
1. **Keep DOM-based UI** for now
2. **Improve incrementally**: Extract helper functions, better organization
3. **Defer to post-v1.0**: Migrate after core features stable
4. **Focus on Phase 4-6**: Deliver value without architectural risk

### Feature Branch Strategy

1. Create `feature/react-migration` branch
2. Develop in isolation
3. Test thoroughly before merging
4. Keep `remote-base` stable

---

## 📝 Open Questions

1. ❓ How does Spicetify expose React to extensions?
2. ❓ What is exact Spicetify Creator config format?
3. ❓ Can we use React 18 features or must stay on 17?
4. ❓ How do other extensions handle SVG in React?
5. ❓ Is there a Spicetify React component library?
6. ❓ Should we create a proof-of-concept first?
7. ❓ Is Phase 3 worth the investment vs other phases?

---

## ✅ Decision Point

**Before proceeding with Phase 3 implementation, we need to:**

1. **Research** Spicetify Creator thoroughly
2. **Validate** that React migration is feasible
3. **Compare** Creator vs tsup+React approaches
4. **Decide** which path to take
5. **Confirm** with user that Phase 3 is priority

**Alternative**: Skip to Phase 4 (Playlist Optimization) which is lower risk and delivers performance improvements without architectural changes.

---

**Status**: ⏸️ **AWAITING RESEARCH & DECISION**
**Next Step**: Research Spicetify Creator and React integration patterns
