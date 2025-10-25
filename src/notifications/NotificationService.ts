/**
 * NotificationService - Phase 5.1
 *
 * Intelligent notification system that chooses appropriate display method:
 * - Single playlist: Simple toast (Spicetify.showNotification)
 * - 2-5 playlists: Stacked toasts (Notistack)
 * - 6+ playlists: Summary modal (PopupModal)
 *
 * Gracefully falls back to simple toasts if Notistack/PopupModal unavailable.
 */

import type { NotificationSummary, NotificationStyle } from '../types/notifications';
import { NOTIFICATION_THRESHOLDS } from '../types/notifications';

export class NotificationService {
  private style: NotificationStyle = 'auto';
  private toastDuration = 4000; // 4 seconds default

  /**
   * Set user preference for notification style
   */
  setPreference(style: NotificationStyle, duration?: number): void {
    this.style = style;
    if (duration !== undefined) {
      this.toastDuration = duration;
    }
  }

  /**
   * Main entry point: Show playlist operation result
   */
  showPlaylistResult(summary: NotificationSummary): void {
    const totalPlaylists = summary.added.length + summary.already.length + summary.failed.length;

    // Determine notification type based on preference and context
    const notificationType = this.determineNotificationType(totalPlaylists);

    switch (notificationType) {
      case 'simple':
        this.showSimpleToast(summary);
        break;
      case 'stacked':
        this.showStackedToasts(summary);
        break;
      case 'modal':
        this.showSummaryModal(summary);
        break;
    }
  }

  /**
   * Determine which notification type to use
   */
  private determineNotificationType(totalPlaylists: number): 'simple' | 'stacked' | 'modal' {
    // User override: always compact
    if (this.style === 'compact') {
      return 'simple';
    }

    // User override: always detailed
    if (this.style === 'detailed' && totalPlaylists > 1) {
      return 'modal';
    }

    // Auto mode: smart thresholds
    if (totalPlaylists === NOTIFICATION_THRESHOLDS.SINGLE_PLAYLIST) {
      return 'simple';
    }

    if (totalPlaylists <= NOTIFICATION_THRESHOLDS.STACKED_TOAST_MAX) {
      // Check if Notistack is available
      if (this.isNotistackAvailable()) {
        return 'stacked';
      }
      // Fallback to simple if Notistack unavailable
      return 'simple';
    }

    // 6+ playlists: use modal if available
    if (this.isPopupModalAvailable()) {
      return 'modal';
    }

    // Fallback to simple if PopupModal unavailable
    return 'simple';
  }

  /**
   * Simple toast notification (current behavior from Phase 4.4)
   */
  private showSimpleToast(summary: NotificationSummary): void {
    const message = this.formatPlaylistNotification(summary);
    const isError = summary.failed.length > 0;
    Spicetify.showNotification(message, isError);
  }

  /**
   * Stacked toast notifications (Phase 5.1 - NEW)
   */
  private showStackedToasts(summary: NotificationSummary): void {
    if (!this.isNotistackAvailable()) {
      // Fallback to simple toast
      this.showSimpleToast(summary);
      return;
    }

    const { enqueueSnackbar } = (Spicetify as any).Notistack;

    // 1. Liked status toast
    this.showLikedToast(summary.likedStatus, enqueueSnackbar);

    // 2. Added playlists toasts
    summary.added.forEach((name, index) => {
      // Stagger slightly for visual effect (50ms apart)
      setTimeout(() => {
        enqueueSnackbar(`✅ Added to ${name}`, {
          variant: 'success',
          autoHideDuration: this.toastDuration,
        });
      }, index * 50);
    });

    // 3. Already present toasts
    summary.already.forEach((name, index) => {
      setTimeout(() => {
        enqueueSnackbar(`🔁 Already in ${name}`, {
          variant: 'info',
          autoHideDuration: this.toastDuration,
        });
      }, (summary.added.length + index) * 50);
    });

    // 4. Failed playlists toasts
    summary.failed.forEach((entry, index) => {
      const errorSuffix = this.getErrorSuffix(entry.error);
      setTimeout(() => {
        enqueueSnackbar(`❌ ${entry.name}${errorSuffix}`, {
          variant: 'error',
          autoHideDuration: this.toastDuration + 1000, // Errors stay longer
        });
      }, (summary.added.length + summary.already.length + index) * 50);
    });
  }

  /**
   * Summary modal for complex operations (Phase 5.2)
   */
  private showSummaryModal(summary: NotificationSummary): void {
    if (!this.isPopupModalAvailable() || !Spicetify.React || !Spicetify.ReactDOM) {
      console.warn('[NotificationService] PopupModal or React/ReactDOM unavailable. Falling back to simple toast.');
      this.showSimpleToast(summary);
      return;
    }

    // Dynamically import ResultModal to avoid circular dependencies
    import('./ResultModal').then(({ ResultModal }) => {
      const { React, ReactDOM } = Spicetify;
      const container = document.createElement('div');

      // Render React component into container
      ReactDOM.render(
        React.createElement(ResultModal, {
          summary,
          onClose: () => {
            Spicetify.PopupModal.hide();
            // Cleanup
            ReactDOM.unmountComponentAtNode(container);
          },
        }),
        container
      );

      // Display modal with React content
      Spicetify.PopupModal.display({
        title: '', // Empty title, component handles header
        content: container,
        isLarge: true,
      });
    }).catch((error) => {
      console.error('[NotificationService] Failed to load ResultModal:', error);
      this.showSimpleToast(summary);
    });
  }

  /**
   * Show liked status as separate toast
   */
  private showLikedToast(likedStatus: NotificationSummary['likedStatus'], enqueueSnackbar: any): void {
    if (likedStatus === 'added') {
      enqueueSnackbar('💚 Liked track', {
        variant: 'success',
        autoHideDuration: this.toastDuration,
      });
    } else if (likedStatus === 'already-liked') {
      enqueueSnackbar('💚 Already liked', {
        variant: 'info',
        autoHideDuration: this.toastDuration,
      });
    } else {
      enqueueSnackbar('❌ Failed to like', {
        variant: 'warning',
        autoHideDuration: this.toastDuration,
      });
    }
  }

  /**
   * Get short error suffix for toast
   */
  private getErrorSuffix(error: string): string {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('permission') || errorLower.includes('read-only') || errorLower.includes('403') || errorLower.includes('forbidden')) {
      return ' (read-only)';
    }

    if (errorLower.includes('rate') || errorLower.includes('429') || errorLower.includes('too many')) {
      return ' (rate limited)';
    }

    // Truncate long errors for toasts
    if (error.length > 40) {
      return `: ${error.substring(0, 37)}...`;
    }

    return `: ${error}`;
  }

  /**
   * Format notification message (from Phase 4.4)
   * Used for simple toast fallback
   */
  private formatPlaylistNotification(summary: NotificationSummary): string {
    const maxDisplayed = 4;
    const totalPlaylists = summary.added.length + summary.already.length + summary.failed.length;
    const successCount = summary.added.length + summary.already.length;
    let message = '';

    // Header with overall summary
    if (totalPlaylists > 1) {
      if (summary.failed.length === 0) {
        message += `✓ Success: ${successCount}/${totalPlaylists} playlists\n`;
      } else {
        message += `⚠️ Partial: ${successCount}/${totalPlaylists} playlists succeeded\n`;
      }
    }

    // Liked status with emoji
    if (summary.likedStatus === 'added') {
      message += '💚 Liked';
    } else if (summary.likedStatus === 'already-liked') {
      message += '💚 Already liked';
    } else {
      message += '❌ Failed to like';
    }

    // Main playlist addition summary
    if (summary.added.length > 0) {
      message += ` + Added to ${summary.added.length} playlist${summary.added.length === 1 ? '' : 's'}`;
    } else if (summary.already.length > 0 && summary.failed.length === 0) {
      message += ` + Already in all ${summary.already.length} playlist${summary.already.length === 1 ? '' : 's'}`;
    }

    // Show added playlists (most important)
    if (summary.added.length > 0) {
      message += '\n\n✅ Added:\n';
      if (summary.added.length <= maxDisplayed) {
        message += summary.added.map(name => `• ${name}`).join('\n');
      } else {
        const displayed = summary.added.slice(0, maxDisplayed);
        const remaining = summary.added.length - maxDisplayed;
        message += displayed.map(name => `• ${name}`).join('\n');
        message += `\n• and ${remaining} more`;
      }
    }

    // Show already present playlists (secondary)
    if (summary.already.length > 0) {
      message += '\n\n🔁 Already in:\n';
      if (summary.already.length <= maxDisplayed) {
        message += summary.already.map(name => `• ${name}`).join('\n');
      } else {
        const displayed = summary.already.slice(0, maxDisplayed);
        const remaining = summary.already.length - maxDisplayed;
        message += displayed.map(name => `• ${name}`).join('\n');
        message += `\n• and ${remaining} more`;
      }
    }

    // Show failed playlists with error details
    if (summary.failed.length > 0) {
      message += '\n\n❌ Failed:\n';

      // Categorize errors by type for better clarity
      const permissionErrors: typeof summary.failed = [];
      const rateLimitErrors: typeof summary.failed = [];
      const otherErrors: typeof summary.failed = [];

      summary.failed.forEach(entry => {
        const errorLower = entry.error.toLowerCase();
        if (errorLower.includes('permission') || errorLower.includes('read-only') || errorLower.includes('403') || errorLower.includes('forbidden')) {
          permissionErrors.push(entry);
        } else if (errorLower.includes('rate') || errorLower.includes('429') || errorLower.includes('too many')) {
          rateLimitErrors.push(entry);
        } else {
          otherErrors.push(entry);
        }
      });

      let displayedCount = 0;

      // Show permission errors with specific message
      if (permissionErrors.length > 0 && displayedCount < maxDisplayed) {
        permissionErrors.slice(0, maxDisplayed - displayedCount).forEach(entry => {
          message += `• ${entry.name} (read-only)\n`;
          displayedCount++;
        });
      }

      // Show rate limit errors with specific message
      if (rateLimitErrors.length > 0 && displayedCount < maxDisplayed) {
        rateLimitErrors.slice(0, maxDisplayed - displayedCount).forEach(entry => {
          message += `• ${entry.name} (rate limited - try again)\n`;
          displayedCount++;
        });
      }

      // Show other errors with full details
      if (otherErrors.length > 0 && displayedCount < maxDisplayed) {
        otherErrors.slice(0, maxDisplayed - displayedCount).forEach(entry => {
          message += `• ${entry.name}: ${entry.error}\n`;
          displayedCount++;
        });
      }

      // Show remaining count if we couldn't display all
      const remaining = summary.failed.length - displayedCount;
      if (remaining > 0) {
        message += `• and ${remaining} more error${remaining === 1 ? '' : 's'}`;
      }
    }

    return message;
  }

  /**
   * Check if Notistack is available
   */
  private isNotistackAvailable(): boolean {
    return typeof (Spicetify as any).Notistack !== 'undefined' &&
           typeof (Spicetify as any).Notistack.enqueueSnackbar === 'function';
  }

  /**
   * Check if PopupModal is available
   */
  private isPopupModalAvailable(): boolean {
    return typeof Spicetify.PopupModal !== 'undefined' &&
           typeof Spicetify.PopupModal.display === 'function';
  }
}

// Global singleton instance
export const notificationService = new NotificationService();
