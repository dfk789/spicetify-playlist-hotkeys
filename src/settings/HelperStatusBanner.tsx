/**
 * Helper Status Banner Component
 * Displays color-coded status indicator for helper connection (from Phase 2)
 */

import React, { useState } from 'react';
import type { HelperStatus, HelperStatusState } from '../types/settings';

interface HelperStatusBannerProps {
  status: HelperStatus;
  isGlobalMode: boolean;
}

interface StatusConfig {
  bgColor: string;
  borderColor: string;
  icon: string;
  title: string;
  message: string;
  showOnboarding: boolean;
}

const getStatusConfig = (
  isGlobalMode: boolean,
  status: HelperStatus
): StatusConfig => {
  if (!isGlobalMode) {
    return {
      bgColor: 'rgba(33, 150, 243, 0.1)',
      borderColor: '#2196F3',
      icon: '⌨️',
      title: 'Focused Mode',
      message: 'Hotkeys work only when Spotify is the active window.',
      showOnboarding: false,
    };
  } else if (status.available && status.ready) {
    return {
      bgColor: 'rgba(76, 175, 80, 0.1)',
      borderColor: '#4CAF50',
      icon: '✅',
      title: 'Global Mode Active',
      message: 'Helper connected. Hotkeys work even when Spotify is in the background.',
      showOnboarding: false,
    };
  } else if (status.available && !status.ready) {
    return {
      bgColor: 'rgba(255, 152, 0, 0.1)',
      borderColor: '#FF9800',
      icon: '🔄',
      title: 'Connecting to Helper',
      message: 'Helper found, establishing connection...',
      showOnboarding: false,
    };
  } else {
    return {
      bgColor: 'rgba(244, 67, 54, 0.1)',
      borderColor: '#F44336',
      icon: '🔴',
      title: 'Helper Not Running',
      message: 'Global hotkeys require the helper script. Start the helper to enable system-wide hotkeys.',
      showOnboarding: true,
    };
  }
};

export const HelperStatusBanner: React.FC<HelperStatusBannerProps> = ({
  status,
  isGlobalMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = getStatusConfig(isGlobalMode, status);

  return (
    <div
      style={{
        marginBottom: '20px',
        padding: '16px',
        background: config.bgColor,
        border: `2px solid ${config.borderColor}`,
        borderRadius: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '24px', lineHeight: '1' }}>{config.icon}</span>
        <div style={{ flex: '1' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
            {config.title}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--spice-text)', opacity: 0.9 }}>
            {config.message}
          </div>

          {config.showOnboarding && (
            <details
              open={isExpanded}
              onToggle={(e) => setIsExpanded(e.currentTarget.open)}
              style={{ marginTop: '12px', fontSize: '12px' }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                📖 How to start the helper
              </summary>
              <div
                style={{
                  paddingLeft: '16px',
                  lineHeight: 1.6,
                  color: 'var(--spice-subtext)',
                }}
              >
                <p style={{ margin: '8px 0' }}>
                  <strong>Option 1: Python Script</strong>
                </p>
                <code
                  style={{
                    display: 'block',
                    background: 'var(--spice-main)',
                    padding: '8px',
                    borderRadius: '4px',
                    margin: '4px 0',
                  }}
                >
                  python helper/global-hotkeys.py
                </code>
                <p style={{ margin: '8px 0' }}>
                  <strong>Option 2: Standalone Executable</strong>
                </p>
                <code
                  style={{
                    display: 'block',
                    background: 'var(--spice-main)',
                    padding: '8px',
                    borderRadius: '4px',
                    margin: '4px 0',
                  }}
                >
                  helper/global-hotkeys.exe
                </code>
                <p style={{ margin: '8px 0', fontSize: '11px' }}>
                  The helper runs on port 17976 and enables OS-level hotkey capture.
                </p>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};
