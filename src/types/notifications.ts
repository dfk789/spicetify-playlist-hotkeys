/**
 * Notification types for Phase 5
 * Shared interfaces for notification service and components
 */

export interface NotificationSummary {
  likedStatus: 'added' | 'already-liked' | 'failed';
  added: string[];
  already: string[];
  failed: { name: string; error: string }[];
}

export type NotificationStyle = 'compact' | 'detailed' | 'auto';

export interface NotificationPreference {
  style: NotificationStyle;
  toastDuration?: number; // milliseconds
}

/**
 * Threshold configuration for auto notification type selection
 */
export const NOTIFICATION_THRESHOLDS = {
  SINGLE_PLAYLIST: 1,
  STACKED_TOAST_MAX: 5,
  MODAL_MIN: 6,
} as const;
