# Keyboard Test Results

**Date**: 2025-10-24
**Tester**: [To be filled]
**Platform**: Windows / macOS / Linux
**Spotify Version**: [Check Help > About Spotify]
**Spicetify Version**: [Run `spicetify -v`]

---

## Test 1: Spotify Focused

**Action**: With Spotify as the active window, pressed `Ctrl+Shift+9`

- Result: ⬜ Notification appeared / ⬜ No notification
- Notification Content: [e.g., "🧪 Keyboard Test #1"]
- Trigger Count: #___
- Console Logs:
  ```
  [Paste console output here]
  ```

**Status**: ⬜ Pass / ⬜ Fail

---

## Test 2: Spotify Unfocused (CRITICAL TEST)

**Action**: Switched to another application, then pressed `Ctrl+Shift+9`

- Active Application: [e.g., Chrome, Terminal, VS Code]
- Spotify State: ⬜ Visible but not focused / ⬜ Minimized / ⬜ Hidden
- Pressed: `Ctrl+Shift+9`
- Result: ⬜ No notification (expected) / ⬜ Notification appeared (unexpected!)
- Console Logs:
  ```
  [Paste console output - check for focus/blur events]
  ```

**Status**: ⬜ Pass (no notification) / ⬜ Fail (notification appeared)

---

## Test 3: Re-Focused

**Action**: Switched back to Spotify, then pressed `Ctrl+Shift+9`

- Result: ⬜ Notification appeared / ⬜ No notification
- Trigger Count: #___
- Console Logs:
  ```
  [Paste console output]
  ```

**Status**: ⬜ Pass / ⬜ Fail

---

## Additional Tests (Optional)

### Test 4: Rapid Switching
- Rapidly switched focus between Spotify and another app while pressing `Ctrl+Shift+9`
- Observations: [Describe behavior]

### Test 5: Spotify Minimized
- Minimized Spotify to system tray/taskbar
- Pressed `Ctrl+Shift+9`
- Result: ⬜ No notification / ⬜ Notification appeared

---

## Console Command Tests

### KeyboardTestStatus()
```javascript
[Paste output from calling KeyboardTestStatus() in console]
```

### Focus Event Logs
```javascript
[Paste any focus/blur event logs from console]
```

---

## Summary

### Expected Behavior Observed?
⬜ Yes - Spicetify.Keyboard is focus-only as expected
⬜ No - Unexpected OS-level capture detected

### Key Findings
- [Finding 1]
- [Finding 2]
- [Finding 3]

### Issues Encountered
- [Issue 1]
- [Issue 2]

### Screenshots (if applicable)
[Attach or describe screenshots showing notifications/behavior]

---

## Conclusion

✅ **PASS**: Behavior matches expectation (focus-only)
- Notifications only appeared when Spotify was focused
- No notifications when Spotify was unfocused
- Helper is required for OS-level global hotkeys
- Proceed with Phase 1 refactor as planned

❌ **FAIL**: Unexpected behavior observed
- [Describe unexpected behavior]
- [Impact on implementation plan]
- [Recommended next steps]

---

## Notes

[Any additional observations, platform-specific quirks, or recommendations]

---

## Next Steps

Based on test results:

1. ⬜ Update `docs/improvement-plan.md` Section 8 (Research Tracker) with findings
2. ⬜ Update `docs/CHANGELOG.md` to mark Phase 0 keyboard test as complete
3. ⬜ If PASS: Proceed to Phase 1 (Hotkey Handling Simplification)
4. ⬜ If FAIL: Revise implementation strategy and document alternative approach
5. ⬜ Clean up test extension: `spicetify config extensions keyboard-test.js-`
