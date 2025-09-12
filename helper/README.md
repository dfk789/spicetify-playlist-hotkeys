# Global Hotkey Helper (Python)

Python companion script for the Spicetify Playlist Hotkeys extension. It enables global hotkeys while Spotify is in the background by capturing key combinations and sending them to the extension over HTTP + SSE.

Note on JS helper: A JavaScript/Node variant exists in this folder but is not reliable yet and is not supported. Please use the Python helper.

## Requirements

- Python 3.8+
- Python package: `keyboard` (install with `pip install keyboard`)
- Accessibility/keyboard permissions (macOS), or administrator/elevated permissions where required.

## Usage

Start the Python helper before or after Spotify — the extension auto-retries and connects when available.

```bash
# Windows
py -3 helper.py
# or
python helper.py

# macOS / Linux
python3 helper.py
```

In Spotify:
- Open the extension’s settings (HK button in the playbar).
- Enable “Global hotkeys”.
- Status will update when the helper is connected and ready. No file picker is needed.

## Behavior

- Listens on `http://127.0.0.1:17976`.
- The extension fetches `GET /hello` to obtain a random token.
- EventSource connects to `GET /events?token=...` (SSE) and receives:
  - `{"ready": true}` once on connect.
  - `{"combo": "CTRL+ALT+1"}` when hotkeys fire.
- The extension POSTs `{"combos": [ ... ]}` to `POST /config` to update which hotkeys to capture.
- Hotkeys are sent once per press (no repeat while held).

## API (for reference)

- `GET /hello` → `{ ok: true, token: string }`
- `GET /events?token=...` → SSE stream; sends `ready` once, then combo events.
- `POST /config` with `{ combos: string[] }` and header `Authorization: Bearer <token>`.
- `POST /trigger` with `{ combo: string }` (testing only; must match a registered combo).

## Platform Notes

- macOS: grant Accessibility permission to your terminal/python process.
- Windows: the helper listens on localhost only; Defender may prompt the first time.
- Linux: works on X11; Wayland support varies by compositor.

## Troubleshooting

- Not connecting: ensure the helper is running and port 17976 is free.
- Reconnect on restart: the extension auto-retries and refreshes the token after helper restarts.
- No hotkeys captured: install `keyboard` and grant required permissions.

