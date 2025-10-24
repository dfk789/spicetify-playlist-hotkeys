# Quick Test Guide - Spicetify.Keyboard Verification

> **Status**: Test extension built and ready ✅
> **Time Required**: ~5 minutes
> **Platform**: Windows (you're here)

---

## 🚀 Quick Start (Windows)

### Step 1: Find Your Extensions Folder

```powershell
# Run this in PowerShell
spicetify path
```

Look for the line that says `Extensions: [path]`

**Common location**: `%APPDATA%\spicetify\Extensions`

### Step 2: Copy the Test Extension

```powershell
# Option A: If you know the path
Copy-Item dist\keyboard-test.js "$env:APPDATA\spicetify\Extensions\keyboard-test.js"

# Option B: Auto-detect path (PowerShell)
$extPath = (spicetify path | Select-String "Extensions").Line.Split(":")[1].Trim()
Copy-Item dist\keyboard-test.js "$extPath\keyboard-test.js"
```

### Step 3: Enable the Test

```bash
spicetify config extensions keyboard-test.js
spicetify apply
```

Wait for Spotify to restart...

### Step 4: Run the Test

When Spotify opens:

1. **You should see**: 🧪 notification with test instructions (8 seconds)
2. **Press** `Ctrl+Shift+9` → Should show "🧪 Keyboard Test #1"
3. **Switch** to Chrome/VS Code/Terminal (any other app)
4. **Press** `Ctrl+Shift+9` again → Should do NOTHING ✅
5. **Switch back** to Spotify
6. **Press** `Ctrl+Shift+9` → Should show "🧪 Keyboard Test #2"

### Step 5: Check Console (Optional)

Press `Ctrl+Shift+I` in Spotify to open DevTools:

```javascript
// Check status
KeyboardTestStatus()

// View logs
// Look for [KeyboardTest] entries showing focus state
```

### Step 6: Document Results

Open `docs/experiments/keyboard-test-results.md` and fill in:
- ✅ or ❌ for each test
- What you observed
- Any issues

### Step 7: Clean Up

```bash
# Remove test extension
spicetify config extensions keyboard-test.js-
spicetify apply
```

---

## ✅ Expected Results

| Test | Expected Behavior |
|------|-------------------|
| Spotify focused | ✅ Notification appears |
| Spotify unfocused | ✅ Nothing happens |
| Re-focused | ✅ Notification appears |

If all ✅ → **Confirms focus-only behavior** → Proceed with Phase 1 refactor

---

## ❌ Troubleshooting

**Test extension not loading?**
```bash
# Check if it's configured
spicetify config | findstr keyboard-test

# If not there, re-enable
spicetify config extensions keyboard-test.js
spicetify apply
```

**No notifications at all?**
1. Make sure Spotify fully restarted
2. Check DevTools console for errors (`Ctrl+Shift+I`)
3. Look for `[KeyboardTest] Extension loaded successfully`

**Ctrl+Shift+9 used by another app?**
- Windows snipping tool uses `Win+Shift+S`
- If conflict, edit `src/keyboard-test.ts` line 8 and change combo

---

## 📝 Report Back

After testing, let me know:
1. Did Test 2 (unfocused) work correctly? (no notification = correct)
2. Any unexpected behavior?
3. Ready to proceed with Phase 1 implementation?

---

## Next Steps After Testing

**If test passes** (focus-only confirmed):
- Update `improvement-plan.md` with findings
- Proceed to Phase 1: Hotkey Handling Simplification
- Start implementing `Spicetify.Keyboard.registerShortcut`

**If test fails** (OS-level capture detected):
- Document unexpected behavior
- Revise implementation strategy
- May not need helper for Windows (unlikely but possible)
