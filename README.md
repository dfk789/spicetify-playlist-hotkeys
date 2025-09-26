# Spicetify Playlist Hotkeys

Add currently playing tracks to playlists with customizable hotkeys. Press a key combination and instantly save the current song to one or more playlists.

## Features

- Custom hotkeys: map any key combo to playlists
- Multiple playlists: add to several at once
- Auto-like: likes tracks when adding to playlists
- Global hotkeys: works in background via local helper script (must be run separately)
- Feedback: toast notifications

## Installation

### Prerequisites
- [Spicetify](https://spicetify.app/) installed and working
- [Spotify desktop app](https://www.spotify.com/download/)

### Install Steps

1. Build the extension:
   ```bash
   git clone <this-repo>
   cd spicetify-playlist-hotkeys
   npm install
   npm run build
   ```

2. Copy to Spicetify:
   ```bash
   # Find your extensions folder
   spicetify path
   
   # Copy the built file
   cp dist/playlist-hotkeys.js ~/.config/spicetify/Extensions/playlist-hotkeys.js
   
   # Enable the extension
   spicetify config extensions playlist-hotkeys.js
   spicetify apply
   ```

3. Verify it works:
   - Open Spotify
   - Look for the "HK" button in the bottom playbar
   - Click it to open settings

## Usage

### Setting Up Hotkeys

1. Click the "HK" button in the bottom playbar
2. Click "Add New Mapping"
3. Click in the hotkey field and press your desired key combination
4. Type to search and select playlists
5. Click "Save Settings"

### Using Hotkeys

1. Play any track in Spotify
2. Press your configured hotkey combination
3. Track is added to your selected playlists and liked automatically
4. A toast shows which playlists were updated

### Hotkey Examples

- Ctrl+1, Ctrl+2 – quick playlist shortcuts
- Shift+A, Shift+B – letter-based shortcuts
- Alt+F1, Alt+F2 – function key combos

## Global Hotkeys (Helper)

Global hotkeys use a small local helper that the extension talks to over HTTP/SSE with a token.

### Python Helper (recommended)
```bash
cd helper
python3 helper.py   # macOS/Linux
# or
py -3 helper.py     # Windows
```

Notes:
- The helper listens on http://127.0.0.1:17976.
- Requires Python package `keyboard` (install with `pip install keyboard`).
- Start Spotify first or the helper first — the extension auto-retries and connects.

### Node helper
There is a Node/JS variant in `helper/`, but it is not reliable yet and is currently deferred. Use the Python helper.

### Configure in the extension
- Open settings (HK button) and enable "Global hotkeys".

## Platform Notes
- macOS: grant Accessibility permission to your terminal/python process on first run. (Not tested)
- Windows: Defender may prompt the first time; the helper listens on localhost only.
- Linux: works on X11; Wayland support may vary by compositor. (Not tested)

## Troubleshooting

### Extension not loading
- Run `spicetify path` to find your extensions folder
- Ensure the file name matches your config (e.g., `playlist-hotkeys.js`)
- Run `spicetify apply` to reload extensions

### Hotkeys not working (in-app)
- Ensure Spotify window is focused
- Check for conflicts with other apps using the same keys
- Try simpler key combinations first

### Global hotkeys not working
- Verify the helper: open http://127.0.0.1:17976/hello (should return JSON with `ok` and a token)
- In settings, ensure "Global hotkeys" is enabled; the status line indicates detection/ready
- On macOS, grant Accessibility permissions if prompted
- Restart the helper; the extension reconnects automatically

## License

MIT License
