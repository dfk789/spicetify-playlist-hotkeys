#!/usr/bin/env python3
"""
Global Hotkey Helper for Spicetify Playlist Hotkeys (Python)
Captures global key combinations and relays them to the extension via SSE
"""

import json
import secrets
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import socketserver
import sys

try:
    import keyboard  # pip install keyboard
    KEYBOARD_AVAILABLE = True
except ImportError:
    KEYBOARD_AVAILABLE = False
    print("Warning: 'keyboard' module not found. Install with: pip install keyboard")

PORT = 17976
TOKEN = secrets.token_hex(16)
combos = set()
clients = []
running = True


class HotkeyHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress default HTTP log messages
        pass

    def do_OPTIONS(self):
        # Properly respond to CORS preflight with a status line first
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # Health check endpoint
        if path == '/hello':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            response = json.dumps({"ok": True, "token": TOKEN})
            self.wfile.write(response.encode())
            return

        # Check auth for protected endpoints
        if not self.check_auth():
            return

        # Server-Sent Events endpoint
        if path == '/events':
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.send_cors_headers()
            self.end_headers()

            # Send ready signal
            ready_msg = f"data: {json.dumps({'ready': True})}\n\n"
            self.wfile.write(ready_msg.encode())
            self.wfile.flush()

            # Add client to list
            clients.append(self.wfile)
            print(f"SSE: client connected (total {len(clients)})")

            # Keep connection alive
            try:
                while running:
                    time.sleep(5)
                    # Keepalive as SSE comment line
                    keepalive_msg = ": keepalive\n\n"
                    self.wfile.write(keepalive_msg.encode())
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, OSError) as e:
                print(f"SSE: connection lost: {e}")
            finally:
                if self.wfile in clients:
                    clients.remove(self.wfile)
                    print(f"SSE: client disconnected (total {len(clients)})")
            return

        # 404 for unknown paths
        self.send_error(404)

    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # Check auth for protected endpoints
        if path != '/hello' and not self.check_auth():
            return

        # Get request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body.decode()) if body else {}
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        # Config endpoint - update watched combos
        if path == '/config':
            combo_list = data.get('combos', [])
            if isinstance(combo_list, list):
                global combos
                combos = set(combo.strip().upper() for combo in combo_list)
                print(f"Combos updated: {', '.join(combos)}")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_cors_headers()
                self.end_headers()
                response = json.dumps({"ok": True, "count": len(combos)})
                self.wfile.write(response.encode())
            else:
                self.send_error(400, "Invalid combos format")
            return

        # Manual trigger endpoint for testing
        if path == '/trigger':
            combo = data.get('combo', '').strip().upper()
            if combo in combos:
                broadcast_combo(combo)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_cors_headers()
                self.end_headers()
                response = json.dumps({"ok": True})
                self.wfile.write(response.encode())
            else:
                self.send_error(400, "Combo not registered")
            return

        # 404 for unknown paths
        self.send_error(404)

    def check_auth(self):
        """Authorize via header or token query param for SSE."""
        auth_header = self.headers.get('Authorization', '')
        if auth_header == f'Bearer {TOKEN}':
            return True

        # Allow token via query for GET /events (EventSource cannot set headers)
        try:
            parsed = urlparse(self.path)
            qs = parse_qs(parsed.query or '')
            token_param = (qs.get('token') or [None])[0]
            if token_param == TOKEN and parsed.path == '/events':
                return True
        except Exception:
            pass

        self.send_response(401)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        response = json.dumps({"error": "unauthorized"})
        self.wfile.write(response.encode())
        return False


def broadcast_combo(combo):
    """Broadcast hotkey event to all connected clients"""
    msg = f"data: {json.dumps({'combo': combo})}\n\n"
    msg_bytes = msg.encode()
    print(f"Broadcast: {combo}")

    # Remove dead clients
    dead_clients = []
    for client in clients[:]:  # Copy list to avoid modification during iteration
        try:
            client.write(msg_bytes)
            client.flush()
        except (BrokenPipeError, ConnectionResetError, OSError):
            dead_clients.append(client)

    # Remove dead clients
    for dead in dead_clients:
        if dead in clients:
            clients.remove(dead)

    print(f"Broadcast done: {combo} (to {len(clients)} clients)")


def setup_keyboard_hooks():
    """Set up global keyboard hooks using the keyboard library"""
    if not KEYBOARD_AVAILABLE:
        print("Keyboard module not available. Install with: pip install keyboard")
        return

    print("Keyboard: setting up global hooks")

    # We'll register hotkeys dynamically as combos are updated
    # Structure: combo -> { id, release_ids: [..], active: bool, parts: [..] }
    registered_hotkeys = {}
    last_combos = set()

    def convert_combo_to_keyboard_format(combo):
        """Convert extension format (CTRL+ALT+1) to keyboard library format (ctrl+alt+1) and parts list"""
        parts = combo.upper().split('+')
        converted = []
        for part in parts:
            if part == 'CTRL':
                converted.append('ctrl')
            elif part == 'ALT':
                converted.append('alt')
            elif part == 'SHIFT':
                converted.append('shift')
            elif part == 'META':
                # 'cmd' on macOS; 'windows' on Windows. Keep 'cmd' but release on main key will still clear.
                converted.append('cmd')
            else:
                converted.append(part.lower())
        return '+'.join(converted), converted

    def mark_inactive(c):
        entry = registered_hotkeys.get(c)
        if entry:
            entry['active'] = False

    def update_hotkeys():
        nonlocal registered_hotkeys, last_combos
        if combos == last_combos:
            return

        print(f"Keyboard: updating hotkeys -> {list(combos)}")

        # Unregister old hotkeys and release hooks
        for combo, entry in list(registered_hotkeys.items()):
            try:
                keyboard.remove_hotkey(entry['id'])
            except Exception as e:
                print(f"Keyboard: error unregistering {combo}: {e}")
            for rid in entry.get('release_ids', []):
                try:
                    keyboard.unhook(rid)
                except Exception:
                    pass
        registered_hotkeys.clear()

        # Register new hotkeys with de-repeat (edge-trigger while held)
        for combo in combos:
            try:
                kb_combo, parts = convert_combo_to_keyboard_format(combo)
                print(f"Keyboard: mapping {combo} -> {kb_combo}")

                def make_callback(c):
                    def cb():
                        entry = registered_hotkeys.get(c)
                        if entry and entry.get('active'):
                            return  # already fired; wait for release
                        if entry is not None:
                            entry['active'] = True
                        broadcast_combo(c)
                    return cb

                hotkey_id = keyboard.add_hotkey(kb_combo, make_callback(combo))

                # Create release hooks for each unique part to reset active flag
                release_ids = []
                unique_parts = set(parts)
                for p in unique_parts:
                    try:
                        rid = keyboard.on_release_key(p, lambda e, c=combo: mark_inactive(c))
                        release_ids.append(rid)
                    except Exception:
                        # Some parts (e.g., 'cmd' on non-mac) may not register; it's fine.
                        pass

                registered_hotkeys[combo] = {
                    'id': hotkey_id,
                    'release_ids': release_ids,
                    'active': False,
                    'parts': parts,
                }
                print(f"Keyboard: registered {combo} ({kb_combo})")
            except Exception as e:
                print(f"Keyboard: could not register {combo}: {e}")

        last_combos = combos.copy()
        print(f"Keyboard: active hotkeys = {len(registered_hotkeys)}")

    # Update hotkeys every 1 second (to pick up new combos from extension)
    def hotkey_updater():
        while running:
            if combos:
                update_hotkeys()
            time.sleep(1)

    if KEYBOARD_AVAILABLE:
        threading.Thread(target=hotkey_updater, daemon=True).start()
        print("Keyboard: hook thread started")


def main():
    global running

    print("Global Hotkey Helper for Spicetify (Python)")
    print(f"Token: {TOKEN}")
    print(f"Listening: http://127.0.0.1:{PORT}")

    # Set up keyboard hooks if available
    setup_keyboard_hooks()

    # Create HTTP server
    class ThreadedHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
        daemon_threads = True
        allow_reuse_address = True

        def handle_error(self, request, client_address):
            ex = sys.exc_info()[1]
            if isinstance(ex, (ConnectionAbortedError, ConnectionResetError, BrokenPipeError, OSError)):
                # Swallow common disconnect noise with a concise log
                print(f"HTTP: client error {client_address}: {ex}")
                return
            # Delegate other errors to base handler
            super().handle_error(request, client_address)

    server = ThreadedHTTPServer(('127.0.0.1', PORT), HotkeyHandler)

    print(f"Server ready: connect via http://127.0.0.1:{PORT}")

    if not KEYBOARD_AVAILABLE:
        print("Tip: Install keyboard support with: pip install keyboard")
        print("Tip: Test via POST /trigger {\"combo\": \"CTRL+ALT+1\"}")

    print("Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        running = False
        server.shutdown()
        server.server_close()
        print("Server stopped")


if __name__ == '__main__':
    main()
