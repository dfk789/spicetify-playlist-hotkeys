# Reference Extension Patterns Analysis

**Date**: 2025-10-24
**Purpose**: Document architectural patterns from established Spicetify extensions to inform our refactoring strategy

---

## Extensions Analyzed

1. **Seek Song** (tlozs/spicetify-seekSongKeybinds) - Keyboard handling
2. **Power Search Bar** (jeroentvb/spicetify-power-bar) - React UI + Spicetify Creator
3. **Song Stats** (rxri/spicetify-extensions) - Context menus (research incomplete)

---

## 1. Seek Song - Keyboard Handling Patterns

### Repository
- https://github.com/tlozs/spicetify-seekSongKeybinds
- Single file extension (`seekSongKeybinds.js`)
- GPL-3.0 license

### Key Findings

**✅ Uses Mousetrap Directly**
```javascript
Spicetify.Mousetrap.bind(key, action)
```
- Does NOT use `Spicetify.Keyboard.registerShortcut()`
- Directly accesses `Spicetify.Mousetrap` (lower-level API)
- Confirms Mousetrap is available via Spicetify

**Pattern: Loop-based Registration**
```javascript
for (let i = 0; i < 10; i++) {
    setKeybind(`${i}`, () => setToPercent(i * 10));
}
```
- Clean pattern for multiple similar bindings
- Binds numeric keys 0-9 to seek percentages (0%-90%)
- Arrow keys: ±5 second increments

**Initialization Pattern**
```javascript
function seekSongKeybinds() {
    // 1. Check if Spicetify modules exist
    if (!Spicetify.Mousetrap) return;

    // 2. Wrapper function for clarity
    function setKeybind(key, action) {
        Spicetify.Mousetrap.bind(key, action);
    }

    // 3. Register multiple shortcuts
    for (let i = 0; i < 10; i++) { /* ... */ }
}
```

### Applicability to Our Project

**✅ Patterns We Can Use:**
- Loop-based registration for similar shortcuts
- Wrapper functions for cleaner code
- Initialization checks before binding

**⚠️ Differences:**
- Seek Song uses Mousetrap directly
- We should use `Spicetify.Keyboard.registerShortcut()` (higher-level, recommended)
- Our shortcuts are dynamic (user-configured), not hardcoded

---

## 2. Power Search Bar - React + Creator Patterns

### Repository
- https://github.com/jeroentvb/spicetify-power-bar
- Modern TypeScript project with Spicetify Creator
- Last updated: March 2025

### Tech Stack

```json
{
  "dependencies": {
    "classnames": "^2.5.1",
    "lodash-es": "^4.17.21",
    "react-markdown": "^8.0.0",
    "spcr-settings": "^1.3.1",
    "spcr-whats-new": "^1.0.1"
  },
  "devDependencies": {
    "spicetify-creator": "^1.0.17",
    "@types/react": "^18.3.12"
  }
}
```

**Key Points:**
- ✅ Uses React (peer dependency)
- ✅ TypeScript (86.7% of codebase)
- ✅ Spicetify Creator for builds
- ✅ `spcr-settings` for settings management
- ✅ SCSS for styling (12.2%)

### Architecture Patterns

**Initialization Pattern** (`app.tsx`):
```typescript
async function main() {
  // Wait for Spicetify APIs
  while (!Spicetify?.Platform || !Spicetify?.CosmosAsync || !Spicetify?.Player) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Mount React app
  const container = document.createElement('div');
  document.body.appendChild(container);

  // Note: Uses React 17 (Spotify still uses v17)
  ReactDOM.render(<PowerBar />, container);
}
```

**⚠️ Important:** Spotify uses React 17, not React 18!
- Must use `ReactDOM.render()`, not `createRoot()`
- ESLint disable comments acknowledge deprecated API

### UI Component Patterns

**Class-Based Component** (not hooks!):
```typescript
class PowerBar extends React.Component {
  state = {
    active: false,
    categorizedSuggestions: [],
    selectedSuggestionUri: ''
  };

  inputRef = React.createRef<HTMLInputElement>();

  // Getter/setter for derived state
  get selectedSuggestionIndex() { /* ... */ }
  set selectedSuggestionIndex(index) {
    // Triggers state update with scroll behavior
  }
}
```

**Why Class-Based?**
- Likely for compatibility with Spotify's React 17
- Or developer preference (older codebase)
- Hooks would work but not used here

### Keyboard Handling Pattern

**Activation Key Detection**:
```typescript
isActivationKeyCombo(event: KeyboardEvent) {
  const { modifier, key } = this.getActivationShortcut();
  const modifierKey = this.getModifierKey(modifier);

  // Check if correct modifier + key pressed
  return event[modifierKey] && event.key === key;
}
```

**Navigation Handling**:
- Arrow keys: Cycle through suggestions (with wrapping)
- Tab/Shift+Tab: Switch between categories
- Escape: Clear input or close
- Enter: Select suggestion or navigate to URI

**Input Protection**:
```typescript
// Don't trigger in other input fields
if (document.activeElement?.tagName === 'INPUT') return;
```

### Spicetify API Usage

**Platform Detection**:
```typescript
const isMac = Spicetify.Platform.PlatformData.os_name === 'osx';
```

**Playback Control**:
```typescript
Spicetify.Player.playUri(uri);
Spicetify.addToQueue(uri);  // For tracks/albums
```

**GraphQL Queries** (for queue):
```typescript
await Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri}`);
```

### Build Setup

**Scripts**:
```json
{
  "build": "spicetify-creator",
  "build:local": "spicetify-creator build -m",
  "build:prod": "npm run build:local && copyfiles ...",
  "watch": "spicetify-creator watch",
  "lint": "eslint src",
  "lint:fix": "eslint src --fix"
}
```

**TypeScript Config**: Uses ESLint for code quality

### Applicability to Our Project

**✅ Patterns We Should Adopt:**
- Spicetify Creator + React for settings UI
- `spcr-settings` for settings management
- TypeScript + SCSS structure
- Initialization pattern (wait for Spicetify APIs)
- Platform detection for modifier keys
- Input protection (don't trigger in other fields)

**⚠️ Considerations:**
- Must use React 17 patterns (`ReactDOM.render()`)
- Class-based vs hooks? (We can use hooks despite Power Bar's choice)
- Build complexity increases (tsup → spicetify-creator)

**🔧 Recommended Adaptation:**
- Use functional components + hooks (modern, maintainable)
- Keep React 17 compatibility (avoid createRoot)
- Adopt `spcr-settings` for configuration UI
- Follow Power Bar's keyboard handling patterns

---

## 3. Context Menu Integration Patterns

### API Documentation
- Official docs: https://spicetify.app/docs/development/api-wrapper/classes/context-menu/
- React components: https://spicetify.app/docs/development/api-wrapper/types/react-component/context-menu-props/

### Context Menu API Pattern

**Basic Menu Item**:
```javascript
// 1. Define conditional display logic
function shouldShowMenuItem(uris) {
  let uriObj = Spicetify.URI.fromString(uris[0]);
  return uriObj.type === Spicetify.URI.Type.TRACK;
}

// 2. Create menu item
const menuItem = new Spicetify.ContextMenu.Item(
  "Add to Playlist (Hotkey)",          // Label
  (uris) => {                            // Click handler
    // Get selected track URIs
    const trackUri = uris[0];
    Spicetify.showNotification("Clicked!");
  },
  shouldShowMenuItem,                    // Conditional display
  Spicetify.SVGIcons["playlist"],       // Icon
  false                                   // Disabled state
);

// 3. Register menu item
menuItem.register();
```

**React-Based Context Menu**:
```typescript
const MenuWrapper = React.memo((props) =>
  <Spicetify.ReactComponent.Menu {...props}>
    <Spicetify.ReactComponent.MenuItem
      label="Add to Configured Playlists"
      onClick={() => {
        // Handle click
      }}
    />
  </Spicetify.ReactComponent.Menu>
);

const ContextMenu = React.memo((props) => {
  return (
    <Spicetify.ReactComponent.ContextMenu
      {...props}
      trigger="click"
      menu={<MenuWrapper {...props} />}
    >
      <div>Right-click target</div>
    </Spicetify.ReactComponent.ContextMenu>
  );
});
```

**SubMenu Pattern** (for multiple options):
```javascript
// Create submenu with configured playlists
const submenu = new Spicetify.ContextMenu.SubMenu(
  "Add via Hotkey Mapping",
  [
    new Spicetify.ContextMenu.Item(
      "Ctrl+1 → Favorites",
      (uris) => addToPlaylist(uris[0], "playlist-id-1")
    ),
    new Spicetify.ContextMenu.Item(
      "Ctrl+2 → Workout",
      (uris) => addToPlaylist(uris[0], "playlist-id-2")
    ),
  ],
  shouldShowMenuItem,
  Spicetify.SVGIcons["playlist"]
);

submenu.register();
```

### Modal Integration

**Spicetify PopupModal**:
```typescript
Spicetify.PopupModal.display({
  title: "Track Added",
  content: `Added to ${playlistCount} playlists`,
  isLarge: false
});

// Close modal
Spicetify.PopupModal.hide();
```

**React ConfirmDialog**:
```typescript
<Spicetify.ReactComponent.ConfirmDialog
  titleText="Add Track?"
  descriptionText={`Add "${trackName}" to configured playlists?`}
  confirmLabel="Add"
  cancelLabel="Cancel"
  onConfirm={() => handleAdd()}
  onClose={() => {}}
/>
```

### Applicability to Our Project

**Option A: Single Menu Item**
- "Add to Configured Playlists" (executes all mappings)
- Simpler, faster
- Good for users who forget shortcuts

**Option B: SubMenu with Mappings**
- Show each configured mapping as submenu item
- "Ctrl+1 → Favorites", "Ctrl+2 → Workout", etc.
- Direct control, no need to remember shortcuts
- More complex UI

**Recommended: Option A** (simpler, faster)
```typescript
const addToPlaylistsMenuItem = new Spicetify.ContextMenu.Item(
  "Add to Configured Playlists",
  async (uris) => {
    const trackUri = uris[0];
    await this.handleHotkey(this.config.mappings.flatMap(m => m.playlistIds));
  },
  (uris) => {
    // Only show for tracks
    return Spicetify.URI.fromString(uris[0]).type === Spicetify.URI.Type.TRACK;
  },
  Spicetify.SVGIcons["playlist-folder"]
);

addToPlaylistsMenuItem.register();
```

---

## Key Patterns Summary

### Keyboard Shortcuts

| Pattern | Seek Song | Power Bar | Our Project |
|---------|-----------|-----------|-------------|
| API Used | `Spicetify.Mousetrap` direct | Event handlers | Should use `Spicetify.Keyboard` |
| Registration | Loop-based, static | Dynamic activation key | User-configured, dynamic |
| Scope | Hardcoded keys (0-9) | Single activation combo | Multiple user mappings |
| Focus | Always active | Protected (not in inputs) | Need focus-only mode |

**✅ Best Practice for Us:**
```typescript
// Recommended pattern combining both approaches
function registerShortcuts(mappings: HotkeyMapping[]) {
  for (const mapping of mappings) {
    Spicetify.Keyboard.registerShortcut(
      mapping.combo,
      async () => {
        // Protection against input fields
        if (document.activeElement?.tagName === 'INPUT') return;

        await handleHotkey(mapping.playlistIds);
      }
    );
  }
}
```

### React UI Architecture

| Aspect | Power Bar | Our Current | Recommendation |
|--------|-----------|-------------|----------------|
| Framework | React 17 + Creator | Vanilla DOM | Migrate to React + Creator |
| Components | Class-based | N/A | Functional + hooks |
| State | Component state | localStorage directly | Context + hooks |
| Styling | SCSS + CSS vars | Inline styles | Adopt SCSS |
| Settings | `spcr-settings` | Custom modal | Use `spcr-settings` |
| Build | Spicetify Creator | tsup | Switch to Creator |

### Initialization

**Standard Pattern** (all extensions use this):
```typescript
async function initialize() {
  // Wait for Spicetify APIs
  while (!Spicetify?.showNotification || !Spicetify?.CosmosAsync) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Initialize extension
  // ...
}

initialize();
```

**✅ We already use this pattern** (extension.ts:49-55)

---

## Recommendations for Phase 1-3 Implementation

### Phase 1: Hotkey Handling Simplification

**Apply Seek Song Patterns:**
- Loop-based registration for multiple mappings
- Wrapper functions for clarity
- Initialization checks

**Apply Power Bar Patterns:**
- Input field protection
- Platform-specific modifier handling

**Our Specific Approach:**
```typescript
// Focused mode using Spicetify.Keyboard
for (const mapping of this.config.mappings) {
  Spicetify.Keyboard.registerShortcut(mapping.combo, async (event) => {
    // Prevent firing in input fields
    if (document.activeElement?.tagName === 'INPUT') return;

    await this.handleHotkey(mapping.playlistIds);
  });
}

// Global mode: Keep helper SSE integration
// (Helper still required for OS-level capture)
```

### Phase 2: Helper UX Improvements

**Status Indicators** (inspired by Power Bar):
- Show connection state with color coding
- Display platform-specific shortcuts
- Clear error messages

### Phase 3: Settings UI Modernization

**Architecture** (follow Power Bar):
```
spicetify-playlist-hotkeys/
├── src/
│   ├── app.tsx              # Entry point
│   ├── components/
│   │   ├── HotkeySettings.tsx    # Main modal
│   │   ├── MappingList.tsx       # List component
│   │   ├── MappingForm.tsx       # Add/edit form
│   │   ├── PlaylistSelector.tsx  # Searchable dropdown
│   │   └── HelperStatus.tsx      # Connection indicator
│   ├── hooks/
│   │   ├── useHotkeySettings.ts  # Settings state
│   │   └── useHelperStatus.ts    # Helper connection
│   ├── styles/
│   │   └── settings.scss
│   └── types/
│       └── index.ts
├── package.json             # Add React, spcr-settings
└── tsup.config.ts → migrate to spicetify-creator
```

**Dependencies to Add:**
```json
{
  "dependencies": {
    "spcr-settings": "^1.3.1",
    "classnames": "^2.5.1"
  },
  "devDependencies": {
    "spicetify-creator": "^1.0.17",
    "@types/react": "^18.3.12"
  }
}
```

---

## Research Gaps & Next Steps

### Completed
- Seek Song keyboard patterns
- Power Bar React architecture
- Power Bar keyboard handling
- Power Bar Spicetify Creator setup

### Not yet researched (not blocking)
- Song Stats context menu patterns and modal UI implementation
- Detailed spcr-settings API usage
- PopupModal vs custom modal comparison
- Power Bar suggestion algorithm and category navigation
- Seek Song player control patterns
- Platform-specific keyboard behavior

These items are not blocking. Context menu and playback control exploration are tracked in GitHub Issues #4 and #5.

---

## Conclusion

**Key Takeaways:**

1. **Keyboard Handling**: Use `Spicetify.Keyboard.registerShortcut()` with input field protection
2. **React Migration**: Adopt Spicetify Creator + React 17 patterns (not hooks in Power Bar, but we can use them)
3. **Settings UI**: Use `spcr-settings` library for configuration
4. **Initialization**: Standard polling pattern for Spicetify API availability
5. **Build Tools**: Migrate from tsup to spicetify-creator for React support

**Confidence Level**: High for Phase 1-2 implementation, Medium for Phase 3 (need more Song Stats research for context menu patterns).

**Ready to Proceed**: Yes - we have enough patterns to start Phase 1 refactoring.
