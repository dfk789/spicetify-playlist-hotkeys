/**
 * Combo Normalization Utilities
 *
 * Shared utilities for normalizing keyboard combo strings.
 * Used by both HotkeyManager (focused mode) and HelperConnection (global mode).
 *
 * Normalization ensures consistent combo format:
 * - Modifiers in order: Ctrl, Alt, Shift
 * - Keys uppercase
 * - Plus-separated: "Ctrl+Alt+A"
 */

/**
 * Normalize a keyboard combo string to canonical format
 *
 * @example
 * normalizeCombo("ctrl+a") → "Ctrl+A"
 * normalizeCombo("shift+ctrl+z") → "Ctrl+Shift+Z"
 * normalizeCombo("cmd+option+1") → "Ctrl+Alt+1"
 */
export function normalizeCombo(combo: string): string {
  return combo
    .split('+')
    .map(part => part.trim())
    .map(part => normalizeModifier(part))
    .sort((a, b) => {
      const order = ['Ctrl', 'Alt', 'Shift'];
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    })
    .join('+');
}

/**
 * Normalize a modifier key name
 *
 * Maps various modifier aliases to canonical names:
 * - ctrl, control, cmd, command → Ctrl
 * - alt, option → Alt
 * - shift → Shift
 */
export function normalizeModifier(modifier: string): string {
  const normalized = modifier.toLowerCase();

  switch (normalized) {
    case 'ctrl':
    case 'control':
    case 'cmd':
    case 'command':
      return 'Ctrl';
    case 'alt':
    case 'option':
      return 'Alt';
    case 'shift':
      return 'Shift';
    default:
      return normalizeKey(modifier);
  }
}

/**
 * Normalize a key name
 *
 * - Single chars → uppercase (a → A)
 * - Arrow keys → short form (ArrowUp → Up)
 * - Space key → "Space"
 */
export function normalizeKey(key: string): string {
  if (key.length === 1) {
    return key.toUpperCase();
  }

  const keyMap: Record<string, string> = {
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    ' ': 'Space',
  };

  return keyMap[key] || key;
}

/**
 * Build a normalized combo string from a KeyboardEvent
 *
 * @param event - Keyboard event from keydown listener
 * @returns Normalized combo string (e.g., "Ctrl+Shift+A")
 */
export function buildComboFromEvent(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');

  const key = normalizeKey(event.key);
  if (key && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
    parts.push(key);
  }

  return parts.join('+');
}

/**
 * Check if a keyboard event should be ignored
 *
 * Returns true if the event is from an input element where
 * we don't want hotkeys to trigger.
 *
 * Pattern from Power Bar extension research.
 */
export function shouldIgnoreEvent(event?: KeyboardEvent): boolean {
  if (!event) return false;

  const target = (event.target || document.activeElement) as HTMLElement;
  if (!target) return false;

  const tagName = target.tagName?.toUpperCase();

  // Don't trigger in input fields
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
    return true;
  }

  // Don't trigger in contenteditable elements
  if (target.isContentEditable) {
    return true;
  }

  return false;
}
