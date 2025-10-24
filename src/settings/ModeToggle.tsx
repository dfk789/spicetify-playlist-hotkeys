/**
 * Mode Toggle Component
 * Toggle between focused and global hotkey modes
 */

import React from 'react';

interface ModeToggleProps {
  globalMode: boolean;
  onChange: (enabled: boolean) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ globalMode, onChange }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={globalMode}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span style={{ fontWeight: 500 }}>Enable Global Hotkeys</span>
      </label>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--spice-subtext)',
          marginTop: '8px',
          lineHeight: 1.5,
        }}
      >
        {/* Mode explanation text will be added in Phase 3.4 */}
        <strong>{globalMode ? 'System-Wide Mode' : 'Focused Mode'}:</strong>{' '}
        {globalMode
          ? 'Hotkeys work everywhere, even when Spotify is in the background.'
          : 'Hotkeys only work when Spotify is the active window.'}
      </div>
    </div>
  );
};
