'use client';

import React from 'react';
import { ShieldIcon } from './Icons';

interface HeaderProps {
  onResetToHome?: () => void;
}

export function Header({ onResetToHome }: HeaderProps) {
  return (
    <header
      role="banner"
      style={{
        backgroundColor: 'transparent',
        padding: '1.25rem 1rem 0.5rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={onResetToHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            background: 'none',
            border: 'none',
            cursor: onResetToHome ? 'pointer' : 'default',
            padding: 0,
            textAlign: 'left',
          }}
          title="ConsentLens Home"
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              backgroundColor: 'var(--accent-tint)',
              color: 'var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-tint-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <ShieldIcon size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                ConsentLens
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.1rem 0.35rem',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-card-subtle)',
                }}
              >
                Copilot
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Context-aware consent & dark-pattern auditor
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
