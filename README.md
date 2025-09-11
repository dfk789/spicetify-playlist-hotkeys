# Spicetify Playlist Hotkeys

A Spicetify extension that lets you press hotkeys to add the currently playing track to one or more playlists. Each hotkey can map to any number of playlists.

## Features

- ⌨️ **Configurable Hotkeys**: Map any key combination to playlists
- 🎵 **Multi-Playlist Support**: Add current track to multiple playlists at once  
- 🚫 **Smart Deduplication**: Skip tracks already in target playlists
- ⚙️ **Simple Settings UI**: Easy configuration via in-app modal
- 💾 **Persistent Config**: Settings saved across Spotify restarts
- 🔔 **Toast Notifications**: Success/error feedback

## Installation

### Prerequisites
- [Spicetify](https://spicetify.app/) installed and configured
- Spotify desktop app

### Steps

1. **Download/Build the extension**:
   ```bash
   git clone https://github.com/yourusername/spicetify-playlist-hotkeys.git
   cd spicetify-playlist-hotkeys
   npm install
   npm run build
   ```

2. **Install in Spicetify**:
   ```bash
   # Copy to Extensions folder
   cp dist/hotkey-playlist.js [YourSpicetifyExtensionsFolder]
   
   # OR use spicetify CLI
   spicetify config extensions hotkey-playlist.js
   spicetify apply
   ```

3. **Verify Installation**:
   - Open Spotify
   - Look for "Hotkeys" button in the top bar
   - You should see a "Playlist Hotkeys extension loaded!" notification

## Usage

### Setting Up Hotkeys

1. Click the **"Hotkeys"** button in Spotify's top bar
2. Click **"Add New Mapping"** 
3. Enter a key combination (e.g., `Ctrl+Alt+1`)
4. Select playlists from the dropdown
5. Click **"Save"**

### Using Hotkeys

1. Start playing any track
2. Press your configured hotkey
3. Track will be added to all mapped playlists
4. Success notification will appear

### Hotkey Format

- `Ctrl+Alt+1` - Control + Alt + 1
- `Shift+A` - Shift + A  
- `Ctrl+Space` - Control + Space
- `Alt+Up` - Alt + Up Arrow

## Settings

The settings modal allows you to:

- ✅ Create hotkey → playlist mappings
- ✅ Edit existing mappings  
- ✅ Remove unwanted mappings
- ✅ Add multiple playlists per hotkey
- ⚠️ Toggle Global Hotkeys (Phase 1 - not yet implemented)

## Development

### Building

```bash
# Development (watch mode)
npm run dev

# Production build
npm run build

# Linting (placeholder)
npm run lint
```

### Architecture

```
src/
├── extension.ts     # Main entry point & orchestration
├── hotkeys.ts      # Keyboard event handling & normalization
├── playlists.ts    # Playlist operations & Spotify API calls
└── settings-ui.ts  # Configuration modal interface
```

### API Documentation

This project uses Context7 MCP for up-to-date Spicetify API documentation. See `docs/vendor/spicetify/` for vendored API references.

## Roadmap

### Phase 0: Foundation ✅ COMPLETE
- ✅ In-app hotkeys  
- ✅ Settings UI
- ✅ Multi-playlist support
- ✅ Configuration persistence

### Phase 1: Global Hotkeys 🔄 PLANNED  
- ⏸️ System-wide hotkeys (works when Spotify is in background)
- ⏸️ Cross-platform helper process
- ⏸️ IPC communication with extension

## Troubleshooting

### Extension Not Loading
- Ensure Spicetify is properly installed: `spicetify --help`
- Check extension is in the correct folder: `spicetify path`
- Try reapplying: `spicetify apply`

### Hotkeys Not Working  
- Make sure Spotify window is focused (Phase 0 limitation)
- Check for key combination conflicts with other apps
- Try simpler combinations first (e.g., `Ctrl+1`)

### Settings Not Saving
- Check browser console for errors (DevTools)
- Verify LocalStorage permissions
- Try refreshing Spotify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the coding guidelines in `AGENTS.md`
4. Test your changes manually
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Spicetify](https://spicetify.app/) for the extension framework
- Context7 MCP for providing up-to-date API documentation