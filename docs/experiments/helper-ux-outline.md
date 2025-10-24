# Helper UX Improvement Outline

Last updated: 2025-10-24

## Objectives

- Make the helper requirement (for OS-wide hotkeys) explicit and easy to diagnose.
- Provide real-time status indicators in the settings UI and debug logs.
- Reduce user confusion around why shortcuts stop working when the helper is offline.

## Proposed Enhancements

### 1. Connection Diagnostics
- Poll `http://127.0.0.1:17976/hello` with a short timeout; show “Connected” plus helper version/token snippet when available.
- Surface specific error states: `ECONNREFUSED`, timeout, unexpected payload, token mismatch.
- Offer a “Retry” button that re-triggers the connection attempt without reloading the modal.

### 2. Status Messaging
- Settings UI header copy:  
  - “Spotify Focused Mode: Works while Spotify is the active window.”  
  - “System-wide Mode: Requires helper; listens everywhere.”
- Badge indicator in the hotkey list (e.g., `Focus only`, `System-wide`) driven by the helper status.
- Add `Spicetify.showNotification` toast when helper connection drops or reconnects while Spotify is running.

### 3. Onboarding Guidance
- Inline helper setup steps (Python prerequisites, command to run, expected console output).
- Link to troubleshooting doc for firewall/accessibility permissions per OS.
- Optionally offer a “Copy start command” button for convenience.

### 4. Debug Tools
- Toggle to output helper request/response details to the console (only when debug mode active).
- Include helper status in `PlaylistHotkeysDebugState()` output.
- Log the last successful helper heartbeat timestamp.

### 5. Settings Persistence
- Remember whether the user last enabled system-wide mode; auto-disable (with explanation) if helper becomes unreachable for N retries.
- Prompt the user to re-enable once the helper resumes, so they know why the mode toggled off.

## Implementation Notes

- Consolidate helper polling/retry logic into a dedicated module (`helperConnection.ts`) consumed by `extension.ts`.
- Use exponential backoff capped at ~10 seconds to avoid spamming logs when helper is offline.
- Ensure helper API changes remain backward compatible (e.g., support existing Python script responses).

## Next Steps

1. Draft helper connection state machine (Ready, Connecting, Error, Reconnecting).  
2. Update settings UI wireframes to include the messaging and badges.  
3. Align README with new onboarding guidance and add troubleshooting appendix.
