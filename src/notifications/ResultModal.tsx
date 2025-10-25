/**
 * ResultModal - Phase 5.2
 *
 * Summary modal for complex multi-playlist operations (6+ playlists).
 * Displays structured results with categorized sections, error details,
 * and copy-to-clipboard functionality.
 */

import React, { useState } from 'react';
import type { NotificationSummary } from '../types/notifications';

interface ResultModalProps {
  summary: NotificationSummary;
  onClose: () => void;
}

interface SectionProps {
  icon: string;
  title: string;
  items: string[];
  variant: 'success' | 'info' | 'error';
}

interface ErrorSectionProps {
  errors: { name: string; error: string }[];
}

const Section: React.FC<SectionProps> = ({ icon, title, items, variant }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const variantColors = {
    success: 'var(--spice-success, #1db954)',
    info: 'var(--spice-notification-info, #3d91f4)',
    error: 'var(--spice-notification-error, #e22134)',
  };

  return (
    <div className="result-section" style={{ marginBottom: '16px' }}>
      <div
        className="section-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--spice-card, #282828)',
          borderLeft: `3px solid ${variantColors[variant]}`,
          borderRadius: '4px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{icon}</span>
          <span style={{ fontWeight: 600 }}>
            {title} ({items.length})
          </span>
        </div>
        <span style={{ fontSize: '12px', opacity: 0.7 }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div
          className="section-content"
          style={{
            padding: '12px 16px',
            background: 'var(--spice-card, #282828)',
            borderRadius: '0 0 4px 4px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'disc' }}>
            {items.map((item, index) => (
              <li key={index} style={{ marginBottom: '4px', opacity: 0.9 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ErrorSection: React.FC<ErrorSectionProps> = ({ errors }) => {
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

  const toggleError = (index: number) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedErrors(newExpanded);
  };

  const categorizeErrors = () => {
    const permission: typeof errors = [];
    const rateLimit: typeof errors = [];
    const other: typeof errors = [];

    errors.forEach(entry => {
      const errorLower = entry.error.toLowerCase();
      if (errorLower.includes('permission') || errorLower.includes('read-only') || errorLower.includes('403') || errorLower.includes('forbidden')) {
        permission.push(entry);
      } else if (errorLower.includes('rate') || errorLower.includes('429') || errorLower.includes('too many')) {
        rateLimit.push(entry);
      } else {
        other.push(entry);
      }
    });

    return { permission, rateLimit, other };
  };

  const { permission, rateLimit, other } = categorizeErrors();

  return (
    <div className="error-section" style={{ marginBottom: '16px' }}>
      <div
        className="section-header"
        style={{
          padding: '8px 12px',
          background: 'var(--spice-card, #282828)',
          borderLeft: '3px solid var(--spice-notification-error, #e22134)',
          borderRadius: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>❌</span>
          <span style={{ fontWeight: 600 }}>Failed ({errors.length})</span>
        </div>
      </div>

      <div
        className="error-content"
        style={{
          padding: '12px 16px',
          background: 'var(--spice-card, #282828)',
          borderRadius: '0 0 4px 4px',
          maxHeight: '250px',
          overflowY: 'auto',
        }}
      >
        {/* Permission errors */}
        {permission.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '6px', textTransform: 'uppercase' }}>
              Permission Denied
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'disc' }}>
              {permission.map((entry, index) => (
                <li key={index} style={{ marginBottom: '4px', opacity: 0.9 }}>
                  {entry.name} <span style={{ opacity: 0.6 }}>(read-only)</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rate limit errors */}
        {rateLimit.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '6px', textTransform: 'uppercase' }}>
              Rate Limited
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'disc' }}>
              {rateLimit.map((entry, index) => (
                <li key={index} style={{ marginBottom: '4px', opacity: 0.9 }}>
                  {entry.name} <span style={{ opacity: 0.6 }}>(try again later)</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Other errors */}
        {other.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '6px', textTransform: 'uppercase' }}>
              Other Errors
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'none' }}>
              {other.map((entry, globalIndex) => {
                const index = permission.length + rateLimit.length + globalIndex;
                const isExpanded = expandedErrors.has(index);
                return (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    <div
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '8px' }}
                      onClick={() => toggleError(index)}
                    >
                      <span style={{ fontSize: '10px', marginTop: '2px' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{entry.name}</div>
                        {isExpanded && (
                          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px', fontFamily: 'monospace' }}>
                            {entry.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export const ResultModal: React.FC<ResultModalProps> = ({ summary, onClose }) => {
  const totalPlaylists = summary.added.length + summary.already.length + summary.failed.length;
  const successCount = summary.added.length + summary.already.length;

  const copyToClipboard = () => {
    const text = formatSummaryText(summary);
    navigator.clipboard.writeText(text).then(() => {
      Spicetify.showNotification('Copied to clipboard', false, 1000);
    }).catch(() => {
      Spicetify.showNotification('Failed to copy', true, 1000);
    });
  };

  const formatSummaryText = (summary: NotificationSummary): string => {
    let text = '=== Playlist Operation Results ===\n\n';
    text += `Total: ${totalPlaylists} playlists\n`;
    text += `Success: ${successCount}/${totalPlaylists}\n\n`;

    text += `Liked Status: ${summary.likedStatus}\n\n`;

    if (summary.added.length > 0) {
      text += `✅ Added (${summary.added.length}):\n`;
      summary.added.forEach(name => text += `  • ${name}\n`);
      text += '\n';
    }

    if (summary.already.length > 0) {
      text += `🔁 Already Present (${summary.already.length}):\n`;
      summary.already.forEach(name => text += `  • ${name}\n`);
      text += '\n';
    }

    if (summary.failed.length > 0) {
      text += `❌ Failed (${summary.failed.length}):\n`;
      summary.failed.forEach(entry => text += `  • ${entry.name}: ${entry.error}\n`);
      text += '\n';
    }

    return text;
  };

  return (
    <div
      className="result-modal"
      style={{
        fontFamily: 'var(--font-family, CircularSp, sans-serif)',
        color: 'var(--spice-text, #fff)',
        padding: '20px',
        minWidth: '400px',
        maxWidth: '600px',
      }}
    >
      {/* Header */}
      <div
        className="modal-header"
        style={{
          marginBottom: '20px',
          borderBottom: '1px solid var(--spice-button-disabled, #535353)',
          paddingBottom: '16px',
        }}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700 }}>
          Playlist Operation Results
        </h2>
        <div
          className="stats"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '14px',
            opacity: 0.8,
          }}
        >
          <span>Total: {totalPlaylists} playlists</span>
          <span
            style={{
              color: summary.failed.length === 0 ? 'var(--spice-success, #1db954)' : 'var(--spice-notification-info, #3d91f4)',
            }}
          >
            {summary.failed.length === 0 ? '✓' : '⚠️'} Success: {successCount}/{totalPlaylists}
          </span>
        </div>
      </div>

      {/* Liked Status */}
      <div style={{ marginBottom: '16px', padding: '8px 12px', background: 'var(--spice-card, #282828)', borderRadius: '4px' }}>
        <span style={{ fontSize: '14px' }}>
          {summary.likedStatus === 'added' && '💚 Liked track'}
          {summary.likedStatus === 'already-liked' && '💚 Already liked'}
          {summary.likedStatus === 'failed' && '❌ Failed to like'}
        </span>
      </div>

      {/* Results Sections */}
      <div
        className="results-container"
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          marginBottom: '20px',
          paddingRight: '4px',
        }}
      >
        {/* Added Section */}
        {summary.added.length > 0 && (
          <Section
            icon="✅"
            title="Added"
            items={summary.added}
            variant="success"
          />
        )}

        {/* Already Present Section */}
        {summary.already.length > 0 && (
          <Section
            icon="🔁"
            title="Already Present"
            items={summary.already}
            variant="info"
          />
        )}

        {/* Failed Section */}
        {summary.failed.length > 0 && (
          <ErrorSection errors={summary.failed} />
        )}
      </div>

      {/* Actions */}
      <div
        className="modal-actions"
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: '1px solid var(--spice-button-disabled, #535353)',
          paddingTop: '16px',
        }}
      >
        <button
          onClick={copyToClipboard}
          style={{
            padding: '8px 16px',
            background: 'var(--spice-button, #535353)',
            border: 'none',
            borderRadius: '4px',
            color: 'var(--spice-text, #fff)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--spice-button-active, #3e3e3e)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--spice-button, #535353)';
          }}
        >
          Copy Details
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            background: 'var(--spice-button, #535353)',
            border: 'none',
            borderRadius: '4px',
            color: 'var(--spice-text, #fff)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--spice-button-active, #3e3e3e)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--spice-button, #535353)';
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};
