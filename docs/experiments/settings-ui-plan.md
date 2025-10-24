# Settings UI Modularization Plan

Last updated: 2025-10-24

## Goals

- Replace the monolithic DOM-based modal in `src/settings-ui.ts` with modular components.
- Adopt Spicetify Creator + React workflow to improve maintainability and alignment with modern extensions (Power Bar, Song Stats).
- Preserve current features while staging the refactor incrementally.

## Proposed Architecture

### 1. Creator/React Base
- Initialize a Creator project targeting `src/ui` that compiles to a bundle consumed by `extension.ts`.
- Use functional React components with hooks for state management (`useState`, `useEffect`).
- Integrate Creator’s SCSS pipeline for styling while sticking to Spotify design tokens when available.

### 2. Component Breakdown
- `HotkeySettingsModal` – top-level modal rendered via `Spicetify.PopupModal.display`.
- `HotkeyMappingList` – renders existing mappings with edit/delete controls.
- `HotkeyMappingForm` – captures combo input and playlist selection.
- `PlaylistSelector` – searchable, virtualized list leveraging Creator’s component patterns (reference Power Bar’s search UI).
- `HelperStatusBanner` – surfaces focused vs. system-wide mode state (ties into helper UX outline).
- `SettingsFooter` – save/cancel buttons, debug toggles.

### 3. State Management
- Centralize settings state in a `useHotkeySettings` hook backed by `Spicetify.LocalStorage`.
- Use context/provider if needed to avoid prop drilling.
- Trigger re-registration callbacks (focused + helper) via an event emitter or shared controller in `extension.ts`.

### 4. Integration Strategy
- Phase 1: Build read-only modal in React to display existing mappings while still using old form for edits.
- Phase 2: Port creation/editing to React components, gating with a feature flag.
- Phase 3: Remove legacy DOM implementation once parity is reached.

### 5. UI Enhancements
- Auto-focus playlist search input when adding a mapping.
- Keyboard navigation for playlist results (↑ ↓ Enter).
- Inline validation messages (e.g., duplicate combos, empty playlist list).
- Snackbar confirmations for save/delete actions using Creator’s Snackbar helper.

### 6. References
- Power Bar (`https://github.com/CharlieS1103/spicetify-power-bar`): Creator setup, global shortcut integration, modal UX.
- Song Stats (`https://github.com/rxri/spicetify-extensions/tree/master/song-stats`): Context menu usage and modal rendering patterns.
- Spicetify Creator Docs (`https://spicetify.app/docs/development/creator`): React component APIs, plugins (e.g., `spcr-settings`).

## Dependencies & Tooling

- Add Creator dev dependency and scripts: `npm install --save-dev @spicetify/creator`.
- Configure `tsup` to skip bundling the UI code once Creator handles it, or adjust build pipeline accordingly.
- Ensure TypeScript configs align (`tsconfig.json` extensions for JSX/React builds).

## Next Steps

1. Draft migration checklist and create feature branch (`feat/react-settings-ui`).  
2. Create Creator scaffold and bootstrap `HotkeySettingsModal`.  
3. Mirror existing functionality feature-by-feature, running manual regression after each phase.  
4. Update documentation and screenshots once the React UI ships.
