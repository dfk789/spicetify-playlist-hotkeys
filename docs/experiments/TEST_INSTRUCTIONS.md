# Spicetify.Keyboard Focus Test - Instructions

## Purpose

Verify that `Spicetify.Keyboard.registerShortcut()` only triggers when Spotify is focused, confirming the API's focus-only behavior before we refactor the hotkey system.

## Expected Behavior

✅ **When Spotify is focused**: `Ctrl+Shift+9` should show a notification
❌ **When Spotify is unfocused**: `Ctrl+Shift+9` should do nothing

This confirms that `Spicetify.Keyboard` (Mousetrap wrapper) is focus-scoped and we need the helper for OS-level global hotkeys.

---

## Setup Instructions

### 1. Build the Test Extension

```bash
npm run build:test
```

This creates `dist/keyboard-test.js`.

### 2. Find Your Spicetify Extensions Folder

```bash
spicetify path
```

Look for the "Extensions" path in the output.

**Common locations**:
- Windows: `%APPDATA%\spicetify\Extensions`
- macOS: `~/.config/spicetify/Extensions` or `~/spicetify_data/Extensions`
- Linux: `~/.config/spicetify/Extensions`

### 3. Copy Test Extension

**Windows (PowerShell)**:
```powershell
$extPath = spicetify path | Select-String "Extensions" | ForEach-Object { $_.Line.Split(":")[1].Trim() }
Copy-Item dist\keyboard-test.js "$extPath\keyboard-test.js"
```

**macOS/Linux**:
```bash
EXT_PATH=$(spicetify path | grep Extensions | cut -d: -f2- | xargs)
cp dist/keyboard-test.js "$EXT_PATH/keyboard-test.js"
```

### 4. Enable Test Extension

```bash
spicetify config extensions keyboard-test.js
spicetify apply
```

### 5. Restart Spotify

Close and reopen Spotify completely.

---

## Testing Procedure

### Step 1: Initial Test (Spotify Focused)

1. Open Spotify (ensure it's the active window)
2. You should see a notification: **"🧪 Keyboard Test Active"** with instructions
3. Press `Ctrl+Shift+9`
4. **Expected**: Notification appears showing "🧪 Keyboard Test #1"

✅ **If notification appears**: Focus mode is working

### Step 2: Unfocused Test (Critical!)

1. Switch to another application (browser, terminal, file explorer, etc.)
2. **Ensure Spotify is NOT the active window** (can be visible but not focused)
3. Press `Ctrl+Shift+9`
4. **Expected**: Nothing should happen (no notification)

✅ **If no notification**: Confirms focus-only behavior
❌ **If notification appears**: Spicetify.Keyboard has OS-level capture (unexpected!)

### Step 3: Re-Focus Test

1. Switch back to Spotify (click on the window)
2. Press `Ctrl+Shift+9` again
3. **Expected**: Notification appears showing "🧪 Keyboard Test #2" or higher

✅ **If notification appears**: Confirms focus detection is working

---

## Console Commands

Open Spotify DevTools (Ctrl+Shift+I or Cmd+Opt+I) for additional debugging:

```javascript
// Check test status
KeyboardTestStatus()

// Clean up (unregister test shortcut)
KeyboardTestCleanup()
```

**Console logs show**:
- Trigger count
- Focus state (`document.hasFocus()`)
- Event details (keys, modifiers, repeat)
- Focus/blur events

---

## Recording Results

### Test Results Template

Copy this template to `docs/experiments/keyboard-test-results.md`:

```markdown
# Keyboard Test Results

**Date**: 2025-10-24
**Tester**: [Your Name]
**Platform**: Windows 11 / macOS 14 / Linux (Ubuntu 22.04)
**Spotify Version**: [Check Help > About Spotify]
**Spicetify Version**: [Run `spicetify -v`]

## Test 1: Spotify Focused
- Pressed: Ctrl+Shift+9
- Result: ✅ Notification appeared / ❌ No notification
- Trigger Count: #1

## Test 2: Spotify Unfocused
- Active App: [Browser/Terminal/etc]
- Spotify State: Visible but not focused / Minimized / Hidden
- Pressed: Ctrl+Shift+9
- Result: ✅ No notification (expected) / ❌ Notification appeared (unexpected!)

## Test 3: Re-Focused
- Pressed: Ctrl+Shift+9
- Result: ✅ Notification appeared / ❌ No notification
- Trigger Count: #2

## Console Logs
[Paste any relevant console.log output]

## Conclusion
- ✅ Behavior matches expectation (focus-only)
- ❌ Unexpected behavior observed
- Notes: [Any additional observations]
```

---

## Troubleshooting

### Test extension not loading
```bash
# Check if extension is in config
spicetify config | grep keyboard-test

# If not listed, add it again
spicetify config extensions keyboard-test.js
spicetify apply
```

### No notifications appearing at all
1. Check DevTools console for errors
2. Verify Spicetify is working: Run `spicetify -v`
3. Try `spicetify restore` then `spicetify apply` to reset

### Keyboard shortcut conflicts
If `Ctrl+Shift+9` is used by another app:
1. Edit `src/keyboard-test.ts`
2. Change `const TEST_COMBO = "ctrl+shift+9"` to another combo
3. Rebuild: `npm run build:test`
4. Copy file again and restart Spotify

---

## Cleanup (After Testing)

### Remove Test Extension

```bash
spicetify config extensions keyboard-test.js-
spicetify apply
```

Or use the console command:
```javascript
KeyboardTestCleanup()
```

Then remove from extensions folder:

**Windows**:
```powershell
Remove-Item "$extPath\keyboard-test.js"
```

**macOS/Linux**:
```bash
rm "$EXT_PATH/keyboard-test.js"
```

---

## Next Steps

After documenting results:

1. Update `docs/experiments/focus-shortcut-test.md` with findings
2. Update `docs/improvement-plan.md` Section 8 (Research Tracker)
3. If focus-only confirmed: Proceed with Phase 1 refactor
4. If OS-level capture detected: Revise strategy (unlikely but document if occurs)

---

## Platform-Specific Notes

### Windows
- Test with both PowerShell and VS Code focused
- Check if Windows shortcuts conflict (Win+X, etc.)

### macOS
- May need Accessibility permissions for Spotify
- Test with Mission Control shortcuts (Ctrl+Up/Down)
- Cmd is mapped to Ctrl in Spicetify

### Linux
- Behavior may vary by desktop environment (GNOME, KDE, i3)
- X11 vs Wayland differences possible
- Check compositor keybindings

---

## Expected Outcome

Based on research (Oct 2024), we expect:
- ✅ Spicetify.Keyboard is focus-only (Mousetrap wrapper)
- ✅ Helper is required for OS-level global hotkeys
- ✅ This test confirms our refactor strategy is sound

If results differ, we'll need to revise the implementation plan accordingly.
