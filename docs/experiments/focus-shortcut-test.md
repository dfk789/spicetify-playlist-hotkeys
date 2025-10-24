# Focus-Mode Shortcut Prototype

Last updated: 2025-10-24

## Goal

Verify how `Spicetify.Keyboard.registerShortcut` behaves when the Spotify desktop app is focused versus unfocused on each target platform. This confirms that focused-mode hotkeys remain scoped to the Spotify window and documents any deviations.

## Test Harness

Add the following minimal snippet to a disposable extension (or wrap it in a temporary module inside this project). The code relies solely on the built-in Spicetify keyboard API.

```ts
async function registerFocusShortcut() {
  await Spicetify.Platform?.WaitForInitialized?.();

  const combo = "ctrl+shift+9";
  const notify = () =>
    Spicetify.showNotification(
      `Focus shortcut fired at ${new Date().toLocaleTimeString()}`
    );

  const unregister = Spicetify.Keyboard.registerShortcut(combo, notify);

  Spicetify.showNotification(`Registered ${combo} via Spicetify.Keyboard`);

  // Optional: return an unregister helper for cleanup in dev
  return () => {
    unregister();
    Spicetify.showNotification(`Unregistered ${combo}`);
  };
}

registerFocusShortcut().catch((err) => {
  console.error("Focus-mode shortcut failed", err);
  Spicetify.showNotification("Focus shortcut registration failed");
});
```

## Manual Steps

1. Load the snippet (e.g., via `dist/playlist-hotkeys.js` in dev mode or a standalone Creator project).  
2. Ensure Spotify desktop is in the foreground; press `Ctrl+Shift+9` and confirm the notification appears.  
3. Switch focus to another application (Chrome, terminal) and press the same combo.  
4. Observe whether the notification triggers while Spotify is unfocused.  
5. Record results for Windows, macOS, and Linux, including any caveats (e.g., modifier differences on macOS).

## Expected Outcome

Based on Spicetify documentation (Oct 2025), `Spicetify.Keyboard` wraps Mousetrap and only handles events when Spotify is the active window. The notification is therefore expected **not** to appear while Spotify is unfocused. Document any discrepancies if observed.

## Next Actions

- Capture platform-specific notes in `docs/improvement-plan.md` once testing is performed.  
- Update helper UX plans if a platform unexpectedly supports background capture without the helper.
