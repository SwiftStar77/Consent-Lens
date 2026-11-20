'use client';

import React from 'react';
import { ShieldIcon } from './Icons';

/**
 * Header Component Props
 */
interface HeaderProps {
  /** Optional callback to return to the Stage 1 input screen */
  onResetToHome?: () => void;
}

/**
 * Top Navigation Header
 * Displays the centered ConsentLens branding and shield logo.
 */
export function Header({ onResetToHome }: HeaderProps) {
  return (
    <header
      role="banner"
      style={{
        backgroundColor: 'transparent',
        padding: '1.75rem 1rem 0.5rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <button
          type="button"
          onClick={onResetToHome}
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            background: 'none',
            border: 'none',
            cursor: onResetToHome ? 'pointer' : 'default',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}
          title="ConsentLens Home"
        >
          {/* Centered App Logo & Title */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--accent-tint)',
                color: 'var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--accent-tint-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-subtle)',
                flexShrink: 0,
              }}
            >
              <ShieldIcon size={22} />
            </div>

            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                display: 'inline-block',
                textAlign: 'center',
              }}
            >
              ConsentLens
            </span>
          </div>

          {/* Subtitle center aligned */}
          <p
            style={{
              margin: 0,
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}
          >
            Context-aware consent & dark-pattern auditor
          </p>
        </button>
      </div>
    </header>
  );
}
