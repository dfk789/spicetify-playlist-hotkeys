/**
 * Spicetify.Keyboard Focus Test
 *
 * Purpose: Verify that Spicetify.Keyboard.registerShortcut only fires when
 * Spotify is focused, confirming focus-only behavior before refactoring.
 *
 * Test Plan:
 * 1. Load this extension in Spotify
 * 2. With Spotify focused: Press Ctrl+Shift+9 → notification should appear
 * 3. Switch to another app (browser, terminal, etc.)
 * 4. With Spotify unfocused: Press Ctrl+Shift+9 → notification should NOT appear
 * 5. Switch back to Spotify and test again → should work
 *
 * Expected Result: Notifications only appear when Spotify has focus
 *
 * To test:
 * 1. Build: npm run build:test
 * 2. Copy: cp dist/keyboard-test.js ~/.config/spicetify/Extensions/
 * 3. Enable: spicetify config extensions keyboard-test.js
 * 4. Apply: spicetify apply
 */

(async () => {
  // Wait for Spicetify to be ready
  while (!Spicetify?.showNotification || !Spicetify?.Keyboard) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const TEST_COMBO = "ctrl+shift+9";
  let triggerCount = 0;
  const startTime = Date.now();

  const handleShortcut = (event: KeyboardEvent) => {
    triggerCount++;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    const message = `🧪 Keyboard Test #${triggerCount}\nCombo: ${TEST_COMBO}\nTime: ${elapsed}s\nFocused: ${document.hasFocus()}`;

    Spicetify.showNotification(message, false, 3000);

    console.log('[KeyboardTest]', {
      trigger: triggerCount,
      combo: TEST_COMBO,
      elapsed: `${elapsed}s`,
      documentHasFocus: document.hasFocus(),
      event: {
        type: event.type,
        key: event.key,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        repeat: event.repeat,
      }
    });
  };

  // Register the test shortcut
  try {
    Spicetify.Keyboard.registerShortcut(TEST_COMBO, handleShortcut);

    const initMessage = `🧪 Keyboard Test Active\n\nTest combo: ${TEST_COMBO}\n\n` +
      `Instructions:\n` +
      `1. Press ${TEST_COMBO} now (should work)\n` +
      `2. Switch to another app\n` +
      `3. Press ${TEST_COMBO} again (should NOT work)\n` +
      `4. Switch back and test again\n\n` +
      `Check console for detailed logs`;

    Spicetify.showNotification(initMessage, false, 8000);

    console.log('[KeyboardTest] Extension loaded successfully');
    console.log('[KeyboardTest] Test combo registered:', TEST_COMBO);
    console.log('[KeyboardTest] Expected behavior: Only triggers when Spotify is focused');
    console.log('[KeyboardTest] Current focus state:', document.hasFocus());

    // Log focus changes for debugging
    window.addEventListener('focus', () => {
      console.log('[KeyboardTest] Window gained focus');
    });

    window.addEventListener('blur', () => {
      console.log('[KeyboardTest] Window lost focus');
    });

    // Expose unregister function for manual cleanup if needed
    (window as any).KeyboardTestCleanup = () => {
      try {
        Spicetify.Keyboard._deregisterShortcut(TEST_COMBO);
        Spicetify.showNotification('🧪 Test extension cleaned up', false, 2000);
        console.log('[KeyboardTest] Unregistered shortcut:', TEST_COMBO);
      } catch (error) {
        console.error('[KeyboardTest] Cleanup error:', error);
      }
    };

    // Expose status function
    (window as any).KeyboardTestStatus = () => {
      const status = {
        combo: TEST_COMBO,
        triggerCount,
        focused: document.hasFocus(),
        elapsed: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      };
      console.log('[KeyboardTest] Status:', status);
      Spicetify.showNotification(
        `Test Status:\nTriggers: ${triggerCount}\nFocused: ${status.focused}`,
        false,
        3000
      );
      return status;
    };

    console.log('[KeyboardTest] Console commands available:');
    console.log('  - KeyboardTestStatus() - Show current test status');
    console.log('  - KeyboardTestCleanup() - Unregister test shortcut');

  } catch (error) {
    console.error('[KeyboardTest] Registration failed:', error);
    Spicetify.showNotification('🧪 Test registration failed - check console', true);
  }
})();
