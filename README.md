# Spicetify Playlist Hotkeys

Add currently playing tracks to playlists with customizable hotkeys. Press a key combination and instantly save the current song to one or more playlists.

## Features

- ⌨️ **Custom Hotkeys**: Map any key combination to your playlists
- 🎵 **Multiple Playlists**: Add current track to several playlists at once  
- 🚫 **Smart Deduplication**: Automatically skips tracks already in playlists
- 💚 **Auto-Like**: Automatically likes tracks when adding to playlists
- 🔔 **Instant Feedback**: Toast notifications show success/failure

## Installation

### Prerequisites
- [Spicetify](https://spicetify.app/) installed and working
- Spotify desktop app

### Install Steps

1. **Build the extension**:
   ```bash
   git clone <this-repo>
   cd spicetify-playlist-hotkeys
   npm install
   npm run build
   ```

2. **Copy to Spicetify**:
   ```bash
   # Find your extensions folder
   spicetify path
   
   # Copy the built file (rename as needed)
   cp dist/extension.js ~/.config/spicetify/Extensions/playlist-hotkeys.js
   
   # Enable the extension
   spicetify config extensions playlist-hotkeys.js
   spicetify apply
   ```

3. **Verify it works**:
   - Open Spotify
   - Look for **"HK"** button in the bottom playbar (to the right of the add to playlist button)
   - Click it to open settings

## Usage

### Setting Up Hotkeys

1. Click the **"HK"** button in the bottom playbar
2. Click **"Add New Mapping"** 
3. Click in the hotkey field and press your desired key combination
4. Type to search and select playlists
5. Click **"Save Settings"**

### Using Hotkeys

1. Play any track in Spotify
2. Press your configured hotkey combination
3. Track gets added to your selected playlists AND liked automatically
4. Success notification shows which playlists were updated

### Hotkey Examples

- `Ctrl+1`, `Ctrl+2`, etc. - Quick playlist shortcuts
- `Shift+A`, `Shift+B` - Letter-based shortcuts  
- `Alt+F1`, `Alt+F2` - Function key combinations

## Troubleshooting

### Extension Not Loading
- Run `spicetify path` to find your extensions folder
- Make sure the file is named correctly (e.g., `playlist-hotkeys.js`)
- Run `spicetify apply` to reload extensions

### Hotkeys Not Working  
- Make sure Spotify window is focused
- Check for conflicts with other apps using the same keys
- Try simpler key combinations first

### No Playlists Showing
- Make sure you own the playlists (collaborative/followed playlists won't show)
- Try refreshing Spotify if playlists don't load

## License

MIT License