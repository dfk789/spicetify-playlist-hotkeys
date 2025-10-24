/**
 * useHelperStatus Hook
 * Tracks helper connection status in real-time
 */

import { useState, useEffect } from 'react';
import type { HelperStatus } from '../types/settings';

const DEFAULT_STATUS: HelperStatus = {
  available: false,
  ready: false,
  connected: false,
  token: null,
};

export function useHelperStatus(helperConnection: any) {
  const [status, setStatus] = useState<HelperStatus>(DEFAULT_STATUS);

  useEffect(() => {
    if (!helperConnection) return;

    // Poll helper status periodically
    const updateStatus = () => {
      const currentStatus = helperConnection.getStatus();
      setStatus(currentStatus);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000); // Update every second

    return () => clearInterval(interval);
  }, [helperConnection]);

  return status;
}
