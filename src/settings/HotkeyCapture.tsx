/**
 * Hotkey Capture Component
 * Captures keyboard input for hotkey combinations
 */

import React, { useState, useEffect } from 'react';

interface HotkeyCaptureProps {
  combo: string;
  onChange: (combo: string) => void;
}

export const HotkeyCapture: React.FC<HotkeyCaptureProps> = ({ combo, onChange }) => {
  const [isCapturing, setIsCapturing] = useState(false);

  // Capture logic will be implemented in Phase 3.4
  const handleClick = () => {
    setIsCapturing(true);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: '8px 12px',
        background: isCapturing ? 'var(--spice-notification-info)' : 'var(--spice-main)',
        color: 'var(--spice-text)',
        border: '1px solid var(--spice-button)',
        borderRadius: '4px',
        cursor: 'pointer',
        minWidth: '120px',
        textAlign: 'left',
      }}
    >
      {isCapturing ? 'Press keys...' : combo || 'Click to set hotkey...'}
    </button>
  );
};
