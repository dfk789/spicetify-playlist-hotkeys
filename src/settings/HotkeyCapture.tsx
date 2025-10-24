/**
 * Hotkey Capture Component
 * Captures keyboard input for hotkey combinations
 */

import React, { useState, useEffect, useRef } from 'react';
import { buildComboFromEvent } from '../comboUtils';

interface HotkeyCaptureProps {
  combo: string;
  onChange: (combo: string) => void;
}

export const HotkeyCapture: React.FC<HotkeyCaptureProps> = ({ combo, onChange }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isCapturing) return;

    const handleKeydown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const capturedCombo = buildComboFromEvent(event);

      // Only capture if we have a non-modifier key
      if (capturedCombo && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        onChange(capturedCombo);
        setIsCapturing(false);
        console.log('[HotkeyCapture] Captured:', capturedCombo);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsCapturing(false);
      }
    };

    // Add listeners
    document.addEventListener('keydown', handleKeydown, true);
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 100);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeydown, true);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isCapturing, onChange]);

  const handleClick = () => {
    setIsCapturing(true);
  };

  return (
    <button
      ref={buttonRef}
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
